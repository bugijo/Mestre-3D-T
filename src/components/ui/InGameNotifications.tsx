import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Notice = {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

export function InGameNotifications() {
  const [items, setItems] = useState<Notice[]>([])
  const liveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!liveRef.current) return
    liveRef.current.scrollTop = liveRef.current.scrollHeight
  }, [items])

  const add = (message: string, type: Notice['type'] = 'info') => {
    const notice: Notice = { id: crypto.randomUUID(), message, type }
    setItems(prev => [...prev, notice].slice(-5))
    setTimeout(() => {
      setItems(prev => prev.filter(n => n.id !== notice.id))
    }, 4000)
  }

  ;(window as any).notifyInGame = add

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] w-[300px] space-y-2" aria-live="polite" aria-atomic="false" ref={liveRef}>
      {items.map(n => (
        <div key={n.id} className={cn(
          'pointer-events-auto text-sm p-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-right-4 duration-300',
          n.type === 'success' && 'bg-neon-green/15 border-neon-green/40 text-neon-green',
          n.type === 'warning' && 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
          n.type === 'error' && 'bg-red-500/15 border-red-500/40 text-red-400',
          (!n.type || n.type === 'info') && 'bg-white/10 border-white/20 text-white'
        )}>
          {n.message}
        </div>
      ))}
    </div>
  )
}

