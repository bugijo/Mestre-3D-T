/**
 * persistence.mjs — Dual-mode session persistence
 *
 * LAN mode:    flat JSON file at .data/lan-sessions.json
 * ONLINE mode: Supabase (service-role) — live_sessions + session_participants + session_events
 *
 * Safe to fail: Supabase unavailability logs a warning and returns gracefully.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { getConfig } from './app-config.mjs'

// --- Helpers ---

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(MODULE_DIR, '..', '.data')
const SESSIONS_FILE = join(DATA_DIR, 'lan-sessions.json')

let _supabase = null

function getSupabaseClient(config) {
  if (_supabase) return _supabase
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn('[PERSIST] Supabase nao configurado: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes')
    return null
  }
  _supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _supabase
}

// --- Timestamp mapping helpers ---

function toISO(ts) {
  return ts ? new Date(ts).toISOString() : new Date().toISOString()
}

function toMs(iso) {
  return iso ? new Date(iso).getTime() : Date.now()
}

// --- LAN persistence (file) ---

async function loadLanSessions() {
  try {
    const raw = await readFile(SESSIONS_FILE, 'utf8')
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[LAN] Erro ao carregar sessoes do arquivo:', error.message)
    }
    return []
  }
}

async function saveLanSessions(sessionsArray) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(SESSIONS_FILE, JSON.stringify(sessionsArray, null, 2), 'utf8')
}

// --- ONLINE persistence (Supabase service role) ---

/**
 * Map in-memory session participant to DB row shape.
 */
function participantToDb(sessionCode, p) {
  return {
    id: p.id,
    session_code: sessionCode,
    user_id: null,
    reconnect_token: p.reconnectToken || null,
    player_name: p.playerName || '',
    character_id: p.characterId || null,
    character_name: null,
    status: p.status || 'pending',
    connected: false,
    joined_at: toISO(p.joinedAt),
    last_seen_at: toISO(p.lastSeenAt),
  }
}

/**
 * Map DB row participant back to in-memory shape.
 */
function participantFromDb(row) {
  return {
    id: row.id,
    reconnectToken: row.reconnect_token,
    playerName: row.player_name,
    characterId: row.character_id,
    status: row.status,
    connected: false,
    joinedAt: toMs(row.joined_at),
    lastSeenAt: toMs(row.last_seen_at),
  }
}

/**
 * Map in-memory event to DB row.
 */
function eventToDb(sessionCode, ev, seq) {
  return {
    id: ev.id,
    session_code: sessionCode,
    action_id: ev.actionId || null,
    seq: seq ?? null,
    kind: ev.kind || '',
    payload: ev.payload ?? {},
    audience: ev.audience ?? { kind: 'all' },
    actor: ev.actor ?? {},
    created_at: toISO(ev.createdAt),
  }
}

/**
 * Map DB row event back to in-memory shape.
 */
function eventFromDb(row) {
  return {
    id: row.id,
    actionId: row.action_id,
    kind: row.kind,
    payload: row.payload ?? {},
    audience: row.audience ?? { kind: 'all' },
    actor: row.actor ?? {},
    createdAt: toMs(row.created_at),
  }
}

/**
 * Map serialized session to DB live_sessions row.
 */
function sessionToDb(s) {
  return {
    id: s.id,
    code: s.code,
    master_token: s.masterToken,
    master_user_id: s.masterUserId || null,
    campaign_id: s.campaignId || null,
    campaign_title: s.campaignTitle || '',
    mode: s.mode || 'in_person',
    status: s.status || 'active',
    ruleset: s.ruleset || null,
    projection: s.projection ?? null,
    stage: s.stage ?? null,
    seq: s.seq ?? 0,
    created_at: toISO(s.createdAt),
    updated_at: toISO(s.updatedAt),
    ended_at: s.status === 'ended' ? new Date().toISOString() : null,
  }
}

/**
 * Map DB live_sessions row back to serialized session shape.
 */
function sessionFromDb(row) {
  return {
    id: row.id,
    code: row.code,
    masterToken: row.master_token,
    masterUserId: row.master_user_id,
    campaignId: row.campaign_id,
    campaignTitle: row.campaign_title,
    mode: row.mode,
    status: row.status,
    ruleset: row.ruleset,
    projection: row.projection,
    stage: row.stage,
    seq: row.seq,
    createdAt: toMs(row.created_at),
    updatedAt: toMs(row.updated_at),
    events: [],
    participants: [],
    actionIds: [],
  }
}

/**
 * Upsert a single session into Supabase (ONLINE mode).
 */
async function saveOnlineSession(sessionData) {
  const config = getConfig()
  const supabase = getSupabaseClient(config)
  if (!supabase) return

  // --- Upsert live_sessions row ---
  const dbSession = sessionToDb(sessionData)
  const { error: sessionError } = await supabase
    .from('live_sessions')
    .upsert(dbSession, { onConflict: 'code' })

  if (sessionError) {
    console.warn('[ONLINE] Erro ao upsert live_sessions:', sessionError.message)
    return
  }

  // --- Replace participants ---
  if (Array.isArray(sessionData.participants)) {
    // Delete existing participants for this session
    const { error: delPartError } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_code', sessionData.code)

    if (delPartError) {
      console.warn('[ONLINE] Erro ao limpar participantes:', delPartError.message)
    }

    // Insert current participants
    if (sessionData.participants.length > 0) {
      const dbParticipants = sessionData.participants.map((p) => participantToDb(sessionData.code, p))
      const { error: insPartError } = await supabase
        .from('session_participants')
        .insert(dbParticipants)

      if (insPartError) {
        console.warn('[ONLINE] Erro ao inserir participantes:', insPartError.message)
      }
    }
  }

  // --- Batch insert events (dedup by action_id) ---
  if (Array.isArray(sessionData.events) && sessionData.events.length > 0) {
    // Fetch existing action_ids for this session to avoid duplicates
    const { data: existingEvents } = await supabase
      .from('session_events')
      .select('action_id')
      .eq('session_code', sessionData.code)

    const existingActionIds = new Set((existingEvents || []).map((e) => e.action_id).filter(Boolean))

    const newEvents = sessionData.events.filter((ev) => !ev.actionId || !existingActionIds.has(ev.actionId))

    if (newEvents.length > 0) {
      // Batch in chunks of 50 to avoid payload limits
      const chunkSize = 50
      for (let i = 0; i < newEvents.length; i += chunkSize) {
        const chunk = newEvents.slice(i, i + chunkSize)
        const seqOffset = i
        const dbEvents = chunk.map((ev, index) => eventToDb(sessionData.code, ev, (sessionData.seq || 0) - newEvents.length + seqOffset + index + 1))
        const { error: evError } = await supabase
          .from('session_events')
          .insert(dbEvents)

        if (evError) {
          console.warn('[ONLINE] Erro ao inserir eventos (chunk):', evError.message)
        }
      }
    }
  }
}

/**
 * Load active sessions from Supabase (ONLINE mode).
 */
async function loadOnlineSessions() {
  const config = getConfig()
  const supabase = getSupabaseClient(config)
  if (!supabase) return []

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()

  const { data: sessions, error: sessError } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('status', 'active')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })

  if (sessError) {
    console.warn('[ONLINE] Erro ao carregar sessoes:', sessError.message)
    return []
  }

  const result = []
  for (const row of sessions || []) {
    const session = sessionFromDb(row)

    // Load participants
    const { data: participants } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_code', session.code)

    session.participants = (participants || []).map(participantFromDb)

    // Load recent events
    const { data: events } = await supabase
      .from('session_events')
      .select('*')
      .eq('session_code', session.code)
      .order('created_at', { ascending: false })
      .limit(200)

    const hydratedEvents = (events || []).reverse().map(eventFromDb)
    session.events = hydratedEvents

    // Reconstruct actionIds from events
    const actionIds = new Set()
    for (const ev of hydratedEvents) {
      if (ev.actionId) actionIds.add(ev.actionId)
    }
    session.actionIds = Array.from(actionIds)

    result.push(session)
  }

  return result
}

/**
 * Delete a session from Supabase (ONLINE mode) — FK cascade handles children.
 */
async function deleteOnlineSession(code) {
  const config = getConfig()
  const supabase = getSupabaseClient(config)
  if (!supabase) return

  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .eq('code', code)

  if (error) {
    console.warn('[ONLINE] Erro ao deletar sessao:', error.message)
  }
}

// --- Public API ---

/**
 * Save session data.
 *
 * LAN mode:  `sessionData` is an array of serialized sessions (all sessions written at once).
 * ONLINE mode: `sessionData` is a single serialized session object.
 *
 * @param {object|object[]} sessionData
 */
export async function saveSession(sessionData) {
  const config = getConfig()

  if (!config.isOnline) {
    // LAN mode — sessionData is an array of all sessions
    if (!Array.isArray(sessionData)) return
    try {
      await saveLanSessions(sessionData)
    } catch (error) {
      console.error('[LAN] Falha ao persistir sessoes:', error.message)
    }
    return
  }

  // ONLINE mode — sessionData is a single session object
  if (!sessionData || typeof sessionData !== 'object' || Array.isArray(sessionData)) return
  try {
    await saveOnlineSession(sessionData)
  } catch (error) {
    console.warn('[ONLINE] Falha ao persistir sessao:', error.message)
  }
}

/**
 * Load sessions from persistent storage.
 *
 * @returns {Promise<object[]>} Array of serialized session objects (ready for hydrateSession).
 */
export async function loadSessions() {
  const config = getConfig()

  if (!config.isOnline) {
    return loadLanSessions()
  }

  try {
    return await loadOnlineSessions()
  } catch (error) {
    console.warn('[ONLINE] Falha ao carregar sessoes:', error.message)
    return []
  }
}

/**
 * Delete a session by code.
 *
 * LAN mode: no-op (deletion handled by not saving ended sessions).
 * ONLINE mode: deletes from Supabase (cascade handles children).
 *
 * @param {string} code
 */
export async function deleteSession(code) {
  const config = getConfig()

  if (!config.isOnline) return

  try {
    await deleteOnlineSession(code)
  } catch (error) {
    console.warn('[ONLINE] Falha ao deletar sessao:', error.message)
  }
}