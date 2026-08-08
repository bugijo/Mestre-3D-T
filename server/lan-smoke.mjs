import { spawn } from 'node:child_process'
import { WebSocket } from 'ws'

const port = 47_000 + (process.pid % 1_000)
const origin = `http://127.0.0.1:${port}`
let serverOutput = ''

class JsonClient {
  constructor(socket) {
    this.socket = socket
    this.queue = []
    this.waiters = []
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw))
      const index = this.waiters.findIndex((waiter) => waiter.predicate(message))
      if (index >= 0) {
        const [waiter] = this.waiters.splice(index, 1)
        clearTimeout(waiter.timer)
        waiter.resolve(message)
      } else {
        this.queue.push(message)
      }
    })
  }

  send(message) {
    this.socket.send(JSON.stringify(message))
  }

  next(predicate, timeoutMs = 3_000) {
    const index = this.queue.findIndex(predicate)
    if (index >= 0) return Promise.resolve(this.queue.splice(index, 1)[0])
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: null }
      waiter.timer = setTimeout(() => {
        const waiterIndex = this.waiters.indexOf(waiter)
        if (waiterIndex >= 0) this.waiters.splice(waiterIndex, 1)
        reject(new Error(`Tempo esgotado esperando mensagem. Fila: ${JSON.stringify(this.queue.map((entry) => entry.type))}`))
      }, timeoutMs)
      this.waiters.push(waiter)
    })
  }

  close() {
    this.socket.close()
  }
}

async function connect() {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`)
  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  return new JsonClient(socket)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/health`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Servidor LAN não iniciou.\n${serverOutput}`)
}

const server = spawn(process.execPath, ['./server/lan-server.mjs', '--production'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, LAN_HOST: '127.0.0.1', LAN_PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
server.stdout.on('data', (chunk) => { serverOutput += String(chunk) })
server.stderr.on('data', (chunk) => { serverOutput += String(chunk) })

const clients = []
try {
  await waitForServer()
  const master = await connect(); clients.push(master)
  master.send({
    type: 'host:create',
    campaignId: 'campaign-smoke',
    campaignTitle: 'Mesa Smoke LAN',
    projection: { campaign: { id: 'campaign-smoke', title: 'Mesa Smoke LAN' }, characters: [{ id: 'char-a', name: 'A' }, { id: 'char-b', name: 'B' }], scene: { id: 'scene-a', name: 'Arquivo' }, combat: null, audio: { currentTrackUrl: null }, session: { isActive: true }, updatedAt: Date.now() },
  })
  const ready = await master.next((message) => message.type === 'host:ready')
  assert(/^[A-Z2-9]{6}$/.test(ready.code), 'Código curto inválido.')

  const playerA = await connect(); clients.push(playerA)
  playerA.send({ type: 'player:join', code: ready.code, playerName: 'Jogador A' })
  const statusA = await playerA.next((message) => message.type === 'player:status')
  assert(statusA.participant.status === 'pending', 'Jogador A deveria aguardar aprovação.')
  const tokenA = statusA.participant.reconnectToken

  const playerB = await connect(); clients.push(playerB)
  playerB.send({ type: 'player:join', code: ready.code, playerName: 'Jogador B' })
  const statusB = await playerB.next((message) => message.type === 'player:status')
  const participantList = await master.next((message) => message.type === 'participant:list' && message.participants.length === 2)
  const participantA = participantList.participants.find((entry) => entry.playerName === 'Jogador A')
  const participantB = participantList.participants.find((entry) => entry.playerName === 'Jogador B')
  assert(participantA && participantB, 'Roster do Mestre incompleto.')

  master.send({ type: 'participant:approve', participantId: participantA.id, approved: true, characterId: 'char-a' })
  master.send({ type: 'participant:approve', participantId: participantB.id, approved: true, characterId: 'char-b' })
  await playerA.next((message) => message.type === 'player:status' && message.participant.status === 'approved')
  await playerB.next((message) => message.type === 'player:status' && message.participant.status === 'approved')
  const resumeA = await playerA.next((message) => message.type === 'session:resume')
  const resumeB = await playerB.next((message) => message.type === 'session:resume')
  assert(resumeA.projection.characters.length === 1 && resumeA.projection.characters[0].id === 'char-a', 'Projeção do jogador A expôs outra ficha.')
  assert(resumeB.projection.characters.length === 1 && resumeB.projection.characters[0].id === 'char-b', 'Projeção do jogador B expôs outra ficha.')

  master.send({ type: 'stage:present', stage: { id: 'private-stage', kind: 'message', title: 'Pista', body: 'Só A recebe', transition: 'reveal', audience: { kind: 'participants', participantIds: [participantA.id] } } })
  const privateStage = await playerA.next((message) => message.type === 'stage:update' && message.stage.id === 'private-stage')
  assert(privateStage.stage.body === 'Só A recebe', 'Palco privado não chegou ao destinatário.')
  await new Promise((resolve) => setTimeout(resolve, 120))
  assert(!playerB.queue.some((message) => message.type === 'stage:update' && message.stage?.id === 'private-stage'), 'Palco privado vazou para outro jogador.')

  playerA.send({ type: 'event:send', actionId: 'same-action', event: { kind: 'dice', payload: { total: 17 }, audience: { kind: 'all' } } })
  playerA.send({ type: 'event:send', actionId: 'same-action', event: { kind: 'dice', payload: { total: 17 }, audience: { kind: 'all' } } })
  const event = await master.next((message) => message.type === 'event:new' && message.event.actionId === 'same-action')
  const duplicateAck = await playerA.next((message) => message.type === 'event:ack' && message.actionId === 'same-action' && message.duplicate === true)
  assert(event.event.payload.total === 17 && duplicateAck.duplicate, 'Deduplicação de ações falhou.')

  playerA.close()
  await new Promise((resolve) => setTimeout(resolve, 100))
  const reconnectedA = await connect(); clients.push(reconnectedA)
  reconnectedA.send({ type: 'player:join', code: ready.code, playerName: 'Jogador A', reconnectToken: tokenA })
  const reconnectStatus = await reconnectedA.next((message) => message.type === 'player:status')
  const reconnectState = await reconnectedA.next((message) => message.type === 'session:resume')
  assert(reconnectStatus.participant.status === 'approved', 'Reconexão perdeu aprovação.')
  assert(reconnectState.projection.characters[0].id === 'char-a', 'Reconexão perdeu a ficha atribuída.')
  assert(reconnectState.stage?.id === 'private-stage', 'Reconexão não recuperou o palco atual.')

  master.send({ type: 'session:end' })
  await reconnectedA.next((message) => message.type === 'session:ended')
  console.log('LAN smoke: aprovação, projeção privada, palco, deduplicação, encerramento e reconexão passaram.')
} finally {
  for (const client of clients) client.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2_000)
    server.once('exit', () => { clearTimeout(timer); resolve() })
  })
}
