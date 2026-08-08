import type { AppSnapshot, Character } from '@/domain/models'
import type { SessionProjection } from './protocol'

export function sanitizeCharacterForPlayers(character: Character): Character {
  return {
    ...character,
    secrets: {},
    history: [],
    sourceAttachment: undefined,
  }
}

export function sanitizeSceneForPlayers(scene: AppSnapshot['scenes'][number] | null) {
  if (!scene) return null
  return {
    ...scene,
    enemyIds: [],
    npcIds: [],
    hooks: [],
    triggers: [],
    connections: [],
  }
}

function readMapState(sceneId: string | null) {
  if (!sceneId || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(`map-state:${sceneId}`)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export function createSessionProjection(state: AppSnapshot): SessionProjection {
  const campaign = state.campaigns.find((entry) => entry.id === state.session.activeCampaignId) ?? null
  const scene = state.scenes.find((entry) => entry.id === state.session.activeSceneId) ?? null
  const combat = state.combats.find((entry) => entry.id === state.session.activeCombatId) ?? null
  const campaignCharacters = state.characters
    .filter((character) => character.campaignId === campaign?.id)
    .map(sanitizeCharacterForPlayers)

  return {
    campaign,
    session: {
      isActive: state.session.isActive,
      startedAt: state.session.startedAt,
      endedAt: state.session.endedAt,
      activeSceneId: state.session.activeSceneId,
      activeCombatId: state.session.activeCombatId,
    },
    scene: sanitizeSceneForPlayers(scene),
    combat,
    characters: campaignCharacters,
    audio: state.audio,
    mapState: readMapState(scene?.id ?? null),
    updatedAt: Date.now(),
  }
}
