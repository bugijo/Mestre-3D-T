import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { AppSnapshot, Arc, Campaign, Character, Combat, CombatParticipant, Scene, SessionNote } from '@/domain/models'
import type { RewardEvent, RewardGrant, RewardRule } from '@/domain/models'
import { calcMaxHp, calcMaxMp } from '@/domain/models'
import { loadSnapshot } from '@/lib/storage'
import { loadSnapshotFromDB, saveSnapshotToDB } from '@/lib/db'
import { createId } from '@/lib/id'
import { createDefaultSnapshot } from '@/store/defaultData'

type AppState = AppSnapshot

type Action =
  | { type: 'SNAPSHOT/REPLACE'; snapshot: AppSnapshot }
  | { type: 'CAMPAIGN/UPSERT'; campaign: Campaign }
  | { type: 'CAMPAIGN/DELETE'; campaignId: string }
  | { type: 'ARC/UPSERT'; arc: Arc }
  | { type: 'ARC/DELETE'; arcId: string }
  | { type: 'SCENE/UPSERT'; scene: Scene }
  | { type: 'SCENE/DELETE'; sceneId: string }
  | { type: 'SESSION/SET_ACTIVE_SCENE'; campaignId: string; sceneId: string }
  | { type: 'SESSION/START' }
  | { type: 'SESSION/END' }
  | { type: 'SESSION/ADD_NOTE'; note: SessionNote }
  | { type: 'SESSION/DELETE_NOTE'; noteId: string }
  | { type: 'CHARACTER/UPSERT'; character: Character }
  | { type: 'CHARACTER/DELETE'; characterId: string }
  | { type: 'SCENE/LINK_CHARACTER'; sceneId: string; characterId: string; kind: 'npc' | 'enemy' }
  | { type: 'SCENE/UNLINK_CHARACTER'; sceneId: string; characterId: string; kind: 'npc' | 'enemy' }
  | { type: 'CHARACTER/ADJUST_HP_MP'; characterId: string; hpDelta: number; mpDelta: number }
  | { type: 'COMBAT/START'; sceneId: string; participants: CombatParticipant[] }
  | { type: 'COMBAT/END'; combatId: string }
  | { type: 'COMBAT/NEXT_TURN'; combatId: string }
  | { type: 'COMBAT/ADJUST_PARTICIPANT'; combatId: string; participantId: string; hpDelta: number; mpDelta: number }
  | { type: 'COMBAT/TOGGLE_DEFEATED'; combatId: string; participantId: string }
  | { type: 'SETTINGS/SET_NEXT_SESSION_AT'; nextSessionAt: number }
  | { type: 'AUDIO/PLAY_TRACK'; url: string }
  | { type: 'AUDIO/PAUSE' }
  | { type: 'AUDIO/RESUME' }
  | { type: 'AUDIO/STOP' }
  | { type: 'AUDIO/SET_VOLUME'; volume: number }
  | { type: 'AUDIO/TOGGLE_MUTE' }
  | { type: 'REWARD_TABLE/UPSERT'; rule: RewardRule }
  | { type: 'REWARD_TABLE/DELETE'; ruleId: string }
  | { type: 'REWARDS/GRANT'; event: RewardEvent }

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx === -1) return [item, ...list]
  const copy = list.slice()
  copy[idx] = item
  return copy
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SNAPSHOT/REPLACE':
      return action.snapshot

    case 'CAMPAIGN/UPSERT':
      return { ...state, campaigns: upsertById(state.campaigns, action.campaign) }

    case 'CAMPAIGN/DELETE': {
      const campaigns = removeById(state.campaigns, action.campaignId)
      const arcs = state.arcs.filter((a) => a.campaignId !== action.campaignId)
      const scenes = state.scenes.filter((s) => s.campaignId !== action.campaignId)
      const characters = state.characters.map((c) => (c.campaignId === action.campaignId ? { ...c, campaignId: null } : c))
      const session =
        state.session.activeCampaignId === action.campaignId
          ? { ...state.session, activeCampaignId: campaigns[0]?.id ?? null, activeSceneId: null, activeCombatId: null }
          : state.session
      return { ...state, campaigns, arcs, scenes, characters, session }
    }

    case 'ARC/UPSERT':
      return { ...state, arcs: upsertById(state.arcs, action.arc) }

    case 'ARC/DELETE': {
      const arcs = removeById(state.arcs, action.arcId)
      const scenes = state.scenes.filter((s) => s.arcId !== action.arcId)
      const session =
        state.session.activeSceneId && scenes.every((s) => s.id !== state.session.activeSceneId)
          ? { ...state.session, activeSceneId: null, activeCombatId: null }
          : state.session
      return { ...state, arcs, scenes, session }
    }

    case 'SCENE/UPSERT':
      return { ...state, scenes: upsertById(state.scenes, action.scene) }

    case 'SCENE/DELETE': {
      const scenes = removeById(state.scenes, action.sceneId)
      const combats = state.combats.filter((c) => c.sceneId !== action.sceneId)
      const session =
        state.session.activeSceneId === action.sceneId
          ? { ...state.session, activeSceneId: null, activeCombatId: null }
          : state.session
      return { ...state, scenes, combats, session }
    }

    case 'SESSION/SET_ACTIVE_SCENE': {
      const scene = state.scenes.find((s) => s.id === action.sceneId)
      const note: SessionNote = {
        id: createId(),
        createdAt: Date.now(),
        text: `📍 Cena Iniciada: ${scene?.name ?? 'Desconhecida'}`,
        important: false,
      }
      return {
        ...state,
        session: {
          ...state.session,
          activeCampaignId: action.campaignId,
          activeSceneId: action.sceneId,
          activeCombatId: null,
          notes: [note, ...state.session.notes],
        },
      }
    }

    case 'SESSION/START':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: true,
          startedAt: Date.now(),
          endedAt: null,
        },
      }

    case 'SESSION/END':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: false,
          endedAt: Date.now(),
          activeCombatId: null,
        },
      }

    case 'SESSION/ADD_NOTE':
      return { ...state, session: { ...state.session, notes: [action.note, ...state.session.notes] } }

    case 'SESSION/DELETE_NOTE':
      return { ...state, session: { ...state.session, notes: state.session.notes.filter((n) => n.id !== action.noteId) } }

    case 'CHARACTER/UPSERT':
      return { ...state, characters: upsertById(state.characters, action.character) }

    case 'CHARACTER/DELETE': {
      const characters = removeById(state.characters, action.characterId)
      const scenes = state.scenes.map((s) => ({
        ...s,
        npcIds: s.npcIds.filter((id) => id !== action.characterId),
        enemyIds: s.enemyIds.filter((id) => id !== action.characterId),
      }))
      const combats = state.combats.map((c) => ({
        ...c,
        participants: c.participants.filter((p) => p.characterId !== action.characterId),
      }))
      return { ...state, characters, scenes, combats }
    }

    case 'SCENE/LINK_CHARACTER': {
      const scenes = state.scenes.map((s) => {
        if (s.id !== action.sceneId) return s
        if (action.kind === 'npc') {
          if (s.npcIds.includes(action.characterId)) return s
          return { ...s, npcIds: [...s.npcIds, action.characterId], updatedAt: Date.now() }
        }
        if (s.enemyIds.includes(action.characterId)) return s
        return { ...s, enemyIds: [...s.enemyIds, action.characterId], updatedAt: Date.now() }
      })
      return { ...state, scenes }
    }

    case 'SCENE/UNLINK_CHARACTER': {
      const scenes = state.scenes.map((s) => {
        if (s.id !== action.sceneId) return s
        if (action.kind === 'npc') {
          return { ...s, npcIds: s.npcIds.filter((id) => id !== action.characterId), updatedAt: Date.now() }
        }
        return { ...s, enemyIds: s.enemyIds.filter((id) => id !== action.characterId), updatedAt: Date.now() }
      })
      return { ...state, scenes }
    }

    case 'CHARACTER/ADJUST_HP_MP': {
      const characters = state.characters.map((c) => {
        if (c.id !== action.characterId) return c
        const maxHp = calcMaxHp(c.resistance)
        const maxMp = calcMaxMp(c.resistance)
        return {
          ...c,
          currentHp: clamp(c.currentHp + action.hpDelta, 0, maxHp),
          currentMp: clamp(c.currentMp + action.mpDelta, 0, maxMp),
          updatedAt: Date.now(),
        }
      })
      return { ...state, characters }
    }

    case 'COMBAT/START': {
      const combatId = createId()
      const combat: Combat = {
        id: combatId,
        sceneId: action.sceneId,
        round: 1,
        currentTurnIndex: 0,
        participants: action.participants.slice().sort((a, b) => b.initiative - a.initiative),
        isActive: true,
        startedAt: Date.now(),
        endedAt: null,
      }

      const note: SessionNote = {
        id: createId(),
        createdAt: Date.now(),
        text: `⚔️ Combate iniciado com ${combat.participants.length} participantes.`,
        important: true,
      }

      return {
        ...state,
        combats: [combat, ...state.combats],
        session: { 
          ...state.session, 
          activeCombatId: combatId,
          notes: [note, ...state.session.notes]
        },
      }
    }

    case 'COMBAT/END': {
      const combats = state.combats.map((c) => (c.id === action.combatId ? { ...c, isActive: false, endedAt: Date.now() } : c))
      const session = state.session.activeCombatId === action.combatId ? { ...state.session, activeCombatId: null } : state.session
      
      const combat = state.combats.find(c => c.id === action.combatId)
      const note: SessionNote = {
        id: createId(),
        createdAt: Date.now(),
        text: `🏁 Combate encerrado após ${combat?.round ?? 0} rodadas.`,
        important: false,
      }
      
      return { 
        ...state, 
        combats, 
        session: { ...session, notes: [note, ...session.notes] } 
      }
    }

    case 'COMBAT/NEXT_TURN': {
      const combats = state.combats.map((c) => {
        if (c.id !== action.combatId) return c
        if (c.participants.length === 0) return c
        const nextIndex = (c.currentTurnIndex + 1) % c.participants.length
        const nextRound = nextIndex === 0 ? c.round + 1 : c.round
        return { ...c, currentTurnIndex: nextIndex, round: nextRound }
      })
      return { ...state, combats }
    }

    case 'COMBAT/ADJUST_PARTICIPANT': {
      const combats = state.combats.map((c) => {
        if (c.id !== action.combatId) return c
        const participants = c.participants.map((p) => {
          if (p.id !== action.participantId) return p
          const maxHp = p.maxHp
          const maxMp = p.maxMp ?? 0
          const currentMp = p.currentMp ?? 0
          const updatedHp = clamp(p.currentHp + action.hpDelta, 0, maxHp)
          const updatedMp = p.maxMp == null ? null : clamp(currentMp + action.mpDelta, 0, maxMp)
          return { ...p, currentHp: updatedHp, currentMp: updatedMp, isDefeated: updatedHp === 0 ? true : p.isDefeated }
        })
        return { ...c, participants }
      })
      return { ...state, combats }
    }

    case 'COMBAT/TOGGLE_DEFEATED': {
      const combats = state.combats.map((c) => {
        if (c.id !== action.combatId) return c
        const participants = c.participants.map((p) => (p.id === action.participantId ? { ...p, isDefeated: !p.isDefeated } : p))
        return { ...c, participants }
      })
      return { ...state, combats }
    }

    case 'SETTINGS/SET_NEXT_SESSION_AT':
      return { ...state, settings: { ...state.settings, nextSessionAt: action.nextSessionAt } }

    case 'AUDIO/PLAY_TRACK':
      return {
        ...state,
        audio: {
          ...state.audio,
          currentTrackUrl: action.url,
          isPlaying: true,
        },
      }

    case 'AUDIO/PAUSE':
      return { ...state, audio: { ...state.audio, isPlaying: false } }

    case 'AUDIO/RESUME':
      return { ...state, audio: { ...state.audio, isPlaying: true } }

    case 'AUDIO/STOP':
      return { ...state, audio: { ...state.audio, isPlaying: false, currentTrackUrl: null } }

    case 'AUDIO/SET_VOLUME':
      return { ...state, audio: { ...state.audio, volume: clamp(action.volume, 0, 1) } }

    case 'AUDIO/TOGGLE_MUTE':
      return { ...state, audio: { ...state.audio, isMuted: !state.audio.isMuted } }

    case 'REWARD_TABLE/UPSERT': {
      const rules = upsertById(state.rewardTables, action.rule)
      return { ...state, rewardTables: rules }
    }

    case 'REWARD_TABLE/DELETE': {
      const rules = removeById(state.rewardTables, action.ruleId)
      return { ...state, rewardTables: rules }
    }

    case 'REWARDS/GRANT': {
      const grants = action.event.grants
      const characters = state.characters.map(c => {
        const g = grants.find(x => x.characterId === c.id)
        if (!g) return c
        return {
          ...c,
          xp: (c.xp ?? 0) + (g.xp ?? 0),
          gold: (c.gold ?? 0) + (g.gold ?? 0),
          equipment: g.items && g.items.length > 0 ? [...c.equipment, ...g.items] : c.equipment,
          updatedAt: Date.now(),
        }
      })
      const note: SessionNote = {
        id: createId(),
        createdAt: Date.now(),
        text: `🎁 Recompensas distribuídas: ${grants.map(g => {
          const ch = state.characters.find(c => c.id === g.characterId)
          const name = ch?.name ?? 'Desconhecido'
          const items = g.items?.length ? `, itens: ${g.items.length}` : ''
          return `${name} (+${g.xp} XP, +${g.gold} ouro${items})`
        }).join('; ')}`,
        important: true,
      }
      return {
        ...state,
        characters,
        rewardEvents: [action.event, ...state.rewardEvents],
        session: { ...state.session, notes: [note, ...state.session.notes] },
      }
    }

    default:
      return state
  }
}

  type AppStoreApi = {
  state: AppState
  replaceSnapshot: (snapshot: AppSnapshot) => void
  createCampaign: (data: Pick<Campaign, 'title' | 'system' | 'description'> & { coverDataUrl?: string | null }) => Campaign
  updateCampaign: (id: string, data: Partial<Campaign>) => void
  deleteCampaign: (campaignId: string) => void
  createArc: (campaignId: string, name: string, description: string) => Arc
  updateArc: (id: string, data: Partial<Arc>) => void
  deleteArc: (arcId: string) => void
  createScene: (campaignId: string, arcId: string, data: Pick<Scene, 'name' | 'description' | 'objective' | 'mood' | 'opening'>) => Scene
  updateScene: (id: string, data: Partial<Scene>) => void
  deleteScene: (sceneId: string) => void
  setActiveScene: (campaignId: string, sceneId: string) => void
  startSession: () => void
  endSession: () => void
  addNote: (text: string, important: boolean) => void
  deleteNote: (noteId: string) => void
  createCharacter: (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Character
  updateCharacter: (id: string, data: Partial<Character>) => void
  deleteCharacter: (characterId: string) => void
  linkCharacterToScene: (sceneId: string, characterId: string, kind: 'npc' | 'enemy') => void
  unlinkCharacterFromScene: (sceneId: string, characterId: string, kind: 'npc' | 'enemy') => void
  adjustCharacterHpMp: (characterId: string, hpDelta: number, mpDelta: number) => void
  startCombatFromScene: (sceneId: string) => void
  endCombat: (combatId: string) => void
  nextCombatTurn: (combatId: string) => void
  adjustCombatParticipant: (combatId: string, participantId: string, hpDelta: number, mpDelta: number) => void
  toggleCombatDefeated: (combatId: string, participantId: string) => void
  setNextSessionAt: (nextSessionAt: number) => void
  playTrack: (url: string) => void
  pauseTrack: () => void
  resumeTrack: () => void
  stopTrack: () => void
  setVolume: (volume: number) => void
    toggleMute: () => void
    upsertRewardRule: (rule: RewardRule) => void
    deleteRewardRule: (ruleId: string) => void
    grantRewards: (sceneId: string, combatId: string | null, grants: RewardGrant[], notes?: string) => RewardEvent
  }

const AppStoreContext = createContext<AppStoreApi | null>(null)

  export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createDefaultSnapshot())
  const [isLoaded, setIsLoaded] = useState(false)

  // Initial Load (IndexedDB -> LocalStorage -> Default)
  useEffect(() => {
    async function init() {
      try {
        // 1. Try IndexedDB
        const dbSnapshot = await loadSnapshotFromDB()
        if (dbSnapshot) {
          if (!dbSnapshot.audio) {
            dbSnapshot.audio = { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false }
          }
          if (!dbSnapshot.rewardTables) {
            dbSnapshot.rewardTables = []
          }
          if (!dbSnapshot.rewardEvents) {
            dbSnapshot.rewardEvents = []
          }
          if (dbSnapshot.characters) {
            dbSnapshot.characters = dbSnapshot.characters.map((c: Character) => ({
              ...c,
              xp: c.xp ?? 0,
              gold: c.gold ?? 0,
            }))
          }
          dispatch({ type: 'SNAPSHOT/REPLACE', snapshot: dbSnapshot })
          setIsLoaded(true)
          return
        }

        // 2. Try LocalStorage (Migration)
        const localSnapshot = loadSnapshot()
        if (localSnapshot) {
          if (!localSnapshot.audio) {
            localSnapshot.audio = { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false }
          }
          if (!localSnapshot.rewardTables) {
            localSnapshot.rewardTables = []
          }
          if (!localSnapshot.rewardEvents) {
            localSnapshot.rewardEvents = []
          }
          if (localSnapshot.characters) {
            localSnapshot.characters = localSnapshot.characters.map((c: Character) => ({
              ...c,
              xp: c.xp ?? 0,
              gold: c.gold ?? 0,
            }))
          }
          dispatch({ type: 'SNAPSHOT/REPLACE', snapshot: localSnapshot })
          await saveSnapshotToDB(localSnapshot) // Migrate
          setIsLoaded(true)
          return
        }

        // 3. Default
        setIsLoaded(true)
      } catch (error) {
        console.error('Failed to load snapshot:', error)
        setIsLoaded(true)
      }
    }
    init()
  }, [])

  // Auto-save to IndexedDB
  useEffect(() => {
    if (!isLoaded) return
    const timeout = setTimeout(() => {
      saveSnapshotToDB(state)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [state, isLoaded])

  const api: AppStoreApi = useMemo(() => {
    return {
      state,
      replaceSnapshot: (snapshot) => dispatch({ type: 'SNAPSHOT/REPLACE', snapshot }),
      createCampaign: (data) => {
        const campaign: Campaign = {
          id: createId(),
          title: data.title.trim(),
          system: data.system.trim() || '3D&T',
          description: data.description.trim(),
          coverDataUrl: data.coverDataUrl ?? null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        dispatch({ type: 'CAMPAIGN/UPSERT', campaign })
        return campaign
      },
      updateCampaign: (id, data) => {
        const existing = state.campaigns.find((c) => c.id === id)
        if (!existing) return
        const campaign: Campaign = { ...existing, ...data, updatedAt: Date.now() }
        dispatch({ type: 'CAMPAIGN/UPSERT', campaign })
      },
      deleteCampaign: (campaignId) => dispatch({ type: 'CAMPAIGN/DELETE', campaignId }),
      createArc: (campaignId, name, description) => {
        const arc: Arc = {
          id: createId(),
          campaignId,
          name: name.trim(),
          description: description.trim(),
          orderIndex: state.arcs.filter((a) => a.campaignId === campaignId).length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        dispatch({ type: 'ARC/UPSERT', arc })
        return arc
      },
      updateArc: (id, data) => {
        const existing = state.arcs.find((a) => a.id === id)
        if (!existing) return
        const arc: Arc = { ...existing, ...data, updatedAt: Date.now() }
        dispatch({ type: 'ARC/UPSERT', arc })
      },
      deleteArc: (arcId) => dispatch({ type: 'ARC/DELETE', arcId }),
      createScene: (campaignId, arcId, data) => {
        const existing = state.scenes.filter((s) => s.arcId === arcId)
        const scene: Scene = {
          id: createId(),
          campaignId,
          arcId,
          name: data.name.trim(),
          description: data.description.trim(),
          objective: data.objective.trim(),
          mood: data.mood,
          opening: data.opening.trim(),
          mapImageDataUrl: null,
          backgroundImageDataUrl: null,
          soundtrackUrl: null,
          enemyIds: [],
          npcIds: [],
          hooks: [],
          triggers: [],
          orderIndex: existing.length,
          isCompleted: false,
          completedAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        dispatch({ type: 'SCENE/UPSERT', scene })
        return scene
      },
      updateScene: (id, data) => {
        const existing = state.scenes.find((s) => s.id === id)
        if (!existing) return
        const scene: Scene = { ...existing, ...data, updatedAt: Date.now() }
        dispatch({ type: 'SCENE/UPSERT', scene })
      },
      deleteScene: (sceneId) => dispatch({ type: 'SCENE/DELETE', sceneId }),
      setActiveScene: (campaignId, sceneId) => dispatch({ type: 'SESSION/SET_ACTIVE_SCENE', campaignId, sceneId }),
      startSession: () => dispatch({ type: 'SESSION/START' }),
      endSession: () => dispatch({ type: 'SESSION/END' }),
      addNote: (text, important) => {
        const trimmed = text.trim()
        if (!trimmed) return
        dispatch({ type: 'SESSION/ADD_NOTE', note: { id: createId(), createdAt: Date.now(), text: trimmed, important } })
      },
      deleteNote: (noteId) => dispatch({ type: 'SESSION/DELETE_NOTE', noteId }),
      createCharacter: (data) => {
        const base: Character = {
          ...data,
          id: createId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          xp: 0,
          gold: 0,
        }
        const maxHp = calcMaxHp(base.resistance)
        const maxMp = calcMaxMp(base.resistance)
        const character: Character = {
          ...base,
          currentHp: clamp(base.currentHp ?? maxHp, 0, maxHp),
          currentMp: clamp(base.currentMp ?? maxMp, 0, maxMp),
        }
        dispatch({ type: 'CHARACTER/UPSERT', character })
        return character
      },
      updateCharacter: (id, data) => {
        const existing = state.characters.find((c) => c.id === id)
        if (!existing) return
        const character: Character = { ...existing, ...data, updatedAt: Date.now() }
        const maxHp = calcMaxHp(character.resistance)
        const maxMp = calcMaxMp(character.resistance)
        dispatch({
          type: 'CHARACTER/UPSERT',
          character: {
            ...character,
            currentHp: clamp(character.currentHp, 0, maxHp),
            currentMp: clamp(character.currentMp, 0, maxMp),
          },
        })
      },
      deleteCharacter: (characterId) => dispatch({ type: 'CHARACTER/DELETE', characterId }),
      linkCharacterToScene: (sceneId, characterId, kind) => dispatch({ type: 'SCENE/LINK_CHARACTER', sceneId, characterId, kind }),
      unlinkCharacterFromScene: (sceneId, characterId, kind) => dispatch({ type: 'SCENE/UNLINK_CHARACTER', sceneId, characterId, kind }),
      adjustCharacterHpMp: (characterId, hpDelta, mpDelta) => dispatch({ type: 'CHARACTER/ADJUST_HP_MP', characterId, hpDelta, mpDelta }),
      startCombatFromScene: (sceneId) => {
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (!scene) return
        const characterById = new Map(state.characters.map((c) => [c.id, c]))
        const ids = [...scene.npcIds, ...scene.enemyIds]
        const participants: CombatParticipant[] = ids
          .map((id) => characterById.get(id))
          .filter(Boolean)
          .map((c) => {
            const maxHp = calcMaxHp(c!.resistance)
            const maxMp = calcMaxMp(c!.resistance)
            return {
              id: createId(),
              characterId: c!.id,
              name: c!.name,
              initiative: c!.skill,
              currentHp: clamp(c!.currentHp, 0, maxHp),
              maxHp,
              currentMp: clamp(c!.currentMp, 0, maxMp),
              maxMp,
              imageUri: c!.imageUri,
              isPlayer: c!.type === 'PLAYER',
              isDefeated: c!.currentHp <= 0,
              activeConditions: c!.activeConditions,
            }
          })

        dispatch({ type: 'COMBAT/START', sceneId, participants })
      },
      endCombat: (combatId) => dispatch({ type: 'COMBAT/END', combatId }),
      nextCombatTurn: (combatId) => dispatch({ type: 'COMBAT/NEXT_TURN', combatId }),
      adjustCombatParticipant: (combatId, participantId, hpDelta, mpDelta) =>
        dispatch({ type: 'COMBAT/ADJUST_PARTICIPANT', combatId, participantId, hpDelta, mpDelta }),
      toggleCombatDefeated: (combatId, participantId) => dispatch({ type: 'COMBAT/TOGGLE_DEFEATED', combatId, participantId }),
      setNextSessionAt: (nextSessionAt) => dispatch({ type: 'SETTINGS/SET_NEXT_SESSION_AT', nextSessionAt }),
      playTrack: (url) => dispatch({ type: 'AUDIO/PLAY_TRACK', url }),
      pauseTrack: () => dispatch({ type: 'AUDIO/PAUSE' }),
      resumeTrack: () => dispatch({ type: 'AUDIO/RESUME' }),
      stopTrack: () => dispatch({ type: 'AUDIO/STOP' }),
      setVolume: (volume) => dispatch({ type: 'AUDIO/SET_VOLUME', volume }),
      toggleMute: () => dispatch({ type: 'AUDIO/TOGGLE_MUTE' }),
      upsertRewardRule: (rule) => {
        const r: RewardRule = { ...rule, id: rule.id || createId() }
        dispatch({ type: 'REWARD_TABLE/UPSERT', rule: r })
      },
      deleteRewardRule: (ruleId) => dispatch({ type: 'REWARD_TABLE/DELETE', ruleId }),
      grantRewards: (sceneId, combatId, grants, notes) => {
        const event: RewardEvent = {
          id: createId(),
          sceneId,
          combatId,
          createdAt: Date.now(),
          grants,
          notes: notes?.trim() || '',
        }
        dispatch({ type: 'REWARDS/GRANT', event })
        return event
      },
    }
  }, [state])

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-neon-purple gap-4">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse">Carregando Grimório...</p>
      </div>
    )
  }

  return <AppStoreContext.Provider value={api}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('AppStoreProvider ausente')
  return ctx
}
