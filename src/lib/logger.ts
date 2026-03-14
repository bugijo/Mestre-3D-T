type LogLevel = 'info' | 'warn' | 'error'

export type LogEntry = {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  source: string
  context?: string
}

const STORAGE_KEY = 'mestre3dt:logs:v1'
const MAX_ENTRIES = 120

let entries: LogEntry[] | null = null
const listeners = new Set<(entries: LogEntry[]) => void>()

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function safeContext(context: unknown) {
  if (context == null) return undefined
  try {
    return JSON.stringify(context, (_key, value) => {
      if (typeof value === 'string' && value.length > 300) return `${value.slice(0, 297)}...`
      return value
    })
  } catch {
    return '[context-unserializable]'
  }
}

function hydrate() {
  if (entries) return entries
  if (typeof window === 'undefined') {
    entries = []
    return entries
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    entries = raw ? (JSON.parse(raw) as LogEntry[]) : []
  } catch {
    entries = []
  }
  return entries
}

function persist(next: LogEntry[]) {
  entries = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignora falha de persistencia para nao quebrar o app.
    }
  }
  listeners.forEach((listener) => listener(next))
}

export function logEvent(level: LogLevel, source: string, message: string, context?: unknown) {
  const nextEntry: LogEntry = {
    id: createId(),
    timestamp: Date.now(),
    level,
    message,
    source,
    context: safeContext(context),
  }

  const current = hydrate()
  const next = [nextEntry, ...current].slice(0, MAX_ENTRIES)
  persist(next)
  return nextEntry
}

export function logInfo(source: string, message: string, context?: unknown) {
  return logEvent('info', source, message, context)
}

export function logWarn(source: string, message: string, context?: unknown) {
  return logEvent('warn', source, message, context)
}

export function logError(source: string, error: unknown, context?: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Erro desconhecido'
  return logEvent('error', source, message, context)
}

export function getLogEntries() {
  return [...hydrate()]
}

export function clearLogEntries() {
  persist([])
}

export function subscribeToLogs(listener: (entries: LogEntry[]) => void) {
  listeners.add(listener)
  listener(getLogEntries())
  return () => listeners.delete(listener)
}
