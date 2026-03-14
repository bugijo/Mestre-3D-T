import type { AppSnapshot } from '@/domain/models'
import { sanitizePersistedMediaUrl } from '@/lib/assets'
import { normalizeCampaignSystem } from '@/lib/campaignSystems'

export const SNAPSHOT_VERSION = 1
const SLOT_PATTERN = /[^a-z0-9:_-]/gi

export function isAppSnapshot(value: unknown): value is AppSnapshot {
  return typeof value === 'object' && value !== null && (value as AppSnapshot).version === SNAPSHOT_VERSION
}

export function normalizeSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return {
    ...snapshot,
    campaigns: Array.isArray(snapshot.campaigns)
      ? snapshot.campaigns.map((campaign) => ({
          ...campaign,
          system: normalizeCampaignSystem(campaign.system),
          coverDataUrl: sanitizePersistedMediaUrl(campaign.coverDataUrl),
        }))
      : [],
    arcs: Array.isArray(snapshot.arcs) ? snapshot.arcs : [],
    scenes: Array.isArray(snapshot.scenes)
      ? snapshot.scenes.map((scene) => ({
          ...scene,
          mapImageDataUrl: sanitizePersistedMediaUrl(scene.mapImageDataUrl),
          backgroundImageDataUrl: sanitizePersistedMediaUrl(scene.backgroundImageDataUrl),
        }))
      : [],
    characters: Array.isArray(snapshot.characters)
      ? snapshot.characters.map((character) => ({
          ...character,
          imageUri: sanitizePersistedMediaUrl(character.imageUri),
          portraitUri: sanitizePersistedMediaUrl(character.portraitUri),
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
