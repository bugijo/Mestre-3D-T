import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
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

function renderDashboard() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Dashboard /> },
      { path: '/session', element: <div>Session Page</div> },
    ],
    {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    },
  )

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

describe('Dashboard', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('alternar tabs atualiza aria-pressed', async () => {
    renderDashboard()

    const allBtn = await screen.findByRole('button', { name: /^Todas$/i })
    const activeBtn = screen.getByRole('button', { name: /^Ativas$/i })
    expect(allBtn).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(activeBtn)
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true')
  }, 15000)

  it('exibe botao preparar sessao com aria-label acessivel', async () => {
    renderDashboard()

    const prepBtn = await screen.findByRole('button', { name: /Preparar sessao/i })
    expect(prepBtn).toBeEnabled()
    expect(prepBtn).toHaveTextContent('PREPARAR AGORA')

    fireEvent.click(prepBtn)
    await waitFor(() => expect(screen.getByText('Session Page')).toBeInTheDocument())
  })
})
