import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Radio, RefreshCw, ShieldCheck, UserCheck, UserX, Wifi, WifiOff } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { useOptionalLiveSession } from '@/realtime/LiveSessionContext'
import { createSessionProjection } from '@/realtime/projection'
import { cn } from '@/lib/cn'
import { safeClipboard } from '@/lib/clipboard'

const SYNC_DEBOUNCE_MS = 500

type LanInfo = { addresses: string[]; port: number }

export function LiveSessionHostPanel() {
  const store = useAppStore()
  const live = useOptionalLiveSession()
  const [lanInfo, setLanInfo] = useState<LanInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const processedEvents = useRef(new Set<string>())
  const lastSyncedProjectionRef = useRef<string | null>(null)
  const pendingSyncRef = useRef(false)
  const campaign = store.state.campaigns.find((entry) => entry.id === store.state.session.activeCampaignId) ?? null
  const projection = useMemo(() => createSessionProjection(store.state), [store.state])
  const characters = projection.characters.filter((character) => character.type === 'PLAYER' || character.type === 'COMPANION')

  useEffect(() => {
    fetch('/api/lan-info')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('LAN indisponível')))
      .then((value: LanInfo) => setLanInfo(value))
      .catch(() => setLanInfo(null))
  }, [live?.connectionStatus])

  useEffect(() => {
    if (!live?.isMaster || !live.code || live.connectionStatus !== 'connected') return
    if (pendingSyncRef.current) return
    const projectionJson = JSON.stringify(projection)
    if (projectionJson === lastSyncedProjectionRef.current) return
    pendingSyncRef.current = true
    const timeout = window.setTimeout(() => {
      pendingSyncRef.current = false
      const currentJson = JSON.stringify(projection)
      if (currentJson === lastSyncedProjectionRef.current) return
      lastSyncedProjectionRef.current = currentJson
      live.syncProjection(projection)
    }, SYNC_DEBOUNCE_MS)
    return () => {
      pendingSyncRef.current = false
      window.clearTimeout(timeout)
    }
  }, [live, projection])

  useEffect(() => {
    if (!live?.isMaster) return
    for (const event of live.events) {
      if (processedEvents.current.has(event.id)) continue
      processedEvents.current.add(event.id)
      if (processedEvents.current.size > 1000) {
        const toRemove = Array.from(processedEvents.current).slice(0, processedEvents.current.size - 500)
        for (const id of toRemove) processedEvents.current.delete(id)
      }
      if (event.kind === 'dice') {
        store.addDiceLog({
          id: event.id,
          createdAt: event.createdAt,
          sessionId: live.code || 'local',
          playerId: event.actor.id,
          playerName: event.actor.name,
          characterId: event.actor.characterId ?? null,
          expression: String(event.payload.expression || ''),
          rolls: Array.isArray(event.payload.rolls) ? event.payload.rolls.map(Number) : [],
          total: Number(event.payload.total || 0),
          visibility: event.audience.kind === 'master' ? 'master' : 'public',
          context: String(event.payload.context || ''),
        })
      } else if (event.kind === 'feedback') {
        store.submitSessionFeedback({
          sessionId: live.code || 'local',
          userId: event.actor.id,
          rating: (event.payload.rating as 'excellent' | 'good' | 'neutral' | 'bad') || 'neutral',
          tags: Array.isArray(event.payload.tags) ? event.payload.tags as Array<'narrative' | 'combat' | 'pace' | 'immersion'> : [],
          comment: String(event.payload.comment || ''),
        })
      } else if (event.kind === 'consent') {
        store.setRecordingConsent({
          sessionId: live.code || 'local',
          participantId: event.actor.id,
          audio: Boolean(event.payload.audio),
          screen: Boolean(event.payload.screen),
          consentedAt: event.payload.accepted ? event.createdAt : null,
          revokedAt: event.payload.accepted ? null : event.createdAt,
        })
      }
    }
  }, [live?.code, live?.events, live?.isMaster, store])

  if (!live) return null

  const baseAddress = lanInfo?.addresses[0] || window.location.origin
  const joinUrl = live.code ? `${baseAddress}/join/${live.code}` : null
  const pending = live.participants.filter((participant) => participant.status === 'pending')
  const approved = live.participants.filter((participant) => participant.status === 'approved')

  const host = () => {
    if (!campaign) return
    if (!store.state.session.isActive) store.startSession()
    live.hostSession({ campaignId: campaign.id, campaignTitle: campaign.title, projection })
    store.logCriticalAction({ actorId: 'demo-master', action: 'session.host', targetType: 'campaign', targetId: campaign.id, detail: 'Sessão LAN presencial iniciada.' })
  }

  return (
    <section className="app-panel p-4" aria-label="Conexão presencial LAN">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#cfa3a3]">
            <Radio size={14} /> Mesa presencial LAN
          </div>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            WebSocket real entre aparelhos, aprovação pelo Mestre e retomada automática após queda de conexão.
          </p>
        </div>
        {!live.code ? (
          <button type="button" onClick={host} disabled={!campaign || live.connectionStatus === 'connecting'} className="btn-primary">
            {live.connectionStatus === 'connecting' ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
            Abrir mesa na rede
          </button>
        ) : (
          <div className={cn('rounded-full border px-3 py-1 text-xs', live.connectionStatus === 'connected' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100')}>
            {live.connectionStatus === 'connected' ? 'LAN conectada' : 'Reconectando…'}
          </div>
        )}
      </div>

      {live.error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          <WifiOff size={15} /> {live.error}
        </div>
      ) : null}

      {live.code && joinUrl ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
          <div className="rounded-2xl bg-[#eee8df] p-3">
            <img src={`/api/qr?text=${encodeURIComponent(joinUrl)}`} alt={`QR Code para entrar na sessão ${live.code}`} className="aspect-square w-full" />
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <div className="rounded-2xl border border-[#985259]/35 bg-[#985259]/10 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Código</div>
                <div className="mt-1 font-mono text-3xl font-bold tracking-[0.18em] text-white">{live.code}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Endereço para os celulares</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">{joinUrl}</span>
                  <button
                    type="button"
                    aria-label="Copiar endereço da sessão"
                    onClick={async () => {
                      await safeClipboard(joinUrl)
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 1500)
                    }}
                    className="rounded-lg border border-white/10 p-2 text-text-muted hover:text-white"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-muted">
                  <span>Pedidos de entrada</span><span>{pending.length}</span>
                </div>
                <div className="space-y-2">
                  {pending.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-text-muted">Aguardando jogadores.</div>
                  ) : pending.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-2 text-sm font-semibold text-white">{entry.playerName}</div>
                      <select
                        aria-label={`Personagem de ${entry.playerName}`}
                        value={assignments[entry.id] || ''}
                        onChange={(event) => setAssignments((current) => ({ ...current, [entry.id]: event.target.value }))}
                        className="field mb-2"
                      >
                        <option value="">Escolha o personagem</option>
                        {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!assignments[entry.id]}
                          onClick={() => {
                            live.approveParticipant(entry.id, true, assignments[entry.id])
                            store.logCriticalAction({ actorId: 'demo-master', action: 'participant.approve', targetType: 'participant', targetId: entry.id, detail: `${entry.playerName} aprovado.` })
                          }}
                          className="flex-1 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100 disabled:opacity-40"
                        ><UserCheck size={14} className="mr-1 inline" /> Aprovar</button>
                        <button type="button" onClick={() => live.approveParticipant(entry.id, false)} className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-100"><UserX size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-muted">
                  <span>Na mesa</span><span>{approved.length}</span>
                </div>
                <div className="space-y-2">
                  {approved.map((entry) => {
                    const character = characters.find((item) => item.id === entry.characterId)
                    return (
                      <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                        <div><div className="text-sm text-white">{entry.playerName}</div><div className="text-xs text-text-muted">{character?.name || 'Sem personagem'}</div></div>
                        <span className={cn('h-2.5 w-2.5 rounded-full', entry.connected ? 'bg-emerald-400' : 'bg-amber-400')} title={entry.connected ? 'Conectado' : 'Reconectando'} />
                      </div>
                    )
                  })}
                  {approved.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-text-muted">Nenhum jogador aprovado.</div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {live.code ? <div className="mt-4 flex items-center gap-2 text-xs text-text-muted"><ShieldCheck size={14} /> Notas privadas e segredos não são enviados aos jogadores.</div> : null}
    </section>
  )
}
