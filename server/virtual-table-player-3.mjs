/**
 * PLAYER-3-SIM — Jogador com Reconexão
 * Simula um jogador que desconecta e reconecta
 *
 * Uso: SESSION_CODE=<codigo> node server/virtual-table-player-3.mjs
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
    this.sessionCode = null
    this.actionCount = 0
    this.failureCount = 0
    this.reconnected = false
    this.eventsAfterReconnect = []
    this.duplicateActionIds = new Set()
  }

  log(action, details = '') {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.name}] ${action} ${details}`)
  }

  connect(reconnectToken = null) {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const attempt = () => {
        attempts++
        this.log(`Conectando${reconnectToken ? ' (reconexão)' : ''} (tentativa ${attempt}/${MAX_CONNECT_ATTEMPTS})...`)
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
            if (this.reconnected) this.eventsAfterReconnect.push(msg)

            // Check for duplicate actionIds
            if (msg.type === 'event:new' && msg.event?.actionId) {
              if (this.duplicateActionIds.has(msg.event.actionId)) {
                this.log(`⚠️ ACTIONID DUPLICADO DETECTADO: ${msg.event.actionId}`)
              } else {
                this.duplicateActionIds.add(msg.event.actionId)
              }
            }

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

  waitFor(predicate, timeout = 15000) {
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
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  getSummary() {
    return {
      name: this.name,
      actions: this.actionCount,
      failures: this.failureCount,
      messagesReceived: this.messages.length,
      reconnected: this.reconnected,
      eventsAfterReconnect: this.eventsAfterReconnect.length,
      duplicateActionIds: this.duplicateActionIds.size
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  PLAYER-3-SIM — Jogador com Reconexão')
  console.log('═══════════════════════════════════════════\n')

  const player = new TestClient('PLAYER-3')

  try {
    const sessionCode = process.env.SESSION_CODE
    if (!sessionCode) {
      console.log('\n⚠️  SESSION_CODE não definido.')
      process.exit(1)
    }

    player.sessionCode = sessionCode

    // ================================================================
    // FASE 1: Conexão inicial
    // ================================================================
    console.log('\n--- FASE 1: Conexão Inicial ---')
    await player.connect()

    player.send({
      type: 'player:join',
      code: sessionCode,
      playerName: 'Jogador Tainá (PLAYER-3)'
    })

    console.log('\n--- Aguardar aprovação ---')
    const statusMsg = await player.waitFor(m => m.type === 'player:status')
    player.participantId = statusMsg.participant.id
    player.reconnectToken = statusMsg.participant.reconnectToken
    player.log(`Participante ID: ${player.participantId}`)
    player.log(`Reconnect Token: ${player.reconnectToken}`)

    if (statusMsg.participant.status === 'pending') {
      const approvedMsg = await player.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
      player.log(`Aprovado! Personagem: ${approvedMsg.participant.characterId}`)
      player.characterId = approvedMsg.participant.characterId
    } else {
      player.characterId = statusMsg.participant.characterId
    }

    // Receber session:resume inicial
    console.log('\n--- Estado inicial da sessão ---')
    const resumeMsg = await player.waitFor(m => m.type === 'session:resume')
    player.log(`Sessão: ${resumeMsg.campaignTitle}, Seq: ${resumeMsg.seq}`)
    player.log(`Palco atual: ${resumeMsg.stage?.title || 'nenhum'} (${resumeMsg.stage?.kind || 'N/A'})`)

    // Aguardar algumas cenas
    console.log('\n--- Aguardar cenas iniciais ---')
    for (let i = 0; i < 3; i++) {
      try {
        const stageMsg = await player.waitFor(m => m.type === 'stage:update', 15000)
        player.log(`Cena ${i + 1}: ${stageMsg.stage.title} [${stageMsg.stage.kind}]`)
      } catch (e) {
        player.log('Timeout aguardando cena')
      }
    }

    // ================================================================
    // FASE 2: Desconectar
    // ================================================================
    console.log('\n--- FASE 2: Desconectar (fechar WebSocket) ---')
    player.close()
    player.log('WebSocket fechado')
    await new Promise(r => setTimeout(r, 1000))

    // ================================================================
    // FASE 3: Reconectar com reconnectToken
    // ================================================================
    console.log('\n--- FASE 3: Reconectar com reconnectToken ---')
    player.reconnected = true
    await player.connect(player.reconnectToken)

    player.send({
      type: 'player:join',
      code: sessionCode,
      playerName: 'Jogador Tainá (PLAYER-3)',
      reconnectToken: player.reconnectToken
    })

    console.log('\n--- Aguardar session:resume após reconexão ---')
    const resumeReconnect = await player.waitFor(m => m.type === 'session:resume')
    player.log(`Reconectado! Seq: ${resumeReconnect.seq}`)
    player.log(`Participante restaurado: ${resumeReconnect.participant?.id === player.participantId ? '✅ SIM' : '❌ NÃO'} (esperado: ${player.participantId}, recebido: ${resumeReconnect.participant?.id})`)
    player.log(`Palco restaurado: ${resumeReconnect.stage?.title || 'nenhum'} (${resumeReconnect.stage?.kind || 'N/A'})`)
    player.log(`Eventos no resume: ${resumeReconnect.events?.length || 0}`)

    // Verificar se o estado foi restaurado corretamente
    const stateRestored = resumeReconnect.participant?.id === player.participantId
    const stageRestored = resumeReconnect.stage !== null
    player.log(`Estado restaurado corretamente: ${stateRestored && stageRestored ? '✅ SIM' : '❌ NÃO'}`)

    // ================================================================
    // FASE 4: Verificar eventos duplicados (actionId)
    // ================================================================
    console.log('\n--- FASE 4: Verificar duplicatas (actionId) ---')
    player.log(`Total de eventos recebidos após reconexão: ${player.eventsAfterReconnect.length}`)
    player.log(`ActionIDs únicos rastreados: ${player.duplicateActionIds.size}`)

    // Aguardar mais eventos para verificar duplicatas
    console.log('\n--- Aguardar mais eventos pós-reconexão ---')
    for (let i = 0; i < 5; i++) {
      try {
        const msg = await player.waitFor(m => m.type === 'stage:update' || m.type === 'event:new' || m.type === 'session:state', 15000)
        player.log(`Evento: ${msg.type}${msg.stage ? ` - ${msg.stage.title}` : ''}${msg.event ? ` - ${msg.event.kind} (actionId: ${msg.event.actionId})` : ''}`)
      } catch (e) {
        player.log('Timeout aguardando eventos')
      }
    }

    // ================================================================
    // FASE 5: Combate e recompensa
    // ================================================================
    console.log('\n--- FASE 5: Combate e recompensa ---')
    try {
      const combatMsg = await player.waitFor(m => m.type === 'session:state' && m.projection?.combat, 30000)
      player.log(`Combate recebido pós-reconexão: ${combatMsg.projection.combat.id}`)
    } catch (e) {
      player.log('Nenhum combate no tempo limite')
    }

    try {
      const rewardStage = await player.waitFor(m => m.type === 'stage:update' && m.stage.kind === 'reward', 30000)
      player.log(`Recompensa recebida: ${rewardStage.stage.body}`)
    } catch (e) {
      player.log('Sem recompensa no tempo limite')
    }

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
    console.log('  RESUMO - PLAYER-3-SIM')
    console.log('═══════════════════════════════════════════')
    const summary = player.getSummary()
    console.log(`  Ações realizadas: ${summary.actions}`)
    console.log(`  Falhas: ${summary.failures}`)
    console.log(`  Mensagens recebidas: ${summary.messagesReceived}`)
    console.log(`  Reconectou: ${summary.reconnected ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`  Eventos pós-reconexão: ${summary.eventsAfterReconnect}`)
    console.log(`  ActionIDs únicos: ${summary.duplicateActionIds}`)
    console.log('═══════════════════════════════════════════\n')
  }
}

main().catch(console.error)