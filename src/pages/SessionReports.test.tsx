import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SessionReports } from './SessionReports'

const sessionHistory = [
  {
    id: 'summary-1',
    campaignId: 'c1',
    campaignTitle: 'Guerra das Sombras',
    startedAt: 1,
    endedAt: Date.now(),
    durationMs: 60 * 60 * 1000,
    sceneNames: ['Taverna'],
    npcNames: ['Eldrin'],
    defeatedEnemyNames: ['Goblin'],
    importantNotes: ['Grupo encontrou a reliquia'],
  },
]

vi.mock('@/store/AppStore', () => ({
  useAppStore: () => ({
    state: {
      sessionHistory,
    },
  }),
}))

afterEach(() => {
  cleanup()
})

describe('SessionReports', () => {
  it('renderiza insights e permite copiar relatorio', async () => {
    render(<SessionReports />)

    expect(screen.getByRole('heading', { name: 'Relatorios de Sessao' })).toBeInTheDocument()
    expect(screen.getAllByText('Guerra das Sombras').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Copiar relatorio/i }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())
  })

  it('filtra por busca textual', () => {
    render(<SessionReports />)

    fireEvent.change(screen.getByPlaceholderText(/Buscar por cena/i), { target: { value: 'reliquia' } })
    expect(screen.getByText('1 resultado(s)')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Buscar por cena/i), { target: { value: 'inexistente' } })
    expect(screen.getByText(/Nenhum relatorio encontrado/i)).toBeInTheDocument()
  })
})
