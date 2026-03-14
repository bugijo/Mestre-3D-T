import { describe, expect, it } from 'vitest'
import { buildAdminMetrics } from '@/admin/adminMetrics'
import { createEmptyAdminVault } from '@/lib/adminSecurity'
import { buildSessionInsights } from '@/lib/sessionReports'
import { normalizeSnapshot } from '@/lib/snapshot'
import { createDefaultSnapshot } from '@/store/defaultData'

function measureMs(label: string, runner: () => void) {
  const start = performance.now()
  runner()
  const elapsed = performance.now() - start
  console.info(`[QA-PERF] ${label}: ${elapsed.toFixed(2)}ms`)
  return elapsed
}

function buildLargeSnapshot() {
  const snapshot = createDefaultSnapshot()
  snapshot.sessionHistory = Array.from({ length: 2500 }, (_, index) => ({
    id: `session-${index}`,
    campaignId: snapshot.campaigns[0]?.id ?? 'camp',
    campaignTitle: `Campanha ${index % 12}`,
    startedAt: Date.now() - 90 * 60 * 1000,
    endedAt: Date.now(),
    durationMs: 90 * 60 * 1000,
    sceneNames: [`Cena ${index % 20}`],
    npcNames: [`NPC ${index % 50}`],
    defeatedEnemyNames: [`Enemy ${index % 30}`],
    importantNotes: [`Nota ${index}`],
  }))
  snapshot.characters = Array.from({ length: 1200 }, (_, index) => ({
    ...snapshot.characters[0],
    id: `char-${index}`,
    name: `Char ${index}`,
    type: index % 5 === 0 ? 'PLAYER' : 'NPC',
    gold: index,
  }))
  return snapshot
}

describe('QA Performance (SLA < 2s)', () => {
  it('normaliza snapshot grande em menos de 2 segundos', () => {
    const snapshot = buildLargeSnapshot()
    const elapsed = measureMs('normalizeSnapshot', () => {
      normalizeSnapshot(snapshot)
    })
    expect(elapsed).toBeLessThan(2000)
  })

  it('calcula insights de sessao em menos de 2 segundos', () => {
    const snapshot = buildLargeSnapshot()
    const elapsed = measureMs('buildSessionInsights', () => {
      buildSessionInsights(snapshot.sessionHistory)
    })
    expect(elapsed).toBeLessThan(2000)
  })

  it('calcula metricas administrativas em menos de 2 segundos', () => {
    const snapshot = buildLargeSnapshot()
    const vault = createEmptyAdminVault()
    vault.users = Array.from({ length: 100 }, (_, index) => ({
      id: `admin-${index}`,
      email: `admin${index}@qa.local`,
      name: `Admin ${index}`,
      role: index % 10 === 0 ? 'CEO' : 'ADMIN',
      isActive: index % 3 !== 0,
      passwordHash: `hash-${index}`,
      passwordSalt: `salt-${index}`,
      encryptionSalt: `enc-${index}`,
      totpSecretCiphertext: `cipher-${index}`,
      totpSecretIv: `iv-${index}`,
      twoFactorEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: null,
    }))
    const logs = Array.from({ length: 2500 }, (_, index) => ({
      id: `log-${index}`,
      timestamp: Date.now(),
      level: index % 5 === 0 ? 'error' as const : 'info' as const,
      source: 'qa-performance',
      message: 'load',
      context: null,
    }))

    const elapsed = measureMs('buildAdminMetrics', () => {
      buildAdminMetrics(snapshot, vault, logs)
    })
    expect(elapsed).toBeLessThan(2000)
  })
})
