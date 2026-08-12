/**
 * MASTER-SIM — Mestre de Jogo
 * Cria a sessão e aprova jogadores para o teste
 *
 * Uso: node server/virtual-table-master.mjs
 */

import { WebSocket } from 'ws'
import { randomBytes } from 'crypto'

const SERVER_URL = 'ws://192.168.3.113:4173/ws'

class MasterClient {
  constructor() {
    this.socket = null
    this.messages = []
    this.waiters = []
    this.sessionCode = null
    this.masterToken = null
    this.participants = new Map()
    this.connected = false
  }

  log(action, details = '') {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [MASTER] ${action} ${details}`)
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(SERVER_URL)
      this.socket.on('open', () => {
        this.connected = true
        this.log('Conectado ao servidor WebSocket')
        resolve(this)
      })
      this.socket.on('error', reject)
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
    })
  }

  send(message) {
    if (!this.connected || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não conectado')
    }
    const msgWithId = message.actionId ? message : { ...message, actionId: randomBytes(16).toString('hex') }
    this.log(`ENVIADO: ${msgWithId.type}`)
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
        reject(new Error(`Timeout (${timeout}ms) esperando ${predicate.toString()}`))
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  close() {
    if (this.socket) this.socket.close()
  }
}

function createProjection() {
  return {
    campaign: { id: 'camp-demo', title: 'O Caso de Santa Aurora', rulesetId: 'ordem-compatible' },
    session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
    scene: { id: 'scene-investigation', name: 'Arquivo Municipal', objective: 'Descobrir a localização da Estação Aurora' },
    combat: null,
    characters: [
      { id: 'char-lia', name: 'Lia Azevedo', type: 'PLAYER', ordem: { resources: { health: { current: 18, max: 18 }, effort: { current: 12, max: 12 }, sanity: { current: 20, max: 20 } } } },
      { id: 'char-caio', name: 'Caio Rocha', type: 'PLAYER', ordem: { resources: { health: { current: 24, max: 24 }, effort: { current: 10, max: 10 }, sanity: { current: 18, max: 18 } } } },
      { id: 'char-taina', name: 'Tainá Vargas', type: 'PLAYER', ordem: { resources: { health: { current: 14, max: 14 }, effort: { current: 14, max: 14 }, sanity: { current: 22, max: 22 } } } },
      { id: 'char-marco', name: 'Marco Silva', type: 'PLAYER', ordem: { resources: { health: { current: 20, max: 20 }, effort: { current: 15, max: 15 }, sanity: { current: 16, max: 16 } } } },
    ],
    audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
    updatedAt: Date.now(),
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  MASTER-SIM — Mestre de Jogo')
  console.log('═══════════════════════════════════════════\n')

  const master = new MasterClient()

  try {
    await master.connect()

    // 1. Criar sessão
    console.log('\n--- 1. Criar sessão ---')
    master.send({
      type: 'host:create',
      campaignId: 'camp-demo',
      campaignTitle: 'O Caso de Santa Aurora',
      projection: createProjection()
    })
    const ready = await master.waitFor(m => m.type === 'host:ready')
    master.sessionCode = ready.code
    master.masterToken = ready.masterToken
    master.log(`Sessão criada: ${ready.code}`)
    master.log(`Master Token: ${ready.masterToken}`)
    console.log(`\n>>> CÓDIGO DA SESSÃO: ${ready.code} <<<\n`)

    // Wait for participants
    console.log('--- 2. Aguardar 4 jogadores ---')
    const participantList = await master.waitFor(m => m.type === 'participant:list' && m.participants.length >= 4)
    master.log(`${participantList.participants.length} jogadores conectados`)

    for (const p of participantList.participants) {
      master.participants.set(p.playerName, p)
      master.log(`  - ${p.playerName} (${p.id}) - status: ${p.status}`)
    }

    // 3. Aprovar os 4 jogadores com personagens
    console.log('\n--- 3. Aprovar jogadores ---')
    const charMap = {
      'Jogador Lia (PLAYER-1)': 'char-lia',
      'Jogador Caio (PLAYER-2)': 'char-caio',
      'Jogador Tainá (PLAYER-3)': 'char-taina',
      'Jogador Marco (PLAYER-4)': 'char-marco',
    }

    for (const [name, participant] of master.participants) {
      const charId = charMap[name] || 'char-lia'
      master.log(`Aprovando ${name} como ${charId}`)
      master.send({
        type: 'participant:approve',
        participantId: participant.id,
        approved: true,
        characterId: charId
      })
    }

    // Wait for all approvals
    for (let i = 0; i < 4; i++) {
      const status = await master.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
      master.log(`Aprovado: ${status.participant.playerName} -> ${status.participant.characterId}`)
    }

    console.log('\n✅ Todos os 4 jogadores aprovados!')
    console.log(`Código da sessão: ${master.sessionCode}`)
    console.log('\nAgora execute os 4 jogadores com:')
    console.log(`  SESSION_CODE=${master.sessionCode} node server/virtual-table-player-1.mjs`)
    console.log(`  SESSION_CODE=${master.sessionCode} node server/virtual-table-player-2.mjs`)
    console.log(`  SESSION_CODE=${master.sessionCode} node server/virtual-table-player-3.mjs`)
    console.log(`  SESSION_CODE=${master.sessionCode} node server/virtual-table-player-4.mjs`)

    // Keep master running to send scenes
    console.log('\n--- 4. Enviar cenas (pressione Ctrl+C para parar) ---')
    console.log('Aguardando 5s para jogadores se conectarem...')
    await new Promise(r => setTimeout(r, 5000))

    // Scene 1: Investigation
    console.log('\n--- Cena 1: Arquivo Municipal ---')
    master.send({
      type: 'stage:present',
      stage: {
        id: 'stage-scene-1',
        kind: 'scene',
        title: 'Arquivo Municipal',
        body: 'Fotografias queimadas e relatórios de uma estação inexistente. O cheiro de papel velho e mofo preenche o ar.',
        transition: 'fade',
        audience: { kind: 'all' }
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // NPC Reveal
    console.log('\n--- NPC: Dra. Ester Vale ---')
    master.send({
      type: 'stage:present',
      stage: {
        id: 'stage-npc-1',
        kind: 'npc_reveal',
        title: 'Dra. Ester Vale',
        body: 'Arquivista municipal — precisa, exausta e preocupada. Ela olha por cima dos óculos: "Vocês não deveriam estar aqui."',
        transition: 'reveal',
        audience: { kind: 'all' }
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // Secret to PLAYER-2 only
    console.log('\n--- Segredo para PLAYER-2 ---')
    const p2 = master.participants.get('Jogador Caio (PLAYER-2)')
    if (p2) {
      master.send({
        type: 'stage:present',
        stage: {
          id: 'stage-secret-2',
          kind: 'message',
          title: 'Informação Reservada',
          body: 'O rádio de Tainá captou um sinal que só você ouviu. Algo se move no subsolo. Frequência 447.3 MHz.',
          transition: 'reveal',
          audience: { kind: 'participants', participantIds: [p2.id] }
        }
      })
      master.log(`Segredo enviado para ${p2.playerName} (${p2.id})`)
    }
    await new Promise(r => setTimeout(r, 3000))

    // Map
    console.log('\n--- Mapa: Subsolo da Estação Aurora ---')
    master.send({
      type: 'session:state',
      projection: {
        ...createProjection(),
        mapState: {
          viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
          tokens: [
            { id: 'token-lia', name: 'Lia', x: 200, y: 300 },
            { id: 'token-caio', name: 'Caio', x: 250, y: 350 },
            { id: 'token-taina', name: 'Tainá', x: 220, y: 280 },
            { id: 'token-marco', name: 'Marco', x: 180, y: 320 },
            { id: 'token-eco', name: 'Eco', x: 400, y: 150 },
          ],
          fogEnabled: true,
          revealedAreas: [{ id: 'area-1', x: 200, y: 300, radius: 80 }],
        },
        updatedAt: Date.now(),
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // Combat start
    console.log('\n--- Iniciar Combate ---')
    master.send({
      type: 'session:state',
      projection: {
        ...createProjection(),
        session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
        combat: {
          id: 'combat-1',
          sceneId: 'scene-combat',
          round: 1,
          currentTurnIndex: 0,
          participants: [
            { id: 'eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
            { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
            { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
            { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
            { id: 'char-marco', name: 'Marco Silva', initiative: 12, isDefeated: false },
          ],
        },
        updatedAt: Date.now(),
      }
    })
    await new Promise(r => setTimeout(r, 10000))

    // Advance turns - simulate a few rounds
    for (let round = 1; round <= 2; round++) {
      console.log(`\n--- Rodada ${round} ---`)
      master.send({
        type: 'session:state',
        projection: {
          ...createProjection(),
          session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
          combat: {
            id: 'combat-1',
            sceneId: 'scene-combat',
            round,
            currentTurnIndex: 0,
            participants: [
              { id: 'eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
              { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false },
              { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
              { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
              { id: 'char-marco', name: 'Marco Silva', initiative: 12, isDefeated: false },
            ],
          },
          updatedAt: Date.now(),
        }
      })
      await new Promise(r => setTimeout(r, 8000))
    }

    // Apply damage to a character
    console.log('\n--- Aplicar dano a Lia ---')
    master.send({
      type: 'session:state',
      projection: {
        ...createProjection(),
        session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-combat', activeCombatId: 'combat-1' },
        combat: {
          id: 'combat-1',
          sceneId: 'scene-combat',
          round: 3,
          currentTurnIndex: 0,
          participants: [
            { id: 'eco', name: 'Eco sem Origem', initiative: 20, isDefeated: false },
            { id: 'char-lia', name: 'Lia Azevedo', initiative: 18, isDefeated: false, health: 12 },
            { id: 'char-taina', name: 'Tainá Vargas', initiative: 16, isDefeated: false },
            { id: 'char-caio', name: 'Caio Rocha', initiative: 14, isDefeated: false },
            { id: 'char-marco', name: 'Marco Silva', initiative: 12, isDefeated: false },
          ],
        },
        characters: createProjection().characters.map(c =>
          c.id === 'char-lia' ? { ...c, ordem: { ...c.ordem, resources: { ...c.ordem.resources, health: { current: 12, max: 18 } } } } : c
        ),
        updatedAt: Date.now(),
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // Grant reward
    console.log('\n--- Conceder Recompensa ---')
    master.send({
      type: 'stage:present',
      stage: {
        id: 'stage-reward-1',
        kind: 'reward',
        title: 'Recompensa Recebida',
        body: 'Lia, Caio, Tainá e Marco recebem 20 de Exposição e um Fragmento de Cristal Vibrante cada um.',
        transition: 'reward',
        audience: { kind: 'all' }
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // End combat, return to narrative
    console.log('\n--- Encerrar Combate ---')
    master.send({
      type: 'session:state',
      projection: {
        ...createProjection(),
        session: { isActive: true, startedAt: Date.now(), endedAt: null, activeSceneId: 'scene-investigation', activeCombatId: null },
        combat: null,
        updatedAt: Date.now(),
      }
    })
    await new Promise(r => setTimeout(r, 2000))

    // Final scene
    console.log('\n--- Cena Final: Após o Confronto ---')
    master.send({
      type: 'stage:present',
      stage: {
        id: 'stage-aftermath',
        kind: 'scene',
        title: 'Após o Confronto',
        body: 'A antena silencia. O que restou do Eco se dissipa no ar. A Dra. Vale suspira aliviada: "Obrigado. Agora podemos investigar o que realmente aconteceu aqui."',
        transition: 'fade',
        audience: { kind: 'all' }
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // End session
    console.log('\n--- Encerrar Sessão ---')
    master.send({ type: 'session:end' })
    await new Promise(r => setTimeout(r, 1000))

  } catch (error) {
    master.log(`ERRO: ${error.message}`)
  } finally {
    master.close()
    console.log('\n═══════════════════════════════════════════')
    console.log('  MASTER-SIM finalizado')
    console.log('═══════════════════════════════════════════\n')
  }
}

main().catch(console.error)