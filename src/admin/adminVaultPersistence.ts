import {
  createEmptyAdminVault,
  isAdminVaultState,
  normalizeAdminVaultState,
  type AdminVaultState,
} from '@/lib/adminSecurity'
import { logError, logWarn } from '@/lib/logger'
import { downloadAdminVault, uploadAdminVault } from '@/lib/supabase'

export const ADMIN_VAULT_STORAGE_KEY = 'mestre3dt:admin-vault:v1'
export const ADMIN_VAULT_SYNC_KEY = 'mestre3dt:admin-vault:sync'

const DEFAULT_REMOTE_SLOT = 'default-admin'

function resolveRemoteSlot() {
  const configured = (import.meta.env.VITE_SUPABASE_ADMIN_SLOT as string | undefined)?.trim()
  return configured || DEFAULT_REMOTE_SLOT
}

export function loadLocalAdminVault() {
  if (typeof window === 'undefined') return createEmptyAdminVault()
  try {
    const raw = window.localStorage.getItem(ADMIN_VAULT_STORAGE_KEY)
    if (!raw) return createEmptyAdminVault()
    const parsed = JSON.parse(raw) as unknown
    if (!isAdminVaultState(parsed)) return createEmptyAdminVault()
    return normalizeAdminVaultState(parsed)
  } catch (error) {
    logError('admin-vault:load-local', error)
    return createEmptyAdminVault()
  }
}

export function persistLocalAdminVault(vault: AdminVaultState) {
  try {
    window.localStorage.setItem(ADMIN_VAULT_STORAGE_KEY, JSON.stringify(vault))
  } catch (error) {
    logError('admin-vault:save-local', error)
  }
}

export function broadcastAdminVaultSync(reason: 'save' | 'clear' | 'refresh') {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_VAULT_SYNC_KEY, `${Date.now()}:${reason}`)
  } catch (error) {
    logError('admin-vault:broadcast-sync', error)
  }
}

export async function hydrateAdminVault() {
  const localVault = loadLocalAdminVault()
  const remoteResult = await downloadAdminVault(resolveRemoteSlot())
  if (!remoteResult.ok) {
    return localVault
  }

  const remoteVault = normalizeAdminVaultState(remoteResult.data)
  persistLocalAdminVault(remoteVault)
  broadcastAdminVaultSync('refresh')
  return remoteVault
}

export async function persistAdminVault(vault: AdminVaultState) {
  const normalized = normalizeAdminVaultState(vault)
  persistLocalAdminVault(normalized)
  broadcastAdminVaultSync('save')

  const remoteResult = await uploadAdminVault(resolveRemoteSlot(), normalized)
  if (!remoteResult.ok) {
    logWarn('admin-vault:save-remote', 'Persistencia remota indisponivel; mantendo cofre local como fallback.', {
      error: remoteResult.error,
    })
  }
}

export function clearLocalAdminVault() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ADMIN_VAULT_STORAGE_KEY)
    broadcastAdminVaultSync('clear')
  } catch (error) {
    logError('admin-vault:clear-local', error)
  }
}
