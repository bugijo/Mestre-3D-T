import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Backpack, Check, Dice5, Heart, Pause, Play, Radio, ShieldAlert, Sparkles, Swords, Volume2, Wifi, WifiOff, Zap } from 'lucide-react'
import { useOptionalLiveSession } from '@/realtime/LiveSessionContext'
import type { StagePresentation } from '@/realtime/protocol'
import { getRuleset } from '@/rulesets/registry'
import { cn } from '@/lib/cn'

const PLAYER_NAME_KEY = 'dk-live:player-name'

export function LivePlayerPage() {
  const { code: routeCode = '' } = useParams<{ code: string }>()
  const live = useOptionalLiveSession()
  const [name, setName] = useState(() => localStorage.getItem(PLAYER_NAME_KEY) || '')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!live || joining || !name.trim() || live.connectionStatus !== 'offline') return
    const reconnectToken = localStorage.getItem(`dk-live:player-token:${routeCode.toUpperCase()}`)
    if (!reconnectToken) return
    setJoining(true)
    live.joinSession({ code: routeCode, playerName: name.trim() })
  }, [joining, live, name, routeCode])

  if (!live) return <div className="app-panel p-6 text-white">Camada LAN não inicializada.</div>

  if (live.joinStatus === 'idle' || (live.connectionStatus === 'error' && !live.participant)) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <section className="dossier-card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3"><Radio className="text-[#b3666b]" /><div><div className="text-xs uppercase tracking-[0.24em] text-[#caa6a3]">Sessão presencial</div><h1 className="mt-1 text-2xl font-bold text-white">Entrar na mesa {routeCode.toUpperCase()}</h1></div></div>
          <label className="block"><span className="field-label">Como o Mestre verá você</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="field mt-2" placeholder="Seu nome" maxLength={80} /></label>
          {live.error ? <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{live.error}</div> : null}
          <button
            type="button"
            disabled={!name.trim() || live.connectionStatus === 'connecting'}
            onClick={() => {
              localStorage.setItem(PLAYER_NAME_KEY, name.trim())
              setJoining(true)
              live.joinSession({ code: routeCode, playerName: name.trim() })
            }}
            className="btn-primary mt-5 w-full"
          ><Wifi size={16} /> Solicitar entrada</button>
          <p className="mt-4 text-xs leading-relaxed text-text-muted">O Mestre precisa aprovar sua entrada e atribuir seu personagem. O token de reconexão fica apenas neste aparelho.</p>
        </section>
      </div>
    )
  }

  if (live.joinStatus === 'pending') {
    return <WaitingState title="Pedido enviado" detail={`Aguardando aprovação do Mestre em ${live.campaignTitle || 'esta mesa'}.`} status={live.connectionStatus} />
  }
  if (live.joinStatus === 'declined') {
    return <WaitingState title="Entrada não aprovada" detail="Fale com o Mestre para solicitar um novo acesso." status={live.connectionStatus} />
  }
  if (!live.projection) {
    return <WaitingState title="Sincronizando dossiê" detail="Recuperando o estado atual da sessão…" status={live.connectionStatus} />
  }

  return <ApprovedPlayerView />
}

function WaitingState({ title, detail, status }: { title: string; detail: string; status: string }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="dossier-card p-8"><div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full border border-[#a65c61]/40 bg-[#a65c61]/10" /><h1 className="text-2xl font-bold text-white">{title}</h1><p className="mt-3 text-sm text-text-muted">{detail}</p><div className="mt-5 text-xs uppercase tracking-[0.2em] text-[#cfa3a3]">{status}</div></div>
    </div>
  )
}

function ApprovedPlayerView() {
  const live = useOptionalLiveSession()!
  const projection = live.projection!
  const character = projection.characters[0] ?? null
  const ruleset = getRuleset(character?.rulesetId || projection.campaign?.rulesetId)
  const [attributeId, setAttributeId] = useState(ruleset.character.attributes[0]?.id || '')
  const [bonus, setBonus] = useState(0)
  const [visibility, setVisibility] = useState<'public' | 'master'>('public')
  const [lastRoll, setLastRoll] = useState<ReturnType<typeof ruleset.dice.roll> | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [consent, setConsent] = useState(false)

  const resources = useMemo(() => {
    if (character?.ordem) return ruleset.character.resources.map((definition) => ({ ...definition, ...character.ordem!.resources[definition.id as keyof typeof character.ordem.resources] }))
    return [
      { id: 'health', label: 'Pontos de Vida', shortLabel: 'PV', color: '#a95c61', current: character?.currentHp ?? 0, max: character?.currentHp ?? 0 },
      { id: 'effort', label: 'Esforço', shortLabel: 'PE', color: '#b38a5b', current: character?.currentMp ?? 0, max: character?.currentMp ?? 0 },
    ]
  }, [character, ruleset.character.resources])

  const roll = () => {
    const value = character?.ordem?.attributes[attributeId as keyof typeof character.ordem.attributes] ?? 1
    const result = ruleset.dice.roll({ attributeId, attributeValue: value, bonus })
    setLastRoll(result)
    live.sendEvent('dice', { ...result, attributeId, context: projection.scene?.name || '' }, visibility === 'master' ? { kind: 'master' } : { kind: 'all' })
  }

  return (
    <div className="player-session -mx-4 -my-6 min-h-screen px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div><div className="text-[10px] uppercase tracking-[0.24em] text-[#caa6a3]">{projection.campaign?.title}</div><h1 className="mt-1 text-2xl font-bold text-white">{character?.name || live.participant?.playerName}</h1></div>
        <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1 text-xs', live.connectionStatus === 'connected' ? 'border-emerald-400/25 text-emerald-100' : 'border-amber-400/25 text-amber-100')}>
          {live.connectionStatus === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}{live.connectionStatus === 'connected' ? 'Ao vivo' : 'Reconectando'}
        </div>
      </header>

      {live.stage ? <StageFocus stage={live.stage} /> : null}

      <SyncedAudio />

      <main className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {projection.combat ? <CombatStatus /> : null}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {resources.map((resource) => <ResourceCard key={resource.id} label={resource.shortLabel} current={resource.current} max={resource.max} color={resource.color} />)}
          </section>
          <section className="dossier-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#caa6a3]"><ShieldAlert size={14} /> Missão atual</div>
            <h2 className="mt-3 text-xl font-semibold text-white">{projection.scene?.name || 'Aguardando cena'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#c8c0b5]">{projection.scene?.objective || 'O Mestre ainda não revelou o objetivo.'}</p>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="dossier-card p-4"><div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#caa6a3]"><Backpack size={14} /> Inventário</div><div className="space-y-2">{character?.equipment.length ? character.equipment.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"><div className="text-sm text-white">{item.name}</div><div className="text-xs text-text-muted">{item.description || item.type}</div></div>) : <p className="text-sm text-text-muted">Sem itens registrados.</p>}</div></div>
            <div className="dossier-card p-4"><div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#caa6a3]"><Sparkles size={14} /> Habilidades</div><div className="space-y-2">{character?.ordem?.abilities.length ? character.ordem.abilities.map((ability) => <div key={ability} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">{ability}</div>) : <p className="text-sm text-text-muted">Nenhuma habilidade destacada.</p>}</div></div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="dossier-card p-4">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#caa6a3]"><Dice5 size={14} /> Rolagem</div>
            <select value={attributeId} onChange={(event) => setAttributeId(event.target.value)} className="field mb-3">{ruleset.character.attributes.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.label} ({character?.ordem?.attributes[attribute.id as keyof typeof character.ordem.attributes] ?? 1})</option>)}</select>
            <div className="grid grid-cols-2 gap-2"><label><span className="field-label">Bônus</span><input type="number" value={bonus} onChange={(event) => setBonus(Number(event.target.value))} className="field mt-1" /></label><label><span className="field-label">Visibilidade</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as 'public' | 'master')} className="field mt-1"><option value="public">Pública</option><option value="master">Só Mestre</option></select></label></div>
            <button type="button" onClick={roll} className="btn-primary mt-3 w-full"><Dice5 size={16} /> Rolar</button>
            {lastRoll ? <div className="mt-3 rounded-xl border border-[#a65c61]/30 bg-[#a65c61]/10 p-3 text-center"><div className="text-xs text-text-muted">{lastRoll.expression} · {lastRoll.rolls.join(', ')}</div><div className="mt-1 text-3xl font-bold text-white">{lastRoll.total}</div></div> : null}
          </section>

          <section className="dossier-card p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#caa6a3]">Mensagens recebidas</div>
            <div className="max-h-48 space-y-2 overflow-y-auto">{live.events.filter((event) => event.kind === 'message').slice(-8).reverse().map((event) => <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"><span className="mr-2 text-xs text-[#caa6a3]">{event.actor.name}</span>{String(event.payload.text || '')}</div>)}{live.events.every((event) => event.kind !== 'message') ? <p className="text-sm text-text-muted">Nenhuma mensagem.</p> : null}</div>
          </section>

          <section className="dossier-card p-4">
            <label className="flex items-start gap-3 text-sm text-[#d7d0c6]"><input type="checkbox" checked={consent} onChange={(event) => { const accepted = event.target.checked; setConsent(accepted); live.sendEvent('consent', { accepted, audio: accepted, screen: accepted }, { kind: 'master' }) }} className="mt-1" /><span>Concordo com gravação de áudio/tela nesta sessão. Posso revogar a qualquer momento.</span></label>
          </section>

          <FeedbackPanel sent={feedbackSent} onSend={(rating, tags) => { live.sendEvent('feedback', { rating, tags, comment: '' }, { kind: 'master' }); setFeedbackSent(true) }} />
          <button type="button" onClick={() => window.print()} className="btn-ghost w-full">Imprimir / salvar ficha em PDF</button>
        </aside>
      </main>
    </div>
  )
}

function StageFocus({ stage }: { stage: StagePresentation }) {
  const live = useOptionalLiveSession()
  return <section key={stage.id} className={cn('stage-focus mb-4', `stage-${stage.transition}`)}>{stage.kind === 'map' ? <PlayerMapView imageUrl={stage.imageUrl} state={live?.projection?.mapState} /> : stage.imageUrl ? <img src={stage.imageUrl} alt="" className="stage-focus-image" /> : null}<div className="stage-focus-shade" /><div className="stage-focus-copy"><div className="text-[10px] uppercase tracking-[0.28em] text-[#d2aaa7]">{stage.kind.replace('_', ' ')}</div><h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">{stage.title}</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#e1d9ce] sm:text-base">{stage.body}</p></div></section>
}

type PlayerMapState = {
  viewport?: { zoom?: number; offsetX?: number; offsetY?: number }
  tokens?: Array<{ id: string; name: string; x: number; y: number; scale?: number; imageUri?: string | null }>
  fogEnabled?: boolean
  revealedAreas?: Array<{ id: string; x: number; y: number; radius: number }>
}

function PlayerMapView({ imageUrl, state }: { imageUrl?: string | null; state: unknown }) {
  const map = state && typeof state === 'object' ? state as PlayerMapState : {}
  const viewport = map.viewport ?? {}
  const zoom = Number(viewport.zoom ?? 1)
  const offsetX = Number(viewport.offsetX ?? 0)
  const offsetY = Number(viewport.offsetY ?? 0)
  const maskId = 'player-map-fog'
  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-label="Mapa compartilhado pelo Mestre">
      {imageUrl ? <img src={imageUrl} alt="Mapa da cena" className="h-full w-full object-contain opacity-85" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_center,#302b27,#0d0c0b)]" />}
      {(map.tokens ?? []).map((token) => (
        <div key={token.id} className="absolute z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: offsetX + token.x * zoom, top: offsetY + token.y * zoom, transform: `translate(-50%, -50%) scale(${Math.max(0.45, Math.min(2, (token.scale ?? 1) * zoom))})` }}>
          {token.imageUri ? <img src={token.imageUri} alt="" className="h-11 w-11 rounded-full border-2 border-[#d4b06d] object-cover shadow-lg" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4b06d] bg-[#5f3034] text-sm font-bold text-white shadow-lg">{token.name.slice(0, 1)}</div>}
          <span className="mt-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] text-white">{token.name}</span>
        </div>
      ))}
      {map.fogEnabled ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-label="Névoa de guerra">
          <defs><mask id={maskId}><rect width="1000" height="700" fill="white" />{(map.revealedAreas ?? []).map((area) => <circle key={area.id} cx={offsetX + area.x * zoom} cy={offsetY + area.y * zoom} r={area.radius * zoom} fill="black" />)}</mask></defs>
          <rect width="1000" height="700" fill="rgba(4,4,4,0.92)" mask={`url(#${maskId})`} />
        </svg>
      ) : null}
    </div>
  )
}

function CombatStatus() {
  const combat = useOptionalLiveSession()!.projection!.combat!
  const current = combat.participants[combat.currentTurnIndex]
  return (
    <section className="dossier-card border-[#a65c61]/35 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d7a1a5]"><Swords size={15} /> Combate · rodada {combat.round}</div>
      <div className="mt-3 flex items-center justify-between gap-3"><div><div className="text-xs text-text-muted">Turno atual</div><div className="text-lg font-semibold text-white">{current?.name || 'Aguardando iniciativa'}</div></div><div className="text-right text-xs text-text-muted">{combat.participants.filter((entry) => !entry.isDefeated).length}/{combat.participants.length}<br />ativos</div></div>
    </section>
  )
}

function SyncedAudio() {
  const live = useOptionalLiveSession()!
  const audio = live.projection?.audio
  const element = useRef<HTMLAudioElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const isLocalOnly = Boolean(audio?.currentTrackUrl?.startsWith('blob:'))

  useEffect(() => {
    const target = element.current
    if (!target || !audio) return
    target.volume = Math.max(0, Math.min(1, audio.volume))
    target.muted = audio.isMuted
    target.loop = audio.loop ?? true
    if (!audio.currentTrackUrl || isLocalOnly) {
      target.pause()
      target.removeAttribute('src')
      return
    }
    if (target.src !== audio.currentTrackUrl) target.src = audio.currentTrackUrl
    if (enabled && audio.isPlaying) {
      target.play().then(() => setPlaybackError('')).catch(() => setPlaybackError('Toque em “Ativar som” para liberar o áudio neste navegador.'))
    } else {
      target.pause()
    }
  }, [audio, enabled, isLocalOnly])

  if (!audio?.currentTrackUrl) return null
  return (
    <section className="dossier-card mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
      <audio ref={element} />
      <Volume2 size={16} className="text-[#d5a2a5]" />
      <div className="min-w-0 flex-1"><div className="truncate text-sm text-white">Paisagem sonora da mesa</div><div className="text-xs text-text-muted">{isLocalOnly ? 'Arquivo local: reproduz somente no dispositivo do Mestre.' : playbackError || (audio.isPlaying ? 'Sincronizada pelo Mestre' : 'Pausada')}</div></div>
      {!isLocalOnly ? <button type="button" onClick={() => setEnabled((value) => !value)} className="btn-ghost">{enabled ? <Pause size={14} /> : <Play size={14} />}{enabled ? 'Silenciar neste celular' : 'Ativar som'}</button> : null}
    </section>
  )
}

function ResourceCard({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  return <article className="dossier-card p-4"><div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-muted"><span>{label}</span>{label === 'PV' ? <Heart size={15} /> : <Zap size={15} />}</div><div className="mt-2 text-2xl font-bold text-white">{current}<span className="text-sm font-normal text-text-muted">/{max}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full" style={{ width: `${max ? Math.max(0, Math.min(100, current / max * 100)) : 0}%`, backgroundColor: color }} /></div></article>
}

function FeedbackPanel({ sent, onSend }: { sent: boolean; onSend: (rating: string, tags: string[]) => void }) {
  const [tags, setTags] = useState<string[]>([])
  if (sent) return <section className="dossier-card flex items-center gap-2 p-4 text-sm text-emerald-100"><Check size={16} /> Feedback enviado. Obrigado.</section>
  const toggle = (tag: string) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  return <section className="dossier-card p-4"><div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#caa6a3]">Feedback rápido</div><div className="grid grid-cols-4 gap-1">{[['excellent', 'Excelente'], ['good', 'Bom'], ['neutral', 'Neutro'], ['bad', 'Ruim']].map(([value, label]) => <button key={value} type="button" onClick={() => onSend(value, tags)} className="rounded-lg border border-white/10 px-2 py-2 text-xs text-white hover:bg-white/10">{label}</button>)}</div><div className="mt-3 flex flex-wrap gap-2">{[['narrative', 'Narrativa'], ['combat', 'Combate'], ['pace', 'Ritmo'], ['immersion', 'Imersão']].map(([value, label]) => <button key={value} type="button" onClick={() => toggle(value)} className={cn('rounded-full border px-2 py-1 text-[11px]', tags.includes(value) ? 'border-[#a65c61]/50 bg-[#a65c61]/20 text-white' : 'border-white/10 text-text-muted')}>{label}</button>)}</div></section>
}
