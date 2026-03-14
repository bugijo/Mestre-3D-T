import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { AppStoreProvider, useAppStore } from '@/store/AppStore'

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

type TableHarness = {
  tableId: number
  getApi: () => ReturnType<typeof useAppStore>
  unmount: () => void
}

type TableMetrics = {
  tableId: number
  players: number
  startSessionMs: number
  addNoteMs: number
  startCombatMs: number
  nextTurnAvgMs: number
  endCombatMs: number
  endSessionMs: number
  scenarioMs: number
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, value) => acc + value, 0)
  const avg = values.length ? sum / values.length : 0
  const p95Index = Math.max(0, Math.ceil(values.length * 0.95) - 1)
  return {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    avg,
    p95: sorted[p95Index] ?? 0,
  }
}

async function setupTable(tableId: number): Promise<TableHarness> {
  let current: ReturnType<typeof useAppStore> | null = null
  const view = render(
    <AppStoreProvider>
      <Probe onReady={(api) => (current = api)} />
    </AppStoreProvider>,
  )

  await waitFor(() => expect(current).not.toBeNull())

  return {
    tableId,
    getApi: () => current!,
    unmount: view.unmount,
  }
}

async function measureActionMs(
  action: () => void,
  assertion: () => void,
  timeout = 3000,
) {
  const started = performance.now()
  action()
  await waitFor(assertion, { timeout })
  return performance.now() - started
}

async function runTableScenario(harness: TableHarness): Promise<TableMetrics> {
  const scenarioStart = performance.now()
  const api = () => harness.getApi()
  const campaignId = api().state.session.activeCampaignId
  if (!campaignId) throw new Error(`Mesa ${harness.tableId}: campanha ativa inexistente`)

  const arc = api().createArc(
    campaignId,
    `Ato QA ${harness.tableId}`,
    `Simulacao de carga da mesa ${harness.tableId}`,
  )
  const scene = api().createScene(campaignId, arc.id, {
    name: `Arena QA ${harness.tableId}`,
    description: 'Cenario de combate e tomada de decisao.',
    objective: 'Derrotar a ameaca e manter o grupo vivo.',
    mood: 'epic',
    opening: 'O mestre descreve o inicio da rodada tensa.',
  })

  api().setActiveScene(campaignId, scene.id)
  const startSessionMs = await measureActionMs(
    () => api().startSession(),
    () => expect(api().state.session.isActive).toBe(true),
  )

  const players = Array.from({ length: 5 }, (_, index) =>
    api().createCharacter({
      name: `Mesa${harness.tableId}-Jogador${index + 1}`,
      type: 'PLAYER',
      role: `Classe ${index + 1}`,
      imageUri: null,
      portraitUri: null,
      tags: [],
      strength: 2 + (index % 2),
      skill: 2 + (index % 3),
      resistance: 2 + (index % 2),
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
    }),
  )

  const enemyA = api().createCharacter({
    name: `Mesa${harness.tableId}-InimigoA`,
    type: 'ENEMY',
    role: 'Bruto',
    imageUri: null,
    portraitUri: null,
    tags: [],
    strength: 4,
    skill: 2,
    resistance: 3,
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
  })
  const enemyB = api().createCharacter({
    name: `Mesa${harness.tableId}-InimigoB`,
    type: 'ENEMY',
    role: 'Conjurador',
    imageUri: null,
    portraitUri: null,
    tags: [],
    strength: 2,
    skill: 4,
    resistance: 2,
    armor: 1,
    firepower: 3,
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
  })

  api().linkCharacterToScene(scene.id, enemyA.id, 'enemy')
  api().linkCharacterToScene(scene.id, enemyB.id, 'enemy')

  const notesBefore = api().state.session.notes.length
  const addNoteMs = await measureActionMs(
    () => api().addNote(`Mesa ${harness.tableId}: anotacao tatico-narrativa`, true),
    () => expect(api().state.session.notes.length).toBe(notesBefore + 1),
  )

  const startCombatMs = await measureActionMs(
    () => api().startCombatFromScene(scene.id),
    () => expect(api().state.session.activeCombatId).not.toBeNull(),
  )

  const combatId = api().state.session.activeCombatId
  if (!combatId) throw new Error(`Mesa ${harness.tableId}: combate nao iniciou`)

  const turnDurations: number[] = []
  for (let step = 0; step < 8; step++) {
    const beforeIndex = api().state.combats.find((entry: any) => entry.id === combatId)?.currentTurnIndex
    const ms = await measureActionMs(
      () => api().nextCombatTurn(combatId),
      () => {
        const nextIndex = api().state.combats.find((entry: any) => entry.id === combatId)?.currentTurnIndex
        expect(nextIndex).not.toBe(beforeIndex)
      },
    )
    turnDurations.push(ms)
  }

  const combat = api().state.combats.find((entry: any) => entry.id === combatId)
  if (!combat) throw new Error(`Mesa ${harness.tableId}: combate nao encontrado`)

  combat.participants
    .filter((participant: any) => participant.name.includes('Inimigo'))
    .forEach((participant: any) => {
      api().adjustCombatParticipant(combatId, participant.id, -999, -999)
    })

  const rewardEventsBefore = api().state.rewardEvents.length
  const endCombatMs = await measureActionMs(
    () => api().endCombat(combatId),
    () => {
      expect(api().state.session.activeCombatId).toBeNull()
      expect(api().state.rewardEvents.length).toBeGreaterThan(rewardEventsBefore)
    },
  )

  const historyBefore = api().state.sessionHistory.length
  const endSessionMs = await measureActionMs(
    () => api().endSession(),
    () => {
      expect(api().state.session.isActive).toBe(false)
      expect(api().state.sessionHistory.length).toBe(historyBefore + 1)
    },
  )

  const scenarioMs = performance.now() - scenarioStart

  expect(players.length).toBe(5)
  expect(scenarioMs).toBeLessThan(15000)
  expect(startSessionMs).toBeLessThan(1000)
  expect(startCombatMs).toBeLessThan(1000)
  expect(addNoteMs).toBeLessThan(1000)
  expect(endCombatMs).toBeLessThan(1200)
  expect(endSessionMs).toBeLessThan(1200)

  return {
    tableId: harness.tableId,
    players: players.length,
    startSessionMs,
    addNoteMs,
    startCombatMs,
    nextTurnAvgMs: turnDurations.reduce((acc, value) => acc + value, 0) / turnDurations.length,
    endCombatMs,
    endSessionMs,
    scenarioMs,
  }
}

describe('Carga multi-mesa: 10 mestres x 10 mesas x 5 jogadores', { timeout: 120_000 }, () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('mantem jogabilidade e tempos de resposta dentro de faixa aceitavel', async () => {
    const totalMesas = 10
    const harnesses = await Promise.all(
      Array.from({ length: totalMesas }, (_, index) => setupTable(index + 1)),
    )

    try {
      const wallClockStart = performance.now()
      const results = await Promise.all(harnesses.map((harness) => runTableScenario(harness)))
      const wallClockMs = performance.now() - wallClockStart

      const startSessionSummary = summarize(results.map((result) => result.startSessionMs))
      const addNoteSummary = summarize(results.map((result) => result.addNoteMs))
      const startCombatSummary = summarize(results.map((result) => result.startCombatMs))
      const nextTurnSummary = summarize(results.map((result) => result.nextTurnAvgMs))
      const endCombatSummary = summarize(results.map((result) => result.endCombatMs))
      const endSessionSummary = summarize(results.map((result) => result.endSessionMs))
      const scenarioSummary = summarize(results.map((result) => result.scenarioMs))

      const totalPlayers = results.reduce((acc, result) => acc + result.players, 0)

      console.info(
        `[QA-LOAD] mesas=${totalMesas} mestres=${totalMesas} jogadores=${totalPlayers} wallClock=${wallClockMs.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] startSession avg=${startSessionSummary.avg.toFixed(2)}ms p95=${startSessionSummary.p95.toFixed(2)}ms max=${startSessionSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] addNote avg=${addNoteSummary.avg.toFixed(2)}ms p95=${addNoteSummary.p95.toFixed(2)}ms max=${addNoteSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] startCombat avg=${startCombatSummary.avg.toFixed(2)}ms p95=${startCombatSummary.p95.toFixed(2)}ms max=${startCombatSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] nextTurn avg=${nextTurnSummary.avg.toFixed(2)}ms p95=${nextTurnSummary.p95.toFixed(2)}ms max=${nextTurnSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] endCombat avg=${endCombatSummary.avg.toFixed(2)}ms p95=${endCombatSummary.p95.toFixed(2)}ms max=${endCombatSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] endSession avg=${endSessionSummary.avg.toFixed(2)}ms p95=${endSessionSummary.p95.toFixed(2)}ms max=${endSessionSummary.max.toFixed(2)}ms`,
      )
      console.info(
        `[QA-LOAD] scenario avg=${scenarioSummary.avg.toFixed(2)}ms p95=${scenarioSummary.p95.toFixed(2)}ms max=${scenarioSummary.max.toFixed(2)}ms`,
      )

      expect(totalPlayers).toBe(50)
      expect(results).toHaveLength(10)
      expect(wallClockMs).toBeLessThan(45000)
    } finally {
      harnesses.forEach((harness) => harness.unmount())
    }
  })
})

