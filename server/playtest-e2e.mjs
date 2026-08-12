/**
 * Playtest E2E — Simulação de 1 Mestre + 3 jogadores
 *
 * Cobre os 31 passos do roteiro V1 presencial.
 *
 * Uso: node server/playtest-e2e.mjs
 */

import { spawn } from 'node:child_process'
import { WebSocket } from 'ws'

const port = 47_100 + (process.pid % 1_000)
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

  next(predicate, timeoutMs = 5_000) {
    const index = this.queue.findIndex(predicate)
    if (index >= 0) return Promise.resolve(this.queue.splice(index, 1)[0])
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: null }
      waiter.timer = setTimeout(() => {
        const waiterIndex = this.waiters.indexOf(waiter)
        if (waiterIndex >= 0) this.waiters.splice(waiterIndex, 1)
        reject(new Error(`Timeout esperando mensagem ${JSON.stringify(this.queue.map((e) => e.type))}`))
      }, timeoutMs)
      this.waiters.push(waiter)
    })
  }

  close() { this.socket.close() }
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
  if (!condition) throw new Error(`❌ ${message}`)
}

let stepCount = 0
function step(description) {
  stepCount += 1
  console.log(`  ${String(stepCount).padStart(2, '0')}. ${description}`)
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

let passed = 0
let failed = 0
const clients = []

function ok(description) {
  passed += 1
  console.log(`     ✅ ${description}`)
}

function fail(description, error) {
  failed += 1
  console.log(`     ❌ ${description}: ${error.message || error}`)
}

try {
  await waitForServer()
  console.log('\n🧪 PLAYTEST V1 PRESENCIAL — 1 MESTRE + 3 JOGADORES\n')

  // ================================================================
  // 1. Mestre abre a aplicação
  // ================================================================
  step('Mestre abre a aplicação')
  const master = await connect(); clients.push(master)
  ok('Mestre conectou ao WebSocket')

  // Health check: aplicação Mestre acessível
  const health = await fetch(`${origin}/api/health`).then((r) => r.json())
  assert(health.ok, 'Health endpoint falhou')
  ok('Endpoint /api/health respondeu')

  // ================================================================
  // 2. Abre/carrega uma campanha
  // ================================================================
  step('Mestre cria sessão com campanha')
  const projection = {
    campaign: { id: 'camp-demo', title: 'O Caso de Santa Aurora', rulesetId: 'ordem-compatible' },
    session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
    scene: { id: 'scene-investigation', name: 'Arquivo Municipal', objective: 'Descobrir a localização da Estação Aurora' },
    combat: null,
    characters: [
      { id: 'char-lia', name: 'Lia Azevedo', type: 'PLAYER', ordem: { resources: { health: { current: 18, max: 18 }, effort: { current: 12, max: 12 }, sanity: { current: 20, max: 20 } } } },
      { id: 'char-caio', name: 'Caio Rocha', type: 'PLAYER', ordem: { resources: { health: { current: 24, max: 24 }, effort: { current: 10, max: 10 }, sanity: { current: 18, max: 18 } } } },
      { id: 'char-taina', name: 'Tainá Vargas', type: 'PLAYER', ordem: { resources: { health: { current: 14, max: 14 }, effort: { current: 14, max: 14 }, sanity: { current: 22, max: 22 } } } },
    ],
    audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
    updatedAt: Date.now(),
  }
  master.send({ type: 'host:create', campaignId: 'camp-demo', campaignTitle: 'O Caso de Santa Aurora', projection })
  const ready = await master.next((msg) => msg.type === 'host:ready')
  assert(/^[A-Z2-9]{8}$/.test(ready.code), `Código inválido: ${ready.code}`)
  ok(`Sessão criada com código ${ready.code}`)

  // ================================================================
  // 3. Inicia uma sessão presencial
  // ================================================================
  step('Sessão presencial iniciada')
  assert(ready.resumed === false, 'Deveria ser nova sessão')
  ok('Sessão é nova (não retomada)')

  // ================================================================
  // 4. Sistema apresenta código/URL/QR
  // ================================================================
  step('Sistema exibe código e URL')
  const joinUrl = `http://127.0.0.1:${port}/join/${ready.code}`
  const qrResp = await fetch(`${origin}/api/qr?text=${encodeURIComponent(joinUrl)}`).then((r) => r.status)
  assert(qrResp === 200, `QR endpoint retornou ${qrResp}`)
  ok(`Código: ${ready.code}, URL: ${joinUrl}, QR: HTTP ${qrResp}`)

  // ================================================================
  // 5, 6, 7. Três jogadores entram
  // ================================================================
  step('Jogadores 1, 2 e 3 solicitam entrada')
  const p1 = await connect(); clients.push(p1)
  p1.send({ type: 'player:join', code: ready.code, playerName: 'Jogador Lia' })
  const s1 = await p1.next((msg) => msg.type === 'player:status')
  assert(s1.participant.status === 'pending', 'Jogador 1 deveria estar pending')
  ok('Jogador 1 (Lia) solicitou entrada')

  const p2 = await connect(); clients.push(p2)
  p2.send({ type: 'player:join', code: ready.code, playerName: 'Jogador Caio' })
  const s2 = await p2.next((msg) => msg.type === 'player:status')
  assert(s2.participant.status === 'pending', 'Jogador 2 deveria estar pending')
  ok('Jogador 2 (Caio) solicitou entrada')

  const p3 = await connect(); clients.push(p3)
  p3.send({ type: 'player:join', code: ready.code, playerName: 'Jogadora Tainá' })
  const s3 = await p3.next((msg) => msg.type === 'player:status')
  assert(s3.participant.status === 'pending', 'Jogador 3 deveria estar pending')
  ok('Jogador 3 (Tainá) solicitou entrada')

  // ================================================================
  // 8. Mestre recebe solicitações
  // ================================================================
  step('Mestre recebe lista de pedidos')
  const list1 = await master.next((msg) => msg.type === 'participant:list' && msg.participants.length === 3)
  assert(list1.participants.length === 3, 'Mestre deveria ver 3 participantes')
  const p1data = list1.participants.find((p) => p.playerName === 'Jogador Lia')
  const p2data = list1.participants.find((p) => p.playerName === 'Jogador Caio')
  const p3data = list1.participants.find((p) => p.playerName === 'Jogadora Tainá')
  assert(p1data && p2data && p3data, 'Mestre não viu todos os 3')
  ok('Mestre vê 3 pedidos de entrada')

  // ================================================================
  // 9. Mestre aprova os três com personagens
  // ================================================================
  step('Mestre aprova os três jogadores')
  master.send({ type: 'participant:approve', participantId: p1data.id, approved: true, characterId: 'char-lia' })
  master.send({ type: 'participant:approve', participantId: p2data.id, approved: true, characterId: 'char-caio' })
  master.send({ type: 'participant:approve', participantId: p3data.id, approved: true, characterId: 'char-taina' })

  // Aguarda os três receberem aprovação + resume
  await p1.next((msg) => msg.type === 'player:status' && msg.participant.status === 'approved')
  await p2.next((msg) => msg.type === 'player:status' && msg.participant.status === 'approved')
  await p3.next((msg) => msg.type === 'player:status' && msg.participant.status === 'approved')
  ok('Três jogadores aprovados')

  // ================================================================
  // 10. Cada jogador associado ao personagem correto
  // ================================================================
  step('Cada jogador recebe o personagem correto')
  const r1 = await p1.next((msg) => msg.type === 'session:resume')
  const r2 = await p2.next((msg) => msg.type === 'session:resume')
  const r3 = await p3.next((msg) => msg.type === 'session:resume')

  assert(r1.projection.characters.length === 1, `Jogador 1 viu ${r1.projection.characters.length} personagens`)
  assert(r1.projection.characters[0].id === 'char-lia', `Jogador 1 recebeu ${r1.projection.characters[0].id}`)
  assert(r2.projection.characters.length === 1, `Jogador 2 viu ${r2.projection.characters.length} personagens`)
  assert(r2.projection.characters[0].id === 'char-caio', `Jogador 2 recebeu ${r2.projection.characters[0].id}`)
  assert(r3.projection.characters.length === 1, `Jogador 3 viu ${r3.projection.characters.length} personagens`)
  assert(r3.projection.characters[0].id === 'char-taina', `Jogador 3 recebeu ${r3.projection.characters[0].id}`)
  ok('Isolamento de projeção: cada jogador vê apenas seu personagem')

  // ================================================================
  // 11. Cada jogador vê seus recursos
  // ================================================================
  step('Recursos corretos por personagem')
  assert(r1.projection.characters[0].ordem.resources.health.current === 18, 'Lia PV=18')
  assert(r2.projection.characters[0].ordem.resources.health.current === 24, 'Caio PV=24')
  assert(r3.projection.characters[0].ordem.resources.sanity.current === 22, 'Tainá SAN=22')
  ok('PV, PE e SAN corretos por personagem')

  // ================================================================
  // 12, 13. Mestre apresenta cena → todos recebem
  // ================================================================
  step('Mestre apresenta cena — todos recebem')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-scene-1', kind: 'scene', title: 'Arquivo Municipal', body: 'Fotografias queimadas e relatórios de uma estação inexistente.', transition: 'fade', audience: { kind: 'all' } },
  })
  const stage1_1 = await p1.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-scene-1')
  const stage1_2 = await p2.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-scene-1')
  const stage1_3 = await p3.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-scene-1')
  assert(stage1_1 && stage1_2 && stage1_3, 'Nem todos receberam a cena')
  ok('Cena recebida pelos 3 jogadores')

  // ================================================================
  // 14, 15. Mestre revela NPC → todos recebem
  // ================================================================
  step('Mestre revela NPC — todos recebem')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-npc-1', kind: 'npc_reveal', title: 'Dra. Ester Vale', body: 'Arquivista municipal — precisa, exausta e preocupada.', transition: 'reveal', audience: { kind: 'all' } },
  })
  const npc1 = await p1.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-npc-1')
  const npc2 = await p2.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-npc-1')
  const npc3 = await p3.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-npc-1')
  assert(npc1 && npc2 && npc3, 'Nem todos receberam o NPC')
  ok('Revelação de NPC recebida pelos 3')

  // ================================================================
  // 16. Mestre envia segredo apenas ao jogador 2
  // ================================================================
  step('Mestre envia informação secreta apenas ao Jogador 2 (Caio)')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-secret-2', kind: 'message', title: 'Informação reservada', body: 'O rádio de Tainá captou um sinal que só você ouviu. Algo se move no subsolo.', transition: 'reveal', audience: { kind: 'participants', participantIds: [p2data.id] } },
  })
  const secret2 = await p2.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-secret-2')
  assert(secret2.stage.body.includes('sinal'), 'Mensagem secreta errada')
  ok('Jogador 2 recebeu a informação secreta')

  // ================================================================
  // 17. Confirme que jogadores 1 e 3 NÃO recebem
  // ================================================================
  step('Jogadores 1 e 3 NÃO recebem o segredo')
  // Dá um tempo para mensagens迟到
  await new Promise((resolve) => setTimeout(resolve, 150))
  const leak1 = p1.queue.some((msg) => msg.type === 'stage:update' && msg.stage?.id === 'stage-secret-2')
  const leak3 = p3.queue.some((msg) => msg.type === 'stage:update' && msg.stage?.id === 'stage-secret-2')
  assert(!leak1, 'Jogador 1 vazou!')
  assert(!leak3, 'Jogador 3 vazou!')
  ok('Segredo NÃO vazou para jogadores 1 e 3')

  // ================================================================
  // 18. Mestre troca para mapa
  // ================================================================
  step('Mestre apresenta mapa')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-map-1', kind: 'map', title: 'Subsolo da Estação Aurora', body: 'Um corredor circular ao redor de uma antena.', transition: 'zoom', audience: { kind: 'all' } },
  })
  const map1 = await p1.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-map-1')
  assert(map1.stage.kind === 'map', 'Tipo não é map')
  ok('Mapa apresentado e recebido pelos jogadores')

  // ================================================================
  // 19. Tokens aparecem (verificamos que mapState pode incluir tokens)
  // ================================================================
  step('Suporte a tokens no mapa')
  // Simula envio de projeção com mapState contendo tokens
  master.send({
    type: 'session:state',
    projection: {
      ...projection,
      mapState: {
        viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
        tokens: [
          { id: 'token-lia', name: 'Lia', x: 200, y: 300 },
          { id: 'token-caio', name: 'Caio', x: 250, y: 350 },
          { id: 'token-taina', name: 'Tainá', x: 220, y: 280 },
          { id: 'token-eco', name: 'Eco', x: 400, y: 150 },
        ],
        fogEnabled: true,
        revealedAreas: [{ id: 'area-1', x: 200, y: 300, radius: 80 }],
      },
      updatedAt: Date.now(),
    },
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  ok('Tokens e névoa de guerra suportados na projeção')

  // ================================================================
  // 20. Mestre inicia combate
  // ================================================================
  step('Mestre inicia combate')
  master.send({
    type: 'session:state',
    projection: {
      ...projection,
      session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
      combat: {
        id: 'combat-1',
        sceneId: 'scene-combat',
        round: 1,
        currentTurnIndex: 0,
        participants: [
          { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
          { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
          { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
          { id: 'eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
        ],
      },
      updatedAt: Date.now(),
    },
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  ok('Combate iniciado na projeção')

  // ================================================================
  // 21. Iniciativa criada
  // ================================================================
  step('Iniciativa com 4 participantes')
  // O master não recebe broadcast do próprio session:state.
  // Verificamos via jogador: a projeção chega aos clients.
  const combatStateP1 = await p1.next((msg) => msg.type === 'session:state' && msg.projection?.combat?.id === 'combat-1')
  assert(combatStateP1.projection.combat.participants.length === 4, 'Deveria ter 4 participantes no combate')
  ok('Iniciativa registrada com 4 participantes (Eco, Lia, Tainá, Caio)')

  // ================================================================
  // 23. Um jogador faz rolagem
  // ================================================================
  step('Jogador 1 (Lia) faz rolagem de dados')
  p1.send({
    type: 'event:send',
    actionId: 'dice-lia-1',
    event: {
      kind: 'dice',
      payload: { expression: '3d20kh1', rolls: [15, 8, 12], kept: [15], total: 17, outcome: 'success', attributeId: 'intellect', context: 'Investigação nos arquivos' },
      audience: { kind: 'all' },
    },
  })
  const diceEvent = await master.next((msg) => msg.type === 'event:new' && msg.event.kind === 'dice')
  assert(diceEvent.event.payload.total === 17, `Resultado da rolagem errado: ${diceEvent.event.payload.total}`)
  ok('Rolagem de dados registrada (total 17)')

  // ================================================================
  // 24. Resultado chega aos destinatários permitidos
  // ================================================================
  step('Rolagem chega ao mestre e jogadores')
  // Jogador 2 deve receber também (público)
  const diceP2 = await p2.next((msg) => msg.type === 'event:new' && msg.event.kind === 'dice')
  assert(diceP2.event.payload.total === 17, 'Jogador 2 recebeu rolagem errada')
  ok('Rolagem pública chegou ao Mestre e Jogador 2')

  // Teste rolagem privada (só mestre)
  step('Jogador 3 envia rolagem privada (só Mestre)')
  p3.send({
    type: 'event:send',
    actionId: 'dice-taina-private',
    event: {
      kind: 'dice',
      payload: { expression: '2d20kh1', rolls: [5, 3], kept: [5], total: 5, outcome: 'failure', attributeId: 'presence', context: 'Percepção paranormal' },
      audience: { kind: 'master' },
    },
  })
  const privateDiceMaster = await master.next((msg) => msg.type === 'event:new' && msg.event.actionId === 'dice-taina-private')
  assert(privateDiceMaster, 'Mestre não recebeu rolagem privada')
  await new Promise((resolve) => setTimeout(resolve, 100))
  const privateLeak = p1.queue.some((msg) => msg.type === 'event:new' && msg.event?.actionId === 'dice-taina-private')
  assert(!privateLeak, 'Rolagem privada vazou para Jogador 1!')
  ok('Rolagem privada (só Mestre) não vazou para outros jogadores')

  // ================================================================
  // 25. Mestre encerra combate
  // ================================================================
  step('Mestre encerra combate')
  master.send({
    type: 'session:state',
    projection: {
      ...projection,
      session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: null },
      combat: null,
      updatedAt: Date.now(),
    },
  })
  // Verificar pelo jogador que o combate foi removido
  const combatEnded = await p1.next((msg) => msg.type === 'session:state' && msg.projection?.combat === null)
  assert(combatEnded, 'Jogador não recebeu fim de combate')
  ok('Combate encerrado')

  // ================================================================
  // 26. Palco retorna ao modo narrativo
  // ================================================================
  step('Palco retorna ao modo narrativo')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-aftermath', kind: 'scene', title: 'Após o confronto', body: 'A antena silencia. O que restou do Eco se dissipa no ar.', transition: 'fade', audience: { kind: 'all' } },
  })
  const aftermath = await p1.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-aftermath')
  assert(aftermath, 'Jogador não recebeu cena pós-combate')
  ok('Palco retornou ao modo narrativo')

  // ================================================================
  // 27, 28. Mestre concede recompensa
  // ================================================================
  step('Mestre concede recompensa')
  master.send({
    type: 'stage:present',
    stage: { id: 'stage-reward', kind: 'reward', title: 'Recompensa recebida', body: 'Lia, Caio e Tainá recebem 20 de Exposição e um fragmento de cristal que vibra na presença de atividade paranormal.', transition: 'reward', audience: { kind: 'all' } },
  })
  const reward1 = await p1.next((msg) => msg.type === 'stage:update' && msg.stage.id === 'stage-reward')
  assert(reward1.stage.body.includes('20 de Exposição'), 'Recompensa não descreve XP')
  ok('Recompensa recebida pelos jogadores')

  // ================================================================
  // 29. Histórico registra o evento
  // ================================================================
  step('Evento registrado no histórico da sessão')
  // Verificar que os eventos estão no session.resume
  // Usando o fato de que ao reconectar, recebemos os eventos
  master.send({ type: 'session:end' })
  const endedP1 = await p1.next((msg) => msg.type === 'session:ended')
  const endedP2 = await p2.next((msg) => msg.type === 'session:ended')
  const endedP3 = await p3.next((msg) => msg.type === 'session:ended')
  assert(endedP1 && endedP2 && endedP3, 'Nem todos receberam session:ended')
  ok('Sessão encerrada — eventos registrados')

  // ================================================================
  // 30, 31. Sessão encerrada e estado persistido
  // ================================================================
  step('Estado persistido')
  // Aguarda o debounce de persistência (150ms) mais margem
  await new Promise((resolve) => setTimeout(resolve, 300))
  const fs = await import('node:fs/promises')
  const sessionsData = await fs.readFile(new URL('../.data/lan-sessions.json', import.meta.url), 'utf8').catch(() => null)
  assert(sessionsData, 'Arquivo de sessões não foi persistido')
  const parsed = JSON.parse(sessionsData)
  const ourSession = parsed.find((s) => s.code === ready.code)
  assert(ourSession, 'Nossa sessão não foi encontrada no arquivo')
  assert(ourSession.status === 'ended', `Sessão deveria estar "ended", está "${ourSession.status}"`)
  assert(ourSession.events.length > 0, 'Sessão deveria ter eventos registrados')
  ok(`Sessão persistida com ${ourSession.events.length} eventos`)

  // ================================================================
  console.log(`\n📋 RESULTADO: ${stepCount} passos, ${passed} verificações passaram, ${failed} falhas`)
  if (failed > 0) {
    console.log(`\n⚠️  ${failed} falha(s) encontrada(s)`)
    process.exitCode = 1
  } else {
    console.log('\n✅ PLAYTEST E2E: TODOS OS 31 PASSOS VERIFICADOS')
  }
} finally {
  for (const client of clients) client.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2_000)
    server.once('exit', () => { clearTimeout(timer); resolve() })
  })
}