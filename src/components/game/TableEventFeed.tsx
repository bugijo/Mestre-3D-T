import { useMemo, useState } from 'react'
import { Megaphone, Send, Siren, Sparkles } from 'lucide-react'
import { useSharedSessionFeed } from '@/hooks/useSharedSessionFeed'
import { cn } from '@/lib/cn'

const TONE_STYLES = {
  info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
} as const

export function TableEventFeed({
  sessionKey,
  defaultAuthor,
  role,
  className,
}: {
  sessionKey: string
  defaultAuthor: string
  role: 'master' | 'player'
  className?: string
}) {
  const { entries, publish } = useSharedSessionFeed(sessionKey)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'warning' | 'success'>(role === 'master' ? 'info' : 'warning')

  const presets = useMemo(
    () =>
      role === 'master'
        ? [
            { label: 'Anunciar pista', text: 'Nova pista liberada para o grupo.', tone: 'info' as const },
            { label: 'Subir tensão', text: 'A tensão da cena aumentou. Preparem-se.', tone: 'warning' as const },
            { label: 'Confirmar sucesso', text: 'A ação foi bem-sucedida. Avancem.', tone: 'success' as const },
          ]
        : [
            { label: 'Pedir ajuda', text: 'Preciso de apoio do mestre nesta ação.', tone: 'warning' as const },
            { label: 'Informar plano', text: 'Vou tentar uma abordagem diferente.', tone: 'info' as const },
            { label: 'Reagir', text: 'Meu personagem reage imediatamente ao evento.', tone: 'success' as const },
          ],
    [role],
  )

  return (
    <section className={cn('rounded-2xl border border-white/10 bg-white/5 p-4', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-white">
            <Megaphone size={14} className="text-secondary" />
            Quadro da Mesa
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            {role === 'master'
              ? 'Envie anúncios, dicas e alertas para todos.'
              : 'Envie pedidos rápidos e acompanhe anúncios do mestre.'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setMessage(preset.text)
              setTone(preset.tone)
            }}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white transition hover:border-white/20 hover:bg-black/40"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <select
          aria-label="Tom do aviso"
          value={tone}
          onChange={(event) => setTone(event.target.value as 'info' | 'warning' | 'success')}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="info">Informativo</option>
          <option value="warning">Urgente</option>
          <option value="success">Positivo</option>
        </select>
        <input
          type="text"
          aria-label="Mensagem da mesa"
          placeholder={role === 'master' ? 'Publicar anúncio para a mesa...' : 'Enviar mensagem para o mestre...'}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && message.trim()) {
              publish({
                author: defaultAuthor,
                text: message.trim(),
                tone,
                type: role === 'master' ? 'announcement' : 'request',
              })
              setMessage('')
            }
          }}
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-secondary/50"
        />
        <button
          type="button"
          onClick={() => {
            if (!message.trim()) return
            publish({
              author: defaultAuthor,
              text: message.trim(),
              tone,
              type: role === 'master' ? 'announcement' : 'request',
            })
            setMessage('')
          }}
          className="rounded-xl border border-white/10 bg-secondary/20 px-4 py-2 text-white transition hover:bg-secondary/30"
        >
          <Send size={16} />
        </button>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-text-muted">
            Nenhum aviso compartilhado nesta sessão.
          </div>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className={cn('rounded-xl border px-3 py-3', TONE_STYLES[entry.tone])}>
              <div className="mb-1 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em]">
                <span className="flex items-center gap-1">
                  {entry.type === 'announcement' ? <Megaphone size={12} /> : entry.type === 'request' ? <Siren size={12} /> : <Sparkles size={12} />}
                  {entry.author}
                </span>
                <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm leading-relaxed">{entry.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
