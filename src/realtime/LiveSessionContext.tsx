import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createId } from '@/lib/id'
import type {
  ConnectionStatus,
  HostSessionInput,
  JoinSessionInput,
  JoinStatus,
  LiveAudience,
  LiveEvent,
  LiveParticipant,
  SessionProjection,
  StagePresentation,
} from './protocol'

const MASTER_TOKEN_KEY = 'dk-live:master-token'
const MASTER_CODE_KEY = 'dk-live:master-code'
const PLAYER_TOKEN_PREFIX = 'dk-live:player-token:'

type LiveSessionApi = {
  connectionStatus: ConnectionStatus
  joinStatus: JoinStatus
  code: string | null
  campaignTitle: string | null
  isMaster: boolean
  participant: LiveParticipant | null
  participants: LiveParticipant[]
  projection: SessionProjection | null
  stage: StagePresentation | null
  events: LiveEvent[]
  error: string | null
  hostSession: (input: HostSessionInput) => void
  joinSession: (input: JoinSessionInput) => void
  approveParticipant: (participantId: string, approved: boolean, characterId?: string | null) => void
  syncProjection: (projection: SessionProjection) => void
  presentStage: (stage: StagePresentation) => void
  sendEvent: (kind: string, payload: Record<string, unknown>, audience?: LiveAudience, actionId?: string) => string
  endSession: () => void
  disconnect: () => void
}

const LiveSessionContext = createContext<LiveSessionApi | null>(null)

function socketUrl() {
  // Backward compat: VITE_LAN_WS_URL → VITE_WS_URL → same-origin
  const explicit =
    (import.meta.env.VITE_WS_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_LAN_WS_URL as string | undefined)?.trim()
  if (explicit) return explicit
  // Same-origin: works for both LAN and ONLINE
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

function actionId() {
  return createId()
}

export function LiveSessionProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline')
  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle')
  const [code, setCode] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState<string | null>(null)
  const [isMaster, setIsMaster] = useState(false)
  const [participant, setParticipant] = useState<LiveParticipant | null>(null)
  const [participants, setParticipants] = useState<LiveParticipant[]>([])
  const [projection, setProjection] = useState<SessionProjection | null>(null)
  const [stage, setStage] = useState<StagePresentation | null>(null)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const authRef = useRef<{ role: 'master'; input: HostSessionInput; token?: string } | { role: 'player'; input: JoinSessionInput; token?: string } | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const intentionalCloseRef = useRef(false)

  const send = useCallback((message: unknown) => {
    const socket = socketRef.current
    if (socket?.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(message))
    return true
  }, [])

  const connect = useCallback((auth: NonNullable<typeof authRef.current>, reconnecting = false) => {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return
    authRef.current = auth
    intentionalCloseRef.current = false
    setConnectionStatus(reconnecting ? 'reconnecting' : 'connecting')
    setError(null)
    const socket = new WebSocket(socketUrl())
    socketRef.current = socket

    socket.addEventListener('open', () => {
      reconnectAttemptsRef.current = 0
      setConnectionStatus('connected')
      if (auth.role === 'master') {
        socket.send(JSON.stringify({ type: 'host:create', ...auth.input, resumeToken: auth.token }))
      } else {
        socket.send(JSON.stringify({ type: 'player:join', ...auth.input, reconnectToken: auth.token }))
      }
    })

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as Record<string, any>
      if (message.type === 'host:ready') {
        const nextCode = String(message.code)
        setCode(nextCode)
        setIsMaster(true)
        setJoinStatus('approved')
        localStorage.setItem(MASTER_TOKEN_KEY, String(message.masterToken))
        localStorage.setItem(MASTER_CODE_KEY, nextCode)
        authRef.current = { ...authRef.current!, token: String(message.masterToken) } as typeof authRef.current
      } else if (message.type === 'player:status') {
        const next = message.participant as LiveParticipant
        setParticipant(next)
        setCode(auth.role === 'player' ? auth.input.code.toUpperCase() : code)
        setCampaignTitle(String(message.campaignTitle || 'Sessão presencial'))
        setJoinStatus(next.status)
        if (next.reconnectToken && auth.role === 'player') {
          localStorage.setItem(`${PLAYER_TOKEN_PREFIX}${auth.input.code.toUpperCase()}`, next.reconnectToken)
          authRef.current = { ...authRef.current!, token: next.reconnectToken } as typeof authRef.current
        }
      } else if (message.type === 'participant:list') {
        setParticipants(message.participants as LiveParticipant[])
      } else if (message.type === 'session:resume') {
        setCode(String(message.code))
        setCampaignTitle(String(message.campaignTitle || 'Sessão presencial'))
        if (message.participant) {
          setParticipant(message.participant as LiveParticipant)
          setJoinStatus((message.participant as LiveParticipant).status)
        }
        if (Array.isArray(message.participants)) setParticipants(message.participants as LiveParticipant[])
        setProjection((message.projection as SessionProjection | null) ?? null)
        setStage((message.stage as StagePresentation | null) ?? null)
        setEvents(Array.isArray(message.events) ? (message.events as LiveEvent[]) : [])
      } else if (message.type === 'session:state') {
        setProjection((message.projection as SessionProjection | null) ?? null)
      } else if (message.type === 'stage:update') {
        setStage((message.stage as StagePresentation | null) ?? null)
      } else if (message.type === 'event:new') {
        const next = message.event as LiveEvent
        setEvents((current) => current.some((entry) => entry.id === next.id) ? current : [...current, next].slice(-200))
      } else if (message.type === 'session:ended') {
        setJoinStatus('idle')
        setStage(null)
        setError('A sessão foi encerrada pelo Mestre.')
      } else if (message.type === 'error') {
        setConnectionStatus('error')
        setError(String(message.message || 'Falha na sessão LAN.'))
      }
    })

    socket.addEventListener('close', () => {
      socketRef.current = null
      if (intentionalCloseRef.current || !authRef.current) {
        setConnectionStatus('offline')
        return
      }
      setConnectionStatus('reconnecting')
      const delay = Math.min(10_000, 500 * 2 ** reconnectAttemptsRef.current) * (0.5 + Math.random() * 0.5)
      reconnectAttemptsRef.current += 1
      reconnectTimerRef.current = window.setTimeout(() => {
        if (authRef.current) connect(authRef.current, true)
      }, delay)
    })

    socket.addEventListener('error', () => {
      setError('Servidor LAN indisponível. Inicie com npm run dev:lan.')
    })
  }, [code])

  useEffect(() => () => {
    intentionalCloseRef.current = true
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
    socketRef.current?.close()
  }, [])

  const api = useMemo<LiveSessionApi>(() => ({
    connectionStatus,
    joinStatus,
    code,
    campaignTitle,
    isMaster,
    participant,
    participants,
    projection,
    stage,
    events,
    error,
    hostSession(input) {
      setCampaignTitle(input.campaignTitle)
      setIsMaster(true)
      const savedToken = localStorage.getItem(MASTER_TOKEN_KEY) || undefined
      connect({ role: 'master', input, token: savedToken })
    },
    joinSession(input) {
      const normalized = { ...input, code: input.code.replace(/[^a-z0-9]/gi, '').toUpperCase() }
      setCode(normalized.code)
      setIsMaster(false)
      const savedToken = localStorage.getItem(`${PLAYER_TOKEN_PREFIX}${normalized.code}`) || undefined
      connect({ role: 'player', input: normalized, token: savedToken })
    },
    approveParticipant(participantId, approved, characterId) {
      send({ type: 'participant:approve', participantId, approved, characterId })
    },
    syncProjection(nextProjection) {
      setProjection(nextProjection)
      send({ type: 'session:state', projection: nextProjection })
    },
    presentStage(nextStage) {
      setStage(nextStage)
      send({ type: 'stage:present', stage: nextStage })
    },
    sendEvent(kind, payload, audience = { kind: 'all' }, explicitActionId) {
      const id = explicitActionId || actionId()
      send({ type: 'event:send', actionId: id, event: { kind, payload, audience } })
      return id
    },
    endSession() {
      send({ type: 'session:end' })
    },
    disconnect() {
      intentionalCloseRef.current = true
      authRef.current = null
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
      socketRef.current = null
      setConnectionStatus('offline')
      setJoinStatus('idle')
    },
  }), [campaignTitle, code, connect, connectionStatus, error, events, isMaster, joinStatus, participant, participants, projection, send, stage])

  return <LiveSessionContext.Provider value={api}>{children}</LiveSessionContext.Provider>
}

export function useLiveSession() {
  const context = useContext(LiveSessionContext)
  if (!context) throw new Error('LiveSessionProvider ausente')
  return context
}

export function useOptionalLiveSession() {
  return useContext(LiveSessionContext)
}
