/**
 * MASTER-FULL-SIM — Mestre completo para testar 4 jogadores (incluindo PLAYER-2-SIM)
 *
 * Cria sessão, aprova 4 jogadores, executa cenário completo com segredo para PLAYER-2.
 *
 * Uso: node server/virtual-table-master-full.mjs
 */

import { WebSocket } from 'ws'
import { randomUUID } from 'crypto'

const WS_URL = 'ws://192.168.3.113:4173/ws'

function log(action, details = '') {
  const ts = new Date().toISOString()
  console.log(`[${ts}] [MASTER] ${action} ${details}`)
}

function createId() {
  return randomUUID()
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class MasterClient {
  constructor() {
    this.socket = null
    this.messages = []
    this.waiters = []
    this.sessionCode = null
    this.masterToken = null
    this.participants = new Map()
    this.participantOrder = []
  }

  connect() {
    return new Promise((resolve, reject) => {
      log('Conectando ao WebSocket...')
      this.socket = new WebSocket(WS_URL)
      this.socket.on('open', () => {
        log('WebSocket conectado')
        resolve(this)
      })
      this.socket.on('error', reject)
      this.socket.on('message', (raw) => {
        const msg = JSON.parse(String(raw))
        this.messages.push(msg)
        this.handleMessage(msg)
        const idx = this.waiters.findIndex(w => w.predicate(msg))
        if (idx >= 0) {
          const [w] = this.waiters.splice(idx, 1)
          clearTimeout(w.timer)
          w.resolve(msg)
        }
      })
      this.socket.on('close', () => log('WebSocket fechado'))
    })
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'participant:list':
        for (const p of msg.participants) {
          this.participants.set(p.id, p)
          if (!this.participantOrder.includes(p.id)) {
            this.participantOrder.push(p.id)
          }
        }
        log(`Lista de participantes: ${msg.participants.length}`, msg.participants.map(p => `${p.playerName}(${p.status})`).join(', '))
        break
      case 'player:status':
        this.participants.set(msg.participant.id, msg.participant)
        if (!this.participantOrder.includes(msg.participant.id)) {
          this.participantOrder.push(msg.participant.id)
        }
        log(`Status: ${msg.participant.playerName} = ${msg.participant.status}`, `charId=${msg.participant.characterId}`)
        break
      case 'event:new':
        log(`Evento: ${msg.event.kind} de ${msg.event.actor?.name}`)
        break
      case 'event:ack':
        log(`ACK: ${msg.actionId} duplicate=${msg.duplicate}`)
        break
      case 'error':
        log(`ERRO: ${msg.code} - ${msg.message}`)
        break
    }
  }

  send(msg) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg))
    }
  }

  waitFor(predicate, timeout = 10000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        reject(new Error(`Timeout (${timeout}ms) esperando`))
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  close() {
    this.socket?.close()
  }
}

async function runMaster() {
  log('=== INICIANDO MASTER-FULL-SIM (4 Jogadores + Segredo para PLAYER-2) ===')
  
  const client = new MasterClient()
  
  try {
    await client.connect()

    // Projection com 4 personagens jogadores
    const projection = {
      campaign: { id: 'camp-demo', title: 'O Caso de Santa Aurora', rulesetId: 'ordem-compatible' },
      session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
      scene: { id: 'scene-investigation', name: 'Arquivo Municipal', objective: 'Descobrir a localização da Estação Aurora' },
      combat: null,
      characters: [
        { id: 'char-lia', name: 'Lia Azevedo', type: 'PLAYER', ordem: { resources: { health: { current: 18, max: 18 }, effort: { current: 12, max: 12 }, sanity: { current: 20, max: 20 } } } },
        { id: 'char-caio', name: 'Caio Rocha', type: 'PLAYER', ordem: { resources: { health: { current: 24, max: 24 }, effort: { current: 10, max: 10 }, sanity: { current: 18, max: 18 } } } },
        { id: 'char-taina', name: 'Tainá Vargas', type: 'PLAYER', ordem: { resources: { health: { current: 14, max: 14 }, effort: { current: 14, max: 14 }, sanity: { current: 22, max: 22 } } } },
        { id: 'char-renan', name: 'Renan Silva', type: 'PLAYER', ordem: { resources: { health: { current: 20, max: 20 }, effort: { current: 11, max: 11 }, sanity: { current: 19, max: 19 } } } },
      ],
      audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
      updatedAt: Date.now(),
    }

    log('Criando sessão...')
    client.send({ 
      type: 'host:create', 
      campaignId: 'camp-demo', 
      campaignTitle: 'O Caso de Santa Aurora', 
      projection 
    })

    const ready = await client.waitFor(m => m.type === 'host:ready')
    client.sessionCode = ready.code
    client.masterToken = ready.masterToken
    
    log('✅ SESSÃO CRIADA', `Código: ${client.sessionCode}`)
    log('Master Token:', client.masterToken)
    console.log(`\n=== CÓDIGO DA SESSÃO: ${client.sessionCode} ===`)
    console.log(`=== MASTER TOKEN: ${client.masterToken} ===`)
    console.log(`\nUse: SESSION_CODE=${client.sessionCode} node server/virtual-table-player-2-sim.mjs\n`)

    // Aguardar pelo menos 1 jogador e aprovar
    log('Aguardando jogadores...')
    const expectedPlayers = 1  // Test with just 1 player for now
    const charMap = {
      0: 'char-caio',  // PLAYER-2 gets Caio
      1: 'char-lia',
      2: 'char-taina',
      3: 'char-renan'
    }

    let approvedCount = 0
    
    // Loop para aprovar jogadores conforme eles entram
    while (approvedCount < expectedPlayers) {
      const listMsg = await client.waitFor(m => m.type === 'participant:list', 30000).catch(() => null)
      if (listMsg) {
        for (const participant of listMsg.participants) {
          // Verificar se está pendente e ainda não foi aprovado por nós
          const storedParticipant = client.participants.get(participant.id)
          const alreadyApprovedByUs = storedParticipant?.status === 'approved'
          if (participant.status === 'pending' && !alreadyApprovedByUs) {
            const charId = charMap[approvedCount]
            if (charId) {
              log(`Aprovando ${participant.playerName} (índice ${approvedCount}) com ${charId}`)
              client.send({
                type: 'participant:approve',
                participantId: participant.id,
                approved: true,
                characterId: charId
              })
              // Aguardar confirmação de aprovação via participant:list
              await client.waitFor(m => m.type === 'participant:list' && 
                m.participants.some(p => p.id === participant.id && p.status === 'approved'), 5000)
              approvedCount++
            }
          }
        }
      }
      await delay(500)
    }

    log(`✅ ${approvedCount} jogadores aprovados`)

    // Aguardar estabilização
    log('Aguardando 3s para jogadores receberem resume...')
    await delay(3000)

    // ============================================================
    // CENÁRIO DE TESTE COMPLETO
    // ============================================================

    log('\n=== INICIANDO CENÁRIO DE TESTE ===\n')

    // 1. Cena inicial
    log('1/17: Apresentando cena inicial "Arquivo Municipal"...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-scene-1', 
        kind: 'scene', 
        title: 'Arquivo Municipal de Santa Aurora', 
        body: 'Poeira dança nos raios de luz que atravessam as janelas altas. Estantes de metal rangem sob o peso de décadas de processos, mapas e fotografias. O cheiro de papel velho e umidade preenche o ar.', 
        transition: 'fade', 
        audience: { kind: 'all' } 
      },
    })
    await delay(1000)

    // 2. Revelar NPC
    log('2/17: Revelando NPC "Dra. Ester Vale"...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-npc-1', 
        kind: 'npc_reveal', 
        title: 'Dra. Ester Vale — Arquivista Municipal', 
        body: 'Uma mulher de meia-idade, cabelos presos em um coque rigoroso, óculos de armação fina. Ela observa vocês com desconfiança e cansaço. "O arquivo não é aberto ao público", diz ela, mas há um brilho de esperança nos olhos.', 
        transition: 'reveal', 
        audience: { kind: 'all' } 
      },
    })
    await delay(1000)

    // 3. Mensagem para todos
    log('3/17: Enviando mensagem para todos...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-msg-all', 
        kind: 'message', 
        title: 'Sussurro nos Arquivos', 
        body: 'Todos ouvem um som estranho vindo das profundezas do arquivo - como páginas sendo viradas por mãos invisíveis.', 
        transition: 'reveal', 
        audience: { kind: 'all' } 
      },
    })
    await delay(1000)

    // 4. Segredo para PLAYER-2 (índice 0 = primeiro/jogador único aprovado)
    log('4/17: Enviando SEGREDO para PLAYER-2 (jogador aprovado)...')
    const player2ParticipantId = client.participantOrder[0] // Primeiro (e único) jogador
    if (player2ParticipantId) {
      log(`   Target participantId: ${player2ParticipantId}`)
      client.send({
        type: 'stage:present',
        stage: { 
          id: 'stage-secret-p2', 
          kind: 'message', 
          title: '🔐 INFORMAÇÃO SECRETA (Apenas Caio)', 
          body: 'O rádio de Tainá captou um sinal que só VOCÊ ouviu. Algo se move no subsolo. A frequência é 447.3 MHz. [SEGREDO PARA PLAYER-2]', 
          transition: 'reveal', 
          audience: { kind: 'participants', participantIds: [player2ParticipantId] } 
        },
      })
    } else {
      log('   AVISO: Não há segundo jogador para enviar segredo')
    }
    await delay(1000)

    // 5. Trocar para mapa
    log('5/17: Apresentando mapa "Subsolo da Estação Aurora"...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-map-1', 
        kind: 'map', 
        title: 'Subsolo da Estação Aurora', 
        body: 'Um corredor circular ao redor de uma antena central. Marcadores mostram posições iniciais.', 
        transition: 'zoom', 
        audience: { kind: 'all' } 
      },
    })
    await delay(1000)

    // 6. Projection com mapa e tokens
    log('6/17: Atualizando projection com tokens e fog of war...')
    client.send({
      type: 'session:state',
      projection: {
        ...projection,
        mapState: {
          viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
          tokens: [
            { id: 'token-lia', name: 'Lia', x: 200, y: 300 },
            { id: 'token-caio', name: 'Caio', x: 250, y: 350 },
            { id: 'token-taina', name: 'Tainá', x: 220, y: 280 },
            { id: 'token-renan', name: 'Renan', x: 180, y: 320 },
          ],
          fogEnabled: true,
          revealedAreas: [{ id: 'area-1', x: 200, y: 300, radius: 80 }],
        },
        updatedAt: Date.now(),
      },
    })
    await delay(1000)

    // 7. Iniciar combate
    log('7/17: Iniciando combate...')
    client.send({
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
            { id: 'char-eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
            { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
            { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
            { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
            { id: 'char-renan', name: 'Renan Silva', initiative: 15, isDefeated: false },
          ],
        },
        updatedAt: Date.now(),
      },
    })
    await delay(2000)

    // 8-9. Avançar turnos (2 rounds)
    for (let round = 1; round <= 2; round++) {
      log(`8/17: Round ${round} - Avançando turnos...`)
      for (let turn = 0; turn < 5; turn++) {
        client.send({
          type: 'session:state',
          projection: {
            ...projection,
            session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
            combat: {
              id: 'combat-1',
              sceneId: 'scene-combat',
              round,
              currentTurnIndex: turn,
              participants: [
                { id: 'char-eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
                { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
                { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
                { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
                { id: 'char-renan', name: 'Renan Silva', initiative: 15, isDefeated: false },
              ],
            },
            updatedAt: Date.now(),
          },
        })
        await delay(500)
      }
    }

    // 10. Aplicar dano a Caio
    log('10/17: Aplicando dano a Caio (6 PV)...')
    client.send({
      type: 'event:send',
      actionId: createId(),
      event: {
        kind: 'damage',
        payload: { 
          characterId: 'char-caio', 
          amount: 6, 
          source: 'Ataque do Eco',
          newHealth: 18 
        },
        audience: { kind: 'all' }
      },
    })
    await delay(500)

    client.send({
      type: 'session:state',
      projection: {
        ...projection,
        session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
        combat: {
          id: 'combat-1',
          sceneId: 'scene-combat',
          round: 3,
          currentTurnIndex: 0,
          participants: [
            { id: 'char-eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
            { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
            { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
            { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false, health: 18 },
            { id: 'char-renan', name: 'Renan Silva', initiative: 15, isDefeated: false },
          ],
        },
        characters: projection.characters.map(c => 
          c.id === 'char-caio' ? { ...c, ordem: { ...c.ordem, resources: { ...c.ordem.resources, health: { current: 18, max: 24 } } } } : c
        ),
        updatedAt: Date.now(),
      },
    })
    await delay(1000)

    // 11. Conceder recompensa
    log('11/17: Concedendo recompensa...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-reward-1', 
        kind: 'reward', 
        title: 'Recompensa da Investigação', 
        body: 'Vocês recebem 20 de Exposição e um fragmento de cristal que vibra na presença de atividade paranormal.', 
        transition: 'reward', 
        audience: { kind: 'all' } 
      },
    })
    await delay(500)

    client.send({
      type: 'event:send',
      actionId: createId(),
      event: {
        kind: 'reward',
        payload: { 
          xp: 20, 
          items: ['Fragmento de Cristal Paranormal'],
          description: '20 de Exposição + Fragmento de Cristal'
        },
        audience: { kind: 'all' }
      },
    })
    await delay(1000)

    // 12. Encerrar combate
    log('12/17: Encerrando combate...')
    client.send({
      type: 'session:state',
      projection: {
        ...projection,
        session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
        combat: null,
        updatedAt: Date.now(),
      },
    })
    await delay(1000)

    // 13. Retornar à narrativa
    log('13/17: Retornando à narrativa...')
    client.send({
      type: 'stage:present',
      stage: { 
        id: 'stage-aftermath', 
        kind: 'scene', 
        title: 'Após o Confronto', 
        body: 'A antena silencia. O que restou do Eco se dissipa no ar. Vocês encontram pistas sobre a Estação Aurora.', 
        transition: 'fade', 
        audience: { kind: 'all' } 
      },
    })
    await delay(2000)

    log('\n=== CENÁRIO COMPLETO EXECUTADO ===')
    log('Encerrando sessão...')
    
    // 14. Encerrar sessão
    client.send({ type: 'session:end' })
    await delay(1000)
    
    log('Sessão encerrada.')
    log(`Código da sessão: ${client.sessionCode}`)
    log(`Master Token: ${client.masterToken}`)

  } catch (err) {
    log('ERRO FATAL', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    client.close()
  }
}

runMaster()