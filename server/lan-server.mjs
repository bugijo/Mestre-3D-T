/**
 * lan-server.mjs — Dual-mode (LAN + ONLINE) server for the RPG V1 session
 *
 * LAN mode:    serves Vite SPA + WebSocket, persists sessions to .data/lan-sessions.json
 * ONLINE mode: serves built SPA + WebSocket, persists sessions to Supabase (service role)
 *
 * Run:   node server/lan-server.mjs
 * Env:   APP_MODE=lan|online  (default: lan)
 */

import http from 'node:http'
import { networkInterfaces } from 'node:os'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, createReadStream } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import QRCode from 'qrcode'
import { saveSession, loadSessions, deleteSession, verifyToken, signUpUser, signInUser } from './persistence.mjs'
import { validateOrigin } from './origin-validator.mjs'
import { getConfig } from './app-config.mjs'

const rootDir = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'))
const config = getConfig()
const dataDir = join(rootDir, '.data')
const sessionsFile = join(dataDir, 'lan-sessions.json')
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MASTER_ACTIONS = new Set(['reward', 'grant', 'system', 'participant:approve', 'stage:present', 'session:end', 'session:state'])
const DEDUP_CLEANUP_INTERVAL = 1000 * 60 * 10 // 10 minutes
const sessions = new Map()
let persistTimer = null
const PERSIST_INTERVAL = 10_000
let persistIntervalTimer = null

function token(size = 24) {
  return randomBytes(size).toString('base64url')
}

function shortCode() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let value = ''
    const bytes = randomBytes(8)
    for (let index = 0; index < 8; index += 1) value += alphabet[bytes[index] % alphabet.length]
    if (!sessions.has(value)) return value
  }
  throw new Error('Não foi possível gerar um código de sessão único.')
}

function publicParticipant(participant, includeToken = false) {
  const result = {
    id: participant.id,
    playerName: participant.playerName,
    characterId: participant.characterId,
    status: participant.status,
    connected: participant.connected,
    joinedAt: participant.joinedAt,
    lastSeenAt: participant.lastSeenAt,
  }
  if (includeToken) result.reconnectToken = participant.reconnectToken
  return result
}

function serializableSession(session) {
  return {
    id: session.id,
    code: session.code,
    masterToken: session.masterToken,
    campaignId: session.campaignId,
    campaignTitle: session.campaignTitle,
    mode: session.mode,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    seq: session.seq,
    projection: session.projection,
    stage: session.stage,
    events: session.events.slice(-200),
    actionIds: Array.from(session.actionIds).slice(-500),
    participants: Array.from(session.participants.values()).map((participant) => ({ ...publicParticipant(participant, true), connected: false })),
  }
}

function hydrateSession(raw) {
  const session = {
    ...raw,
    participants: new Map((raw.participants || []).map((participant) => [participant.id, participant])),
    clients: new Set(),
    actionIds: new Set((raw.actionIds || [])),
  }
  // Also hydrate from events (backward compat + runtime)
  for (const event of (raw.events || [])) {
    if (event.actionId) session.actionIds.add(event.actionId)
  }
  return session
}

async function loadExistingSessions() {
  const rawSessions = await loadSessions()
  const cutoff = Date.now() - 1000 * 60 * 60 * 48
  for (const raw of Array.isArray(rawSessions) ? rawSessions : []) {
    if (raw.updatedAt >= cutoff && raw.status !== 'ended') sessions.set(raw.code, hydrateSession(raw))
  }
}

function schedulePersist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    try {
      const allSessions = Array.from(sessions.values()).map(serializableSession)
      if (config.isOnline) {
        for (const s of allSessions) {
          await saveSession(s)
        }
      } else {
        await saveSession(allSessions)
      }
    } catch (error) {
      console.error(`[${config.mode.toUpperCase()}] Falha ao persistir sessoes:`, error.message)
    }
  }, 150)
}

// Periodic persist every 10s in ONLINE mode for safety
function startPersistInterval() {
  if (persistIntervalTimer) return
  persistIntervalTimer = setInterval(async () => {
    if (config.isOnline && sessions.size > 0) {
      try {
        for (const s of Array.from(sessions.values()).map(serializableSession)) {
          await saveSession(s)
        }
      } catch (error) {
        console.error('[ONLINE] Falha no persist periódico:', error.message)
      }
    }
  }, PERSIST_INTERVAL)
}

function stopPersistInterval() {
  if (persistIntervalTimer) {
    clearInterval(persistIntervalTimer)
    persistIntervalTimer = null
  }
}

function cleanupStaleActionIds(session) {
  if (!session || !session.events || session.events.length === 0) return
  const cutoff = Date.now() - DEDUP_CLEANUP_INTERVAL
  const eventsInWindow = session.events.filter((event) => event.createdAt >= cutoff)
  const recentIds = new Set(eventsInWindow.map((event) => event.actionId).filter(Boolean))
  for (const id of session.actionIds) {
    if (!recentIds.has(id)) session.actionIds.delete(id)
  }
}

function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
}

function safeText(value, max = 500) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : ''
}

function relevantToParticipant(audience, participantId) {
  if (!audience || audience.kind === 'all') return true
  if (audience.kind === 'master') return false
  return Array.isArray(audience.participantIds) && audience.participantIds.includes(participantId)
}

function projectForParticipant(projection, participant) {
  if (!projection || !participant) return projection
  const ownCharacterId = participant.characterId
  return {
    ...projection,
    characters: Array.isArray(projection.characters)
      ? projection.characters.filter((character) => character.id === ownCharacterId)
      : [],
  }
}

function validatePlayerEvent(event, participant) {
  // Block player from using master-only event kinds
  if (MASTER_ACTIONS.has(event?.kind)) return false
  // If a characterId is included in the payload, it must match the participant's assigned character
  const targetId = event?.payload?.characterId
  if (targetId && targetId !== participant?.characterId) return false
  return true
}

function resumePayload(session, ws) {
  const isMaster = ws.meta?.role === 'master'
  const participant = isMaster ? null : session.participants.get(ws.meta?.participantId)
  const events = isMaster
    ? session.events
    : session.events.filter((event) => relevantToParticipant(event.audience, participant?.id))
  const stage = isMaster || relevantToParticipant(session.stage?.audience, participant?.id) ? session.stage : null
  return {
    type: 'session:resume',
    code: session.code,
    status: session.status,
    campaignTitle: session.campaignTitle,
    participant: participant ? publicParticipant(participant, true) : null,
    participants: isMaster ? Array.from(session.participants.values()).map((item) => publicParticipant(item)) : [],
    projection: isMaster ? session.projection : projectForParticipant(session.projection, participant),
    stage,
    events: events.slice(-100),
    seq: session.seq,
  }
}

function broadcastParticipants(session) {
  const message = {
    type: 'participant:list',
    participants: Array.from(session.participants.values()).map((participant) => publicParticipant(participant)),
  }
  for (const client of Array.from(session.clients)) if (client.meta?.role === 'master') send(client, message)
}

function broadcastProjection(session) {
  for (const client of Array.from(session.clients)) {
    if (client.meta?.role === 'master') continue
    const participant = session.participants.get(client.meta?.participantId)
    if (participant?.status !== 'approved') continue
    send(client, { type: 'session:state', projection: projectForParticipant(session.projection, participant), seq: session.seq })
  }
}

function broadcastStage(session) {
  for (const client of Array.from(session.clients)) {
    if (client.meta?.role === 'master') continue
    const participant = session.participants.get(client.meta?.participantId)
    if (participant?.status !== 'approved') continue
    if (relevantToParticipant(session.stage?.audience, participant.id)) {
      send(client, { type: 'stage:update', stage: session.stage, seq: session.seq })
    }
  }
}

function eventForClient(session, event, client) {
  if (client.meta?.role === 'master') return true
  const participant = session.participants.get(client.meta?.participantId)
  return participant?.status === 'approved' && relevantToParticipant(event.audience, participant.id)
}

function broadcastEvent(session, event) {
  for (const client of Array.from(session.clients)) if (eventForClient(session, event, client)) send(client, { type: 'event:new', event, seq: session.seq })
}

function attach(session, ws, meta) {
  ws.meta = { ...meta, sessionCode: session.code, messageTimes: [] }
  session.clients.add(ws)
}

function rateLimited(ws) {
  const now = Date.now()
  ws.meta.messageTimes = (ws.meta.messageTimes || []).filter((value) => now - value < 10_000)
  ws.meta.messageTimes.push(now)
  return ws.meta.messageTimes.length > 80
}

async function handleMessage(ws, message) {
  if (!message || typeof message.type !== 'string') return

  if (message.type === 'auth:login') {
    const token = message.token
    if (!token || typeof token !== 'string') {
      send(ws, { type: 'error', code: 'AUTH_FAILED', message: 'Token ausente.' })
      return
    }
    const user = await verifyToken(token)
    if (!user) {
      send(ws, { type: 'error', code: 'AUTH_FAILED', message: 'Token inválido.' })
      return
    }
    ws.meta = ws.meta || {}
    ws.meta.userId = user.id
    send(ws, { type: 'auth:ready', userId: user.id })
    return
  }

  if (message.type === 'host:create') {
    // ONLINE mode requires prior authentication
    if (config.isOnline && !ws.meta?.userId) {
      send(ws, { type: 'error', code: 'AUTH_REQUIRED', message: 'Autenticação necessária para criar sessão online.' })
      return
    }

    const resumeToken = safeText(message.resumeToken, 100)
    const resumed = resumeToken
      ? Array.from(sessions.values()).find((session) => session.masterToken === resumeToken && session.status !== 'ended')
      : null
    if (resumed) {
      attach(resumed, ws, { role: 'master' })
      send(ws, { type: 'host:ready', code: resumed.code, masterToken: resumed.masterToken, resumed: true })
      send(ws, resumePayload(resumed, ws))
      broadcastParticipants(resumed)
      return
    }

    const code = shortCode()
    const session = hydrateSession({
      id: token(12),
      code,
      masterToken: token(),
      masterUserId: ws.meta?.userId || null,
      campaignId: safeText(message.campaignId, 100),
      campaignTitle: safeText(message.campaignTitle, 160) || 'Sessão presencial',
      mode: 'in_person',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      seq: 0,
      projection: message.projection || null,
      stage: null,
      events: [],
      participants: [],
    })
    sessions.set(code, session)
    attach(session, ws, { role: 'master' })
    send(ws, { type: 'host:ready', code, masterToken: session.masterToken, resumed: false })
    send(ws, resumePayload(session, ws))
    schedulePersist()
    return
  }

  if (message.type === 'player:join') {
    const code = safeText(message.code, 12).toUpperCase()
    const session = sessions.get(code)
    if (!session || session.status !== 'active') {
      send(ws, { type: 'error', code: 'SESSION_NOT_FOUND', message: 'Sessão não encontrada ou encerrada.' })
      return
    }
    const reconnectToken = safeText(message.reconnectToken, 100)
    let participant = reconnectToken
      ? Array.from(session.participants.values()).find((item) => item.reconnectToken === reconnectToken)
      : null
    if (!participant) {
      participant = {
        id: token(10),
        reconnectToken: token(),
        playerName: safeText(message.playerName, 80) || 'Jogador',
        characterId: null,
        status: 'pending',
        connected: true,
        joinedAt: Date.now(),
        lastSeenAt: Date.now(),
      }
      session.participants.set(participant.id, participant)
    } else {
      // Close existing WS connection for this participant (P4: prevent multi-connection)
      for (const client of Array.from(session.clients)) {
        if (client.meta?.participantId === participant.id && client !== ws) {
          client.meta = { ...client.meta, replaced: true }
          client.close(1000, 'Replaced by new connection')
          session.clients.delete(client)
        }
      }
      participant.connected = true
      participant.lastSeenAt = Date.now()
      if (safeText(message.playerName, 80)) participant.playerName = safeText(message.playerName, 80)
    }
    attach(session, ws, { role: 'player', participantId: participant.id })
    session.updatedAt = Date.now()
    send(ws, { type: 'player:status', participant: publicParticipant(participant, true), campaignTitle: session.campaignTitle })
    if (participant.status === 'approved') send(ws, resumePayload(session, ws))
    broadcastParticipants(session)
    schedulePersist()
    return
  }

  const session = sessions.get(ws.meta?.sessionCode)
  if (!session || rateLimited(ws)) return
  const isMaster = ws.meta?.role === 'master'
  const participant = session.participants.get(ws.meta?.participantId)

  if (message.type === 'participant:approve') {
    if (!isMaster) {
      send(ws, { type: 'error', code: 'FORBIDDEN', message: 'Apenas o Mestre pode aprovar participantes.' })
      return
    }
    const target = session.participants.get(safeText(message.participantId, 100))
    if (!target) return
    target.status = message.approved === false ? 'declined' : 'approved'
    target.characterId = target.status === 'approved' ? safeText(message.characterId, 100) || null : null
    target.lastSeenAt = Date.now()
    session.seq += 1
    session.updatedAt = Date.now()
    for (const client of Array.from(session.clients)) {
      if (client.meta?.participantId !== target.id) continue
      send(client, { type: 'player:status', participant: publicParticipant(target, true), campaignTitle: session.campaignTitle })
      if (target.status === 'approved') send(client, resumePayload(session, client))
    }
    broadcastParticipants(session)
    schedulePersist()
    return
  }

  if (message.type === 'session:state') {
    if (!isMaster) {
      send(ws, { type: 'error', code: 'FORBIDDEN', message: 'Apenas o Mestre pode alterar o estado da sessão.' })
      return
    }
    session.projection = message.projection || null
    session.seq += 1
    session.updatedAt = Date.now()
    broadcastProjection(session)
    schedulePersist()
    return
  }

  if (message.type === 'stage:present') {
    if (!isMaster) {
      send(ws, { type: 'error', code: 'FORBIDDEN', message: 'Apenas o Mestre pode apresentar conteúdo no Palco.' })
      return
    }
    session.stage = {
      ...message.stage,
      id: safeText(message.stage?.id, 100) || token(10),
      title: safeText(message.stage?.title, 180),
      body: safeText(message.stage?.body, 4000),
      createdAt: Date.now(),
    }
    session.seq += 1
    session.updatedAt = Date.now()
    broadcastStage(session)
    schedulePersist()
    return
  }

  if (message.type === 'event:send' && (isMaster || participant?.status === 'approved')) {
    const actionId = safeText(message.actionId, 100) || token(10)
    // Check-then-add atomically (single-threaded event loop: no preemption between has and add)
    if (session.actionIds.has(actionId)) {
      send(ws, { type: 'event:ack', actionId, duplicate: true })
      return
    }
    session.actionIds.add(actionId)
    // Validate authorization for non-master
    if (!isMaster && !validatePlayerEvent(message.event, participant)) {
      send(ws, { type: 'error', code: 'FORBIDDEN', message: 'Ação não permitida para jogadores.' })
      return
    }
    const event = {
      id: token(10),
      actionId,
      kind: safeText(message.event?.kind, 40),
      payload: message.event?.payload ?? {},
      audience: isMaster ? message.event?.audience || { kind: 'all' } : message.event?.audience?.kind === 'master' ? { kind: 'master' } : { kind: 'all' },
      actor: isMaster
        ? { role: 'master', id: 'master', name: 'Mestre' }
        : { role: 'player', id: participant.id, name: participant.playerName, characterId: participant.characterId },
      createdAt: Date.now(),
    }
    session.events.push(event)
    session.events = session.events.slice(-200)
    session.seq += 1
    session.updatedAt = Date.now()
    broadcastEvent(session, event)
    send(ws, { type: 'event:ack', actionId, duplicate: false })
    // Cleanup stale actionIds periodically (every 50 events)
    if (session.events.length % 50 === 0) cleanupStaleActionIds(session)
    schedulePersist()
    return
  }

  if (message.type === 'session:end') {
    if (!isMaster) {
      send(ws, { type: 'error', code: 'FORBIDDEN', message: 'Apenas o Mestre pode encerrar a sessão.' })
      return
    }
    session.status = 'ended'
    session.seq += 1
    session.updatedAt = Date.now()
    for (const client of session.clients) send(client, { type: 'session:ended', code: session.code })
    schedulePersist()
  }
}

await loadExistingSessions()
startPersistInterval()

const production = config.nodeEnv === 'production' || process.argv.includes('--production')
let vite = null
if (!production) {
  const { createServer } = await import('vite')
  vite = await createServer({ root: rootDir, server: { middlewareMode: true }, appType: 'spa' })
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function setSecurityHeaders(response) {
  const isDev = response.req?.url?.startsWith('/api/') || !config.isOnline
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')

  // CSP - permissive enough for the app and WebSocket
  const self = "'self'"
  response.setHeader(
    'Content-Security-Policy',
    `default-src ${self}; ` +
    `script-src ${self} 'wasm-unsafe-eval'; ` +
    `style-src ${self} 'unsafe-inline'; ` +
    `img-src ${self} data: blob:; ` +
    `connect-src ${self} wss: https:; ` +
    `font-src ${self}; ` +
    `frame-ancestors ${self}; ` +
    `base-uri ${self}; ` +
    `form-action ${self}`
  )
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${config.port}`}`)
  setSecurityHeaders(response)

  // Health check
  if (url.pathname === '/api/health') {
    response.setHeader('content-type', 'application/json')
    const health = { ok: true, sessions: sessions.size, mode: config.mode, transport: 'websocket', uptime: process.uptime() }
    response.end(JSON.stringify(health))
    return
  }

  // Public config (no secrets)
  if (url.pathname === '/api/config') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ mode: config.mode, publicUrl: config.publicUrl }))
    return
  }

  // Auth endpoints (ONLINE mode only)
  if (config.isOnline) {
    // POST /api/auth/signup
    if (url.pathname === '/api/auth/signup' && request.method === 'POST') {
      let body = ''
      request.on('data', (chunk) => { body += chunk })
      request.on('end', async () => {
        response.setHeader('content-type', 'application/json')
        try {
          const { email, password } = JSON.parse(body)
          if (!email || !password || password.length < 6) {
            response.end(JSON.stringify({ error: 'Email e senha (mín 6 caracteres) são obrigatórios.' }))
            return
          }
          const { user, error } = await signUpUser(email, password)
          if (error) {
            response.end(JSON.stringify({ error }))
            return
          }
          response.end(JSON.stringify({ ok: true, user: { id: user.id, email: user.email } }))
        } catch {
          response.end(JSON.stringify({ error: 'JSON inválido.' }))
        }
      })
      return
    }

    // POST /api/auth/login
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      let body = ''
      request.on('data', (chunk) => { body += chunk })
      request.on('end', async () => {
        response.setHeader('content-type', 'application/json')
        try {
          const { email, password } = JSON.parse(body)
          if (!email || !password) {
            response.end(JSON.stringify({ error: 'Email e senha são obrigatórios.' }))
            return
          }
          const { session, error } = await signInUser(email, password)
          if (error || !session) {
            response.end(JSON.stringify({ error: error || 'Falha na autenticação.' }))
            return
          }
          response.end(JSON.stringify({ ok: true, access_token: session.access_token, user: { id: session.user.id, email: session.user.email } }))
        } catch {
          response.end(JSON.stringify({ error: 'JSON inválido.' }))
        }
      })
      return
    }
  }

  // Debug: check Supabase connectivity (no secrets returned)
  if (url.pathname === '/api/debug-supabase') {
    response.setHeader('content-type', 'application/json')
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } })
      const { data, error } = await client.from('live_sessions').select('code').limit(1)
      response.end(JSON.stringify({
        supabaseUrl: config.supabaseUrl ? 'configured' : 'missing',
        serviceRoleKey: config.supabaseServiceRoleKey ? 'configured (' + config.supabaseServiceRoleKey.length + ' chars)' : 'missing',
        publishableKey: config.supabasePublishableKey ? 'configured' : 'missing',
        testQuery: error ? { error: error.message } : { ok: true, rows: data.length }
      }))
    } catch (e) {
      response.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // Force persist (useful before restart)
  if (url.pathname === '/api/persist' && request.method === 'POST') {
    clearTimeout(persistTimer)
    response.setHeader('content-type', 'application/json')
    const errors = []
    const allSessions = Array.from(sessions.values()).map(serializableSession)
    if (config.isOnline) {
      for (const s of allSessions) {
        try {
          await saveSession(s)
        } catch (e) {
          errors.push({ code: s.code, error: e.message })
        }
      }
    } else {
      try {
        await saveSession(allSessions)
      } catch (e) {
        errors.push({ error: e.message })
      }
    }
    response.end(JSON.stringify({ ok: errors.length === 0, sessions: allSessions.length, errors: errors.length > 0 ? errors : undefined }))
    return
  }

  // LAN info — only in LAN mode
  if (url.pathname === '/api/lan-info') {
    if (config.isOnline) {
      response.writeHead(404).end('Nao disponivel em modo online')
      return
    }
    const addresses = []
    for (const entries of Object.values(networkInterfaces())) {
      for (const entry of entries || []) {
        if (entry.family === 'IPv4' && !entry.internal) addresses.push(`http://${entry.address}:${config.port}`)
      }
    }
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ host: config.host, port: config.port, addresses }))
    return
  }

  // QR code
  if (url.pathname === '/api/qr') {
    const text = safeText(url.searchParams.get('text'), 1000)
    if (!text) {
      response.writeHead(400).end('Texto ausente')
      return
    }
    response.setHeader('content-type', 'image/png')
    response.setHeader('cache-control', 'no-store')
    response.end(await QRCode.toBuffer(text, { width: 360, margin: 1, color: { dark: '#161311', light: '#eee8df' } }))
    return
  }

  if (vite) {
    vite.middlewares(request, response, () => {
      response.writeHead(404).end('Não encontrado')
    })
    return
  }

  const distDir = join(rootDir, 'dist')
  let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  let filePath = normalize(join(distDir, relativePath || 'index.html'))
  if (!filePath.startsWith(distDir)) {
    response.writeHead(403).end('Acesso negado')
    return
  }
  if (!existsSync(filePath) || url.pathname.endsWith('/')) filePath = join(distDir, 'index.html')
  if (!existsSync(filePath)) {
    response.writeHead(503).end('Build ausente. Execute npm run build antes de npm run serve:lan.')
    return
  }
  response.setHeader('content-type', contentTypes[extname(filePath)] || 'application/octet-stream')
  createReadStream(filePath).pipe(response)
})

const webSocketServer = new WebSocketServer({ server, path: '/ws', maxPayload: 2 * 1024 * 1024 })
webSocketServer.on('connection', (ws, req) => {
  // Origin validation
  const origin = req?.headers?.origin
  if (origin) {
    const host = req?.headers?.host || `localhost:${config.port}`
    if (!validateOrigin(origin, host)) {
      ws.close(4001, 'Origin not allowed')
      return
    }
  }
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
  ws.on('message', (raw) => {
    try {
      handleMessage(ws, JSON.parse(String(raw)))
    } catch (error) {
      send(ws, { type: 'error', code: 'INVALID_MESSAGE', message: 'Mensagem inválida.' })
      console.warn(`[${config.mode.toUpperCase()}] Mensagem rejeitada:`, error.message)
    }
  })
  ws.on('close', () => {
    const session = sessions.get(ws.meta?.sessionCode)
    if (!session) return
    session.clients.delete(ws)
    const participant = session.participants.get(ws.meta?.participantId)
    if (participant) {
      participant.connected = false
      participant.lastSeenAt = Date.now()
      broadcastParticipants(session)
      schedulePersist()
    }
  })
})

setInterval(() => {
  for (const ws of webSocketServer.clients) {
    if (ws.isAlive === false) {
      ws.terminate()
      continue
    }
    ws.isAlive = false
    ws.ping()
  }
}, 20_000).unref()

server.listen(config.port, config.host, () => {
  if (config.isOnline) {
    console.log(`\nDungeon Keeper V1 — sessao ONLINE`)
    console.log(`ONLINE: ${config.publicUrl}`)
    console.log(`WebSocket: ${config.publicUrl.replace(/^http/, 'ws')}/ws\n`)
    return
  }

  const addresses = []
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) if (entry.family === 'IPv4' && !entry.internal) addresses.push(`http://${entry.address}:${config.port}`)
  }
  console.log(`\nDungeon Keeper V1 — sessao presencial (LAN)`)
  console.log(`Mestre: http://localhost:${config.port}/session`)
  for (const address of addresses) console.log(`LAN: ${address}`)
  console.log(`WebSocket: ws://0.0.0.0:${config.port}/ws\n`)
})

async function shutdown() {
  clearTimeout(persistTimer)
  // Persist all sessions before shutdown
  try {
    const allSessions = Array.from(sessions.values()).map(serializableSession)
    if (config.isOnline) {
      for (const s of allSessions) {
        await saveSession(s)
      }
    } else {
      await mkdir(dataDir, { recursive: true })
      await writeFile(sessionsFile, JSON.stringify(allSessions, null, 2), 'utf8')
    }
  } catch (error) {
    console.error(`[${config.mode.toUpperCase()}] Falha ao salvar sessoes no encerramento:`, error.message)
  }
  await vite?.close()
  webSocketServer.close()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)