import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PlayerConsole } from './PlayerConsole'

const storeApi = {
  addConditionToCharacter: vi.fn(),
  addEquipmentToCharacter: vi.fn(),
  adjustCharacterHpMp: vi.fn(),
  removeConditionFromCharacter: vi.fn(),
  removeEquipmentFromCharacter: vi.fn(),
  toggleCharacterEquipment: vi.fn(),
}

const overview = {
  activeCampaign: { id: 'camp-1', title: 'Cronicas Neon', system: '3D&T', description: '', coverDataUrl: null, createdAt: 0, updatedAt: 0 },
  activeCombat: null,
  activeScene: {
    id: 'scene-1',
    name: 'Mercado Suspenso',
    description: '',
    objective: 'Resgatar o informante',
    mood: 'tense',
    opening: 'Cabos de aco balancam acima da cidade.',
    mapImageDataUrl: null,
    backgroundImageDataUrl: null,
    soundtrackUrl: null,
    enemyIds: [],
    npcIds: [],
    hooks: [],
    triggers: [],
    campaignId: 'camp-1',
    arcId: 'arc-1',
    orderIndex: 0,
    isCompleted: false,
    completedAt: null,
    createdAt: 0,
    updatedAt: 0,
  },
  campaignScenes: [],
  enemiesInScene: [],
  lastEndedCombat: null,
  npcsInScene: [],
  playersInCampaign: [
    {
      id: 'player-1',
      name: 'Lina',
      type: 'PLAYER',
      role: 'Espadachim',
      imageUri: null,
      portraitUri: null,
      tags: [],
      strength: 2,
      skill: 3,
      resistance: 2,
      armor: 1,
      firepower: 0,
      currentHp: 10,
      currentMp: 10,
      activeConditions: [],
      xp: 20,
      gold: 15,
      personality: '',
      speechStyle: '',
      mannerisms: [],
      goal: '',
      secrets: {},
      quickPhrases: [],
      advantages: ['Ataque Especial'],
      disadvantages: [],
      equipment: [],
      powers: [],
      campaignId: 'camp-1',
      isTemplate: false,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  session: {
    isActive: true,
    activeCampaignId: 'camp-1',
    activeSceneId: 'scene-1',
    activeCombatId: null,
    startedAt: 0,
    endedAt: null,
    notes: [],
  },
  state: {} as never,
}

vi.mock('@/store/AppStore', () => ({
  useAppStore: () => storeApi,
}))

vi.mock('@/hooks/useSessionOverview', () => ({
  useSessionOverview: () => overview,
}))

vi.mock('@/components/game/DiceRoller', () => ({
  DiceRoller: () => <div>Dice Roller</div>,
}))

vi.mock('@/components/game/SessionChat', () => ({
  SessionChat: () => <div>Session Chat</div>,
}))

vi.mock('@/components/game/TableEventFeed', () => ({
  TableEventFeed: () => <div>Table Feed</div>,
}))

describe('PlayerConsole', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('permite adicionar item ao inventario e ajustar recursos', () => {
    render(
      <MemoryRouter
        initialEntries={['/player/player-1']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/player/:characterId" element={<PlayerConsole readonly={false} />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0])
    expect(storeApi.adjustCharacterHpMp).toHaveBeenCalledWith('player-1', 1, 0)

    fireEvent.change(screen.getByPlaceholderText('Novo item'), { target: { value: 'Pocao' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(storeApi.addEquipmentToCharacter).toHaveBeenCalledWith(
      'player-1',
      expect.objectContaining({ name: 'Pocao', type: 'WEAPON' }),
    )
  }, 15000)
})
