/**
 * PLAYER-4-SIM — Jogador Adversarial
 * Tenta ações não autorizadas para testar segurança
 *
 * Uso: SESSION_CODE=<codigo> node server/virtual-table-player-4.mjs
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
    this.securityTests = {
      sessionStateForbidden: { attempted: false, blocked: false, response: null },
      audienceMasterForbidden: { attempted: false, blocked: false, response: null },
      rewardEventForbidden: { attempted: false, blocked: false, response: null },
      modifyOtherCharacter: { attempted: false, blocked: false, response: null },
      duplicateActionId: { attempted: false, blocked: false, response: null },
      participantApproveForbidden: { attempted: false, blocked: false, response: null },
      stagePresentForbidden: { attempted: false, blocked: false, response: null },
    }
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

  waitFor(predicate, timeout = 5000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        this.failureCount++
        resolve(null) // Don't reject, just return null for timeout
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  waitForError(actionId, timeout = 3000) {
    return this.waitFor(m => m.type === 'error' && (m.actionId === actionId || m.message?.includes(actionId)), timeout)
  }

  waitForAck(actionId, timeout = 3000) {
    return this.waitFor(m => m.type === 'event:ack' && m.actionId === actionId, timeout)
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
      securityTests: this.securityTests
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  PLAYER-4-SIM — Jogador Adversarial')
  console.log('═══════════════════════════════════════════\n')

  const player = new TestClient('PLAYER-4')

  try {
    const sessionCode = process.env.SESSION_CODE
    if (!sessionCode) {
      console.log('\n⚠️  SESSION_CODE não definido.')
      process.exit(1)
    }

    player.sessionCode = sessionCode

    // Conectar e aguardar aprovação
    console.log('\n--- Conexão e Aprovação ---')
    await player.connect()

    player.send({
      type: 'player:join',
      code: sessionCode,
      playerName: 'Jogador Marco (PLAYER-4)'
    })

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

    await player.waitFor(m => m.type === 'session:resume')
    player.log('Sessão iniciada, começando testes de segurança...')

    // ================================================================
    // TESTE 1: Tentar enviar session:state (apenas Mestre)
    // ================================================================
    console.log('\n--- TESTE 1: session:state (apenas Mestre) ---')
    player.securityTests.sessionStateForbidden.attempted = true
    const actionId1 = crypto.randomUUID()
    player.send({
      type: 'session:state',
      actionId: actionId1,
      projection: { test: 'malicious', updatedAt: Date.now() }
    })
    const resp1 = await player.waitForError(actionId1)
    if (resp1 && resp1.code === 'FORBIDDEN') {
      player.securityTests.sessionStateForbidden.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - Apenas Mestre pode alterar estado')
    } else {
      player.log(`❌ NÃO BLOQUEADO: ${JSON.stringify(resp1)}`)
    }
    player.securityTests.sessionStateForbidden.response = resp1

    // ================================================================
    // TESTE 2: Tentar enviar evento com audience='master'
    // ================================================================
    console.log('\n--- TESTE 2: event:send com audience=master ---')
    player.securityTests.audienceMasterForbidden.attempted = true
    const actionId2 = crypto.randomUUID()
    player.send({
      type: 'event:send',
      actionId: actionId2,
      event: {
        kind: 'dice',
        payload: { expression: '1d20', total: 20 },
        audience: { kind: 'master' }
      }
    })
    const resp2 = await player.waitForError(actionId2)
    const ack2 = await player.waitForAck(actionId2)
    if (resp2 && resp2.code === 'FORBIDDEN') {
      player.securityTests.audienceMasterForbidden.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - Jogador não pode enviar para audience=master')
    } else if (ack2 && ack2.duplicate === false) {
      // Check if master received it (would be a leak)
      player.log(`⚠️ ACEITO (ack): duplicate=${ack2.duplicate} - Verificar se Mestre recebeu`)
    } else {
      player.log(`Resultado: error=${JSON.stringify(resp2)}, ack=${JSON.stringify(ack2)}`)
    }
    player.securityTests.audienceMasterForbidden.response = resp2 || ack2

    // ================================================================
    // TESTE 3: Tentar enviar evento kind='reward' (apenas Mestre)
    // ================================================================
    console.log('\n--- TESTE 3: event:send kind=reward (apenas Mestre) ---')
    player.securityTests.rewardEventForbidden.attempted = true
    const actionId3 = crypto.randomUUID()
    player.send({
      type: 'event:send',
      actionId: actionId3,
      event: {
        kind: 'reward',
        payload: { xp: 9999, items: ['Item Hackeado'] },
        audience: { kind: 'all' }
      }
    })
    const resp3 = await player.waitForError(actionId3)
    const ack3 = await player.waitForAck(actionId3)
    if (resp3 && resp3.code === 'FORBIDDEN') {
      player.securityTests.rewardEventForbidden.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - reward é ação apenas de Mestre')
    } else if (ack3 && ack3.duplicate === false) {
      player.log(`❌ ACEITO (ack): duplicate=${ack3.duplicate} - FALHA DE SEGURANÇA!`)
    } else {
      player.log(`Resultado: error=${JSON.stringify(resp3)}, ack=${JSON.stringify(ack3)}`)
    }
    player.securityTests.rewardEventForbidden.response = resp3 || ack3

    // ================================================================
    // TESTE 4: Tentar modificar projection de outro personagem
    // ================================================================
    console.log('\n--- TESTE 4: Modificar personagem de outro jogador ---')
    player.securityTests.modifyOtherCharacter.attempted = true
    const actionId4 = crypto.randomUUID()
    // Tenta enviar dice com characterId de outro jogador (char-lia)
    player.send({
      type: 'event:send',
      actionId: actionId4,
      event: {
        kind: 'dice',
        payload: { characterId: 'char-lia', expression: '1d20', total: 20 },
        audience: { kind: 'all' }
      }
    })
    const resp4 = await player.waitForError(actionId4)
    const ack4 = await player.waitForAck(actionId4)
    if (resp4 && resp4.code === 'FORBIDDEN') {
      player.securityTests.modifyOtherCharacter.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - Não pode rolar por outro personagem')
    } else if (ack4 && ack4.duplicate === false) {
      player.log(`❌ ACEITO (ack): duplicate=${ack4.duplicate} - FALHA DE SEGURANÇA!`)
    } else {
      player.log(`Resultado: error=${JSON.stringify(resp4)}, ack=${JSON.stringify(ack4)}`)
    }
    player.securityTests.modifyOtherCharacter.response = resp4 || ack4

    // ================================================================
    // TESTE 5: Tentar enviar actionId repetido
    // ================================================================
    console.log('\n--- TESTE 5: ActionId duplicado ---')
    player.securityTests.duplicateActionId.attempted = true
    const duplicateActionId = 'duplicate-test-' + Date.now()
    
    // Primeira vez
    player.send({
      type: 'event:send',
      actionId: duplicateActionId,
      event: { kind: 'dice', payload: { total: 10 }, audience: { kind: 'all' } }
    })
    const ack5a = await player.waitForAck(duplicateActionId)
    player.log(`Primeira vez: ack=${JSON.stringify(ack5a)}`)

    // Segunda vez com mesmo actionId
    player.send({
      type: 'event:send',
      actionId: duplicateActionId,
      event: { kind: 'dice', payload: { total: 10 }, audience: { kind: 'all' } }
    })
    const ack5b = await player.waitForAck(duplicateActionId)
    player.log(`Segunda vez: ack=${JSON.stringify(ack5b)}`)

    if (ack5a && ack5a.duplicate === false && ack5b && ack5b.duplicate === true) {
      player.securityTests.duplicateActionId.blocked = true
      player.log('✅ BLOQUEADO: Segunda tentativa marcada como duplicate=true')
    } else {
      player.log(`⚠️ Comportamento inesperado: ack1=${JSON.stringify(ack5a)}, ack2=${JSON.stringify(ack5b)}`)
    }
    player.securityTests.duplicateActionId.response = { first: ack5a, second: ack5b }

    // ================================================================
    // TESTE 6: Tentar participant:approve (apenas Mestre)
    // ================================================================
    console.log('\n--- TESTE 6: participant:approve (apenas Mestre) ---')
    player.securityTests.participantApproveForbidden.attempted = true
    const actionId6 = crypto.randomUUID()
    player.send({
      type: 'participant:approve',
      actionId: actionId6,
      participantId: player.participantId,
      approved: true,
      characterId: 'char-lia'
    })
    const resp6 = await player.waitForError(actionId6)
    if (resp6 && resp6.code === 'FORBIDDEN') {
      player.securityTests.participantApproveForbidden.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - Apenas Mestre pode aprovar')
    } else {
      player.log(`❌ NÃO BLOQUEADO: ${JSON.stringify(resp6)}`)
    }
    player.securityTests.participantApproveForbidden.response = resp6

    // ================================================================
    // TESTE 7: Tentar stage:present (apenas Mestre)
    // ================================================================
    console.log('\n--- TESTE 7: stage:present (apenas Mestre) ---')
    player.securityTests.stagePresentForbidden.attempted = true
    const actionId7 = crypto.randomUUID()
    player.send({
      type: 'stage:present',
      actionId: actionId7,
      stage: { id: 'hack-stage', kind: 'message', title: 'Hack', body: 'Tentativa de injeção', transition: 'reveal', audience: { kind: 'all' } }
    })
    const resp7 = await player.waitForError(actionId7)
    if (resp7 && resp7.code === 'FORBIDDEN') {
      player.securityTests.stagePresentForbidden.blocked = true
      player.log('✅ BLOQUEADO: FORBIDDEN - Apenas Mestre pode apresentar no Palco')
    } else {
      player.log(`❌ NÃO BLOQUEADO: ${JSON.stringify(resp7)}`)
    }
    player.securityTests.stagePresentForbidden.response = resp7

    // ================================================================
    // Aguardar fim da sessão
    // ================================================================
    console.log('\n--- Aguardar fim da sessão ---')
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
    console.log('  RESUMO - PLAYER-4-SIM (TESTES DE SEGURANÇA)')
    console.log('═══════════════════════════════════════════')
    const summary = player.getSummary()
    console.log(`  Ações realizadas: ${summary.actions}`)
    console.log(`  Falhas: ${summary.failures}`)
    console.log(`  Mensagens recebidas: ${summary.messagesReceived}`)
    console.log('\n  Testes de Segurança:')
    for (const [testName, result] of Object.entries(summary.securityTests)) {
      const status = result.blocked ? '✅ BLOQUEADO' : result.attempted ? '❌ FALHOU' : '⏭️ NÃO TESTADO'
      console.log(`    ${testName}: ${status}`)
      if (result.response) {
        console.log(`      Resposta: ${JSON.stringify(result.response).slice(0, 200)}`)
      }
    }
    const blocked = Object.values(summary.securityTests).filter(t => t.blocked).length
    const total = Object.values(summary.securityTests).filter(t => t.attempted).length
    console.log(`\n  Resultado: ${blocked}/${total} testes bloqueados corretamente`)
    console.log('═══════════════════════════════════════════\n')
  }
}

main().catch(console.error)