import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CampaignForm } from './CampaignForm'

const storeApi = {
  state: {
    campaigns: [] as Array<{
      id: string
      title: string
      system: string
      description: string
      coverDataUrl: string | null
      createdAt: number
      updatedAt: number
    }>,
    characters: [] as Array<{ id: string; campaignId: string | null }>,
  },
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}

vi.mock('@/store/AppStore', () => ({
  useAppStore: () => storeApi,
}))

vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: () => <div>Image Upload</div>,
}))

describe('CampaignForm', () => {
  it('cria campanha nova ao enviar formulario', () => {
    storeApi.state.campaigns = []
    storeApi.createCampaign.mockClear()

    render(
      <MemoryRouter
        initialEntries={['/campaigns/new']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/campaigns/new" element={<CampaignForm />} />
          <Route path="/campaigns" element={<div>Campaigns Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Ex: A Lenda de Arton'), { target: { value: 'Nova Saga' } })
    fireEvent.click(screen.getByRole('button', { name: /Criar campanha/i }))

    expect(storeApi.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nova Saga', system: '3DeT Victory' }),
    )
  })
})
