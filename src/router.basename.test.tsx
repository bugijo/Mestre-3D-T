import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import App from '@/App'
import { Dashboard } from '@/components/Dashboard'
import { AppStoreProvider } from '@/store/AppStore'

vi.mock('@/lib/imageGen', () => ({
  generateImage: async () => ({ dataUrl: 'data:image/png;base64,AA==' }),
}))

vi.mock('@/lib/db', () => ({
  loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/storage', () => ({
  loadSnapshot: vi.fn().mockReturnValue(null),
}))

function renderWithProvider(router: ReturnType<typeof createMemoryRouter>) {
  render(
    <AppStoreProvider>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      />
    </AppStoreProvider>,
  )
}

describe('Roteamento com basename', () => {
  it('resolve index em / com basename /', async () => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
        </Route>,
      ),
      {
        basename: '/',
        initialEntries: ['/'],
        future: {
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        },
      },
    )
    renderWithProvider(router)
    expect(await screen.findByText('Dungeon Keeper')).toBeInTheDocument()
  })

  it('resolve index em /Mestre-3D-T/ com basename /Mestre-3D-T/', async () => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
        </Route>,
      ),
      {
        basename: '/Mestre-3D-T/',
        initialEntries: ['/Mestre-3D-T/'],
        future: {
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        },
      },
    )
    renderWithProvider(router)
    expect(await screen.findByText('Dungeon Keeper')).toBeInTheDocument()
  })
})
