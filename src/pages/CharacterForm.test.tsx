import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppStoreProvider } from '@/store/AppStore'
import { CharacterForm } from '@/pages/CharacterForm'

vi.mock('@/lib/db', () => ({
  loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/storage', () => ({
  loadSnapshot: vi.fn().mockReturnValue(null),
}))

vi.mock('@/components/ui/PageHero', () => ({
  PageHero: ({ title, description, actions }: { title: unknown; description: unknown; actions?: unknown }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      <div>{actions}</div>
    </div>
  ),
}))

vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: () => <div>Image Upload</div>,
}))

vi.mock('@/components/ui/ImageGenerator', () => ({
  ImageGenerator: () => <div>Image Generator</div>,
}))

describe('CharacterForm', () => {
  it('habilita envio para ficha valida de 3DeT Victory e bloqueia prerequisito invalido', async () => {
    render(
      <MemoryRouter initialEntries={['/characters/new']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppStoreProvider>
          <Routes>
            <Route path="/characters/new" element={<CharacterForm />} />
          </Routes>
        </AppStoreProvider>
      </MemoryRouter>,
    )

    const submit = await screen.findByRole('button', { name: /Criar personagem/i })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Ex: Cloud Strife'), { target: { value: 'Aria' } })
    expect(submit).toBeEnabled()

    fireEvent.click(screen.getByText('Magia').closest('button') as HTMLButtonElement)
    expect((await screen.findAllByText(/Exige a pericia Mistica/i)).length).toBeGreaterThan(0)
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByText('Mistica').closest('button') as HTMLButtonElement)
    expect(submit).toBeEnabled()
  }, 15000)
})
