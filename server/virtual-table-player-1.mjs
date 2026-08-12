/**
 * PLAYER-1-SIM — Jogador Normal
 * Simula um jogador conectando à mesa via WebSocket
 *
 * Uso: node server/virtual-table-player-1.mjs
 */

import { WebSocket } from 'ws'

const SERVER_URL = 'ws://192.168.3.113:4173/ws'
const HTTP_BASE = 'http://192.168.3.113:4173'
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
            this.log(`Erro ao parsear mensagem: ${e.message}`)
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
      throw new Error('WebSocket não está conectado')
    }
    this.actionCount++
    const msgWithId = message.actionId ? message : { ...message, actionId: crypto.randomUUID() }
    this.log(`ENVIADO: ${msgWithId.type}`, msgWithId.actionId ? ` (actionId: ${msgWithId.actionId})` : '')
    this.socket.send(JSON.stringify(msgWithId))
    return msgWithId.actionId
  }

  waitFor(predicate, timeout = 5000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        this.failureCount++
        reject(new Error(`${this.name}: timeout (${timeout}ms) esperando ${predicate.toString()}`))
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
      messagesReceived: this.messages.length
    }
  }
}

function createId() {
  return crypto.randomUUID()
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  PLAYER-1-SIM — Jogador Normal')
  console.log('═══════════════════════════════════════════\n')

  const player = new TestClient('PLAYER-1')

  try {
    // ================================================================
    // 1. Conectar como jogador (player:join)
    // ================================================================
    console.log('\n--- PASSO 1: Conectar como jogador ---')
    await player.connect()

    // Need session code - in real test, this would come from MASTER-SIM
    // For now, we'll wait for user input or use a known code
    // Since we can't get the code from MASTER-SIM here, we'll try to find an active session
    const healthResp = await fetch(`${HTTP_BASE}/api/health`).catch(() => null)
    if (healthResp && healthResp.ok) {
      const health = await healthResp.json()
      console.log(`Servidor saudável: ${health.sessions} sessão(ões) ativas`)
    }

    // We need the session code - prompt user or use environment
    const sessionCode = process.env.SESSION_CODE
    if (!sessionCode) {
      console.log('\n⚠️  SESSION_CODE não definido.')
      console.log('   Execute: SESSION_CODE=<codigo> node server/virtual-table-player-1.mjs')
      console.log('   Ou defina a variável de ambiente SESSION_CODE')
      process.exit(1)
    }

    player.sessionCode = sessionCode
    player.log(`Usando código de sessão: ${sessionCode}`)

    player.send({
      type: 'player:join',
      code: sessionCode,
      playerName: 'Jogador Lia (PLAYER-1)'
    })

    // ================================================================
    // 2. Aguardar aprovação do Mestre
    // ================================================================
    console.log('\n--- PASSO 2: Aguardar aprovação do Mestre ---')
    const statusMsg = await player.waitFor(m => m.type === 'player:status')
    player.participantId = statusMsg.participant.id
    player.reconnectToken = statusMsg.participant.reconnectToken
    player.log(`Participante ID: ${player.participantId}`)
    player.log(`Reconnect Token: ${player.reconnectToken}`)
    player.log(`Status inicial: ${statusMsg.participant.status}`)

    if (statusMsg.participant.status === 'pending') {
      player.log('Aguardando aprovação do Mestre...')
      const approvedMsg = await player.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
      player.log(`Aprovado! Personagem: ${approvedMsg.participant.characterId}`)
      player.characterId = approvedMsg.participant.characterId
    } else if (statusMsg.participant.status === 'approved') {
      player.log('Já aprovado!')
      player.characterId = statusMsg.participant.characterId
    }

    // ================================================================
    // 3. Receber dados do personagem (session:resume / projection)
    // ================================================================
    console.log('\n--- PASSO 3: Receber dados do personagem ---')
    const resumeMsg = await player.waitFor(m => m.type === 'session:resume')
    player.log(`Sessão: ${resumeMsg.campaignTitle}`)
    player.log(`Status: ${resumeMsg.status}`)
    player.log(`Seq: ${resumeMsg.seq}`)

    if (resumeMsg.projection?.characters?.length > 0) {
      const char = resumeMsg.projection.characters[0]
      player.log(`Personagem: ${char.name} (${char.id})`)
      if (char.ordem?.resources) {
        const res = char.ordem.resources
        player.log(`  PV: ${res.health?.current}/${res.health?.max}`)
        player.log(`  PE: ${res.effort?.current}/${res.effort?.max}`)
        player.log(`  SAN: ${res.sanity?.current}/${res.sanity?.max}`)
      }
      if (char.ordem?.skills) {
        player.log(`  Perícias: ${Object.keys(char.ordem.skills).join(', ')}`)
      }
    }

    if (resumeMsg.stage) {
      player.log(`Palco atual: ${resumeMsg.stage.title} (${resumeMsg.stage.kind})`)
    }

    // ================================================================
    // 4. Acompanhar cenas do Palco (stage:update)
    // ================================================================
    console.log('\n--- PASSO 4: Aguardar cenas do Palco ---')
    player.log('Aguardando apresentações do Mestre... (timeout 30s)')

    let stageCount = 0
    const maxStages = 5
    while (stageCount < maxStages) {
      try {
        const stageMsg = await player.waitFor(m => m.type === 'stage:update', 30000)
        stageCount++
        player.log(`Cena ${stageCount}: ${stageMsg.stage.title} [${stageMsg.stage.kind}]`)
        player.log(`  Transição: ${stageMsg.stage.transition}`)
        if (stageMsg.stage.body) {
          const preview = stageMsg.stage.body.slice(0, 100)
          player.log(`  Corpo: ${preview}${stageMsg.stage.body.length > 100 ? '...' : ''}`)
        }
        if (stageMsg.stage.audience?.kind === 'participants') {
          player.log(`  Audiência: apenas ${stageMsg.stage.audience.participantIds?.length} jogador(es)`)
        } else {
          player.log(`  Audiência: ${stageMsg.stage.audience?.kind}`)
        }
      } catch (e) {
        player.log('Timeout aguardando cena - continuando...')
        break
      }
    }

    // ================================================================
    // 5. Rolar dados (event:send com kind='dice')
    // ================================================================
    console.log('\n--- PASSO 5: Rolagem de dados ---')
    const diceActionId = createId()
    player.send({
      type: 'event:send',
      actionId: diceActionId,
      event: {
        kind: 'dice',
        payload: {
          expression: '3d20kh1',
          rolls: [14, 7, 11],
          kept: [14],
          total: 16,
          outcome: 'success',
          attributeId: 'intellect',
          context: 'Investigação nos arquivos municipais'
        },
        audience: { kind: 'all' }
      }
    })
    const diceAck = await player.waitFor(m => m.type === 'event:ack' && m.actionId === diceActionId)
    player.log(`Rolagem confirmada: duplicate=${diceAck.duplicate}`)

    // ================================================================
    // 6. Verificar inventário (via projection updates)
    // ================================================================
    console.log('\n--- PASSO 6: Verificar inventário/recursos ---')
    // O inventário vem na projection. Se houver session:state com atualização, capturar.
    try {
      const stateMsg = await player.waitFor(m => m.type === 'session:state', 5000)
      if (stateMsg.projection?.characters?.[0]?.ordem?.resources) {
        const res = stateMsg.projection.characters[0].ordem.resources
        player.log(`Recursos atuais:`)
        player.log(`  PV: ${res.health?.current}/${res.health?.max}`)
        player.log(`  PE: ${res.effort?.current}/${res.effort?.max}`)
        player.log(`  SAN: ${res.sanity?.current}/${res.sanity?.max}`)
      }
      if (stateMsg.projection?.characters?.[0]?.inventory) {
        player.log(`Inventário: ${JSON.stringify(stateMsg.projection.characters[0].inventory)}`)
      }
    } catch (e) {
      player.log('Nenhuma atualização de projection recebida no timeout')
    }

    // ================================================================
    // 7. Participar do combate (receber combat state, rolar iniciativa, etc.)
    // ================================================================
    console.log('\n--- PASSO 7: Participar do combate ---')
    try {
      const combatMsg = await player.waitFor(m => m.type === 'session:state' && m.projection?.combat, 30000)
      const combat = combatMsg.projection.combat
      player.log(`Combate iniciado: ${combat.id}`)
      player.log(`  Rodada: ${combat.round}`)
      player.log(`  Turno atual: ${combat.currentTurnIndex}`)
      player.log(`  Participantes:`)
      combat.participants?.forEach((p, i) => {
        const marker = i === combat.currentTurnIndex ? ' ►' : ''
        player.log(`    ${i + 1}. ${p.name} (Iniciativa: ${p.initiative})${marker}`)
      })

      // Se for nosso turno, podemos rolar ação
      const myTurn = combat.participants?.[combat.currentTurnIndex]?.id === player.characterId
      if (myTurn) {
        player.log('É nosso turno! Enviando ação de ataque...')
        const attackActionId = createId()
        player.send({
          type: 'event:send',
          actionId: attackActionId,
          event: {
            kind: 'dice',
            payload: {
              expression: '2d20kh1 + 2',
              rolls: [18, 5],
              kept: [18],
              total: 20,
              outcome: 'success',
              attributeId: 'might',
              context: 'Ataque com espada'
            },
            audience: { kind: 'all' }
          }
        })
        await player.waitFor(m => m.type === 'event:ack' && m.actionId === attackActionId)
        player.log('Ação de ataque enviada')
      } else {
        player.log('Aguardando nosso turno...')
        // Aguardar fim do combate ou nosso turno
        const endCombat = await player.waitFor(m => m.type === 'session:state' && m.projection?.combat === null, 60000)
        player.log('Combate encerrado')
      }
    } catch (e) {
      player.log('Nenhum combate iniciado no tempo limite')
    }

    // ================================================================
    // 8. Receber recompensa
    // ================================================================
    console.log('\n--- PASSO 8: Receber recompensa ---')
    try {
      const rewardStage = await player.waitFor(m => m.type === 'stage:update' && m.stage.kind === 'reward', 30000)
      player.log(`Recompensa recebida: ${rewardStage.stage.title}`)
      player.log(`  ${rewardStage.stage.body}`)
    } catch (e) {
      player.log('Nenhuma recompensa recebida no tempo limite')
    }

    // ================================================================
    // 9. Aguardar fim da sessão
    // ================================================================
    console.log('\n--- PASSO 9: Aguardar fim da sessão ---')
    try {
      const endedMsg = await player.waitFor(m => m.type === 'session:ended', 30000)
      player.log(`Sessão encerrada: ${endedMsg.code}`)
    } catch (e) {
      player.log('Sessão não encerrada no tempo limite')
    }

  } catch (error) {
    player.log(`ERRO: ${error.message}`)
    player.failureCount++
  } finally {
    player.close()
    console.log('\n═══════════════════════════════════════════')
    console.log('  RESUMO - PLAYER-1-SIM')
    console.log('═══════════════════════════════════════════')
    const summary = player.getSummary()
    console.log(`  Ações realizadas: ${summary.actions}`)
    console.log(`  Falhas: ${summary.failures}`)
    console.log(`  Mensagens recebidas: ${summary.messagesReceived}`)
    console.log('═══════════════════════════════════════════\n')
  }
}

main().catch(console.error)