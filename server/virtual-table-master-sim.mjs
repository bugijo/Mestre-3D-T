/**
 * MASTER-SIM — Mestre da Mesa Virtual
 *
 * Simula o Mestre orquestrando uma sessão completa:
 * 1. Conecta como Mestre (host:create)
 * 2. Obtém o código da sessão
 * 3. Aprova 4 jogadores à medida que entram
 * 4. Atribui personagens a cada um
 * 5. Inicia uma cena (stage:present)
 * 6. Revela um NPC
 * 7. Envia mensagem para todos
 * 8. Envia segredo somente para PLAYER-2
 * 9. Troca de cena
 * 10. Enviar projection com mapa
 * 11. Inicia combate (event:send com kind='combat:start')
 * 12. Avança turnos
 * 13. Aplica dano a um personagem
 * 14. Concede recompensa
 * 15. Encerra combate
 * 16. Retorna à narrativa
 * 17. Finaliza a sessão
 *
 * Uso: node server/virtual-table-master-sim.mjs
 *
 * Variáveis de ambiente:
 * - SERVER_URL (padrão: ws://192.168.3.113:4173/ws)
 * - HTTP_BASE (padrão: http://192.168.3.113:4173)
 */

import { WebSocket } from 'ws'
import { randomUUID } from 'crypto'

const WS_URL = process.env.SERVER_URL || 'ws://192.168.3.113:4173/ws'
const HTTP_BASE = process.env.HTTP_BASE || 'http://192.168.3.113:4173'
const MAX_CONNECT_ATTEMPTS = 5
const CONNECT_RETRY_DELAY = 2000

// ============================================================
// Personagens pré-definidos para a demo "O Caso de Santa Aurora"
// ============================================================

const DEMO_CHARACTERS = [
  {
    id: 'char-lia',
    name: 'Lia Azevedo',
    type: 'PLAYER',
    ordem: {
      resources: {
        health: { current: 18, max: 18 },
        effort: { current: 12, max: 12 },
        sanity: { current: 20, max: 20 }
      },
      skills: { investigation: 2, intellect: 1, stealth: 1 }
    }
  },
  {
    id: 'char-caio',
    name: 'Caio Rocha',
    type: 'PLAYER',
    ordem: {
      resources: {
        health: { current: 24, max: 24 },
        effort: { current: 10, max: 10 },
        sanity: { current: 18, max: 18 }
      },
      skills: { might: 2, presence: 1, endurance: 1 }
    }
  },
  {
    id: 'char-taina',
    name: 'Tainá Vargas',
    type: 'PLAYER',
    ordem: {
      resources: {
        health: { current: 14, max: 14 },
        effort: { current: 14, max: 14 },
        sanity: { current: 22, max: 22 }
      },
      skills: { agility: 2, perception: 1, stealth: 1 }
    }
  },
  {
    id: 'char-renan',
    name: 'Renan Silva',
    type: 'PLAYER',
    ordem: {
      resources: {
        health: { current: 20, max: 20 },
        effort: { current: 11, max: 11 },
        sanity: { current: 19, max: 19 }
      },
      skills: { intellect: 1, investigation: 1, technology: 2 }
    }
  }
]

const DEMO_PROJECTION = {
  campaign: { id: 'camp-demo', title: 'O Caso de Santa Aurora', rulesetId: 'ordem-compatible' },
  session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
  scene: { id: 'scene-investigation', name: 'Arquivo Municipal', objective: 'Descobrir a localização da Estação Aurora' },
  combat: null,
  characters: DEMO_CHARACTERS,
  audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
  updatedAt: Date.now()
}

// ============================================================
// Utilitários
// ============================================================

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

// ============================================================
// Cliente WebSocket do Mestre
// ============================================================

class MasterClient {
  constructor() {
    this.name = 'MASTER-SIM'
    this.socket = null
    this.messages = []
    this.waiters = []
    this.connected = false
    this.sessionCode = null
    this.masterToken = null
    this.participants = new Map() // participantId -> { id, playerName, characterId, status, reconnectToken }
    this.participantOrder = [] // ordem de chegada para atribuição de personagens
    this.actionCount = 0
    this.failureCount = 0
    this.stageHistory = []
    this.eventsSent = []
    this.combatState = null
    this.currentTurn = 0
  }

  connect() {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const attempt = () => {
        attempts++
        log(`Conectando ao WebSocket (tentativa ${attempt}/${MAX_CONNECT_ATTEMPTS})...`)
        this.socket = new WebSocket(WS_URL)
        this.socket.on('open', () => {
          this.connected = true
          log('✅ Conectado ao servidor WebSocket')
          resolve(this)
        })
        this.socket.on('error', (err) => {
          log(`❌ Erro de conexão: ${err.message}`)
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
            this.handleMessage(msg)
            const idx = this.waiters.findIndex(w => w.predicate(msg))
            if (idx >= 0) {
              const [w] = this.waiters.splice(idx, 1)
              clearTimeout(w.timer)
              w.resolve(msg)
            }
          } catch (e) {
            log(`⚠️ Erro ao parsear mensagem: ${e.message}`)
          }
        })
        this.socket.on('close', () => {
          this.connected = false
          log('🔌 Conexão fechada')
        })
      }
      attempt()
    })
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'host:ready':
        this.sessionCode = msg.code
        this.masterToken = msg.masterToken
        log(`🎯 Sessão criada! Código: ${msg.code}, MasterToken: ${msg.masterToken?.slice(0, 12)}...`)
        log(`   Resumida: ${msg.resumed}`)
        break
      case 'player:status':
        const p = msg.participant
        this.participants.set(p.id, { ...p })
        if (!this.participantOrder.includes(p.id)) {
          this.participantOrder.push(p.id)
        }
        log(`👤 Jogador: ${p.playerName} | ID: ${p.id} | Status: ${p.status} | Char: ${p.characterId || 'nenhum'}`)
        break
      case 'participant:list':
        log(`📋 Lista de participantes atualizada: ${msg.participants.length}`)
        for (const p of msg.participants) {
          this.participants.set(p.id, { ...p })
          if (!this.participantOrder.includes(p.id)) {
            this.participantOrder.push(p.id)
          }
        }
        break
      case 'stage:update':
        this.stageHistory.push(msg.stage)
        log(`🎭 Palco (broadcast para jogadores): ${msg.stage.kind} - ${msg.stage.title} [${msg.stage.id}]`)
        if (msg.stage.audience?.kind === 'participants') {
          log(`   Audiência restrita: ${msg.stage.audience.participantIds?.length} jogador(es)`)
        }
        break
      case 'event:new':
        log(`📥 Evento (broadcast): ${msg.event.kind} | actionId: ${msg.event.actionId} | actor: ${msg.event.actor?.name}`)
        break
      case 'event:ack':
        log(`✅ ACK do evento: actionId=${msg.actionId}, duplicate=${msg.duplicate}`)
        break
      case 'session:resume':
        log(`🔄 Session resume recebida (mestre). Seq: ${msg.seq}, Eventos: ${msg.events?.length || 0}`)
        break
      case 'session:state':
        if (msg.projection?.combat) {
          this.combatState = msg.projection.combat
          log(`⚔️ Combate atualizado via projection: ${this.combatState.id}, Round: ${this.combatState.round}, Turno: ${this.combatState.currentTurnIndex}`)
        }
        break
      case 'session:ended':
        log('🏁 Sessão encerrada (broadcast)')
        break
      case 'error':
        log(`❌ Erro do servidor: ${msg.code} - ${msg.message}`)
        this.failureCount++
        break
      default:
        log(`📨 ${msg.type}`)
    }
  }

  send(message) {
    if (!this.connected || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não está conectado')
    }
    this.actionCount++
    const msgWithId = message.actionId ? message : { ...message, actionId: createId() }
    log(`📤 ENVIADO: ${msgWithId.type}${msgWithId.actionId ? ` (actionId: ${msgWithId.actionId})` : ''}`)
    this.socket.send(JSON.stringify(msgWithId))
    return msgWithId.actionId
  }

  waitFor(predicate, timeout = 10000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        this.failureCount++
        reject(new Error(`${this.name}: timeout (${timeout}ms) - mensagens recentes: ${JSON.stringify(this.messages.slice(-5).map(m => m.type))}`))
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
      participants: this.participants.size,
      stagesPresented: this.stageHistory.length,
      eventsSent: this.eventsSent.length
    }
  }

  // ============================================================
  // Ações de alto nível do Mestre
  // ============================================================

  async createSession() {
    log('--- CRIANDO SESSÃO ---')
    this.send({
      type: 'host:create',
      campaignId: 'camp-demo',
      campaignTitle: 'O Caso de Santa Aurora',
      projection: DEMO_PROJECTION
    })
    const ready = await this.waitFor(m => m.type === 'host:ready')
    log(`✅ Sessão pronta: ${ready.code}`)
    return ready.code
  }

  async waitForPlayers(expectedCount = 4, timeout = 60000) {
    log(`--- AGUARDANDO ${expectedCount} JOGADORES ---`)
    const startTime = Date.now()
    
    while (this.participants.size < expectedCount) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout aguardando ${expectedCount} jogadores (temos ${this.participants.size})`)
      }
      await delay(500)
    }
    
    // Aguardar um pouco mais para estabilizar
    await delay(1000)
    log(`✅ ${this.participants.size} jogadores conectados`)
    
    // Mostrar lista
    for (const [id, p] of this.participants) {
      log(`   ${p.playerName} (${id}) - Status: ${p.status}`)
    }
  }

  async approveAllPlayers() {
    log('--- APROVANDO TODOS OS JOGADORES E ATRIBUINDO PERSONAGENS ---')
    
    for (let i = 0; i < Math.min(this.participantOrder.length, DEMO_CHARACTERS.length); i++) {
      const participantId = this.participantOrder[i]
      const character = DEMO_CHARACTERS[i]
      const participant = this.participants.get(participantId)
      
      if (!participant) {
        log(`⚠️ Participante ${participantId} não encontrado`)
        continue
      }
      
      log(`Aprovando ${participant.playerName} -> ${character.name} (${character.id})`)
      this.send({
        type: 'participant:approve',
        participantId,
        approved: true,
        characterId: character.id
      })
      
      // Aguardar confirmação de aprovação para este jogador
      try {
        const approvedMsg = await this.waitFor(
          m => m.type === 'player:status' && m.participant.id === participantId && m.participant.status === 'approved',
          5000
        )
        log(`   ✅ ${participant.playerName} aprovado e recebeu ${character.name}`)
      } catch (e) {
        log(`   ⚠️ Timeout aguardando confirmação para ${participant.playerName}`)
      }
      
      await delay(200) // Pequeno delay entre aprovações
    }
  }

  async presentScene(stage) {
    log(`--- APRESENTANDO CENA: ${stage.title} [${stage.kind}] ---`)
    this.send({ type: 'stage:present', stage })
    this.stageHistory.push(stage)
    
    // Aguardar broadcast de confirmação (stage:update para o mestre também chega)
    try {
      await this.waitFor(m => m.type === 'stage:update' && m.stage.id === stage.id, 3000)
      log(`✅ Cena "${stage.title}" apresentada e confirmada`)
    } catch (e) {
      log(`⚠️ Timeout aguardando confirmação da cena (pode ter sido entregue aos jogadores)`)
    }
  }

  async sendEvent(event, description = '') {
    const actionId = createId()
    log(`--- ENVIANDO EVENTO: ${event.kind} ${description ? `- ${description}` : ''} ---`)
    this.send({
      type: 'event:send',
      actionId,
      event
    })
    this.eventsSent.push({ actionId, event, description })
    
    const ack = await this.waitFor(m => m.type === 'event:ack' && m.actionId === actionId, 5000)
    log(`✅ Evento confirmado: duplicate=${ack.duplicate}`)
    return ack
  }

  async sendSecretToPlayer(playerIndex, stage) {
    // playerIndex é 0-based na ordem de chegada
    if (playerIndex >= this.participantOrder.length) {
      throw new Error(`Índice de jogador ${playerIndex} inválido (temos ${this.participantOrder.length})`)
    }
    const targetParticipantId = this.participantOrder[playerIndex]
    const targetParticipant = this.participants.get(targetParticipantId)
    
    log(`--- ENVIANDO SEGREDO PARA ${targetParticipant?.playerName || 'desconhecido'} (índice ${playerIndex}) ---`)
    
    const secretStage = {
      ...stage,
      audience: { kind: 'participants', participantIds: [targetParticipantId] }
    }
    
    this.send({ type: 'stage:present', stage: secretStage })
    this.stageHistory.push(secretStage)
    
    try {
      await this.waitFor(m => m.type === 'stage:update' && m.stage.id === secretStage.id, 3000)
      log(`✅ Segredo enviado para ${targetParticipant?.playerName}`)
    } catch (e) {
      log(`⚠️ Timeout aguardando confirmação do segredo`)
    }
  }

  async updateProjection(projection, description = '') {
    log(`--- ATUALIZANDO PROJECTION: ${description} ---`)
    this.send({ type: 'session:state', projection })
    
    // O mestre não recebe broadcast do próprio session:state
    // Aguardamos um pouco para processamento
    await delay(200)
    log(`✅ Projection atualizada`)
  }

  async endSession() {
    log('--- ENCERRANDO SESSÃO ---')
    this.send({ type: 'session:end' })
    
    try {
      await this.waitFor(m => m.type === 'session:ended', 3000)
      log('✅ Sessão encerrada confirmada')
    } catch (e) {
      log('⚠️ Timeout aguardando confirmação de encerramento')
    }
  }
}

// ============================================================
// Função principal
// ============================================================

async function runMasterSim() {
  console.log('\n' + '█'.repeat(70))
  console.log('█  MASTER-SIM — Mestre da Mesa Virtual                     █')
  console.log('█  Demo: O Caso de Santa Aurora                              █')
  console.log('█'.repeat(70))
  console.log(`Servidor: ${WS_URL}`)
  console.log('')

  const master = new MasterClient()

  try {
    // ================================================================
    // 1. Conectar como Mestre (host:create)
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 1: Conectar como Mestre e criar sessão')
    console.log('='.repeat(70))
    await master.connect()
    const sessionCode = await master.createSession()
    log(`📋 Código da sessão para jogadores: ${sessionCode}`)
    log(`   Compartilhe com: SESSION_CODE=${sessionCode} node server/virtual-table-player-1.mjs`)

    // ================================================================
    // 2. Obter código da sessão (já feito acima)
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 2: Código da sessão obtido')
    console.log('='.repeat(70))
    log(`Código: ${sessionCode}`)

    // ================================================================
    // 3. Aprovar 4 jogadores à medida que entram
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 3: Aguardar e aprovar 4 jogadores')
    console.log('='.repeat(70))
    await master.waitForPlayers(4, 90000)

    // ================================================================
    // 4. Atribuir personagens a cada um
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 4: Atribuir personagens aos jogadores aprovados')
    console.log('='.repeat(70))
    await master.approveAllPlayers()

    // Aguardar todos processarem
    await delay(2000)

    // ================================================================
    // 5. Iniciar uma cena (stage:present) - Cena de investigação
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 5: Apresentar cena inicial - Arquivo Municipal')
    console.log('='.repeat(70))
    await master.presentScene({
      id: 'stage-scene-1',
      kind: 'scene',
      title: 'Arquivo Municipal de Santa Aurora',
      body: 'Poeira dança nos raios de luz que atravessam as janelas altas. Estantes de metal rangem sob o peso de décadas de processos, mapas e fotografias. O cheiro de papel velho e umidade preenche o ar. No centro da sala, uma mesa coberta de documentos parece ter sido abandonada às pressas.',
      transition: 'fade',
      audience: { kind: 'all' }
    })

    await delay(2000)

    // ================================================================
    // 6. Revelar um NPC
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 6: Revelar NPC - Dra. Ester Vale')
    console.log('='.repeat(70))
    await master.presentScene({
      id: 'stage-npc-1',
      kind: 'npc_reveal',
      title: 'Dra. Ester Vale — Arquivista Municipal',
      body: 'Uma mulher na casa dos 50 anos, cabelos grisalhos presos num coque frouxo, óculos de aro fino sobre o nariz. Veste um cardigã bege sobre uma blusa de seda gasta. Os olhos são cansados, mas atentos. Ela segura uma pasta de couro contra o peito como se protegesse algo precioso. — "Não esperava visitantes... especialmente não hoje."',
      transition: 'reveal',
      audience: { kind: 'all' }
    })

    await delay(2000)

    // ================================================================
    // 7. Enviar mensagem para todos
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 7: Enviar mensagem para todos os jogadores')
    console.log('='.repeat(70))
    await master.presentScene({
      id: 'stage-message-all',
      kind: 'message',
      title: 'Sussurro nos Arquivos',
      body: 'Um ruído estranho ecoa pelos corredores — como páginas virando sozinhas, mas não há ninguém além de vocês. A temperatura cai repentinamente. A respiração de todos forma névoa no ar.',
      transition: 'instant',
      audience: { kind: 'all' }
    })

    await delay(1500)

    // ================================================================
    // 8. Enviar segredo somente para PLAYER-2 (índice 1 = segundo jogador)
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 8: Enviar segredo apenas para PLAYER-2 (Caio)')
    console.log('='.repeat(70))
    await master.sendSecretToPlayer(1, {
      id: 'stage-secret-p2',
      kind: 'message',
      title: '⚠️ Informação Reservada — Apenas Caio',
      body: 'Seu rádio portátil, que você mantinha no bolso "por segurança", emite um chiado. Uma voz distorcida sussurra: "Eles sabem que você está aqui. O arquivo não é o que parece. Confie nos seus instintos, não nos olhos." O sinal morre. Ninguém mais ouviu.',
      transition: 'whisper',
      audience: { kind: 'participants', participantIds: [] } // Será preenchido por sendSecretToPlayer
    })

    await delay(2000)

    // ================================================================
    // 9. Trocar de cena
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 9: Trocar de cena - Subsolo da Estação Aurora')
    console.log('='.repeat(70))
    await master.presentScene({
      id: 'stage-scene-2',
      kind: 'scene',
      title: 'Subsolo da Estação Aurora — Corredor Principal',
      body: 'A porta dos fundos do arquivo cede para um corredor de concreto úmido. Tubulações correm pelo teto baixo, gotejando em poças irregulares. Luzes piscam em intervalos irregulares. À frente, o corredor se bifurca: à esquerda, sinais de "Sala de Controle"; à direita, "Laboratório de Análise". O ar cheira a ozônio e algo metálico — sangue?',
      transition: 'zoom',
      audience: { kind: 'all' }
    })

    await delay(2000)

    // ================================================================
    // 10. Enviar projection com mapa
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 10: Enviar projection com mapa e tokens')
    console.log('='.repeat(70))
    const mapProjection = {
      ...DEMO_PROJECTION,
      mapState: {
        viewport: { zoom: 1.2, offsetX: -100, offsetY: -50 },
        grid: { enabled: true, size: 50, type: 'square' },
        tokens: [
          { id: 'token-lia', name: 'Lia', x: 150, y: 200, characterId: 'char-lia', icon: '👩‍🔬' },
          { id: 'token-caio', name: 'Caio', x: 180, y: 220, characterId: 'char-caio', icon: '👨‍🚒' },
          { id: 'token-taina', name: 'Tainá', x: 160, y: 240, characterId: 'char-taina', icon: '👩‍💻' },
          { id: 'token-renan', name: 'Renan', x: 170, y: 190, characterId: 'char-renan', icon: '👨‍💻' },
          { id: 'token-eco', name: 'Eco sem Origem', x: 400, y: 150, characterId: null, icon: '👻', isNPC: true }
        ],
        fogEnabled: true,
        revealedAreas: [
          { id: 'area-entrance', x: 150, y: 200, radius: 100 },
          { id: 'area-corridor', x: 300, y: 180, radius: 80 }
        ],
        walls: [
          { x1: 100, y1: 100, x2: 500, y2: 100 },
          { x1: 100, y1: 100, x2: 100, y2: 400 },
          { x1: 500, y1: 100, x2: 500, y2: 400 },
          { x1: 100, y1: 400, x2: 500, y2: 400 }
        ]
      },
      updatedAt: Date.now()
    }
    await master.updateProjection(mapProjection, 'Mapa do subsolo com tokens e névoa de guerra')

    await delay(2000)

    // ================================================================
    // 11. Iniciar combate (event:send com kind='combat:start')
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 11: Iniciar combate')
    console.log('='.repeat(70))
    await master.sendEvent({
      kind: 'combat:start',
      payload: {
        combatId: 'combat-1',
        sceneId: 'scene-combat',
        participants: [
          { id: 'eco', name: 'Eco sem Origem', initiative: 22, maxHealth: 30, currentHealth: 30, isNPC: true, isDefeated: false },
          { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, maxHealth: 18, currentHealth: 18, isNPC: false, isDefeated: false },
          { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, maxHealth: 14, currentHealth: 14, isNPC: false, isDefeated: false },
          { id: 'char-caio', name: 'Caio Rocha', initiative: 14, maxHealth: 24, currentHealth: 24, isNPC: false, isDefeated: false },
          { id: 'char-renan', name: 'Renan Silva', initiative: 12, maxHealth: 20, currentHealth: 20, isNPC: false, isDefeated: false }
        ],
        round: 1,
        currentTurnIndex: 0
      },
      audience: { kind: 'all' }
    }, 'Combate iniciado: Eco sem Origem vs Grupo')

    // Atualizar projection com estado de combate
    const combatProjection = {
      ...mapProjection,
      session: { ...mapProjection.session, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
      combat: {
        id: 'combat-1',
        sceneId: 'scene-combat',
        round: 1,
        currentTurnIndex: 0,
        participants: [
          { id: 'eco', name: 'Eco sem Origem', initiative: 22, maxHealth: 30, currentHealth: 30, isNPC: true, isDefeated: false },
          { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, maxHealth: 18, currentHealth: 18, isNPC: false, isDefeated: false },
          { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, maxHealth: 14, currentHealth: 14, isNPC: false, isDefeated: false },
          { id: 'char-caio', name: 'Caio Rocha', initiative: 14, maxHealth: 24, currentHealth: 24, isNPC: false, isDefeated: false },
          { id: 'char-renan', name: 'Renan Silva', initiative: 12, maxHealth: 20, currentHealth: 20, isNPC: false, isDefeated: false }
        ]
      },
      updatedAt: Date.now()
    }
    await master.updateProjection(combatProjection, 'Combate ativo na projection')

    // Apresentar palco modo combate
    await master.presentScene({
      id: 'stage-combat-start',
      kind: 'combat',
      title: '⚔️ COMBATE INICIADO — Eco sem Origem',
      body: 'A criatura emerge das sombras — uma massa de energia instável com feições vagamente humanoides. Seus olhos brilham com uma luz fria e calculista. A iniciativa foi rolada. Eco age primeiro!',
      transition: 'combat',
      audience: { kind: 'all' }
    })

    await delay(2000)

    // ================================================================
    // 12. Avançar turnos (simular 2 rodadas completas)
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 12: Avançar turnos do combate (2 rodadas)')
    console.log('='.repeat(70))

    const turnOrder = ['eco', 'char-lia', 'char-taina', 'char-caio', 'char-renan']
    let currentTurnIndex = 0
    let round = 1

    for (let r = 0; r < 2; r++) { // 2 rodadas
      round = r + 1
      log(`\n--- RODADA ${round} ---`)
      
      for (let i = 0; i < turnOrder.length; i++) {
        const actorId = turnOrder[i]
        const actor = combatProjection.combat.participants.find(p => p.id === actorId)
        if (!actor || actor.isDefeated) continue
        
        currentTurnIndex = i
        log(`Turno: ${actor.name} (${actor.id})`)
        
        // Atualizar projection com turno atual
        combatProjection.combat.currentTurnIndex = currentTurnIndex
        combatProjection.combat.round = round
        await master.updateProjection({ ...combatProjection }, `Turno de ${actor.name}`)
        
        // Simular ação do ator
        if (actor.isNPC) {
          // NPC ataca
          const target = combatProjection.combat.participants.find(p => !p.isNPC && !p.isDefeated)
          if (target) {
            await master.sendEvent({
              kind: 'dice',
              payload: {
                expression: '2d20kh1 + 3',
                rolls: [16, 8],
                kept: [16],
                total: 19,
                outcome: 'success',
                attributeId: 'might',
                context: `${actor.name} ataca ${target.name}`,
                targetId: target.id,
                damage: 6
              },
              audience: { kind: 'all' }
            }, `${actor.name} ataca ${target.name}`)
            
            // Aplicar dano
            target.currentHealth = Math.max(0, target.currentHealth - 6)
            if (target.currentHealth <= 0) {
              target.isDefeated = true
              log(`   💀 ${target.name} foi derrotado!`)
            }
          }
        } else {
          // Jogador age (simular rolagem)
          await master.sendEvent({
            kind: 'dice',
            payload: {
              expression: '2d20kh1 + 2',
              rolls: [14, 11],
              kept: [14],
              total: 16,
              outcome: 'success',
              attributeId: 'might',
              context: `${actor.name} contra-ataca`,
              targetId: 'eco'
            },
            audience: { kind: 'all' }
          }, `${actor.name} contra-ataca`)
        }
        
        await delay(800)
      }
    }

    // ================================================================
    // 13. Aplicar dano a um personagem (já feito durante o combate acima)
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 13: Dano aplicado durante o combate (verificar estado)')
    console.log('='.repeat(70))
    
    // Mostrar estado final do combate
    for (const p of combatProjection.combat.participants) {
      const status = p.isDefeated ? '💀 DERROTADO' : `${p.currentHealth}/${p.maxHealth} PV`
      log(`   ${p.name}: ${status}`)
    }

    // ================================================================
    // 14. Conceder recompensa
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 14: Conceder recompensa')
    console.log('='.repeat(70))
    
    await master.sendEvent({
      kind: 'reward',
      payload: {
        xp: 20,
        items: [
          { id: 'item-crystal', name: 'Fragmento de Cristal Ressonante', type: 'artifact', description: 'Vibra na presença de atividade paranormal. Pode ser usado para detectar ecos.' }
        ],
        currency: { credits: 50 },
        campaignAchievement: 'Sobrevivente do Subsolo'
      },
      audience: { kind: 'all' }
    }, 'Recompensa: 20 XP + Fragmento de Cristal + 50 créditos')

    // Apresentar recompensa no palco
    await master.presentScene({
      id: 'stage-reward-1',
      kind: 'reward',
      title: '🏆 Recompensa — O Eco Silencia',
      body: 'A criatura se dissolve em partículas de luz fria. O silêncio retorna ao corredor, mas agora é um silêncio diferente — mais pesado, como se o ar guardasse a memória do que aconteceu.\n\nCada um de vocês recebe:\n• 20 pontos de Exposição (XP)\n• 1 Fragmento de Cristal Ressonante (artefato)\n• 50 Créditos da Ordem\n• Conquista da Campanha: "Sobrevivente do Subsolo"',
      transition: 'reward',
      audience: { kind: 'all' }
    })

    await delay(2000)

    // ================================================================
    // 15. Encerrar combate
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 15: Encerrar combate')
    console.log('='.repeat(70))
    
    await master.sendEvent({
      kind: 'combat:end',
      payload: {
        combatId: 'combat-1',
        result: 'victory',
        survivors: ['char-lia', 'char-taina', 'char-caio', 'char-renan'],
        defeated: ['eco']
      },
      audience: { kind: 'all' }
    }, 'Combate encerrado - Vitória dos jogadores')

    // Atualizar projection removendo combate
    const postCombatProjection = {
      ...combatProjection,
      session: { ...combatProjection.session, activeCombatId: null },
      combat: null,
      updatedAt: Date.now()
    }
    await master.updateProjection(postCombatProjection, 'Combate removido da projection')

    // ================================================================
    // 16. Retornar à narrativa
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 16: Retornar à narrativa - Cena de desfecho')
    console.log('='.repeat(70))
    
    await master.presentScene({
      id: 'stage-aftermath',
      kind: 'scene',
      title: 'Após o Confronto — O Que Resta',
      body: 'A antena no centro da sala para de zumbir. Os painéis de controle apagam-se um a um. O fragmento de cristal no bolso de Caio pulsa uma vez, fraco, e então fica dormente.\n\nEster Vale aparece na entrada do corredor, a pasta de couro ainda apertada contra o peito. Seus olhos encontram os de cada um de vocês. — "Vocês viram... não viram? Então não foi alucinação minha."\n\nEla abre a pasta. Dentro, não há papéis — há um mapa antigo, com uma marca vermelha: ESTAÇÃO AURORA. E coordenadas para algo chamado "NÚCLEO".\n\n— "Acho que temos muito o que conversar," diz ela. — "E pouco tempo."',
      transition: 'fade',
      audience: { kind: 'all' }
    })

    await delay(3000)

    // ================================================================
    // 17. Finalizar a sessão
    // ================================================================
    console.log('\n' + '='.repeat(70))
    console.log('PASSO 17: Finalizar a sessão')
    console.log('='.repeat(70))
    await master.endSession()

    // ================================================================
    // RESUMO FINAL
    // ================================================================
    console.log('\n' + '█'.repeat(70))
    console.log('█  RESUMO FINAL - MASTER-SIM                                 █')
    console.log('█'.repeat(70))
    const summary = master.getSummary()
    console.log(`  Ações realizadas: ${summary.actions}`)
    console.log(`  Falhas: ${summary.failures}`)
    console.log(`  Mensagens recebidas: ${summary.messagesReceived}`)
    console.log(`  Jogadores conectados: ${summary.participants}`)
    console.log(`  Cenas apresentadas: ${summary.stagesPresented}`)
    console.log(`  Eventos enviados: ${summary.eventsSent}`)
    console.log('')
    console.log('  Cenas apresentadas:')
    for (const stage of master.stageHistory) {
      const aud = stage.audience?.kind === 'participants' ? ` (secreto: ${stage.audience.participantIds?.length} jogador(es))` : ''
      console.log(`    - [${stage.kind}] ${stage.title} [${stage.id}]${aud}`)
    }
    console.log('')
    console.log('  Eventos enviados:')
    for (const e of master.eventsSent) {
      console.log(`    - [${e.event.kind}] ${e.description || e.event.payload?.context || 'sem descrição'} (actionId: ${e.actionId.slice(0, 8)}...)`)
    }
    console.log('█'.repeat(70) + '\n')

    if (master.failureCount === 0) {
      log('✅ MASTER-SIM: TODOS OS PASSOS EXECUTADOS COM SUCESSO')
      process.exit(0)
    } else {
      log(`❌ MASTER-SIM: ${master.failureCount} FALHA(S) DURANTE A EXECUÇÃO`)
      process.exit(1)
    }

  } catch (err) {
    log(`💥 ERRO FATAL: ${err.message}`)
    console.error(err)
    master.failureCount++
    console.log(`\nResumo: ${master.actionCount} ações, ${master.failureCount} falhas`)
    process.exit(1)
  } finally {
    master.close()
  }
}

// ============================================================
// Executar com retry de conexão inicial
// ============================================================

async function main() {
  let attempts = 0
  while (attempts < MAX_CONNECT_ATTEMPTS) {
    try {
      await runMasterSim()
      break
    } catch (err) {
      attempts++
      log(`Tentativa ${attempts}/${MAX_CONNECT_ATTEMPTS} falhou: ${err.message}`)
      if (attempts >= MAX_CONNECT_ATTEMPTS) {
        log('Máximo de tentativas atingido. Encerrando.')
        process.exit(1)
      }
      await delay(CONNECT_RETRY_DELAY)
    }
  }
}

main()