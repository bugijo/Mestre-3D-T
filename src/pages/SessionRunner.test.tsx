import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

vi.mock('@/store/AppStore', () => {
  const api = {
    state: {
      session: { isActive: false, startedAt: null, endedAt: null, activeCampaignId: null, activeSceneId: null, activeCombatId: null, notes: [] },
      campaigns: [
        { id: 'camp1', title: 'Campanha Teste', system: '3D&T', description: '', coverDataUrl: null, createdAt: Date.now(), updatedAt: Date.now() },
      ],
      scenes: [
        { id: 'scene1', campaignId: 'camp1', arcId: 'arc1', name: 'Cena 1', description: '', objective: '', mood: 'neutral', opening: '', mapImageDataUrl: null, backgroundImageDataUrl: null, soundtrackUrl: null, enemyIds: [], npcIds: [], hooks: [], triggers: [], orderIndex: 0, isCompleted: false, completedAt: null, createdAt: Date.now(), updatedAt: Date.now() },
      ],
      characters: [],
      combats: [],
      audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
      settings: { nextSessionAt: Date.now() }
    },
    startSession: vi.fn(),
    endSession: vi.fn(),
    setActiveScene: vi.fn(),
    startCombatFromScene: vi.fn(),
    addNote: vi.fn(),
  }
  return { useAppStore: () => api }
})

// Importar dinamicamente após configurar mocks para garantir estado correto em cada caso

describe('SessionRunner', () => {
  it('exibe CTA para iniciar sessão e aciona ações ao clicar', async () => {
    const { SessionRunner } = await import('./SessionRunner')
    render(<SessionRunner />)
    const btn = screen.getByRole('button', { name: /Iniciar sessão com Campanha Teste/i })
    fireEvent.click(btn)
    // Mocks definidos no vi.mock acima
    const mod = await import('@/store/AppStore')
    expect(mod.useAppStore().startSession).toHaveBeenCalled()
    expect(mod.useAppStore().setActiveScene).toHaveBeenCalled()
  })

  it('encerrar sessão aciona endSession quando ativa', async () => {
    vi.resetModules()
    vi.doMock('@/store/AppStore', () => {
      const api = {
        state: {
          session: { isActive: true, startedAt: Date.now(), endedAt: null, activeCampaignId: 'camp1', activeSceneId: 'scene1', activeCombatId: null, notes: [] },
          campaigns: [ { id: 'camp1', title: 'Campanha Teste', system: '3D&T', description: '', coverDataUrl: null, createdAt: Date.now(), updatedAt: Date.now() } ],
          scenes: [ { id: 'scene1', campaignId: 'camp1', arcId: 'arc1', name: 'Cena 1', description: '', objective: '', mood: 'neutral', opening: '', mapImageDataUrl: null, backgroundImageDataUrl: null, soundtrackUrl: null, enemyIds: [], npcIds: [], hooks: [], triggers: [], orderIndex: 0, isCompleted: false, completedAt: null, createdAt: Date.now(), updatedAt: Date.now() } ],
          characters: [], combats: [], audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false }, settings: { nextSessionAt: Date.now() }
        },
        endSession: vi.fn(),
        setActiveScene: vi.fn(),
        startCombatFromScene: vi.fn(),
        addNote: vi.fn(),
        startSession: vi.fn(),
      }
      return { useAppStore: () => api }
    })

    const { SessionRunner } = await import('./SessionRunner')
    const { unmount } = render(<SessionRunner />)
    // Simula confirmação do usuário
    const originalConfirm = window.confirm
    window.confirm = () => true
    const endBtn = screen.getByRole('button', { name: /Encerrar sessão/i })
    fireEvent.click(endBtn)
    const mod = await import('@/store/AppStore')
    expect(mod.useAppStore().endSession).toHaveBeenCalled()
    window.confirm = originalConfirm
    unmount()
  })

  it('selecionar cena e iniciar combate possuem rótulos acessíveis', async () => {
    vi.resetModules()
    vi.doMock('@/store/AppStore', () => {
      const api = {
        state: {
          session: { isActive: true, startedAt: Date.now(), endedAt: null, activeCampaignId: 'camp1', activeSceneId: 'scene1', activeCombatId: null, notes: [] },
          campaigns: [ { id: 'camp1', title: 'Campanha Teste', system: '3D&T', description: '', coverDataUrl: null, createdAt: Date.now(), updatedAt: Date.now() } ],
          scenes: [
            { id: 'scene1', campaignId: 'camp1', arcId: 'arc1', name: 'Cena 1', description: '', objective: '', mood: 'neutral', opening: '', mapImageDataUrl: null, backgroundImageDataUrl: null, soundtrackUrl: null, enemyIds: [], npcIds: [], hooks: [], triggers: [], orderIndex: 0, isCompleted: false, completedAt: null, createdAt: Date.now(), updatedAt: Date.now() },
          ],
          characters: [], combats: [], audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false }, settings: { nextSessionAt: Date.now() }
        },
        setActiveScene: vi.fn(),
        startCombatFromScene: vi.fn(),
        addNote: vi.fn(),
        endSession: vi.fn(),
        startSession: vi.fn(),
      }
      return { useAppStore: () => api }
    })

    const { SessionRunner } = await import('./SessionRunner')
    render(<SessionRunner />)
    const selectSceneBtn = screen.getByRole('button', { name: /Selecionar cena Cena 1/i })
    fireEvent.click(selectSceneBtn)
    const startCombatBtn = screen.getByRole('button', { name: /Iniciar combate/i })
    expect(startCombatBtn).toBeInTheDocument()
  })

  it('adicionar nota envia texto quando preenchido', async () => {
    vi.resetModules()
    vi.doMock('@/store/AppStore', () => {
      const api = {
        state: {
          session: { isActive: true, startedAt: Date.now(), endedAt: null, activeCampaignId: 'camp1', activeSceneId: 'scene1', activeCombatId: null, notes: [] },
          campaigns: [ { id: 'camp1', title: 'Campanha Teste', system: '3D&T', description: '', coverDataUrl: null, createdAt: Date.now(), updatedAt: Date.now() } ],
          scenes: [ { id: 'scene1', campaignId: 'camp1', arcId: 'arc1', name: 'Cena 1', description: '', objective: '', mood: 'neutral', opening: '', mapImageDataUrl: null, backgroundImageDataUrl: null, soundtrackUrl: null, enemyIds: [], npcIds: [], hooks: [], triggers: [], orderIndex: 0, isCompleted: false, completedAt: null, createdAt: Date.now(), updatedAt: Date.now() } ],
          characters: [], combats: [], audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false }, settings: { nextSessionAt: Date.now() }
        },
        addNote: vi.fn(),
        setActiveScene: vi.fn(),
        startCombatFromScene: vi.fn(),
        endSession: vi.fn(),
        startSession: vi.fn(),
      }
      return { useAppStore: () => api }
    })
    const { SessionRunner } = await import('./SessionRunner')
    const { container } = render(<SessionRunner />)
    const input = Array.from(container.querySelectorAll('input[type="text"]')).find(el => (el as HTMLInputElement).placeholder === 'Adicionar nota...') as HTMLInputElement
    if (!input) throw new Error('Campo de nota não encontrado')
    fireEvent.change(input, { target: { value: 'Nota teste' } })
    await waitFor(() => expect((input as HTMLInputElement).value).toBe('Nota teste'))
    const addBtn = within(container).getByRole('button', { name: 'Adicionar nota' })
    fireEvent.click(addBtn)
    const mod = await import('@/store/AppStore')
    await waitFor(() => expect(mod.useAppStore().addNote).toHaveBeenCalled())
  })
})
