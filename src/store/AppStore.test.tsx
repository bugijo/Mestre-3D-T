import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
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

describe('AppStoreProvider', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('inicia e encerra sessao atualizando flags', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))
    current.startSession()
    await waitFor(() => expect(current.state.session.isActive).toBe(true))

    current.endSession()
    await waitFor(() => expect(current.state.session.isActive).toBe(false))
    expect(current.state.session.endedAt).not.toBeNull()
    expect(current.state.sessionHistory.length).toBeGreaterThan(0)
  })

  it('encerra combate, registra histórico e separa XP da plataforma e do Mestre', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )
    await waitFor(() => expect(!!current).toBe(true))
    const campaign = current.state.campaigns[0]
    const player = current.state.characters.find((character: any) => character.type === 'PLAYER')
    const playerBefore = current.state.v1.users.find((user: any) => user.id === player.ownerUserId)
    const masterBefore = current.state.v1.users.find((user: any) => user.id === campaign.gameMasterUserId)

    current.startSession()
    await waitFor(() => expect(current.state.session.isActive).toBe(true))
    current.startCombatFromScene(current.state.session.activeSceneId)
    await waitFor(() => expect(current.state.session.activeCombatId).not.toBeNull())
    current.endSession()

    await waitFor(() => expect(current.state.session.isActive).toBe(false))
    expect(current.state.combats.every((combat: any) => !combat.isActive)).toBe(true)
    expect(current.state.characters.find((character: any) => character.id === player.id).history[0].type).toBe('session')
    expect(current.state.v1.users.find((user: any) => user.id === player.ownerUserId).platformXp).toBe(playerBefore.platformXp + 10)
    expect(current.state.v1.users.find((user: any) => user.id === campaign.gameMasterUserId).gameMasterXp).toBe(masterBefore.gameMasterXp + 25)
    expect(current.state.v1.auditLog[0].action).toBe('session.end')
  })

  it('define cena ativa e registra nota automatica', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))

    const campId = current.state.session.activeCampaignId
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

  it('addNote ignora texto vazio e adiciona texto valido', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))
    const previousLength = current.state.session.notes.length

    current.addNote('   ', false)
    await waitFor(() => expect(current.state.session.notes.length).toBe(previousLength))

    current.addNote('Nota importante', true)
    await waitFor(() => expect(current.state.session.notes.length).toBeGreaterThan(previousLength))
    expect(current.state.session.notes[0].important).toBe(true)
  })

  it('permite alternar importancia e excluir notas da sessao', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))
    current.addNote('Nota de teste', false)
    await waitFor(() => expect(current.state.session.notes.length).toBeGreaterThan(0))

    const noteId = current.state.session.notes[0].id
    current.toggleNoteImportant(noteId)
    await waitFor(() => expect(current.state.session.notes[0].important).toBe(true))

    current.deleteNote(noteId)
    await waitFor(() => expect(current.state.session.notes.some((note: any) => note.id === noteId)).toBe(false))
  })

  it('inicia combate a partir da cena e manipula participantes', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))

    const activeSceneId = current.state.session.activeSceneId
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
      campaignId: current.state.session.activeCampaignId,
      isTemplate: false,
      ordem: {
        origin: '',
        path: '',
        progression: 5,
        attributes: { agility: 1, intellect: 1, presence: 1, strength: 1, vigor: 1 },
        skills: {},
        resources: { health: { current: 15, max: 15 }, effort: { current: 10, max: 10 }, sanity: { current: 10, max: 10 } },
        abilities: [],
        biography: '',
        appearance: '',
      },
    })

    await waitFor(() => expect(current.state.characters.some((character: any) => character.id === player.id)).toBe(true))

    current.startCombatFromScene(activeSceneId)
    await waitFor(() => expect(current.state.session.activeCombatId).not.toBeNull())
    await waitFor(() => expect(current.state.combats.length).toBeGreaterThan(0))

    const combatId = current.state.session.activeCombatId
    const combat = current.state.combats.find((entry: any) => entry.id === combatId)
    expect(combat).toBeDefined()
    if (!combat) throw new Error('Combate nao encontrado')
    expect(combat.participants.length).toBeGreaterThan(0)

    const first = combat.participants[0]
    current.adjustCombatParticipant(combatId, first.id, -1, -1)
    await waitFor(() => {
      const updatedCombat = current.state.combats.find((entry: any) => entry.id === combatId)
      const participant = updatedCombat.participants.find((entry: any) => entry.id === first.id)
      expect(participant.currentHp).toBeLessThanOrEqual(first.currentHp)
    })

    current.toggleCombatDefeated(combatId, first.id)
    await waitFor(() => {
      const updatedCombat = current.state.combats.find((entry: any) => entry.id === combatId)
      const participant = updatedCombat.participants.find((entry: any) => entry.id === first.id)
      expect(participant.isDefeated).toBe(true)
    })

    current.nextCombatTurn(combatId)
    await waitFor(() => {
      const updatedCombat = current.state.combats.find((entry: any) => entry.id === combatId)
      expect(updatedCombat.currentTurnIndex).toBe(1 % updatedCombat.participants.length)
    })

    current.endCombat(combatId)
    await waitFor(() => expect(current.state.session.activeCombatId).toBeNull())
    expect(current.state.session.notes.some((note: any) => /Combate encerrado/.test(note.text))).toBe(true)
    await waitFor(() => expect(current.state.rewardEvents.length).toBeGreaterThan(0))
  })

  it('permite gerenciar inventario e condicoes do personagem do jogador', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))

    const player = current.createCharacter({
      name: 'Ayla',
      type: 'PLAYER',
      role: 'Heroina',
      imageUri: null,
      portraitUri: null,
      tags: [],
      strength: 2,
      skill: 2,
      resistance: 2,
      armor: 1,
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
      campaignId: current.state.session.activeCampaignId,
      isTemplate: false,
      ordem: {
        origin: '',
        path: '',
        progression: 5,
        attributes: { agility: 1, intellect: 1, presence: 1, strength: 1, vigor: 1 },
        skills: {},
        resources: { health: { current: 15, max: 15 }, effort: { current: 10, max: 10 }, sanity: { current: 10, max: 10 } },
        abilities: [],
        biography: '',
        appearance: '',
      },
    })

    const item = current.addEquipmentToCharacter(player.id, {
      name: 'Espada Curta',
      type: 'WEAPON',
      description: '',
      bonusF: 1,
      bonusH: 0,
      bonusR: 0,
      bonusA: 0,
      bonusPdF: 0,
      special: '',
      imageUri: null,
      isEquipped: false,
    })
    await waitFor(() => expect(current.state.characters.find((character: any) => character.id === player.id)?.equipment.length).toBe(1))

    current.toggleCharacterEquipment(player.id, item.id)
    await waitFor(() => expect(current.state.characters.find((character: any) => character.id === player.id)?.equipment[0].isEquipped).toBe(true))

    const condition = current.addConditionToCharacter(player.id, {
      type: 'CUSTOM',
      name: 'Inspirado',
      description: '',
      duration: 2,
      value: 1,
    })
    await waitFor(() => expect(current.state.characters.find((character: any) => character.id === player.id)?.activeConditions.length).toBe(1))

    current.removeConditionFromCharacter(player.id, condition.id)
    current.removeEquipmentFromCharacter(player.id, item.id)
    await waitFor(() => {
      expect(
        current.state.characters.some(
          (character: any) => character.id === player.id && character.activeConditions.length === 0 && character.equipment.length === 0,
        ),
      ).toBe(true)
    })
  })

  it('normaliza sistema legado ao criar campanha e bloqueia ficha com sistema divergente', async () => {
    let current: any
    render(
      <AppStoreProvider>
        <Probe onChange={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(!!current).toBe(true))

    const created = current.createCampaign({
      title: 'Campanha Legada',
      system: '3D&T Alpha',
      description: 'Teste',
    })
    expect(created.system).toBe('3DeT Victory')

    const dndCampaign = current.createCampaign({
      title: 'Mesa D&D',
      system: 'D&D 5e',
      description: 'Teste',
    })
    await waitFor(() => expect(current.state.campaigns.some((campaign: any) => campaign.id === dndCampaign.id)).toBe(true))
    expect(() =>
      current.createCharacter({
        name: 'Ficha Invalida',
        type: 'PLAYER',
        role: 'Heroi',
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
        campaignId: dndCampaign.id,
        isTemplate: false,
      }),
    ).toThrow(/precisa usar o sistema D&D 5e/i)
  })
})
