import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AppStoreProvider, useAppStore } from './AppStore'

vi.mock('@/lib/db', () => ({
  loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/storage', () => ({
  loadSnapshot: vi.fn().mockReturnValue(null),
}))

function Probe({ onChange }: { onChange: (api: ReturnType<typeof useAppStore>) => void }) {
  const api = useAppStore()
  onChange(api)
  return null
}

describe('Rewards', () => {
  it('concede XP, ouro e itens e registra evento/nota', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>
    )
    await waitFor(() => expect(!!current).toBe(true))

    const cid = current.state.session.activeCampaignId
    const player1 = current.createCharacter({
      name: 'Herói',
      type: 'PLAYER',
      role: 'Aventureiro',
      imageUri: null,
      portraitUri: null,
      tags: [],
      strength: 2,
      skill: 2,
      resistance: 2,
      armor: 0,
      firepower: 0,
      activeConditions: [],
      personality: '',
      speechStyle: '',
      mannerisms: [],
      goal: '',
      secrets: {},
      quickPhrases: [],
      advantages: [],
      disadvantages: [],
      equipment: [],
      powers: [],
      campaignId: cid,
      isTemplate: false,
    })

    const item = {
      id: 'it1',
      name: 'Espada Curta',
      type: 'WEAPON' as const,
      description: '',
      bonusF: 1,
      bonusH: 0,
      bonusR: 0,
      bonusA: 0,
      bonusPdF: 0,
      special: '',
      imageUri: null,
      isEquipped: false,
    }

    const grants = [{ characterId: player1.id, xp: 100, gold: 25, items: [item] }]
    const evt = current.grantRewards(current.state.session.activeSceneId, null, grants, 'Vitória limpa')

    await waitFor(() => {
      const ch = current.state.characters.find((c: any) => c.id === player1.id)
      expect(ch.xp).toBeGreaterThanOrEqual(100)
      expect(ch.gold).toBeGreaterThanOrEqual(25)
      expect(ch.equipment.some((e: any) => e.name === 'Espada Curta')).toBe(true)
    })

    expect(current.state.rewardEvents[0].id).toBe(evt.id)
    expect(current.state.session.notes[0].text).toMatch(/Recompensas distribuídas/)
  })
})

