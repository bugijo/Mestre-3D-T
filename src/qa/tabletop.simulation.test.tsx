import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { AppStoreProvider, useAppStore } from '@/store/AppStore'
import type { Character } from '@/domain/models'

vi.mock('@/lib/db', () => ({
  loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/storage', () => ({
  loadSnapshot: vi.fn().mockReturnValue(null),
}))

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useAppStore>) => void }) {
  const api = useAppStore()
  onReady(api)
  return null
}

function buildCharacterBase(name: string, campaignId: string, type: Character['type'], role: string) {
  return {
    name,
    type,
    role,
    imageUri: null,
    portraitUri: null,
    tags: [],
    strength: 2,
    skill: 2,
    resistance: 2,
    armor: 1,
    firepower: 1,
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
    campaignId,
    isTemplate: false,
  } satisfies Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'currentHp' | 'currentMp' | 'xp' | 'gold'>
}

describe('Simulacao de mesa: 1 mestre + 5 jogadores', { timeout: 30_000 }, () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('executa fluxo completo de sessao, combate e recompensas sem inconsistencias', async () => {
    let current: ReturnType<typeof useAppStore> | null = null

    render(
      <AppStoreProvider>
        <Probe onReady={(api) => (current = api)} />
      </AppStoreProvider>,
    )

    await waitFor(() => expect(current).not.toBeNull())
    const api = () => current!

    const campaignId = api().state.session.activeCampaignId
    expect(campaignId).toBeTruthy()
    if (!campaignId) throw new Error('Campanha ativa nao encontrada')

    const arc = api().createArc(campaignId, 'Ato de Simulacao QA', 'Execucao automatizada com 5 jogadores')
    const scene = api().createScene(campaignId, arc.id, {
      name: 'Ruinas de Valtor',
      description: 'Simulacao de encontro tatico em ambiente hostil.',
      objective: 'Neutralizar a ameaca e proteger os exploradores.',
      mood: 'epic',
      opening: 'O mestre descreve uma tempestade arcana sobre as ruinas.',
    })

    api().setActiveScene(campaignId, scene.id)
    api().startSession()

    await waitFor(() => expect(api().state.session.isActive).toBe(true))
    await waitFor(() => expect(api().state.session.activeSceneId).toBe(scene.id))

    const players = ['Lia', 'Rurik', 'Kael', 'Mira', 'Tobin'].map((name, index) =>
      api().createCharacter({
        ...buildCharacterBase(name, campaignId, 'PLAYER', `Jogador ${index + 1}`),
        skill: 2 + (index % 2),
        resistance: 2 + (index % 3),
      }),
    )

    const npc = api().createCharacter({
      ...buildCharacterBase('Ithra', campaignId, 'NPC', 'Aliada'),
      skill: 3,
      resistance: 3,
    })
    const enemyA = api().createCharacter({
      ...buildCharacterBase('Sentinela das Cinzas', campaignId, 'ENEMY', 'Bruto'),
      strength: 3,
      resistance: 3,
      firepower: 2,
    })
    const enemyB = api().createCharacter({
      ...buildCharacterBase('Arquiteto Sombrio', campaignId, 'ENEMY', 'Conjurador'),
      skill: 4,
      resistance: 2,
      firepower: 3,
    })

    api().linkCharacterToScene(scene.id, npc.id, 'npc')
    api().linkCharacterToScene(scene.id, enemyA.id, 'enemy')
    api().linkCharacterToScene(scene.id, enemyB.id, 'enemy')

    players.forEach((player, index) => {
      api().addEquipmentToCharacter(player.id, {
        name: `Kit tatico ${index + 1}`,
        type: 'ACCESSORY',
        description: 'Equipamento de teste',
        bonusF: 0,
        bonusH: 0,
        bonusR: 0,
        bonusA: 0,
        bonusPdF: 0,
        special: '',
        imageUri: null,
        isEquipped: false,
      })
      api().adjustCharacterHpMp(player.id, -1, -1)
      api().addNote(`[${player.name}] reporta status pronto para combate.`, false)
    })

    api().addNote('Mestre inicia encontro com briefing tatico.', true)

    await waitFor(() => expect(api().state.characters.filter((entry) => entry.type === 'PLAYER').length).toBeGreaterThanOrEqual(5))
    await waitFor(() => expect(api().state.session.notes.length).toBeGreaterThanOrEqual(6))

    api().startCombatFromScene(scene.id)
    await waitFor(() => expect(api().state.session.activeCombatId).not.toBeNull())

    const combatId = api().state.session.activeCombatId
    if (!combatId) throw new Error('Combate nao foi iniciado')

    await waitFor(() => expect(api().state.combats.some((entry) => entry.id === combatId)).toBe(true))
    const combatBefore = api().state.combats.find((entry) => entry.id === combatId)
    if (!combatBefore) throw new Error('Combate nao encontrado')

    const playerParticipantCount = combatBefore.participants.filter((entry) => entry.isPlayer).length
    expect(playerParticipantCount).toBeGreaterThanOrEqual(5)

    for (let turn = 0; turn < 8; turn++) {
      api().nextCombatTurn(combatId)
    }

    const enemyNames = new Set([enemyA.name, enemyB.name])
    const combatDuring = api().state.combats.find((entry) => entry.id === combatId)
    if (!combatDuring) throw new Error('Combate nao encontrado durante a simulacao')

    combatDuring.participants
      .filter((participant) => enemyNames.has(participant.name))
      .forEach((participant) => {
        api().adjustCombatParticipant(combatId, participant.id, -999, -999)
      })

    api().endCombat(combatId)

    await waitFor(() => expect(api().state.session.activeCombatId).toBeNull())
    await waitFor(() => expect(api().state.rewardEvents.length).toBeGreaterThan(0))

    const afterRewardsPlayers = api().state.characters.filter((entry) => players.some((p) => p.id === entry.id))
    expect(afterRewardsPlayers.every((entry) => (entry.xp ?? 0) > 0)).toBe(true)
    expect(afterRewardsPlayers.every((entry) => (entry.gold ?? 0) > 0)).toBe(true)

    api().endSession()
    await waitFor(() => expect(api().state.session.isActive).toBe(false))
    await waitFor(() => expect(api().state.sessionHistory.length).toBeGreaterThan(0))

    const summary = api().state.sessionHistory[0]
    expect(summary.sceneNames).toContain('Ruinas de Valtor')
    expect(summary.defeatedEnemyNames).toEqual(expect.arrayContaining([enemyA.name, enemyB.name]))
    expect(summary.importantNotes.length).toBeGreaterThan(0)

    console.info(
      `[QA-SIM] mesa finalizada: players=${players.length}, notas=${api().state.session.notes.length}, recompensas=${api().state.rewardEvents.length}, derrotados=${summary.defeatedEnemyNames.join(', ')}`,
    )
  })
})

