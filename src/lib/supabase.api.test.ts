import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSnapshot } from '@/store/defaultData'
import {
  createCampaign,
  createNpc,
  downloadAdminVault,
  deleteCampaign,
  deleteNpc,
  downloadSnapshot,
  healthCheck,
  listCampaigns,
  listNpcs,
  uploadAdminVault,
  updateCampaign,
  updateNpc,
  uploadSnapshot,
} from './supabase'
import { createEmptyAdminVault } from '@/lib/adminSecurity'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    throw new Error('mocked-no-network')
  }),
}))

describe('Supabase API wrappers (degrade graciosamente sem backend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna erro controlado no health check quando nao ha conectividade', async () => {
    const result = await healthCheck(true)
    expect(result.ok).toBe(false)
  })

  it('retorna erro controlado para operacoes de campanhas e npcs sem backend', async () => {
    const [campaigns, createdCampaign, updatedCampaign, removedCampaign] = await Promise.all([
      listCampaigns('user-1'),
      createCampaign({
        user_id: 'user-1',
        title: 'Campanha QA',
        description: null,
        cover_url: null,
        players: 0,
        progress: 0,
        next_session: null,
      }),
      updateCampaign(1, { title: 'Atualizada' }),
      deleteCampaign(1),
    ])

    const [npcs, createdNpc, updatedNpc, removedNpc] = await Promise.all([
      listNpcs('user-1'),
      createNpc({
        user_id: 'user-1',
        campaign_id: null,
        name: 'NPC QA',
        avatar: null,
        type: 'Aliado',
        level: 1,
        description: null,
        strength: 0,
        skill: 0,
        resistance: 0,
        armor: 0,
        firepower: 0,
      }),
      updateNpc(1, { name: 'NPC QA 2' }),
      deleteNpc(1),
    ])

    expect(campaigns.ok).toBe(false)
    expect(createdCampaign.ok).toBe(false)
    expect(updatedCampaign.ok).toBe(false)
    expect(removedCampaign.ok).toBe(false)

    expect(npcs.ok).toBe(false)
    expect(createdNpc.ok).toBe(false)
    expect(updatedNpc.ok).toBe(false)
    expect(removedNpc.ok).toBe(false)
  })

  it('retorna erro controlado para upload/download de snapshot e cofre admin sem backend', async () => {
    const snapshot = createDefaultSnapshot()
    const adminVault = createEmptyAdminVault()
    const uploadResult = await uploadSnapshot('mesa-qa', snapshot)
    const downloadResult = await downloadSnapshot('mesa-qa')
    const uploadAdminResult = await uploadAdminVault('admin-qa', adminVault)
    const downloadAdminResult = await downloadAdminVault('admin-qa')

    expect(uploadResult.ok).toBe(false)
    expect(downloadResult.ok).toBe(false)
    expect(uploadAdminResult.ok).toBe(false)
    expect(downloadAdminResult.ok).toBe(false)
  })
})
