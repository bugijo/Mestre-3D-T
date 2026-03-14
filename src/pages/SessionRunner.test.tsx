import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SessionRunner } from './SessionRunner'

const api = {
  state: {
    session: { isActive: false, startedAt: null as number | null, endedAt: null as number | null, activeCampaignId: null as string | null, activeSceneId: null as string | null, activeCombatId: null as string | null, notes: [] as Array<{ id: string; createdAt: number; text: string; important: boolean }> },
    campaigns: [{ id: 'camp1', title: 'Campanha Teste', system: '3D&T', description: '', coverDataUrl: null, createdAt: 1, updatedAt: 1 }],
    scenes: [{ id: 'scene1', campaignId: 'camp1', arcId: 'arc1', name: 'Cena 1', description: '', objective: '', mood: 'neutral', opening: '', mapImageDataUrl: null, backgroundImageDataUrl: null, soundtrackUrl: null, enemyIds: [], npcIds: [], hooks: [], triggers: [], orderIndex: 0, isCompleted: false, completedAt: null, createdAt: 1, updatedAt: 1 }],
    characters: [],
    combats: [],
    audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
    settings: { nextSessionAt: Date.now() },
  },
  startSession: vi.fn(),
  endSession: vi.fn(),
  setActiveScene: vi.fn(),
  startCombatFromScene: vi.fn(),
  addNote: vi.fn(),
  deleteNote: vi.fn(),
  toggleNoteImportant: vi.fn(),
}

const overview = {
  activeCampaign: null as any,
  activeCombat: null as any,
  activeScene: null as any,
  campaignScenes: [] as any[],
  enemiesInScene: [] as any[],
  lastEndedCombat: null as any,
  npcsInScene: [] as any[],
  playersInCampaign: [] as any[],
  session: api.state.session,
}

vi.mock('@/store/AppStore', () => ({
  useAppStore: () => api,
}))

vi.mock('@/hooks/useSessionOverview', () => ({
  useSessionOverview: () => overview,
}))

vi.mock('@/components/game/DiceRoller', () => ({
  DiceRoller: () => <div>Dice Roller</div>,
}))

vi.mock('@/components/game/CombatTracker', () => ({
  CombatTracker: () => <div>Combat Tracker</div>,
}))

vi.mock('@/components/game/AudioPlayer', () => ({
  AudioPlayer: () => <div>Audio Player</div>,
}))

vi.mock('@/components/game/SessionChat', () => ({
  SessionChat: () => <div>Session Chat</div>,
}))

vi.mock('@/components/game/InteractiveMap', () => ({
  InteractiveMap: () => <div>Interactive Map</div>,
}))

vi.mock('@/components/game/PostBattleRewards', () => ({
  PostBattleRewards: () => <div>Post Battle Rewards</div>,
}))

vi.mock('@/components/ui/InGameNotifications', () => ({
  InGameNotifications: () => null,
}))

vi.mock('@/components/game/MasterToolkitPanel', () => ({
  MasterToolkitPanel: () => <div>Master Toolkit</div>,
}))

function setInactiveState() {
  api.state.session = { isActive: false, startedAt: null, endedAt: null, activeCampaignId: null, activeSceneId: null, activeCombatId: null, notes: [] }
  overview.session = api.state.session
  overview.activeCampaign = null
  overview.activeScene = null
  overview.activeCombat = null
  overview.campaignScenes = []
  overview.enemiesInScene = []
  overview.lastEndedCombat = null
  overview.npcsInScene = []
  overview.playersInCampaign = []
}

function setActiveState() {
  api.state.session = { isActive: true, startedAt: Date.now(), endedAt: null, activeCampaignId: 'camp1', activeSceneId: 'scene1', activeCombatId: null, notes: [] }
  overview.session = api.state.session
  overview.activeCampaign = api.state.campaigns[0]
  overview.activeScene = api.state.scenes[0]
  overview.activeCombat = null
  overview.campaignScenes = api.state.scenes
  overview.enemiesInScene = []
  overview.lastEndedCombat = null
  overview.npcsInScene = []
  overview.playersInCampaign = []
}

describe('SessionRunner', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    setInactiveState()
  })

  it('exibe CTA para iniciar sessao e aciona acoes ao clicar', async () => {
    render(<SessionRunner />)

    const btn = screen.getByRole('button', { name: /Iniciar sess/i })
    fireEvent.click(btn)

    expect(api.startSession).toHaveBeenCalled()
    expect(api.setActiveScene).toHaveBeenCalledWith('camp1', 'scene1')
  }, 15000)

  it('encerrar sessao aciona endSession quando ativa', async () => {
    setActiveState()

    render(<SessionRunner />)

    fireEvent.click(screen.getAllByRole('button', { name: /Encerrar sess/i })[0])
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /Encerrar sessao/i }))
    expect(api.endSession).toHaveBeenCalled()
  }, 15000)

  it('selecionar cena e iniciar combate possuem rotulos acessiveis', async () => {
    setActiveState()
    render(<SessionRunner />)

    fireEvent.click(screen.getByRole('button', { name: /Selecionar cena Cena 1/i }))
    expect(screen.getByRole('button', { name: /Iniciar combate/i })).toBeInTheDocument()
  })

  it('adicionar nota envia texto quando preenchido', async () => {
    setActiveState()
    render(<SessionRunner />)

    fireEvent.change(screen.getByPlaceholderText('Adicionar nota...'), { target: { value: 'Nota teste' } })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar nota/i }))

    await waitFor(() => expect(api.addNote).toHaveBeenCalledWith('Nota teste', false))
  })

  it('atalho Shift+C inicia combate na cena ativa', async () => {
    setActiveState()
    render(<SessionRunner />)

    fireEvent.keyDown(window, { key: 'C', shiftKey: true })
    expect(api.startCombatFromScene).toHaveBeenCalledWith('scene1')
  })

  it('permite marcar nota como importante e excluir', async () => {
    setActiveState()
    api.state.session.notes = [{ id: 'note-1', createdAt: Date.now(), text: 'Nota existente', important: false }]
    overview.session = api.state.session

    render(<SessionRunner />)

    fireEvent.click(screen.getByRole('button', { name: /Marcar nota importante/i }))
    expect(api.toggleNoteImportant).toHaveBeenCalledWith('note-1')

    fireEvent.click(screen.getByRole('button', { name: /Excluir nota/i }))
    expect(api.deleteNote).toHaveBeenCalledWith('note-1')
  })
})
