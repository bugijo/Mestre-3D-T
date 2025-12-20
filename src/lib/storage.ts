import type { AppSnapshot } from '@/domain/models'

const STORAGE_KEY = 'mestre3dt:snapshot:v1'

export function loadSnapshot(): AppSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppSnapshot
    if (!parsed || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSnapshot(snapshot: AppSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearSnapshot() {
  localStorage.removeItem(STORAGE_KEY)
}

