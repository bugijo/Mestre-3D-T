import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/store/AppStore', () => {
  const api = {
    nextCombatTurn: vi.fn(),
    endCombat: vi.fn(),
    adjustCombatParticipant: vi.fn(),
    toggleCombatDefeated: vi.fn(),
  }
  return { useAppStore: () => api }
})

import { CombatTracker } from './CombatTracker'
import type { Combat } from '@/domain/models'

function makeCombat(): Combat {
  return {
    id: 'c1',
    sceneId: 's1',
    round: 1,
    currentTurnIndex: 0,
    participants: [
      {
        id: 'p1',
        characterId: 'ch1',
        name: 'Goblin',
        initiative: 8,
        currentHp: 5,
        maxHp: 10,
        currentMp: 2,
        maxMp: 5,
        imageUri: null,
        isPlayer: false,
        isDefeated: false,
        activeConditions: [],
      },
      {
        id: 'p2',
        characterId: 'ch2',
        name: 'Knight',
        initiative: 10,
        currentHp: 12,
        maxHp: 15,
        currentMp: 3,
        maxMp: 6,
        imageUri: null,
        isPlayer: true,
        isDefeated: false,
        activeConditions: [],
      },
    ],
    isActive: true,
    startedAt: Date.now(),
    endedAt: null,
  }
}

describe('CombatTracker', () => {
  it('aciona próximo turno e encerrar combate', () => {
    const combat = makeCombat()
    render(<CombatTracker combat={combat} />)
    const nextBtn = screen.getByRole('button', { name: 'Próximo turno' })
    const endBtn = screen.getByRole('button', { name: 'Encerrar combate' })
    fireEvent.click(nextBtn)
    fireEvent.click(endBtn)
    expect(nextBtn).toBeInTheDocument()
    expect(endBtn).toBeInTheDocument()
    return import('@/store/AppStore').then(mod => {
      expect(mod.useAppStore().nextCombatTurn).toHaveBeenCalled()
      expect(mod.useAppStore().endCombat).toHaveBeenCalled()
    })
  })

  it('ajusta PV/PM e alterna derrotado', () => {
    const combat = makeCombat()
    render(<CombatTracker combat={combat} />)
    const pvBtn = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Remover 1 PV')!
    const pmBtn = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Remover 1 PM')!
    fireEvent.click(pvBtn)
    fireEvent.click(pmBtn)
    const toggleBtn = screen
      .getAllByRole('button')
      .find(el => {
        const name = el.getAttribute('aria-label') || ''
        return name === 'Marcar como derrotado' || name === 'Reviver'
      })!
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggleBtn)
    return import('@/store/AppStore').then(mod => {
      expect(mod.useAppStore().adjustCombatParticipant).toHaveBeenCalled()
      expect(mod.useAppStore().toggleCombatDefeated).toHaveBeenCalled()
    })
  })
})
