import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSnapshot } from '@/store/defaultData'

type RequestLike<T = unknown> = {
  result?: T
  error?: Error | null
  onsuccess: null | ((event: { target: RequestLike<T> }) => void)
  onerror: null | ((event: { target: RequestLike<T> }) => void)
  onupgradeneeded?: null | ((event: { target: RequestLike<T> }) => void)
}

function createMockIndexedDb() {
  let currentValue: unknown = null

  const createRequest = <T,>(result?: T): RequestLike<T> => ({
    result,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })

  const db = {
    objectStoreNames: {
      contains: vi.fn().mockReturnValue(false),
    },
    createObjectStore: vi.fn(),
    transaction: vi.fn((_store: string, _mode: string) => ({
      objectStore: vi.fn(() => ({
        put: vi.fn((value: unknown) => {
          const request = createRequest()
          queueMicrotask(() => {
            currentValue = value
            request.onsuccess?.({ target: request })
          })
          return request
        }),
        get: vi.fn(() => {
          const request = createRequest(currentValue)
          queueMicrotask(() => {
            request.onsuccess?.({ target: request })
          })
          return request
        }),
      })),
    })),
  }

  const api = {
    open: vi.fn((_name: string, _version: number) => {
      const request = createRequest(db as unknown as IDBDatabase)
      queueMicrotask(() => {
        request.onupgradeneeded?.({ target: request })
        request.onsuccess?.({ target: request })
      })
      return request
    }),
  }

  return api
}

describe('db storage', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('salva e carrega snapshot via indexedDB', async () => {
    ;(globalThis as any).indexedDB = createMockIndexedDb()
    const { saveSnapshotToDB, loadSnapshotFromDB } = await import('./db')

    const snapshot = createDefaultSnapshot()
    await saveSnapshotToDB(snapshot)
    const loaded = await loadSnapshotFromDB()

    expect(loaded?.version).toBe(snapshot.version)
    expect(loaded?.campaigns[0]?.title).toBe(snapshot.campaigns[0]?.title)
  })

  it('propaga erro quando indexedDB falha ao abrir', async () => {
    const failingOpen = vi.fn(() => {
      const request: RequestLike = {
        result: undefined,
        error: new Error('open-failed'),
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      }
      queueMicrotask(() => {
        request.onerror?.({ target: request })
      })
      return request
    })
    ;(globalThis as any).indexedDB = { open: failingOpen }
    const { openDB } = await import('./db')

    await expect(openDB()).rejects.toBeInstanceOf(Error)
  })
})
