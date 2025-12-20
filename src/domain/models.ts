export type CharacterType = 'PLAYER' | 'NPC' | 'ENEMY' | 'BOSS' | 'COMPANION'

export type ConditionType =
  | 'BURNING'
  | 'POISONED'
  | 'PARALYZED'
  | 'STUNNED'
  | 'BLEEDING'
  | 'BLESSED'
  | 'CURSED'
  | 'INVISIBLE'
  | 'FLYING'
  | 'PRONE'
  | 'RESTRAINED'
  | 'FRIGHTENED'
  | 'CHARMED'
  | 'CUSTOM'

export type EquipmentType = 'WEAPON' | 'ARMOR' | 'SHIELD' | 'ACCESSORY' | 'CONSUMABLE'

export type Mood = 'neutral' | 'tense' | 'calm' | 'epic' | 'mysterious'

export type RollTrigger = {
  id: string
  situation: string
  testType: string
  attribute: string
  difficulty: string
  onSuccess: string
  onFailure: string
}

export type Condition = {
  id: string
  type: ConditionType
  name: string
  description: string
  duration: number
  value: number
  appliedAt: number
}

export type EquipmentItem = {
  id: string
  name: string
  type: EquipmentType
  description: string
  bonusF: number
  bonusH: number
  bonusR: number
  bonusA: number
  bonusPdF: number
  special: string
  imageUri: string | null
  isEquipped: boolean
}

export type Power = {
  id: string
  name: string
  description: string
  mpCost: number | null
  target: string
  testReminder: string | null
  onSuccess: string | null
  onFailure: string | null
  damage: string | null
  range: string
  areaEffect: boolean
}

export type Character = {
  id: string
  name: string
  type: CharacterType
  role: string
  imageUri: string | null
  portraitUri: string | null
  tags: string[]

  strength: number
  skill: number
  resistance: number
  armor: number
  firepower: number

  currentHp: number
  currentMp: number
  activeConditions: Condition[]
  xp: number
  gold: number

  personality: string
  speechStyle: string
  mannerisms: string[]
  goal: string
  secrets: Record<string, string>
  quickPhrases: string[]

  advantages: string[]
  disadvantages: string[]
  equipment: EquipmentItem[]
  powers: Power[]
  dnd?: DndCharacterData

  campaignId: string | null
  isTemplate: boolean
  createdAt: number
  updatedAt: number
}

export type Scene = {
  id: string
  name: string
  description: string
  objective: string
  mood: Mood
  opening: string

  mapImageDataUrl: string | null
  backgroundImageDataUrl: string | null
  soundtrackUrl: string | null

  enemyIds: string[]
  npcIds: string[]
  hooks: string[]
  triggers: RollTrigger[]

  campaignId: string
  arcId: string
  orderIndex: number
  isCompleted: boolean
  completedAt: number | null
  createdAt: number
  updatedAt: number
}

export type Arc = {
  id: string
  name: string
  description: string
  campaignId: string
  orderIndex: number
  createdAt: number
  updatedAt: number
}

export type Campaign = {
  id: string
  title: string
  system: string
  description: string
  coverDataUrl: string | null
  createdAt: number
  updatedAt: number
}

export type CombatParticipant = {
  id: string
  characterId: string | null
  name: string
  initiative: number
  currentHp: number
  maxHp: number
  currentMp: number | null
  maxMp: number | null
  imageUri: string | null
  isPlayer: boolean
  isDefeated: boolean
  activeConditions: Condition[]
}

export type Combat = {
  id: string
  sceneId: string
  round: number
  currentTurnIndex: number
  participants: CombatParticipant[]
  isActive: boolean
  startedAt: number
  endedAt: number | null
}

export type SessionNote = {
  id: string
  createdAt: number
  text: string
  important: boolean
}

export type SessionState = {
  isActive: boolean
  activeCampaignId: string | null
  activeSceneId: string | null
  activeCombatId: string | null
  startedAt: number | null
  endedAt: number | null
  notes: SessionNote[]
}

export type SettingsState = {
  nextSessionAt: number
}

export type AudioState = {
  currentTrackUrl: string | null
  volume: number
  isPlaying: boolean
  isMuted: boolean
}

export type GameSystem = 'DND5E' | '3DT'
export type DndAbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
export type DndCharacterData = {
  level: number
  class: string
  race: string
  background: string
  abilityScores: Record<DndAbilityKey, number>
  proficiencyBonus: number
  armorClass: number
  maxHp: number
}

export type RewardRule = {
  id: string
  name: string
  criteria: string
  xp: number
  gold: number
}

export type RewardGrant = {
  characterId: string
  xp: number
  gold: number
  items: EquipmentItem[]
}

export type RewardEvent = {
  id: string
  sceneId: string
  combatId: string | null
  createdAt: number
  grants: RewardGrant[]
  notes: string
}

export type AppSnapshot = {
  version: 1
  campaigns: Campaign[]
  arcs: Arc[]
  scenes: Scene[]
  characters: Character[]
  combats: Combat[]
  session: SessionState
  settings: SettingsState
  audio: AudioState
  rewardTables: RewardRule[]
  rewardEvents: RewardEvent[]
}

export function calcMaxHp(resistance: number) {
  return Math.max(0, Math.floor(resistance) * 5)
}

export function calcMaxMp(resistance: number) {
  return Math.max(0, Math.floor(resistance) * 5)
}

