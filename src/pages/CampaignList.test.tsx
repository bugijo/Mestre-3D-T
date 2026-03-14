import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CampaignList } from './CampaignList'

const storeState = {
  campaigns: [] as Array<{
    id: string
    title: string
    system: string
    description: string
    coverDataUrl: string | null
    createdAt: number
    updatedAt: number
  }>,
  scenes: [] as Array<{ id: string }>,
  characters: [] as Array<{ id: string }>,
}

vi.mock('@/store/AppStore', () => ({
  useAppStore: () => ({ state: storeState }),
}))

describe('CampaignList', () => {
  it('renderiza empty state quando nao ha campanhas', () => {
    storeState.campaigns = []
    storeState.scenes = []
    storeState.characters = []

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <CampaignList />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Biblioteca de/i })).toBeInTheDocument()
    expect(screen.getByText('Nenhuma campanha encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Criar primeira campanha/i })).toBeInTheDocument()
  })
})
