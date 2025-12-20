import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/cn'

type ChatMessage = {
  id: string
  user: string
  text: string
  createdAt: number
}

export function SessionChat({ sessionKey, className }: { sessionKey: string, className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState('Jogador')
  const listRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(`chat:${sessionKey}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[]
        setMessages(parsed)
      } catch {}
    }
    channelRef.current = new BroadcastChannel(`mestre-chat-${sessionKey}`)
    const ch = channelRef.current
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data as ChatMessage
      setMessages(prev => {
        const next = [...prev, msg].slice(-200)
        localStorage.setItem(`chat:${sessionKey}`, JSON.stringify(next))
        return next
      })
    }
    ch.addEventListener('message', onMessage)
    return () => {
      ch.removeEventListener('message', onMessage)
      ch.close()
    }
  }, [sessionKey])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const msg: ChatMessage = { id: crypto.randomUUID(), user, text, createdAt: Date.now() }
    setMessages(prev => {
      const next = [...prev, msg].slice(-200)
      localStorage.setItem(`chat:${sessionKey}`, JSON.stringify(next))
      return next
    })
    if (channelRef.current) channelRef.current.postMessage(msg)
    setInput('')
  }

  return (
    <div className={cn('flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden', className)} aria-label="Chat da Sessão">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <MessageSquare size={14} /> Chat em tempo real
        </div>
        <input
          type="text"
          aria-label="Nome do usuário"
          placeholder="Seu nome"
          className="text-xs bg-black/30 border border-white/10 rounded px-2 py-1 text-white w-32 focus:border-neon-purple outline-none"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
      </div>

      <div ref={listRef} className="flex-1 min-h-[140px] max-h-[240px] overflow-y-auto p-3 space-y-2 custom-scrollbar" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="text-xs text-text-muted text-center py-6">Sem mensagens.</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="text-xs bg-black/30 border border-white/10 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{m.user}</span>
                <span className="text-white/40">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-white whitespace-pre-wrap break-words">{m.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 p-3 border-t border-white/10">
        <input
          type="text"
          aria-label="Mensagem"
          placeholder="Escreva uma mensagem..."
          className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-neon-purple outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} aria-label="Enviar mensagem" className="p-2 bg-white/5 hover:bg-neon-purple/20 hover:text-neon-purple rounded-lg transition-colors border border-white/10">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

