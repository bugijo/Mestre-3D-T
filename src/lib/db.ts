import type { AppSnapshot } from '@/domain/models'
import { logError } from '@/lib/logger'

const DB_NAME = 'Mestre3DT_DB'
const STORE_NAME = 'snapshots'
const KEY = 'current_snapshot'

let dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error
      logError('db:open', error)
      reject(error)
    }
  }).catch((error) => {
    dbPromise = null
    throw error
  }) as Promise<IDBDatabase>

  return dbPromise as Promise<IDBDatabase>
}

export async function saveSnapshotToDB(snapshot: AppSnapshot): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(snapshot, KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => {
      logError('db:save-snapshot', request.error)
      reject(request.error)
    }
  })
}

export async function loadSnapshotFromDB(): Promise<AppSnapshot | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(KEY)

    request.onsuccess = () => resolve((request.result as AppSnapshot | null) ?? null)
    request.onerror = () => {
      logError('db:load-snapshot', request.error)
      reject(request.error)
    }
  })
}
