import type { RulesetId } from '@/rulesets/types'

export type UserRole = 'player' | 'game_master' | 'admin'
export type CharacterLifeStatus = 'active' | 'fallen' | 'retired'
export type SessionMode = 'in_person' | 'online' | 'hybrid'
export type CharacterEntryMode = 'new_start' | 'existing' | 'range' | 'adapted' | 'full_legacy'

export type PlatformUser = {
  id: string
  displayName: string
  roles: UserRole[]
  platformXp: number
  gameMasterXp: number
  titles: string[]
  createdAt: number
  updatedAt: number
}

export type CharacterHistoryEvent = {
  id: string
  type: 'campaign' | 'session' | 'xp' | 'progression' | 'item' | 'title' | 'event' | 'death' | 'resurrection' | 'achievement'
  title: string
  detail: string
  campaignId?: string
  sessionId?: string
  amount?: number
  createdAt: number
}

export type CharacterParticipation = {
  id: string
  characterId: string
  campaignId: string
  mode: CharacterEntryMode
  approvedByMaster: boolean
  adaptedProgression?: number
  approvedItemIds: string[]
  notes: string
  joinedAt: number
  leftAt: number | null
}

export type CampaignEntryPolicy = {
  mode: CharacterEntryMode
  minProgression?: number
  maxProgression?: number
  requiresMasterApproval: boolean
}

export type OrdemCompatibleCharacterData = {
  origin: string
  path: string
  progression: number
  attributes: Record<'agility' | 'intellect' | 'presence' | 'strength' | 'vigor', number>
  skills: Record<string, number>
  resources: Record<'health' | 'effort' | 'sanity', { current: number; max: number }>
  abilities: string[]
  biography: string
  appearance: string
}

export type LibraryEntityKind =
  | 'npc'
  | 'creature'
  | 'villain'
  | 'item'
  | 'equipment'
  | 'ability'
  | 'place'
  | 'settlement'
  | 'region'
  | 'country'
  | 'world'
  | 'mission'
  | 'scene'
  | 'map'
  | 'audio'
  | 'campaign'

export type LibraryEntity = {
  id: string
  ownerUserId: string
  rulesetId: RulesetId
  kind: LibraryEntityKind
  name: string
  summary: string
  imageDataUrl: string | null
  parentId: string | null
  tags: string[]
  privateNotes: string
  data: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export type DiceLogEntry = {
  id: string
  sessionId: string
  playerId: string
  playerName: string
  characterId: string | null
  expression: string
  rolls: number[]
  total: number
  visibility: 'public' | 'master' | 'player_master'
  context?: string
  createdAt: number
}

export type SessionFeedback = {
  id: string
  sessionId: string
  userId: string
  rating: 'excellent' | 'good' | 'neutral' | 'bad'
  tags: Array<'narrative' | 'combat' | 'pace' | 'immersion'>
  comment: string
  createdAt: number
}

export type RecordingConsent = {
  id: string
  sessionId: string
  participantId: string
  audio: boolean
  screen: boolean
  consentedAt: number | null
  revokedAt: number | null
}

export type CriticalActionLog = {
  id: string
  sessionId?: string
  actorId: string
  action: string
  targetType: string
  targetId?: string
  detail: string
  createdAt: number
}

export type FeatureEntitlement = {
  id: string
  userId: string
  feature: string
  enabled: boolean
  source: 'v1' | 'plan' | 'purchase' | 'admin'
  expiresAt: number | null
}

export type Wallet = {
  id: string
  userId: string
  virtualBalance: number
  updatedAt: number
}

export type WalletTransaction = {
  id: string
  walletId: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  createdAt: number
}

export type SocialStub = {
  friendships: Array<{ id: string; userId: string; friendUserId: string; status: 'pending' | 'accepted' | 'blocked' }>
  follows: Array<{ id: string; followerId: string; followedId: string }>
  groups: Array<{ id: string; ownerId: string; name: string; memberIds: string[] }>
  notificationPreferences: Array<{ userId: string; sessionReminders: boolean; invitations: boolean }>
}

export type V1DomainState = {
  users: PlatformUser[]
  participations: CharacterParticipation[]
  library: LibraryEntity[]
  diceLog: DiceLogEntry[]
  feedback: SessionFeedback[]
  recordingConsents: RecordingConsent[]
  auditLog: CriticalActionLog[]
  entitlements: FeatureEntitlement[]
  wallets: Wallet[]
  walletTransactions: WalletTransaction[]
  social: SocialStub
}

export function createEmptyV1DomainState(): V1DomainState {
  return {
    users: [],
    participations: [],
    library: [],
    diceLog: [],
    feedback: [],
    recordingConsents: [],
    auditLog: [],
    entitlements: [],
    wallets: [],
    walletTransactions: [],
    social: { friendships: [], follows: [], groups: [], notificationPreferences: [] },
  }
}
