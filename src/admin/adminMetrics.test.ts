import { describe, expect, it } from 'vitest'
import { buildAdminMetrics } from './adminMetrics'
import { createDefaultSnapshot } from '@/store/defaultData'
import { createEmptyAdminVault } from '@/lib/adminSecurity'

describe('buildAdminMetrics', () => {
  it('agrega metricas do snapshot, vault e logs', () => {
    const snapshot = createDefaultSnapshot()
    snapshot.sessionHistory = [
      {
        id: 's1',
        campaignId: snapshot.campaigns[0].id,
        campaignTitle: snapshot.campaigns[0].title,
        startedAt: 1,
        endedAt: 2,
        durationMs: 60_000,
        sceneNames: [],
        npcNames: [],
        defeatedEnemyNames: [],
        importantNotes: [],
      },
    ]
    snapshot.rewardEvents = [
      {
        id: 'r1',
        sceneId: snapshot.scenes[0].id,
        combatId: null,
        createdAt: 1,
        notes: '',
        grants: [{ characterId: 'c1', xp: 10, gold: 50, items: [] }],
      },
    ]
    const vault = createEmptyAdminVault()
    vault.users = [
      {
        id: 'admin-1',
        name: 'CEO',
        email: 'ceo@empresa.com',
        role: 'CEO',
        passwordHash: '',
        passwordSalt: '',
        encryptionSalt: '',
        totpSecretCiphertext: '',
        totpSecretIv: '',
        twoFactorEnabled: true,
        isActive: true,
        createdAt: 1,
        updatedAt: 1,
        lastLoginAt: null,
      },
    ]
    vault.auditEntries = [
      {
        id: 'a1',
        actorUserId: 'admin-1',
        actorEmail: 'ceo@empresa.com',
        action: 'admin.portal.view',
        targetType: 'admin-portal',
        targetId: 'admin-1',
        status: 'success',
        severity: 'info',
        createdAt: 1,
        details: '',
      },
    ]
    const metrics = buildAdminMetrics(snapshot, vault, [
      { id: 'l1', timestamp: 1, level: 'error', message: 'falha', source: 'app' },
    ])

    expect(metrics.totalCampaigns).toBeGreaterThan(0)
    expect(metrics.activePrivilegedUsers).toBe(1)
    expect(metrics.totalRewardsDistributed).toBe(50)
    expect(metrics.totalAppErrors).toBe(1)
  })
})
