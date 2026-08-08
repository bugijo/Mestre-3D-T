import http from 'node:http'
import { networkInterfaces } from 'node:os'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, createReadStream } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import QRCode from 'qrcode'

const rootDir = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'))
const dataDir = join(rootDir, '.data')
const sessionsFile = join(dataDir, 'lan-sessions.json')
const host = process.env.LAN_HOST || '0.0.0.0'
const port = Number(process.env.LAN_PORT || 4173)
const production = process.argv.includes('--production')
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const sessions = new Map()
let persistTimer = null

function token(size = 24) {
  return randomBytes(size).toString('base64url')
}

function shortCode() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let value = ''
    const bytes = randomBytes(6)
    for (let index = 0; index < 6; index += 1) value += alphabet[bytes[index] % alphabet.length]
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
    participants: Array.from(session.participants.values()).map((participant) => ({ ...publicParticipant(participant, true), connected: false })),
  }
}

function hydrateSession(raw) {
  return {
    ...raw,
    participants: new Map((raw.participants || []).map((participant) => [participant.id, participant])),
    clients: new Set(),
    actionIds: new Set((raw.events || []).map((event) => event.actionId).filter(Boolean)),
  }
}

async function loadSessions() {
  try {
    const parsed = JSON.parse(await readFile(sessionsFile, 'utf8'))
    const cutoff = Date.now() - 1000 * 60 * 60 * 48
    for (const raw of Array.isArray(parsed) ? parsed : []) {
      if (raw.updatedAt >= cutoff && raw.status !== 'ended') sessions.set(raw.code, hydrateSession(raw))
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn('[LAN] Sessões anteriores não puderam ser carregadas:', error.message)
  }
}

function schedulePersist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    try {
      await mkdir(dataDir, { recursive: true })
      await writeFile(sessionsFile, JSON.stringify(Array.from(sessions.values()).map(serializableSession), null, 2), 'utf8')
    } catch (error) {
      console.error('[LAN] Falha ao persistir sessões:', error.message)
    }
  }, 150)
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
  for (const client of session.clients) if (client.meta?.role === 'master') send(client, message)
}

function broadcastProjection(session) {
  for (const client of session.clients) {
    if (client.meta?.role === 'master') continue
    const participant = session.participants.get(client.meta?.participantId)
    if (participant?.status !== 'approved') continue
    send(client, { type: 'session:state', projection: projectForParticipant(session.projection, participant), seq: session.seq })
  }
}

function broadcastStage(session) {
  for (const client of session.clients) {
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
  for (const client of session.clients) if (eventForClient(session, event, client)) send(client, { type: 'event:new', event, seq: session.seq })
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

function handleMessage(ws, message) {
  if (!message || typeof message.type !== 'string') return

  if (message.type === 'host:create') {
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

  if (message.type === 'participant:approve' && isMaster) {
    const target = session.participants.get(safeText(message.participantId, 100))
    if (!target) return
    target.status = message.approved === false ? 'declined' : 'approved'
    target.characterId = target.status === 'approved' ? safeText(message.characterId, 100) || null : null
    target.lastSeenAt = Date.now()
    session.seq += 1
    session.updatedAt = Date.now()
    for (const client of session.clients) {
      if (client.meta?.participantId !== target.id) continue
      send(client, { type: 'player:status', participant: publicParticipant(target, true), campaignTitle: session.campaignTitle })
      if (target.status === 'approved') send(client, resumePayload(session, client))
    }
    broadcastParticipants(session)
    schedulePersist()
    return
  }

  if (message.type === 'session:state' && isMaster) {
    session.projection = message.projection || null
    session.seq += 1
    session.updatedAt = Date.now()
    broadcastProjection(session)
    schedulePersist()
    return
  }

  if (message.type === 'stage:present' && isMaster) {
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
    if (session.actionIds.has(actionId)) {
      send(ws, { type: 'event:ack', actionId, duplicate: true })
      return
    }
    session.actionIds.add(actionId)
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
    schedulePersist()
    return
  }

  if (message.type === 'session:end' && isMaster) {
    session.status = 'ended'
    session.seq += 1
    session.updatedAt = Date.now()
    for (const client of session.clients) send(client, { type: 'session:ended', code: session.code })
    schedulePersist()
  }
}

await loadSessions()

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

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${port}`}`)
  if (url.pathname === '/api/health') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ ok: true, sessions: sessions.size, transport: 'websocket' }))
    return
  }
  if (url.pathname === '/api/lan-info') {
    const addresses = []
    for (const entries of Object.values(networkInterfaces())) {
      for (const entry of entries || []) {
        if (entry.family === 'IPv4' && !entry.internal) addresses.push(`http://${entry.address}:${port}`)
      }
    }
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ host, port, addresses }))
    return
  }
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

// A projection can legitimately contain a reviewed map or portrait. Keep a hard
// ceiling, but leave enough room for the 10 MB upload policy used by the UI.
const webSocketServer = new WebSocketServer({ server, path: '/ws', maxPayload: 12 * 1024 * 1024 })
webSocketServer.on('connection', (ws) => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
  ws.on('message', (raw) => {
    try {
      handleMessage(ws, JSON.parse(String(raw)))
    } catch (error) {
      send(ws, { type: 'error', code: 'INVALID_MESSAGE', message: 'Mensagem inválida.' })
      console.warn('[LAN] Mensagem rejeitada:', error.message)
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

server.listen(port, host, () => {
  const addresses = []
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) if (entry.family === 'IPv4' && !entry.internal) addresses.push(`http://${entry.address}:${port}`)
  }
  console.log(`\nDungeon Keeper V1 — sessão presencial`)
  console.log(`Mestre: http://localhost:${port}/session`)
  for (const address of addresses) console.log(`LAN: ${address}`)
  console.log(`WebSocket: ws://0.0.0.0:${port}/ws\n`)
})

async function shutdown() {
  clearTimeout(persistTimer)
  await mkdir(dataDir, { recursive: true })
  await writeFile(sessionsFile, JSON.stringify(Array.from(sessions.values()).map(serializableSession), null, 2), 'utf8')
  await vite?.close()
  webSocketServer.close()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
