import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function resolveEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  const table = import.meta.env.VITE_SUPABASE_TABLE as string | undefined
  return { url, key, table }
}

function requireClient(): SupabaseClient {
  const { url, key } = resolveEnv()
  if (!url || !key) throw new Error('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
  return createClient(url, key)
}

export async function healthCheck(): Promise<Result<{ service: 'supabase'; reachable: boolean }>> {
  const { url, key } = resolveEnv()
  if (!url || !key) return { ok: false, error: 'Variáveis de ambiente ausentes' }
  try {
    const client = createClient(url, key)
    const { error } = await client.from('campaigns').select('id', { count: 'exact', head: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { service: 'supabase', reachable: true } }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export function startHealthMonitor(intervalMs: number, onStatus: (res: Result<{ service: 'supabase'; reachable: boolean }>) => void) {
  let timer: any = null
  const tick = async () => {
    const res = await healthCheck()
    onStatus(res)
  }
  tick()
  timer = setInterval(tick, Math.max(1000, intervalMs))
  return () => clearInterval(timer)
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

export async function listCampaigns(userId: string): Promise<Result<DbCampaign[]>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function createCampaign(payload: Omit<DbCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<Result<DbCampaign>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('campaigns').insert(payload).select('*').single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbCampaign }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function updateCampaign(id: number, patch: Partial<DbCampaign>): Promise<Result<DbCampaign>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('campaigns').update(patch).eq('id', id).select('*').single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbCampaign }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function deleteCampaign(id: number): Promise<Result<{ id: number }>> {
  try {
    const client = requireClient()
    const { error } = await client.from('campaigns').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { id } }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function listNpcs(userId: string): Promise<Result<DbNpc[]>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('npcs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function createNpc(payload: Omit<DbNpc, 'id' | 'created_at' | 'updated_at'>): Promise<Result<DbNpc>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('npcs').insert(payload).select('*').single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbNpc }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function updateNpc(id: number, patch: Partial<DbNpc>): Promise<Result<DbNpc>> {
  try {
    const client = requireClient()
    const { data, error } = await client.from('npcs').update(patch).eq('id', id).select('*').single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as DbNpc }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

export async function deleteNpc(id: number): Promise<Result<{ id: number }>> {
  try {
    const client = requireClient()
    const { error } = await client.from('npcs').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { id } }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}
