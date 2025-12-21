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
  // Notificar a cada mudança de estado
  onChange(api)
  return null
}

describe('AppStoreProvider', () => {
  it('inicia e encerra sessão atualizando flags', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>
    )
    await waitFor(() => expect(!!current).toBe(true))
    current.startSession()
    await waitFor(() => expect(current.state.session.isActive).toBe(true))

    current.endSession()
    await waitFor(() => expect(current.state.session.isActive).toBe(false))
    expect(current.state.session.endedAt).not.toBeNull()
  })

  it('define cena ativa e registra nota automática', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>
    )
    await waitFor(() => expect(!!current).toBe(true))

    const campId = current.state.session.activeCampaignId!
    const arcId = current.state.arcs[0].id
    const scene = current.createScene(campId, arcId, {
      name: 'Nova Cena',
      description: 'Desc',
      objective: 'Obj',
      mood: 'neutral',
      opening: '',
    })
    current.setActiveScene(campId, scene.id)
    await waitFor(() => expect(current.state.session.activeSceneId).toBe(scene.id))
    expect(current.state.session.notes[0].text).toMatch(/Cena Iniciada/)
  })

  it('addNote ignora texto vazio e adiciona texto válido', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>
    )
    await waitFor(() => expect(!!current).toBe(true))

    const prevLen = current.state.session.notes.length
    current.addNote('   ', false)
    await waitFor(() => expect(current.state.session.notes.length).toBe(prevLen))

    current.addNote('Nota importante', true)
    await waitFor(() => expect(current.state.session.notes.length).toBeGreaterThan(prevLen))
    expect(current.state.session.notes[0].important).toBe(true)
  })

  it('inicia combate a partir da cena e manipula participantes', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>
    )
    await waitFor(() => expect(!!current).toBe(true))

    const activeSceneId = current.state.session.activeSceneId!
    // Garantir que há ao menos um personagem vinculado
    const scene = current.state.scenes.find((s: any) => s.id === activeSceneId)!
    if (scene.npcIds.length === 0 && current.state.characters.length > 0) {
      current.linkCharacterToScene(scene.id, current.state.characters[0].id, 'npc')
    }
    const campId2 = current.state.session.activeCampaignId!
    const player = current.createCharacter({
      name: 'Jogador',
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
      campaignId: campId2,
      isTemplate: false,
    })
    current.linkCharacterToScene(scene.id, player.id, 'npc')

    current.startCombatFromScene(activeSceneId)
    await waitFor(() => expect(current.state.session.activeCombatId).not.toBeNull())
    const combatId = current.state.session.activeCombatId!
    const combat = current.state.combats.find((c: any) => c.id === combatId)!
    expect(combat.participants.length).toBeGreaterThan(0)

    const first = combat.participants[0]
    current.adjustCombatParticipant(combatId, first.id, -1, -1)
    await waitFor(() => {
      const c = current.state.combats.find((c: any) => c.id === combatId)!
      const p = c.participants.find((p: any) => p.id === first.id)!
      expect(p.currentHp).toBeLessThanOrEqual(first.currentHp)
    })

    current.toggleCombatDefeated(combatId, first.id)
    await waitFor(() => {
      const c = current.state.combats.find((c: any) => c.id === combatId)!
      const p = c.participants.find((p: any) => p.id === first.id)!
      expect(p.isDefeated).toBe(true)
    })

    current.nextCombatTurn(combatId)
    await waitFor(() => {
      const c = current.state.combats.find((c: any) => c.id === combatId)!
      expect(c.currentTurnIndex).toBe(1 % c.participants.length)
    })

    current.endCombat(combatId)
    await waitFor(() => expect(current.state.session.activeCombatId).toBeNull())
    expect(current.state.session.notes.some((n: any) => /Combate encerrado/.test(n.text))).toBe(true)
    await waitFor(() => expect(current.state.rewardEvents.length).toBeGreaterThan(0))
  })
})
