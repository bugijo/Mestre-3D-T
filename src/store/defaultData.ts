import loginBg from '@/assets/login-bg.png'
import type { AppSnapshot, Campaign, Character, Scene, Arc } from '@/domain/models'
import { calcMaxHp, calcMaxMp } from '@/domain/models'
import { createId } from '@/lib/id'

function now() {
  return Date.now()
}

export function createDefaultSnapshot(): AppSnapshot {
  const campaignId = createId()
  const arcId = createId()
  const sceneId = createId()

  const campaign: Campaign = {
    id: campaignId,
    title: 'A Guerra das Sombras',
    system: '3D&T Alpha',
    description: 'Uma campanha sombria de investigação e horror fantástico.',
    coverDataUrl: loginBg,
    createdAt: now(),
    updatedAt: now(),
  }

  const arc: Arc = {
    id: arcId,
    name: 'Ato I — O Sussurro',
    description: 'Introdução e ganchos iniciais.',
    campaignId,
    orderIndex: 0,
    createdAt: now(),
    updatedAt: now(),
  }

  const scene: Scene = {
    id: sceneId,
    name: 'Taverna de Blackwood',
    description: 'Ponto de encontro e rumores estranhos.',
    objective: 'Descobrir o que está acontecendo na floresta.',
    mood: 'mysterious',
    opening: 'A chuva cai pesada. No canto da taverna, um mensageiro observa vocês em silêncio.',
    mapImageDataUrl: null,
    backgroundImageDataUrl: loginBg,
    soundtrackUrl: null,
    enemyIds: [],
    npcIds: [],
    hooks: ['Uma carruagem sumiu na estrada', 'Luzes verdes na floresta'],
    triggers: [],
    campaignId,
    arcId,
    orderIndex: 0,
    isCompleted: false,
    completedAt: null,
    createdAt: now(),
    updatedAt: now(),
  }

  const npcId = createId()
  const npc: Character = {
    id: npcId,
    name: 'Eldrin (NPC)',
    type: 'NPC',
    role: 'Informante',
    imageUri: null,
    portraitUri: null,
    tags: ['rumores', 'taverna'],
    strength: 0,
    skill: 2,
    resistance: 1,
    armor: 0,
    firepower: 0,
    currentHp: calcMaxHp(1),
    currentMp: calcMaxMp(1),
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: 'Calmo, atento e desconfiado.',
    speechStyle: 'Fala baixo e direto.',
    mannerisms: ['Olha para os lados antes de falar'],
    goal: 'Manter a cidade segura.',
    secrets: { '1': 'Ele sabe quem atacou a carruagem.' },
    quickPhrases: ['Não é seguro ficar na estrada à noite.', 'A floresta não está normal.'],
    advantages: [],
    disadvantages: [],
    equipment: [],
    powers: [],
    campaignId,
    isTemplate: false,
    createdAt: now(),
    updatedAt: now(),
  }

  scene.npcIds = [npcId]

  return {
    version: 1,
    campaigns: [campaign],
    arcs: [arc],
    scenes: [scene],
    characters: [npc],
    combats: [],
    session: {
      isActive: false,
      activeCampaignId: campaignId,
      activeSceneId: sceneId,
      activeCombatId: null,
      startedAt: null,
      endedAt: null,
      notes: [],
    },
    settings: {
      nextSessionAt: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    audio: {
      currentTrackUrl: null,
      volume: 0.5,
      isPlaying: false,
      isMuted: false,
    },
    rewardTables: [
      { id: createId(), name: 'Padrão', criteria: 'Vitória comum', xp: 50, gold: 20 },
      { id: createId(), name: 'Difícil', criteria: 'Encontro difícil', xp: 100, gold: 50 },
    ],
    rewardEvents: [],
  }
}

