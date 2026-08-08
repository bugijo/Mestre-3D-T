import type { AppSnapshot } from '@/domain/models'
import { sanitizePersistedMediaUrl } from '@/lib/assets'
import { normalizeCampaignSystem } from '@/lib/campaignSystems'
import { createEmptyV1DomainState } from '@/domain/v1'

export const SNAPSHOT_VERSION = 1
const SLOT_PATTERN = /[^a-z0-9:_-]/gi

export function isAppSnapshot(value: unknown): value is AppSnapshot {
  return typeof value === 'object' && value !== null && (value as AppSnapshot).version === SNAPSHOT_VERSION
}

export function normalizeSnapshot(snapshot: AppSnapshot): AppSnapshot {
  const emptyV1 = createEmptyV1DomainState()
  return {
    ...snapshot,
    campaigns: Array.isArray(snapshot.campaigns)
      ? snapshot.campaigns.map((campaign) => ({
          ...campaign,
          system: normalizeCampaignSystem(campaign.system),
          rulesetId: campaign.rulesetId ?? (normalizeCampaignSystem(campaign.system) === 'Protocolo Paranormal' ? 'ordem-compatible' : undefined),
          coverDataUrl: sanitizePersistedMediaUrl(campaign.coverDataUrl),
        }))
      : [],
    arcs: Array.isArray(snapshot.arcs) ? snapshot.arcs : [],
    scenes: Array.isArray(snapshot.scenes)
      ? snapshot.scenes.map((scene) => ({
          ...scene,
          connections: Array.isArray(scene.connections) ? scene.connections : [],
          mapImageDataUrl: sanitizePersistedMediaUrl(scene.mapImageDataUrl),
          backgroundImageDataUrl: sanitizePersistedMediaUrl(scene.backgroundImageDataUrl),
        }))
      : [],
    characters: Array.isArray(snapshot.characters)
      ? snapshot.characters.map((character) => ({
          ...character,
          imageUri: sanitizePersistedMediaUrl(character.imageUri),
          portraitUri: sanitizePersistedMediaUrl(character.portraitUri),
          rulesetId: character.rulesetId ?? (character.ordem ? 'ordem-compatible' : character.dnd ? 'dnd5e' : '3det-victory'),
          lifeStatus: character.lifeStatus ?? 'active',
          history: Array.isArray(character.history) ? character.history : [],
        }))
      : [],
    combats: Array.isArray(snapshot.combats) ? snapshot.combats : [],
    sessionHistory: Array.isArray(snapshot.sessionHistory) ? snapshot.sessionHistory : [],
    rewardTables: Array.isArray(snapshot.rewardTables) ? snapshot.rewardTables : [],
    rewardEvents: Array.isArray(snapshot.rewardEvents) ? snapshot.rewardEvents : [],
    session: {
      isActive: Boolean(snapshot.session?.isActive),
      activeCampaignId: snapshot.session?.activeCampaignId ?? null,
      activeSceneId: snapshot.session?.activeSceneId ?? null,
      activeCombatId: snapshot.session?.activeCombatId ?? null,
      startedAt: snapshot.session?.startedAt ?? null,
      endedAt: snapshot.session?.endedAt ?? null,
      notes: Array.isArray(snapshot.session?.notes) ? snapshot.session.notes : [],
    },
    settings: {
      nextSessionAt: snapshot.settings?.nextSessionAt ?? Date.now(),
    },
    audio: {
      currentTrackUrl: snapshot.audio?.currentTrackUrl ?? null,
      volume: snapshot.audio?.volume ?? 0.5,
      isPlaying: Boolean(snapshot.audio?.isPlaying),
      isMuted: Boolean(snapshot.audio?.isMuted),
      loop: snapshot.audio?.loop ?? true,
    },
    v1: {
      ...emptyV1,
      ...(snapshot.v1 ?? {}),
      users: Array.isArray(snapshot.v1?.users) ? snapshot.v1.users : [],
      participations: Array.isArray(snapshot.v1?.participations) ? snapshot.v1.participations : [],
      library: Array.isArray(snapshot.v1?.library) ? snapshot.v1.library : [],
      diceLog: Array.isArray(snapshot.v1?.diceLog) ? snapshot.v1.diceLog : [],
      feedback: Array.isArray(snapshot.v1?.feedback) ? snapshot.v1.feedback : [],
      recordingConsents: Array.isArray(snapshot.v1?.recordingConsents) ? snapshot.v1.recordingConsents : [],
      auditLog: Array.isArray(snapshot.v1?.auditLog) ? snapshot.v1.auditLog : [],
      entitlements: Array.isArray(snapshot.v1?.entitlements) ? snapshot.v1.entitlements : [],
      wallets: Array.isArray(snapshot.v1?.wallets) ? snapshot.v1.wallets : [],
      walletTransactions: Array.isArray(snapshot.v1?.walletTransactions) ? snapshot.v1.walletTransactions : [],
      social: snapshot.v1?.social ?? emptyV1.social,
    },
  }
}

export function sanitizeSyncSlot(input: string) {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(SLOT_PATTERN, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return cleaned || 'default'
}
