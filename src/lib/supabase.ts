import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { AppSnapshot } from '@/domain/models'
import { normalizeAdminVaultState, type AdminVaultState } from '@/lib/adminSecurity'
import { withTimeout } from '@/lib/async'
import { logError, logInfo } from '@/lib/logger'
import { normalizeSnapshot, sanitizeSyncSlot } from '@/lib/snapshot'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const REQUEST_TIMEOUT_MS = 8000
const HEALTH_CACHE_TTL_MS = 30_000

let clientInstance: SupabaseClient | null = null
let cachedHealth: { timestamp: number; result: Result<{ service: 'supabase'; reachable: boolean }> } | null = null

function resolveEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  const table = import.meta.env.VITE_SUPABASE_TABLE as string | undefined
  return { url, key, table }
}

function resolveSnapshotTable() {
  return resolveEnv().table || 'mestre_snapshots'
}

function resolveAdminVaultTable() {
  return (import.meta.env.VITE_SUPABASE_ADMIN_TABLE as string | undefined) || 'mestre_admin_vaults'
}

function requireClient(): SupabaseClient {
  const { url, key } = resolveEnv()
  if (!url || !key) throw new Error('Supabase nao configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
  if (!clientInstance) {
    clientInstance = createClient(url, key)
  }
  return clientInstance
}

async function runTimed<T>(label: string, promise: PromiseLike<T>) {
  return withTimeout(promise, REQUEST_TIMEOUT_MS, label)
}

export async function healthCheck(force = false): Promise<Result<{ service: 'supabase'; reachable: boolean }>> {
  const { url, key } = resolveEnv()
  if (!url || !key) return { ok: false, error: 'Variaveis de ambiente ausentes' }

  if (!force && cachedHealth && Date.now() - cachedHealth.timestamp < HEALTH_CACHE_TTL_MS) {
    return cachedHealth.result
  }

  try {
    const client = requireClient()
    const { error } = await runTimed<any>(
      'supabase.healthCheck',
      client.from(resolveSnapshotTable()).select('id', { count: 'exact', head: true }),
    )
    const result = error ? { ok: false as const, error: error.message } : { ok: true as const, data: { service: 'supabase' as const, reachable: true } }
    cachedHealth = { timestamp: Date.now(), result }
    return result
  } catch (error) {
    logError('supabase:health-check', error)
    const result = { ok: false as const, error: String((error as Error)?.message ?? error) }
    cachedHealth = { timestamp: Date.now(), result }
    return result
  }
}

export function startHealthMonitor(intervalMs: number, onStatus: (res: Result<{ service: 'supabase'; reachable: boolean }>) => void) {
  let timer: ReturnType<typeof setInterval> | null = null
  const tick = async () => {
    onStatus(await healthCheck(true))
  }
  tick()
  timer = setInterval(tick, Math.max(1000, intervalMs))
  return () => {
    if (timer) clearInterval(timer)
  }
}

export type DbCampaign = {
  id: number
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  players: number | null
  progress: number | null
  next_session: string | null
  created_at: string
  updated_at: string
}

export type DbNpc = {
  id: number
  user_id: string
  campaign_id: number | null
  name: string
  avatar: string | null
  type: 'Aliado' | 'Inimigo' | 'Boss'
  level: number
  description: string | null
  strength: number
  skill: number
  resistance: number
  armor: number
  firepower: number
  created_at: string
  updated_at: string
}

export type DbSnapshotRow = {
  id: number
  slot: string
  payload: AppSnapshot
  created_at: string
  updated_at: string
}

export type DbAdminVaultRow = {
  id: number
  slot: string
  payload: AdminVaultState
  created_at: string
  updated_at: string
}

async function safely<T>(source: string, action: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await action()
  } catch (error) {
    logError(source, error)
    return { ok: false, error: String((error as Error)?.message ?? error) }
  }
}

export async function listCampaigns(userId: string): Promise<Result<DbCampaign[]>> {
  return safely('supabase:list-campaigns', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>(
      'supabase.listCampaigns',
      client.from('campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    )
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  })
}

export async function createCampaign(payload: Omit<DbCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<Result<DbCampaign>> {
  return safely('supabase:create-campaign', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>('supabase.createCampaign', client.from('campaigns').insert(payload).select('*').single())
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbCampaign }
  })
}

export async function updateCampaign(id: number, patch: Partial<DbCampaign>): Promise<Result<DbCampaign>> {
  return safely('supabase:update-campaign', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>('supabase.updateCampaign', client.from('campaigns').update(patch).eq('id', id).select('*').single())
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbCampaign }
  })
}

export async function deleteCampaign(id: number): Promise<Result<{ id: number }>> {
  return safely('supabase:delete-campaign', async () => {
    const client = requireClient()
    const { error } = await runTimed<any>('supabase.deleteCampaign', client.from('campaigns').delete().eq('id', id))
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { id } }
  })
}

export async function listNpcs(userId: string): Promise<Result<DbNpc[]>> {
  return safely('supabase:list-npcs', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>(
      'supabase.listNpcs',
      client.from('npcs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    )
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  })
}

export async function createNpc(payload: Omit<DbNpc, 'id' | 'created_at' | 'updated_at'>): Promise<Result<DbNpc>> {
  return safely('supabase:create-npc', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>('supabase.createNpc', client.from('npcs').insert(payload).select('*').single())
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbNpc }
  })
}

export async function updateNpc(id: number, patch: Partial<DbNpc>): Promise<Result<DbNpc>> {
  return safely('supabase:update-npc', async () => {
    const client = requireClient()
    const { data, error } = await runTimed<any>('supabase.updateNpc', client.from('npcs').update(patch).eq('id', id).select('*').single())
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbNpc }
  })
}

export async function deleteNpc(id: number): Promise<Result<{ id: number }>> {
  return safely('supabase:delete-npc', async () => {
    const client = requireClient()
    const { error } = await runTimed<any>('supabase.deleteNpc', client.from('npcs').delete().eq('id', id))
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { id } }
  })
}

export async function uploadSnapshot(slot: string, snapshot: AppSnapshot): Promise<Result<DbSnapshotRow>> {
  return safely('supabase:upload-snapshot', async () => {
    const client = requireClient()
    const normalizedSlot = sanitizeSyncSlot(slot)
    const payload = {
      slot: normalizedSlot,
      payload: normalizeSnapshot(snapshot),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await runTimed<any>(
      'supabase.uploadSnapshot',
      client.from(resolveSnapshotTable()).upsert(payload, { onConflict: 'slot' }).select('*').single(),
    )
    if (error) return { ok: false, error: error.message }
    logInfo('supabase:upload-snapshot', 'Snapshot remoto atualizado', { slot: normalizedSlot })
    return { ok: true, data: data as DbSnapshotRow }
  })
}

export async function downloadSnapshot(slot: string): Promise<Result<AppSnapshot>> {
  return safely('supabase:download-snapshot', async () => {
    const client = requireClient()
    const normalizedSlot = sanitizeSyncSlot(slot)
    const { data, error } = await runTimed<any>(
      'supabase.downloadSnapshot',
      client.from(resolveSnapshotTable()).select('*').eq('slot', normalizedSlot).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    )
    if (error) return { ok: false, error: error.message }
    if (!data?.payload) return { ok: false, error: 'Nenhum snapshot encontrado para este slot' }
    logInfo('supabase:download-snapshot', 'Snapshot remoto carregado', { slot: normalizedSlot })
    return { ok: true, data: normalizeSnapshot(data.payload as AppSnapshot) }
  })
}

export async function uploadAdminVault(slot: string, vault: AdminVaultState): Promise<Result<DbAdminVaultRow>> {
  return safely('supabase:upload-admin-vault', async () => {
    const client = requireClient()
    const normalizedSlot = sanitizeSyncSlot(slot)
    const payload = {
      slot: normalizedSlot,
      payload: normalizeAdminVaultState(vault),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await runTimed<any>(
      'supabase.uploadAdminVault',
      client.from(resolveAdminVaultTable()).upsert(payload, { onConflict: 'slot' }).select('*').single(),
    )
    if (error) return { ok: false, error: error.message }
    logInfo('supabase:upload-admin-vault', 'Cofre admin remoto atualizado', { slot: normalizedSlot })
    return { ok: true, data: data as DbAdminVaultRow }
  })
}

export async function downloadAdminVault(slot: string): Promise<Result<AdminVaultState>> {
  return safely('supabase:download-admin-vault', async () => {
    const client = requireClient()
    const normalizedSlot = sanitizeSyncSlot(slot)
    const { data, error } = await runTimed<any>(
      'supabase.downloadAdminVault',
      client.from(resolveAdminVaultTable()).select('*').eq('slot', normalizedSlot).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    )
    if (error) return { ok: false, error: error.message }
    if (!data?.payload) return { ok: false, error: 'Nenhum cofre administrativo encontrado para este slot' }
    logInfo('supabase:download-admin-vault', 'Cofre admin remoto carregado', { slot: normalizedSlot })
    return { ok: true, data: normalizeAdminVaultState(data.payload as AdminVaultState) }
  })
}
