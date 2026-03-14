import type { AppSnapshot } from '@/domain/models'
import type { AdminVaultState } from '@/lib/adminSecurity'
import type { LogEntry } from '@/lib/logger'

export type AdminMetrics = {
  totalCampaigns: number
  totalScenes: number
  totalCharacters: number
  totalPlayers: number
  totalSessions: number
  totalCombatEncounters: number
  activeSession: boolean
  activePrivilegedUsers: number
  totalAuditEvents: number
  totalAppErrors: number
  totalRewardsDistributed: number
  totalGoldInCirculation: number
  averageSessionDurationMs: number
}

export function buildAdminMetrics(snapshot: AppSnapshot, vault: AdminVaultState, logs: LogEntry[]): AdminMetrics {
  const totalRewardsDistributed = snapshot.rewardEvents.reduce(
    (total, event) => total + event.grants.reduce((subtotal, grant) => subtotal + grant.gold, 0),
    0,
  )
  const totalGoldInCirculation = snapshot.characters.reduce((total, character) => total + (character.gold ?? 0), 0)
  const totalDuration = snapshot.sessionHistory.reduce((total, entry) => total + entry.durationMs, 0)

  return {
    totalCampaigns: snapshot.campaigns.length,
    totalScenes: snapshot.scenes.length,
    totalCharacters: snapshot.characters.length,
    totalPlayers: snapshot.characters.filter((character) => character.type === 'PLAYER').length,
    totalSessions: snapshot.sessionHistory.length,
    totalCombatEncounters: snapshot.combats.length,
    activeSession: snapshot.session.isActive,
    activePrivilegedUsers: vault.users.filter((user) => user.isActive).length,
    totalAuditEvents: vault.auditEntries.length,
    totalAppErrors: logs.filter((entry) => entry.level === 'error').length,
    totalRewardsDistributed,
    totalGoldInCirculation,
    averageSessionDurationMs: snapshot.sessionHistory.length > 0 ? Math.round(totalDuration / snapshot.sessionHistory.length) : 0,
  }
}
