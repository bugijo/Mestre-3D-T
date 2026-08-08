import type { AudioState, Campaign, Character, Combat, Scene, SessionState } from '@/domain/models'

export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'reconnecting' | 'error'
export type JoinStatus = 'idle' | 'pending' | 'approved' | 'declined'

export type LiveParticipant = {
  id: string
  playerName: string
  characterId: string | null
  status: 'pending' | 'approved' | 'declined'
  connected: boolean
  joinedAt: number
  lastSeenAt: number
  reconnectToken?: string
}

export type LiveAudience =
  | { kind: 'all' }
  | { kind: 'master' }
  | { kind: 'participants'; participantIds: string[] }

export type StageKind = 'scene' | 'image' | 'npc_reveal' | 'map' | 'combat' | 'reward' | 'message'
export type StageTransition = 'fade' | 'zoom' | 'reveal' | 'reward'

export type StagePresentation = {
  id: string
  kind: StageKind
  title: string
  body: string
  imageUrl?: string | null
  entityId?: string | null
  transition: StageTransition
  audience: LiveAudience
  createdAt?: number
}

export type SessionProjection = {
  campaign: Campaign | null
  session: Pick<SessionState, 'isActive' | 'startedAt' | 'endedAt' | 'activeSceneId' | 'activeCombatId'>
  scene: Scene | null
  combat: Combat | null
  characters: Character[]
  audio: AudioState
  mapState?: unknown
  updatedAt: number
}

export type LiveEvent = {
  id: string
  actionId: string
  kind: 'dice' | 'message' | 'feedback' | 'consent' | 'system' | string
  payload: Record<string, unknown>
  audience: LiveAudience
  actor: { role: 'master' | 'player'; id: string; name: string; characterId?: string | null }
  createdAt: number
}

export type HostSessionInput = {
  campaignId: string
  campaignTitle: string
  projection: SessionProjection
}

export type JoinSessionInput = {
  code: string
  playerName: string
}
