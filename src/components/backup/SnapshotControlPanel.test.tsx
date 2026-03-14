import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SnapshotControlPanel } from './SnapshotControlPanel'
import { AppStoreProvider, useAppStore } from '@/store/AppStore'
import { createDefaultSnapshot } from '@/store/defaultData'

const healthCheckMock = vi.fn()
const uploadSnapshotMock = vi.fn()
const downloadSnapshotMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  healthCheck: () => healthCheckMock(),
  uploadSnapshot: (...args: unknown[]) => uploadSnapshotMock(...args),
  downloadSnapshot: (...args: unknown[]) => downloadSnapshotMock(...args),
}))

vi.mock('@/lib/db', () => ({
  loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/storage', () => ({
  loadSnapshot: vi.fn().mockReturnValue(null),
}))

function CampaignCounter() {
  const { state } = useAppStore()
  return <span data-testid="campaign-count">{state.campaigns.length}</span>
}

describe('SnapshotControlPanel', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('envia snapshot para o slot remoto informado', async () => {
    healthCheckMock.mockResolvedValue({ ok: true, data: { service: 'supabase', reachable: true } })
    uploadSnapshotMock.mockResolvedValue({
      ok: true,
      data: {
        id: 1,
        slot: 'mesa-final',
        payload: createDefaultSnapshot(),
        created_at: '2026-03-02T10:00:00.000Z',
        updated_at: '2026-03-02T10:00:00.000Z',
      },
    })

    render(
      <AppStoreProvider>
        <SnapshotControlPanel />
      </AppStoreProvider>,
    )

    const input = await screen.findByPlaceholderText('default')
    fireEvent.change(input, { target: { value: 'mesa-final' } })
    fireEvent.click(screen.getByRole('button', { name: /Enviar para nuvem/i }))

    await waitFor(() => expect(uploadSnapshotMock).toHaveBeenCalled())
    expect(uploadSnapshotMock.mock.calls[0][0]).toBe('mesa-final')
    expect(await screen.findByText('Snapshot enviado para o slot "mesa-final".')).toBeInTheDocument()
  })

  it('baixa snapshot remoto e substitui o estado local', async () => {
    const remoteSnapshot = createDefaultSnapshot()
    remoteSnapshot.campaigns = [...remoteSnapshot.campaigns, { ...remoteSnapshot.campaigns[0], id: 'extra', title: 'Nova Campanha' }]
    downloadSnapshotMock.mockResolvedValue({ ok: true, data: remoteSnapshot })

    render(
      <AppStoreProvider>
        <SnapshotControlPanel />
        <CampaignCounter />
      </AppStoreProvider>,
    )

    expect(await screen.findByTestId('campaign-count')).toHaveTextContent('1')
    fireEvent.change(screen.getByPlaceholderText('default'), { target: { value: 'default' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Baixar da nuvem/i })[0])

    await waitFor(() => expect(downloadSnapshotMock).toHaveBeenCalledWith('default'))
    await waitFor(() => expect(screen.getByTestId('campaign-count')).toHaveTextContent('2'))
    expect(await screen.findByText('Snapshot do slot "default" restaurado da nuvem.')).toBeInTheDocument()
  })
})
