import { useEffect, useMemo, useRef, useState } from 'react'
import { createId } from '@/lib/id'

export type SharedSessionFeedEntry = {
  id: string
  author: string
  createdAt: number
  text: string
  tone: 'info' | 'warning' | 'success'
  type: 'announcement' | 'request' | 'system'
}

type Payload = {
  entry: SharedSessionFeedEntry
  key: string
  source: string
}

function storageKey(sessionKey: string) {
  return `table-feed:${sessionKey}`
}

function loadEntries(sessionKey: string): SharedSessionFeedEntry[] {
  const raw = localStorage.getItem(storageKey(sessionKey))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as SharedSessionFeedEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useSharedSessionFeed(sessionKey: string) {
  const [entries, setEntries] = useState<SharedSessionFeedEntry[]>([])
  const channelRef = useRef<BroadcastChannel | null>(null)
  const sourceRef = useRef(createId())

  useEffect(() => {
    const saved = loadEntries(sessionKey)
    setEntries(saved)
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(`mestre-3dt-feed-${sessionKey}`)
    channelRef.current = channel
    const onMessage = (event: MessageEvent<Payload>) => {
      if (!event.data || event.data.source === sourceRef.current || event.data.key !== sessionKey) return
      setEntries((current) => {
        const next = [event.data.entry, ...current].slice(0, 100)
        localStorage.setItem(storageKey(sessionKey), JSON.stringify(next))
        return next
      })
    }
    channel.addEventListener('message', onMessage as EventListener)
    return () => {
      channel.removeEventListener('message', onMessage as EventListener)
      channel.close()
      channelRef.current = null
    }
  }, [sessionKey])

  const api = useMemo(
    () => ({
      entries,
      publish(entry: Omit<SharedSessionFeedEntry, 'id' | 'createdAt'>) {
        const nextEntry: SharedSessionFeedEntry = {
          ...entry,
          id: createId(),
          createdAt: Date.now(),
        }
        setEntries((current) => {
          const next = [nextEntry, ...current].slice(0, 100)
          localStorage.setItem(storageKey(sessionKey), JSON.stringify(next))
          return next
        })
        channelRef.current?.postMessage({
          entry: nextEntry,
          key: sessionKey,
          source: sourceRef.current,
        } satisfies Payload)
        return nextEntry
      },
      clear() {
        localStorage.removeItem(storageKey(sessionKey))
        setEntries([])
      },
    }),
    [entries, sessionKey],
  )

  return api
}
