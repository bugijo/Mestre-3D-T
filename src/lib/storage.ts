import type { AppSnapshot } from '@/domain/models'
import { logError } from '@/lib/logger'
import { isAppSnapshot, normalizeSnapshot } from '@/lib/snapshot'

const STORAGE_KEY = 'mestre3dt:snapshot:v1'

export function loadSnapshot(): AppSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isAppSnapshot(parsed)) return null
    return normalizeSnapshot(parsed)
  } catch (error) {
    logError('storage:load-snapshot', error)
    return null
  }
}

export function saveSnapshot(snapshot: AppSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (error) {
    logError('storage:save-snapshot', error)
  }
}

export function clearSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    logError('storage:clear-snapshot', error)
  }
}
