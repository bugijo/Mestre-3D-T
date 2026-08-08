import loginBg from '@/assets/login-bg.webp'
import type { AppSnapshot, Arc, Campaign, Character, EquipmentItem, Scene } from '@/domain/models'
import { createEmptyV1DomainState, type OrdemCompatibleCharacterData } from '@/domain/v1'
import { createId } from '@/lib/id'
import { DEFAULT_CAMPAIGN_SYSTEM } from '@/lib/campaignSystems'

function now() {
  return Date.now()
}

function demoItem(name: string, description: string): EquipmentItem {
  return {
    id: createId(),
    name,
    type: 'ACCESSORY',
    description,
    bonusF: 0,
    bonusH: 0,
    bonusR: 0,
    bonusA: 0,
    bonusPdF: 0,
    special: '',
    imageUri: null,
    isEquipped: false,
  }
}

function paranormalCharacter(input: {
  id: string
  campaignId: string
  ownerUserId?: string
  name: string
  type: Character['type']
  role: string
  origin: string
  path: string
  attributes: OrdemCompatibleCharacterData['attributes']
  health: number
  effort: number
  sanity: number
  biography: string
  equipment?: EquipmentItem[]
}): Character {
  const timestamp = now()
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    role: input.role,
    imageUri: null,
    portraitUri: null,
    tags: ['paranormal', input.origin.toLowerCase()],
    strength: input.attributes.strength,
    skill: input.attributes.agility,
    resistance: input.attributes.vigor,
    armor: 0,
    firepower: 0,
    currentHp: input.health,
    currentMp: input.effort,
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: '',
    speechStyle: '',
    mannerisms: [],
    goal: '',
    secrets: {},
    quickPhrases: [],
    advantages: [],
    disadvantages: [],
    equipment: input.equipment ?? [],
    powers: [],
    campaignId: input.campaignId,
    isTemplate: false,
    rulesetId: 'ordem-compatible',
    ownerUserId: input.ownerUserId,
    lifeStatus: 'active',
    history: [],
    creationMode: 'guided',
    ordem: {
      origin: input.origin,
      path: input.path,
      progression: 5,
      attributes: input.attributes,
      skills: {},
      resources: {
        health: { current: input.health, max: input.health },
        effort: { current: input.effort, max: input.effort },
        sanity: { current: input.sanity, max: input.sanity },
      },
      abilities: [],
      biography: input.biography,
      appearance: '',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultSnapshot(): AppSnapshot {
  const timestamp = now()
  const campaignId = createId()
  const arcId = createId()
  const investigationSceneId = createId()
  const combatSceneId = createId()
  const masterId = 'demo-master'
  const playerOneUserId = 'demo-player-lia'
  const playerTwoUserId = 'demo-player-caio'
  const liaId = createId()
  const caioId = createId()
  const npcId = createId()
  const creatureId = createId()

  const campaign: Campaign = {
    id: campaignId,
    title: 'O Caso de Santa Aurora',
    system: DEFAULT_CAMPAIGN_SYSTEM,
    rulesetId: 'ordem-compatible',
    description: 'Uma equipe investiga sinais impossíveis em uma estação meteorológica desativada. Conteúdo demonstrativo original.',
    coverDataUrl: loginBg,
    gameMasterUserId: masterId,
    entryPolicy: { mode: 'new_start', requiresMasterApproval: true },
    defaultSessionMode: 'in_person',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const arc: Arc = {
    id: arcId,
    name: 'Dossiê 01 — A frequência ausente',
    description: 'Investigação, revelação e confronto para um playtest presencial curto.',
    campaignId,
    orderIndex: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const investigationScene: Scene = {
    id: investigationSceneId,
    name: 'Arquivo Municipal',
    description: 'Fotografias queimadas nas bordas e relatórios de uma estação oficialmente inexistente.',
    objective: 'Descobrir a localização da Estação Aurora e quem apagou seus registros.',
    mood: 'mysterious',
    opening: 'O relógio marca 02:17. Em todas as fotografias, uma janela diferente reflete a mesma silhueta.',
    mapImageDataUrl: null,
    backgroundImageDataUrl: loginBg,
    soundtrackUrl: null,
    enemyIds: [],
    npcIds: [npcId],
    hooks: ['Um relatório carimbado com uma data futura', 'Uma fita cassete rotulada “não reproduzir”'],
    triggers: [
      {
        id: createId(),
        situation: 'Comparar as fotografias do arquivo.',
        testType: 'Investigação',
        attribute: 'Intelecto',
        difficulty: '15',
        onSuccess: 'A equipe encontra as coordenadas escondidas nas marcas de revelação.',
        onFailure: 'A silhueta parece mais próxima na fotografia seguinte.',
      },
    ],
    connections: [{ id: createId(), toSceneId: combatSceneId, label: 'Seguir as coordenadas', condition: 'A equipe identifica a estação nos arquivos.', consequence: 'O grupo chega ao subsolo antes do pico da transmissão.' }],
    campaignId,
    arcId,
    orderIndex: 0,
    isCompleted: false,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const combatScene: Scene = {
    id: combatSceneId,
    name: 'Subsolo da Estação Aurora',
    description: 'Um corredor circular cerca uma antena que vibra sem energia.',
    objective: 'Interromper a transmissão antes que o Eco atravesse por completo.',
    mood: 'tense',
    opening: 'A luz de emergência acende uma lâmpada por vez. Algo repete os passos da equipe do outro lado da parede.',
    mapImageDataUrl: null,
    backgroundImageDataUrl: null,
    soundtrackUrl: null,
    enemyIds: [creatureId],
    npcIds: [],
    hooks: ['O disjuntor principal', 'A antena marcada com símbolos geométricos'],
    triggers: [],
    campaignId,
    arcId,
    orderIndex: 1,
    isCompleted: false,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const lia = paranormalCharacter({
    id: liaId,
    campaignId,
    ownerUserId: playerOneUserId,
    name: 'Lia Azevedo',
    type: 'PLAYER',
    role: 'Investigadora forense',
    origin: 'Perita',
    path: 'Especialista',
    attributes: { agility: 2, intellect: 3, presence: 1, strength: 1, vigor: 2 },
    health: 18,
    effort: 12,
    sanity: 20,
    biography: 'Perita civil que encontrou padrões impossíveis em laudos arquivados.',
    equipment: [demoItem('Câmera espectral improvisada', 'Registra variações de luz fora do espectro visível.')],
  })
  lia.ordem!.skills = { investigation: 10, technology: 5, perception: 5 }

  const caio = paranormalCharacter({
    id: caioId,
    campaignId,
    ownerUserId: playerTwoUserId,
    name: 'Caio Rocha',
    type: 'PLAYER',
    role: 'Socorrista de campo',
    origin: 'Socorrista',
    path: 'Operador',
    attributes: { agility: 2, intellect: 2, presence: 2, strength: 2, vigor: 3 },
    health: 24,
    effort: 10,
    sanity: 18,
    biography: 'Voluntário de resgate acostumado a chegar antes das explicações.',
    equipment: [demoItem('Bolsa de primeiros socorros', 'Material básico para estabilização em campo.')],
  })
  caio.ordem!.skills = { medicine: 10, athletics: 5, will: 5 }

  const npc = paranormalCharacter({
    id: npcId,
    campaignId,
    name: 'Dra. Ester Vale',
    type: 'NPC',
    role: 'Arquivista municipal',
    origin: 'Pesquisadora',
    path: 'Contato',
    attributes: { agility: 1, intellect: 3, presence: 2, strength: 1, vigor: 1 },
    health: 10,
    effort: 12,
    sanity: 14,
    biography: 'Guardou cópias de documentos que deveriam ter sido destruídos.',
  })
  npc.personality = 'Precisa, exausta e genuinamente preocupada.'
  npc.goal = 'Impedir que a estação volte a transmitir.'
  npc.secrets = { master: 'Ester trabalhou na Estação Aurora e reconhece a voz da fita.' }
  npc.quickPhrases = ['Este arquivo nunca esteve vazio.', 'Não escutem a fita perto de um rádio.']

  const creature = paranormalCharacter({
    id: creatureId,
    campaignId,
    name: 'Eco sem Origem',
    type: 'BOSS',
    role: 'Anomalia acústica',
    origin: 'Manifestação',
    path: 'Ameaça',
    attributes: { agility: 3, intellect: 1, presence: 3, strength: 2, vigor: 3 },
    health: 32,
    effort: 16,
    sanity: 0,
    biography: 'Uma repetição que aprendeu a antecipar sua fonte.',
  })
  creature.powers = [
    {
      id: createId(),
      name: 'Passo Antecipado',
      description: 'O Eco se move um instante antes do som que deveria produzi-lo.',
      mpCost: null,
      target: 'um alvo',
      testReminder: null,
      onSuccess: null,
      onFailure: null,
      damage: '1d6',
      range: 'curto',
      areaEffect: false,
    },
  ]

  const v1 = createEmptyV1DomainState()
  v1.users = [
    { id: masterId, displayName: 'Mestre Demo', roles: ['player', 'game_master'], platformXp: 0, gameMasterXp: 0, titles: [], createdAt: timestamp, updatedAt: timestamp },
    { id: playerOneUserId, displayName: 'Jogadora Lia', roles: ['player'], platformXp: 0, gameMasterXp: 0, titles: [], createdAt: timestamp, updatedAt: timestamp },
    { id: playerTwoUserId, displayName: 'Jogador Caio', roles: ['player'], platformXp: 0, gameMasterXp: 0, titles: [], createdAt: timestamp, updatedAt: timestamp },
  ]
  v1.participations = [lia, caio].map((character) => ({
    id: createId(),
    characterId: character.id,
    campaignId,
    mode: 'new_start' as const,
    approvedByMaster: true,
    approvedItemIds: character.equipment.map((item) => item.id),
    notes: 'Participação de demonstração.',
    joinedAt: timestamp,
    leftAt: null,
  }))
  v1.entitlements = [{ id: createId(), userId: masterId, feature: 'v1-playtest', enabled: true, source: 'v1', expiresAt: null }]

  return {
    version: 1,
    campaigns: [campaign],
    arcs: [arc],
    scenes: [investigationScene, combatScene],
    characters: [lia, caio, npc, creature],
    combats: [],
    session: {
      isActive: false,
      activeCampaignId: campaignId,
      activeSceneId: investigationSceneId,
      activeCombatId: null,
      startedAt: null,
      endedAt: null,
      notes: [],
    },
    settings: { nextSessionAt: timestamp + 1000 * 60 * 60 * 24 * 3 },
    audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false, loop: true },
    sessionHistory: [],
    rewardTables: [
      { id: createId(), name: 'Pista decisiva', criteria: 'Descoberta que muda a investigação', xp: 10, gold: 0 },
      { id: createId(), name: 'Encerrar ameaça', criteria: 'Concluir o confronto', xp: 20, gold: 0 },
    ],
    rewardEvents: [],
    v1,
  }
}
