/**
 * PLAYER-2-SIM — Jogador + Segredo (Simulation Version)
 * Conecta via SESSION_CODE env var
 */

import { WebSocket } from 'ws'

const SERVER_URL = 'ws://192.168.3.113:4173/ws'
const MAX_CONNECT_ATTEMPTS = 5
const CONNECT_RETRY_DELAY = 2000

class TestClient {
  constructor(name) {
    this.name = name
    this.socket = null
    this.messages = []
    this.waiters = []
    this.connected = false
    this.participantId = null
    this.reconnectToken = null
    this.characterId = null
    this.sessionCode = process.env.SESSION_CODE
    this.actionCount = 0
    this.failureCount = 0
    this.receivedSecret = false
    this.secretContent = null
  }

  log(action, details = '') {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.name}] ${action} ${details}`)
  }

  connect() {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const attempt = () => {
        attempts++
        this.log(`Conectando (tentativa ${attempt}/${MAX_CONNECT_ATTEMPTS})...`)
        this.socket = new WebSocket(SERVER_URL)
        this.socket.on('open', () => {
          this.connected = true
          this.log('Conectado ao servidor WebSocket')
          resolve(this)
        })
        this.socket.on('error', (err) => {
          this.log(`Erro de conexão: ${err.message}`)
          if (attempts >= MAX_CONNECT_ATTEMPTS) {
            reject(new Error(`Falha após ${MAX_CONNECT_ATTEMPTS} tentativas`))
          } else {
            setTimeout(attempt, CONNECT_RETRY_DELAY)
          }
        })
        this.socket.on('message', (raw) => {
          try {
            const msg = JSON.parse(String(raw))
            this.messages.push(msg)
            const idx = this.waiters.findIndex(w => w.predicate(msg))
            if (idx >= 0) {
              const [w] = this.waiters.splice(idx, 1)
              clearTimeout(w.timer)
              w.resolve(msg)
            }
          } catch (e) {
            this.log(`Erro ao parsear: ${e.message}`)
          }
        })
        this.socket.on('close', () => {
          this.connected = false
          this.log('Conexão fechada')
        })
      }
      attempt()
    })
  }

  send(message) {
    if (!this.connected || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não conectado')
    }
    this.actionCount++
    const msgWithId = message.actionId ? message : { ...message, actionId: crypto.randomUUID() }
    this.log(`ENVIADO: ${msgWithId.type}`, msgWithId.actionId ? ` (actionId: ${msgWithId.actionId})` : '')
    this.socket.send(JSON.stringify(msgWithId))
    return msgWithId.actionId
  }

  waitFor(predicate, timeout = 30000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        this.failureCount++
        reject(new Error(`${this.name}: timeout (${timeout}ms)`))
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  close() {
    if (this.socket) this.socket.close()
  }

  getSummary() {
    return {
      name: this.name,
      actions: this.actionCount,
      failures: this.failureCount,
      messagesReceived: this.messages.length,
      receivedSecret: this.receivedSecret,
      secretContent: this.secretContent
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  PLAYER-2-SIM — Jogador + Segredo')
  console.log('═══════════════════════════════════════════\n')

  const player = new TestClient('PLAYER-2')

  if (!player.sessionCode) {
    console.log('\n⚠️  SESSION_CODE não definido.')
    process.exit(1)
  }

  try {
    await player.connect()

    player.log(`Usando código: ${player.sessionCode}`)

    // 1. Conectar como jogador
    player.send({
      type: 'player:join',
      code: player.sessionCode,
      playerName: 'Jogador Caio (PLAYER-2)'
    })

    // 2. Aguardar aprovação
    console.log('\n--- Aguardar aprovação ---')
    const statusMsg = await player.waitFor(m => m.type === 'player:status')
    player.participantId = statusMsg.participant.id
    player.reconnectToken = statusMsg.participant.reconnectToken
    player.log(`Participante ID: ${player.participantId}`)

    if (statusMsg.participant.status === 'pending') {
      const approvedMsg = await player.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
      player.log(`Aprovado! Personagem: ${approvedMsg.participant.characterId}`)
      player.characterId = approvedMsg.participant.characterId
    } else {
      player.characterId = statusMsg.participant.characterId
    }

    // 3. Receber session:resume
    console.log('\n--- Receber estado da sessão ---')
    const resumeMsg = await player.waitFor(m => m.type === 'session:resume')
    player.log(`Sessão: ${resumeMsg.campaignTitle}`)

    if (resumeMsg.projection?.characters?.[0]?.ordem?.resources) {
      const res = resumeMsg.projection.characters[0].ordem.resources
      player.log(`PV: ${res.health?.current}/${res.health?.max} | PE: ${res.effort?.current}/${res.effort?.max} | SAN: ${res.sanity?.current}/${res.sanity?.max}`)
    }

    // 4. Monitorar palco E verificar segredo
    console.log('\n--- Monitorar Palco (verificar segredo) ---')
    let stageCount = 0
    while (stageCount < 10) {
      try {
        const stageMsg = await player.waitFor(m => m.type === 'stage:update', 30000)
        stageCount++
        player.log(`Cena ${stageCount}: ${stageMsg.stage.title} [${stageMsg.stage.kind}]`)

        // Verificar se é o segredo para este jogador
        if (stageMsg.stage.id === 'stage-secret-2' || (stageMsg.stage.audience?.kind === 'participants' && stageMsg.stage.audience.participantIds?.includes(player.participantId))) {
          player.receivedSecret = true
          player.secretContent = stageMsg.stage.body
          player.log(`🔒 SEGREDO RECEBIDO: ${stageMsg.stage.body}`)
          player.log(`   Audiência confirmada: apenas para este jogador`)
        }

        if (stageMsg.stage.audience) {
          player.log(`   Audiência: ${JSON.stringify(stageMsg.stage.audience)}`)
        }
      } catch (e) {
        player.log('Timeout aguardando cena')
        break
      }
    }

    // 5. Rolagem de dados
    console.log('\n--- Rolagem de dados ---')
    const diceActionId = crypto.randomUUID()
    player.send({
      type: 'event:send',
      actionId: diceActionId,
      event: {
        kind: 'dice',
        payload: {
          expression: '2d20kh1',
          rolls: [12, 18],
          kept: [18],
          total: 20,
          outcome: 'success',
          attributeId: 'presence',
          context: 'Percepção para notar detalhes'
        },
        audience: { kind: 'all' }
      }
    })
    await player.waitFor(m => m.type === 'event:ack' && m.actionId === diceActionId)
    player.log('Rolagem confirmada')

    // 6. Combate
    console.log('\n--- Aguardar combate ---')
    try {
      const combatMsg = await player.waitFor(m => m.type === 'session:state' && m.projection?.combat, 30000)
      const combat = combatMsg.projection.combat
      player.log(`Combate: ${combat.id}, Rodada: ${combat.round}`)
      combat.participants?.forEach((p, i) => {
        const marker = p.id === player.characterId ? ' ◄ VOCÊ' : ''
        player.log(`  ${i + 1}. ${p.name} (Inic: ${p.initiative})${marker}`)
      })
    } catch (e) {
      player.log('Nenhum combate no tempo limite')
    }

    // 7. Recompensa
    console.log('\n--- Aguardar recompensa ---')
    try {
      const rewardStage = await player.waitFor(m => m.type === 'stage:update' && m.stage.kind === 'reward', 30000)
      player.log(`Recompensa: ${rewardStage.stage.title} - ${rewardStage.stage.body}`)
    } catch (e) {
      player.log('Sem recompensa no tempo limite')
    }

    // 8. Fim da sessão
    console.log('\n--- Aguardar fim ---')
    try {
      await player.waitFor(m => m.type === 'session:ended', 30000)
      player.log('Sessão encerrada')
    } catch (e) {
      player.log('Sessão não encerrada no tempo limite')
    }

  } catch (error) {
    player.log(`ERRO: ${error.message}`)
    player.failureCount++
  } finally {
    player.close()
    console.log('\n═══════════════════════════════════════════')
    console.log('  RESUMO - PLAYER-2-SIM')
    console.log('═══════════════════════════════════════════')
    const summary = player.getSummary()
    console.log(`  Ações realizadas: ${summary.actions}`)
    console.log(`  Falhas: ${summary.failures}`)
    console.log(`  Mensagens recebidas: ${summary.messagesReceived}`)
    console.log(`  Segredo recebido: ${summary.receivedSecret ? '✅ SIM' : '❌ NÃO'}`)
    if (summary.secretContent) {
      console.log(`  Conteúdo: ${summary.secretContent}`)
    }
    console.log('═══════════════════════════════════════════\n')
  }
}

main().catch(console.error)