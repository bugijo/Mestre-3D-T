import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { AppSnapshot, Arc, Campaign, Character, Combat, CombatParticipant, Condition, EquipmentItem, Scene, SessionNote, SessionSummary } from '@/domain/models'
import type { RewardEvent, RewardGrant, RewardRule } from '@/domain/models'
import type { CriticalActionLog, DiceLogEntry, LibraryEntity, RecordingConsent, SessionFeedback } from '@/domain/v1'
import { getCharacterMaxHp, getCharacterMaxMp } from '@/domain/models'
import { loadSnapshot } from '@/lib/storage'
import { loadSnapshotFromDB, saveSnapshotToDB } from '@/lib/db'
import { createId } from '@/lib/id'
import { logError } from '@/lib/logger'
import {
  DEFAULT_CAMPAIGN_SYSTEM,
  getSupportedCharacterSystemForCampaign,
  getRulesetIdForCampaign,
  isSupportedCampaignSystem,
  normalizeCampaignSystem,
} from '@/lib/campaignSystems'
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
  | { type: 'SESSION/TOGGLE_NOTE_IMPORTANT'; noteId: string }
  | { type: 'SESSION/DELETE_NOTE'; noteId: string }
  | { type: 'CHARACTER/UPSERT'; character: Character }
  | { type: 'CHARACTER/DELETE'; characterId: string }
  | { type: 'SCENE/LINK_CHARACTER'; sceneId: string; characterId: string; kind: 'npc' | 'enemy' }
  | { type: 'SCENE/UNLINK_CHARACTER'; sceneId: string; characterId: string; kind: 'npc' | 'enemy' }
  | { type: 'CHARACTER/ADJUST_HP_MP'; characterId: string; hpDelta: number; mpDelta: number }
  | { type: 'CHARACTER/ADD_EQUIPMENT'; characterId: string; item: EquipmentItem }
  | { type: 'CHARACTER/REMOVE_EQUIPMENT'; characterId: string; itemId: string }
  | { type: 'CHARACTER/TOGGLE_EQUIPMENT'; characterId: string; itemId: string }
  | { type: 'CHARACTER/ADD_CONDITION'; characterId: string; condition: Condition }
  | { type: 'CHARACTER/REMOVE_CONDITION'; characterId: string; conditionId: string }
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
  | { type: 'AUDIO/TOGGLE_LOOP' }
  | { type: 'REWARD_TABLE/UPSERT'; rule: RewardRule }
  | { type: 'REWARD_TABLE/DELETE'; ruleId: string }
  | { type: 'REWARDS/GRANT'; event: RewardEvent }
  | { type: 'V1/LOG_DICE'; entry: DiceLogEntry }
  | { type: 'V1/ADD_FEEDBACK'; feedback: SessionFeedback }
  | { type: 'V1/SET_CONSENT'; consent: RecordingConsent }
  | { type: 'V1/LOG_CRITICAL'; entry: CriticalActionLog }
  | { type: 'V1/LIBRARY_UPSERT'; entity: LibraryEntity }
  | { type: 'V1/LIBRARY_DELETE'; entityId: string }

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

function ensureSupportedCampaignSystem(system: string) {
  const normalized = normalizeCampaignSystem(system)
  if (!isSupportedCampaignSystem(normalized)) {
    throw new Error(`Sistema de campanha nao suportado no motor atual: ${system}.`)
  }
  return normalized
}

function assertCharacterMatchesCampaign(campaigns: Campaign[], character: Pick<Character, 'campaignId'> & Partial<Pick<Character, 'dnd' | 'ordem'>>) {
  if (!character.campaignId) return

  const campaign = campaigns.find((entry) => entry.id === character.campaignId)
  if (!campaign) return

  const requiredSystem = getSupportedCharacterSystemForCampaign(campaign.system)
  if (!requiredSystem) {
    throw new Error(`A campanha "${campaign.title}" usa um sistema sem criacao guiada suportada.`)
  }

  const characterSystem = character.ordem ? 'ORDEM' : character.dnd ? 'DND5E' : '3DT'
  if (characterSystem !== requiredSystem) {
    throw new Error(`A ficha precisa usar o sistema ${campaign.system} da campanha vinculada.`)
  }
}

function buildSessionSummary(state: AppState, endedAt: number): SessionSummary {
  const campaign = state.campaigns.find((entry) => entry.id === state.session.activeCampaignId) ?? null
  const sceneById = new Map(state.scenes.map((scene) => [scene.id, scene]))
  const startedAt = state.session.startedAt
  const sceneNames = Array.from(
    new Set(
      state.session.notes
        .filter((note) => note.text.includes('Cena Iniciada:'))
        .map((note) => note.text.split('Cena Iniciada:')[1]?.trim())
        .filter(Boolean) as string[],
    ),
  )
  const fallbackScene = state.scenes.find((scene) => scene.id === state.session.activeSceneId)?.name
  if (sceneNames.length === 0 && fallbackScene) sceneNames.push(fallbackScene)

  const combatsInWindow = state.combats.filter((combat) => {
    if (!startedAt) return combat.sceneId === state.session.activeSceneId
    const started = combat.startedAt >= startedAt && combat.startedAt <= endedAt
    const ended = combat.endedAt != null && combat.endedAt >= startedAt && combat.endedAt <= endedAt
    const sameCampaign = sceneById.get(combat.sceneId)?.campaignId === state.session.activeCampaignId
    return sameCampaign && (started || ended || combat.isActive)
  })

  const npcNames = Array.from(
    new Set(
      combatsInWindow
        .flatMap((combat) => combat.participants)
        .filter((participant) => !participant.isPlayer)
        .map((participant) => participant.name),
    ),
  )

  const defeatedEnemyNames = Array.from(
    new Set(
      combatsInWindow
        .flatMap((combat) => combat.participants)
        .filter((participant) => !participant.isPlayer && participant.isDefeated)
        .map((participant) => participant.name),
    ),
  )

  return {
    id: createId(),
    campaignId: campaign?.id ?? null,
    campaignTitle: campaign?.title ?? 'Sem campanha',
    startedAt,
    endedAt,
    durationMs: startedAt ? Math.max(0, endedAt - startedAt) : 0,
    sceneNames,
    npcNames,
    defeatedEnemyNames,
    importantNotes: state.session.notes.filter((note) => note.important).map((note) => note.text),
  }
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
      const removedSceneIds = new Set(state.scenes.filter((scene) => scene.campaignId === action.campaignId).map((scene) => scene.id))
      const characters = state.characters.map((c) => (c.campaignId === action.campaignId ? { ...c, campaignId: null } : c))
      const combats = state.combats.filter((combat) => !removedSceneIds.has(combat.sceneId))
      const session =
        state.session.activeCampaignId === action.campaignId
          ? { ...state.session, activeCampaignId: campaigns[0]?.id ?? null, activeSceneId: null, activeCombatId: null }
          : state.session
      return { ...state, campaigns, arcs, scenes, characters, combats, session }
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

    case 'SESSION/END': {
      const endedAt = Date.now()
      const summary = buildSessionSummary(state, endedAt)
      const campaignId = state.session.activeCampaignId
      const campaign = state.campaigns.find((entry) => entry.id === campaignId)
      const campaignSceneIds = new Set(state.scenes.filter((scene) => scene.campaignId === campaignId).map((scene) => scene.id))
      const endingCombats = state.combats.filter((combat) => combat.isActive && campaignSceneIds.has(combat.sceneId))
      const characters = state.characters.map((character) => {
        const participant = endingCombats
          .flatMap((combat) => combat.participants)
          .find((entry) => entry.characterId === character.id)
        const belongsToCampaign = character.campaignId === campaignId
        const history = belongsToCampaign && character.type === 'PLAYER'
          ? [
              {
                id: createId(),
                type: 'session' as const,
                title: `Sessão concluída — ${summary.campaignTitle}`,
                detail: `${summary.sceneNames.length} cena(s), ${summary.defeatedEnemyNames.length} ameaça(s) derrotada(s).`,
                campaignId: campaignId ?? undefined,
                sessionId: summary.id,
                createdAt: endedAt,
              },
              ...(character.history ?? []),
            ]
          : character.history
        if (!participant) return { ...character, history }
        return {
          ...character,
          currentHp: participant.currentHp,
          currentMp: participant.currentMp ?? character.currentMp,
          history,
          ordem: character.ordem
            ? {
                ...character.ordem,
                resources: {
                  ...character.ordem.resources,
                  health: { ...character.ordem.resources.health, current: participant.currentHp },
                  effort: { ...character.ordem.resources.effort, current: participant.currentMp ?? character.ordem.resources.effort.current },
                },
              }
            : character.ordem,
          updatedAt: endedAt,
        }
      })
      const participatingOwnerIds = new Set(
        characters
          .filter((character) => character.campaignId === campaignId && character.type === 'PLAYER')
          .map((character) => character.ownerUserId)
          .filter((value): value is string => Boolean(value)),
      )
      const users = state.v1.users.map((user) => {
        const playerXp = participatingOwnerIds.has(user.id) ? 10 : 0
        const masterXp = campaign?.gameMasterUserId === user.id ? 25 : 0
        return playerXp || masterXp
          ? { ...user, platformXp: user.platformXp + playerXp, gameMasterXp: user.gameMasterXp + masterXp, updatedAt: endedAt }
          : user
      })
      const combats = state.combats.map((combat) =>
        endingCombats.some((entry) => entry.id === combat.id)
          ? { ...combat, isActive: false, endedAt }
          : combat,
      )
      return {
        ...state,
        characters,
        combats,
        session: {
          ...state.session,
          isActive: false,
          endedAt,
          activeCombatId: null,
        },
        sessionHistory: [summary, ...state.sessionHistory].slice(0, 20),
        v1: {
          ...state.v1,
          users,
          auditLog: [
            {
              id: createId(),
              actorId: campaign?.gameMasterUserId ?? 'local-master',
              action: 'session.end',
              targetType: 'session',
              targetId: summary.id,
              detail: `Sessão presencial encerrada em ${summary.campaignTitle}.`,
              createdAt: endedAt,
            },
            ...state.v1.auditLog,
          ].slice(0, 1000),
        },
      }
    }

    case 'SESSION/ADD_NOTE':
      return { ...state, session: { ...state.session, notes: [action.note, ...state.session.notes] } }

    case 'SESSION/TOGGLE_NOTE_IMPORTANT':
      return {
        ...state,
        session: {
          ...state.session,
          notes: state.session.notes.map((note) =>
            note.id === action.noteId ? { ...note, important: !note.important } : note,
          ),
        },
      }

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
        const maxHp = getCharacterMaxHp(c)
        const maxMp = getCharacterMaxMp(c)
        return {
          ...c,
          currentHp: clamp(c.currentHp + action.hpDelta, 0, maxHp),
          currentMp: clamp(c.currentMp + action.mpDelta, 0, maxMp),
          updatedAt: Date.now(),
        }
      })
      return { ...state, characters }
    }

    case 'CHARACTER/ADD_EQUIPMENT': {
      const characters = state.characters.map((c) =>
        c.id === action.characterId
          ? {
              ...c,
              equipment: [...c.equipment, action.item],
              updatedAt: Date.now(),
            }
          : c,
      )
      return { ...state, characters }
    }

    case 'CHARACTER/REMOVE_EQUIPMENT': {
      const characters = state.characters.map((c) =>
        c.id === action.characterId
          ? {
              ...c,
              equipment: c.equipment.filter((item) => item.id !== action.itemId),
              updatedAt: Date.now(),
            }
          : c,
      )
      return { ...state, characters }
    }

    case 'CHARACTER/TOGGLE_EQUIPMENT': {
      const characters = state.characters.map((c) =>
        c.id === action.characterId
          ? {
              ...c,
              equipment: c.equipment.map((item) =>
                item.id === action.itemId ? { ...item, isEquipped: !item.isEquipped } : item,
              ),
              updatedAt: Date.now(),
            }
          : c,
      )
      return { ...state, characters }
    }

    case 'CHARACTER/ADD_CONDITION': {
      const characters = state.characters.map((c) =>
        c.id === action.characterId
          ? {
              ...c,
              activeConditions: [action.condition, ...c.activeConditions],
              updatedAt: Date.now(),
            }
          : c,
      )
      return { ...state, characters }
    }

    case 'CHARACTER/REMOVE_CONDITION': {
      const characters = state.characters.map((c) =>
        c.id === action.characterId
          ? {
              ...c,
              activeConditions: c.activeConditions.filter((condition) => condition.id !== action.conditionId),
              updatedAt: Date.now(),
            }
          : c,
      )
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
      const endedCombat = state.combats.find((combat) => combat.id === action.combatId)
      const combats = state.combats.map((c) => (c.id === action.combatId ? { ...c, isActive: false, endedAt: Date.now() } : c))
      const session = state.session.activeCombatId === action.combatId ? { ...state.session, activeCombatId: null } : state.session
      
      const combat = endedCombat
      const characters = endedCombat
        ? state.characters.map((character) => {
            const participant = endedCombat.participants.find((entry) => entry.characterId === character.id)
            if (!participant) return character
            return {
              ...character,
              currentHp: participant.currentHp,
              currentMp: participant.currentMp ?? character.currentMp,
              ordem: character.ordem
                ? {
                    ...character.ordem,
                    resources: {
                      ...character.ordem.resources,
                      health: { ...character.ordem.resources.health, current: participant.currentHp },
                      effort: { ...character.ordem.resources.effort, current: participant.currentMp ?? character.ordem.resources.effort.current },
                    },
                  }
                : character.ordem,
              updatedAt: Date.now(),
            }
          })
        : state.characters
      const note: SessionNote = {
        id: createId(),
        createdAt: Date.now(),
        text: `🏁 Combate encerrado após ${combat?.round ?? 0} rodadas.`,
        important: false,
      }
      
      return { 
        ...state, 
        combats,
        characters,
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
      const adjustedCombat = combats.find((combat) => combat.id === action.combatId)
      const adjustedParticipant = adjustedCombat?.participants.find((participant) => participant.id === action.participantId)
      const characters = adjustedParticipant?.characterId
        ? state.characters.map((character) => {
            if (character.id !== adjustedParticipant.characterId) return character
            return {
              ...character,
              currentHp: adjustedParticipant.currentHp,
              currentMp: adjustedParticipant.currentMp ?? character.currentMp,
              ordem: character.ordem
                ? {
                    ...character.ordem,
                    resources: {
                      ...character.ordem.resources,
                      health: { ...character.ordem.resources.health, current: adjustedParticipant.currentHp },
                      effort: { ...character.ordem.resources.effort, current: adjustedParticipant.currentMp ?? character.ordem.resources.effort.current },
                    },
                  }
                : character.ordem,
              updatedAt: Date.now(),
            }
          })
        : state.characters
      return { ...state, combats, characters }
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

    case 'AUDIO/TOGGLE_LOOP':
      return { ...state, audio: { ...state.audio, loop: !(state.audio.loop ?? true) } }

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
        const historyEntries = [
          g.xp > 0 ? { id: createId(), type: 'xp' as const, title: 'XP recebido', detail: action.event.notes || 'Recompensa da sessão.', amount: g.xp, campaignId: c.campaignId ?? undefined, createdAt: action.event.createdAt } : null,
          g.items.length > 0 ? { id: createId(), type: 'item' as const, title: 'Item recebido', detail: g.items.map((item) => item.name).join(', '), campaignId: c.campaignId ?? undefined, createdAt: action.event.createdAt } : null,
          g.gold > 0 ? { id: createId(), type: 'event' as const, title: 'Recursos recebidos', detail: `${g.gold} em recursos da campanha.`, amount: g.gold, campaignId: c.campaignId ?? undefined, createdAt: action.event.createdAt } : null,
        ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        return {
          ...c,
          xp: (c.xp ?? 0) + (g.xp ?? 0),
          gold: (c.gold ?? 0) + (g.gold ?? 0),
          equipment: g.items && g.items.length > 0 ? [...c.equipment, ...g.items] : c.equipment,
          history: [...historyEntries, ...(c.history ?? [])],
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

    case 'V1/LOG_DICE':
      if (state.v1.diceLog.some((entry) => entry.id === action.entry.id)) return state
      return { ...state, v1: { ...state.v1, diceLog: [action.entry, ...state.v1.diceLog].slice(0, 500) } }

    case 'V1/ADD_FEEDBACK':
      return {
        ...state,
        v1: {
          ...state.v1,
          feedback: [action.feedback, ...state.v1.feedback.filter((entry) => !(entry.sessionId === action.feedback.sessionId && entry.userId === action.feedback.userId))],
        },
      }

    case 'V1/SET_CONSENT':
      return {
        ...state,
        v1: {
          ...state.v1,
          recordingConsents: [
            action.consent,
            ...state.v1.recordingConsents.filter((entry) => !(entry.sessionId === action.consent.sessionId && entry.participantId === action.consent.participantId)),
          ],
        },
      }

    case 'V1/LOG_CRITICAL':
      return { ...state, v1: { ...state.v1, auditLog: [action.entry, ...state.v1.auditLog].slice(0, 1000) } }

    case 'V1/LIBRARY_UPSERT':
      return { ...state, v1: { ...state.v1, library: upsertById(state.v1.library, action.entity) } }

    case 'V1/LIBRARY_DELETE':
      return { ...state, v1: { ...state.v1, library: removeById(state.v1.library, action.entityId) } }

    default:
      return state
  }
}

  type AppStoreApi = {
  state: AppState
  replaceSnapshot: (snapshot: AppSnapshot) => void
  createCampaign: (data: Pick<Campaign, 'title' | 'system' | 'description'> & Pick<Partial<Campaign>, 'entryPolicy' | 'defaultSessionMode'> & { coverDataUrl?: string | null }) => Campaign
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
  toggleNoteImportant: (noteId: string) => void
  deleteNote: (noteId: string) => void
  createCharacter: (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Character
  updateCharacter: (id: string, data: Partial<Character>) => void
  deleteCharacter: (characterId: string) => void
  linkCharacterToScene: (sceneId: string, characterId: string, kind: 'npc' | 'enemy') => void
  unlinkCharacterFromScene: (sceneId: string, characterId: string, kind: 'npc' | 'enemy') => void
  adjustCharacterHpMp: (characterId: string, hpDelta: number, mpDelta: number) => void
  addEquipmentToCharacter: (characterId: string, item: Omit<EquipmentItem, 'id'>) => EquipmentItem
  removeEquipmentFromCharacter: (characterId: string, itemId: string) => void
  toggleCharacterEquipment: (characterId: string, itemId: string) => void
  addConditionToCharacter: (characterId: string, condition: Omit<Condition, 'id' | 'appliedAt'>) => Condition
  removeConditionFromCharacter: (characterId: string, conditionId: string) => void
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
    toggleLoop: () => void
    upsertRewardRule: (rule: RewardRule) => void
    deleteRewardRule: (ruleId: string) => void
  grantRewards: (sceneId: string, combatId: string | null, grants: RewardGrant[], notes?: string) => RewardEvent
  addDiceLog: (entry: Omit<DiceLogEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => DiceLogEntry
  submitSessionFeedback: (feedback: Omit<SessionFeedback, 'id' | 'createdAt'>) => SessionFeedback
  setRecordingConsent: (consent: Omit<RecordingConsent, 'id'> & { id?: string }) => RecordingConsent
  logCriticalAction: (entry: Omit<CriticalActionLog, 'id' | 'createdAt'>) => CriticalActionLog
  createLibraryEntity: (entity: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt'>) => LibraryEntity
  updateLibraryEntity: (id: string, patch: Partial<LibraryEntity>) => void
  deleteLibraryEntity: (id: string) => void
  }

const AppStoreContext = createContext<AppStoreApi | null>(null)

  export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createDefaultSnapshot())
  const [isLoaded, setIsLoaded] = useState(false)
  const syncChannelRef = useRef<BroadcastChannel | null>(null)
  const suppressBroadcastRef = useRef(false)
  const lastSerializedRef = useRef<string>('')
  const clientIdRef = useRef(createId())

  // Initial Load (IndexedDB -> LocalStorage -> Default)
  useEffect(() => {
    async function init() {
      try {
        // 1. Try IndexedDB
        const dbSnapshot = await loadSnapshotFromDB()
        if (dbSnapshot) {
          if (!dbSnapshot.audio) {
            dbSnapshot.audio = { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false, loop: true }
          }
          if (!dbSnapshot.rewardTables) {
            dbSnapshot.rewardTables = []
          }
          if (!dbSnapshot.rewardEvents) {
            dbSnapshot.rewardEvents = []
          }
          if (!dbSnapshot.sessionHistory) {
            dbSnapshot.sessionHistory = []
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
            localSnapshot.audio = { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false, loop: true }
          }
          if (!localSnapshot.rewardTables) {
            localSnapshot.rewardTables = []
          }
          if (!localSnapshot.rewardEvents) {
            localSnapshot.rewardEvents = []
          }
          if (!localSnapshot.sessionHistory) {
            localSnapshot.sessionHistory = []
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
        logError('store:load-snapshot', error)
        setIsLoaded(true)
      }
    }
    init()
  }, [])

  // Auto-save to IndexedDB
  useEffect(() => {
    if (!isLoaded) return
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('mestre-3dt-app-sync')
    syncChannelRef.current = channel
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; clientId?: string; snapshot?: AppSnapshot } | null
      if (!payload || payload.type !== 'SNAPSHOT_SYNC' || !payload.snapshot) return
      if (payload.clientId === clientIdRef.current) return
      const incoming = JSON.stringify(payload.snapshot)
      if (incoming === lastSerializedRef.current) return
      suppressBroadcastRef.current = true
      lastSerializedRef.current = incoming
      dispatch({ type: 'SNAPSHOT/REPLACE', snapshot: payload.snapshot })
    }
    channel.addEventListener('message', onMessage)
    return () => {
      channel.removeEventListener('message', onMessage)
      channel.close()
      syncChannelRef.current = null
    }
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    const timeout = setTimeout(() => {
      const serialized = JSON.stringify(state)
      if (serialized === lastSerializedRef.current && !suppressBroadcastRef.current) return
      lastSerializedRef.current = serialized

      saveSnapshotToDB(state).catch((error) => {
        logError('store:save-snapshot', error)
      })

      if (syncChannelRef.current) {
        if (suppressBroadcastRef.current) {
          suppressBroadcastRef.current = false
          return
        }
        syncChannelRef.current.postMessage({
          type: 'SNAPSHOT_SYNC',
          clientId: clientIdRef.current,
          snapshot: state,
        })
      }
    }, 1000)
    return () => clearTimeout(timeout)
  }, [state, isLoaded])

  const api: AppStoreApi = useMemo(() => {
    return {
      state,
      replaceSnapshot: (snapshot) => dispatch({ type: 'SNAPSHOT/REPLACE', snapshot }),
      createCampaign: (data) => {
        const system = ensureSupportedCampaignSystem(data.system)
        const campaign: Campaign = {
          id: createId(),
          title: data.title.trim(),
          system: system || DEFAULT_CAMPAIGN_SYSTEM,
          description: data.description.trim(),
          coverDataUrl: data.coverDataUrl ?? null,
          rulesetId: getRulesetIdForCampaign(system),
          gameMasterUserId: 'demo-master',
          entryPolicy: data.entryPolicy ?? { mode: 'new_start', requiresMasterApproval: true },
          defaultSessionMode: data.defaultSessionMode ?? 'in_person',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        dispatch({ type: 'CAMPAIGN/UPSERT', campaign })
        return campaign
      },
      updateCampaign: (id, data) => {
        const existing = state.campaigns.find((c) => c.id === id)
        if (!existing) return
        const nextSystem = data.system === undefined ? existing.system : ensureSupportedCampaignSystem(data.system)
        const currentSystem = normalizeCampaignSystem(existing.system)
        const linkedCharacters = state.characters.filter((character) => character.campaignId === id)

        if (linkedCharacters.length > 0 && nextSystem !== currentSystem) {
          throw new Error('Nao e permitido trocar o sistema de uma campanha que ja possui personagens vinculados.')
        }

        const campaign: Campaign = { ...existing, ...data, system: nextSystem, updatedAt: Date.now() }
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
      toggleNoteImportant: (noteId) => dispatch({ type: 'SESSION/TOGGLE_NOTE_IMPORTANT', noteId }),
      deleteNote: (noteId) => dispatch({ type: 'SESSION/DELETE_NOTE', noteId }),
      createCharacter: (data) => {
        assertCharacterMatchesCampaign(state.campaigns, data)
        const base: Character = {
          ...data,
          id: createId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          xp: 0,
          gold: 0,
          rulesetId: data.rulesetId ?? (data.ordem ? 'ordem-compatible' : data.dnd ? 'dnd5e' : '3det-victory'),
          lifeStatus: data.lifeStatus ?? 'active',
          history: data.history ?? [],
        }
        const character: Character = {
          ...base,
          currentHp: clamp(base.currentHp ?? getCharacterMaxHp(base as Character), 0, getCharacterMaxHp(base as Character)),
          currentMp: clamp(base.currentMp ?? getCharacterMaxMp(base as Character), 0, getCharacterMaxMp(base as Character)),
        }
        dispatch({ type: 'CHARACTER/UPSERT', character })
        return character
      },
      updateCharacter: (id, data) => {
        const existing = state.characters.find((c) => c.id === id)
        if (!existing) return
        const character: Character = { ...existing, ...data, updatedAt: Date.now() }
        assertCharacterMatchesCampaign(state.campaigns, character)
        const maxHp = getCharacterMaxHp(character)
        const maxMp = getCharacterMaxMp(character)
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
      addEquipmentToCharacter: (characterId, item) => {
        const nextItem: EquipmentItem = { ...item, id: createId() }
        dispatch({ type: 'CHARACTER/ADD_EQUIPMENT', characterId, item: nextItem })
        return nextItem
      },
      removeEquipmentFromCharacter: (characterId, itemId) => dispatch({ type: 'CHARACTER/REMOVE_EQUIPMENT', characterId, itemId }),
      toggleCharacterEquipment: (characterId, itemId) => dispatch({ type: 'CHARACTER/TOGGLE_EQUIPMENT', characterId, itemId }),
      addConditionToCharacter: (characterId, condition) => {
        const nextCondition: Condition = {
          ...condition,
          id: createId(),
          appliedAt: Date.now(),
        }
        dispatch({ type: 'CHARACTER/ADD_CONDITION', characterId, condition: nextCondition })
        return nextCondition
      },
      removeConditionFromCharacter: (characterId, conditionId) =>
        dispatch({ type: 'CHARACTER/REMOVE_CONDITION', characterId, conditionId }),
      startCombatFromScene: (sceneId) => {
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (!scene) return
        const characterById = new Map(state.characters.map((c) => [c.id, c]))
        const playerIds = state.characters
          .filter(
            (character) =>
              character.campaignId === scene.campaignId &&
              (character.type === 'PLAYER' || character.type === 'COMPANION'),
          )
          .map((character) => character.id)
        const ids = Array.from(new Set([...playerIds, ...scene.npcIds, ...scene.enemyIds]))
        const participants: CombatParticipant[] = ids
          .map((id) => characterById.get(id))
          .filter(Boolean)
          .map((c) => {
            const maxHp = getCharacterMaxHp(c!)
            const maxMp = getCharacterMaxMp(c!)
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
      endCombat: (combatId) => {
        const combat = state.combats.find((c) => c.id === combatId)
        dispatch({ type: 'COMBAT/END', combatId })
        if (combat) {
          const rule = state.rewardTables[0] || { id: createId(), name: 'Padrão', criteria: '', xp: 50, gold: 20 }
          const participants = combat.participants.filter((participant) => participant.isPlayer && participant.characterId)
          if (participants.length > 0) {
            const grants: RewardGrant[] = participants.map((p) => ({ characterId: p.characterId!, xp: rule.xp, gold: rule.gold, items: [] }))
            const event: RewardEvent = {
              id: createId(),
              sceneId: combat.sceneId,
              combatId: combat.id,
              createdAt: Date.now(),
              grants,
              notes: 'XP automático ao encerrar combate',
            }
            dispatch({ type: 'REWARDS/GRANT', event })
          }
        }
      },
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
      toggleLoop: () => dispatch({ type: 'AUDIO/TOGGLE_LOOP' }),
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
      addDiceLog: (entry) => {
        const next: DiceLogEntry = { ...entry, id: entry.id ?? createId(), createdAt: entry.createdAt ?? Date.now() }
        dispatch({ type: 'V1/LOG_DICE', entry: next })
        return next
      },
      submitSessionFeedback: (feedback) => {
        const next: SessionFeedback = { ...feedback, id: createId(), createdAt: Date.now() }
        dispatch({ type: 'V1/ADD_FEEDBACK', feedback: next })
        return next
      },
      setRecordingConsent: (consent) => {
        const next: RecordingConsent = { ...consent, id: consent.id ?? createId() }
        dispatch({ type: 'V1/SET_CONSENT', consent: next })
        return next
      },
      logCriticalAction: (entry) => {
        const next: CriticalActionLog = { ...entry, id: createId(), createdAt: Date.now() }
        dispatch({ type: 'V1/LOG_CRITICAL', entry: next })
        return next
      },
      createLibraryEntity: (entity) => {
        const next: LibraryEntity = { ...entity, id: createId(), createdAt: Date.now(), updatedAt: Date.now() }
        dispatch({ type: 'V1/LIBRARY_UPSERT', entity: next })
        return next
      },
      updateLibraryEntity: (id, patch) => {
        const existing = state.v1.library.find((entity) => entity.id === id)
        if (!existing) return
        dispatch({ type: 'V1/LIBRARY_UPSERT', entity: { ...existing, ...patch, id, updatedAt: Date.now() } })
      },
      deleteLibraryEntity: (id) => dispatch({ type: 'V1/LIBRARY_DELETE', entityId: id }),
    }
  }, [state])

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-secondary gap-4">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
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
