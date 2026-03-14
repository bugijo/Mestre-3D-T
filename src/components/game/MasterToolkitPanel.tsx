import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dice5, Lightbulb, RadioTower, ScrollText, Users } from 'lucide-react'
import { getCharacterMaxHp, getCharacterMaxMp, type Character, type RollTrigger, type Scene } from '@/domain/models'
import { TableEventFeed } from '@/components/game/TableEventFeed'

type TableTrackers = {
  clues: number
  danger: number
  spotlight: number
  tempo: number
}

const IMPROV_TABLE = {
  complication: [
    'Uma testemunha contradiz a versão anterior.',
    'O local começa a colapsar e força uma decisão rápida.',
    'Um aliado age sem avisar o grupo.',
    'A recompensa prometida não cobre o risco real.',
  ],
  sensory: [
    'Cheiro forte de ozônio e metal queimado.',
    'Som abafado de passos fora de sincronia.',
    'Luzes pulsantes recortam sombras na parede.',
    'Um silêncio estranho abafa toda a cena por um instante.',
  ],
  npcBeat: [
    'O NPC revela mais do que pretendia e tenta recuar.',
    'O NPC exige uma prova de confiança antes de cooperar.',
    'O NPC entrega uma pista, mas omite a motivação real.',
    'O NPC muda de lado ao perceber o risco crescente.',
  ],
}

function trackerKey(sessionKey: string) {
  return `table-trackers:${sessionKey}`
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, value))
}

export function MasterToolkitPanel({
  sessionKey,
  activeScene,
  players,
}: {
  sessionKey: string
  activeScene: Scene | null
  players: Character[]
}) {
  const [trackers, setTrackers] = useState<TableTrackers>({ clues: 2, danger: 1, spotlight: 5, tempo: 4 })
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    const raw = localStorage.getItem(trackerKey(sessionKey))
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as TableTrackers
      setTrackers({
        clues: clamp(parsed.clues ?? 0),
        danger: clamp(parsed.danger ?? 0),
        spotlight: clamp(parsed.spotlight ?? 0),
        tempo: clamp(parsed.tempo ?? 0),
      })
    } catch {
      localStorage.removeItem(trackerKey(sessionKey))
    }
  }, [sessionKey])

  useEffect(() => {
    localStorage.setItem(trackerKey(sessionKey), JSON.stringify(trackers))
  }, [sessionKey, trackers])

  const improvCards = useMemo(
    () => [
      { title: 'Complicação', text: IMPROV_TABLE.complication[promptIndex % IMPROV_TABLE.complication.length] },
      { title: 'Sensação', text: IMPROV_TABLE.sensory[promptIndex % IMPROV_TABLE.sensory.length] },
      { title: 'Batida de NPC', text: IMPROV_TABLE.npcBeat[promptIndex % IMPROV_TABLE.npcBeat.length] },
    ],
    [promptIndex],
  )

  const triggers = activeScene?.triggers ?? []

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2">
          <RadioTower size={14} className="text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Controle da Mesa</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TrackerCard label="Pistas" value={trackers.clues} onChange={(delta) => setTrackers((current) => ({ ...current, clues: clamp(current.clues + delta) }))} />
          <TrackerCard label="Perigo" value={trackers.danger} onChange={(delta) => setTrackers((current) => ({ ...current, danger: clamp(current.danger + delta) }))} />
          <TrackerCard label="Holofote" value={trackers.spotlight} onChange={(delta) => setTrackers((current) => ({ ...current, spotlight: clamp(current.spotlight + delta) }))} />
          <TrackerCard label="Ritmo" value={trackers.tempo} onChange={(delta) => setTrackers((current) => ({ ...current, tempo: clamp(current.tempo + delta) }))} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Jogadores</h3>
          </div>
          <span className="text-xs text-text-muted">{players.length} ativos</span>
        </div>
        <div className="space-y-2">
          {players.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-text-muted">
              Nenhum personagem do tipo jogador vinculado à campanha ativa.
            </div>
          ) : (
            players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">{player.name}</div>
                  <div className="text-xs text-text-muted">{player.role || 'Sem função definida'}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{player.currentHp}/{getCharacterMaxHp(player)} PV</span>
                  <span>{player.dnd ? `CA ${player.dnd.armorClass}` : `${player.currentMp}/${getCharacterMaxMp(player)} PM`}</span>
                  <Link
                    to={`/player/${player.id}`}
                    className="rounded-lg border border-secondary/30 bg-secondary/15 px-2 py-1 text-white transition hover:bg-secondary/25"
                  >
                    Abrir visão
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-300" />
            <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Improviso</h3>
          </div>
          <button
            type="button"
            onClick={() => setPromptIndex((current) => current + 1)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-xs text-white transition hover:bg-black/30"
          >
            Girar tabela
          </button>
        </div>
        <div className="space-y-3">
          {improvCards.map((card) => (
            <article key={card.title} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">{card.title}</div>
              <p className="text-sm text-white">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2">
            <ScrollText size={14} className="text-secondary" />
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Gatilhos da Cena</h3>
        </div>
        <div className="space-y-2">
          {triggers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-text-muted">
              A cena ativa não possui gatilhos cadastrados.
            </div>
          ) : (
            triggers.map((trigger) => <TriggerCard key={trigger.id} trigger={trigger} />)
          )}
        </div>
      </section>

      <TableEventFeed sessionKey={sessionKey} defaultAuthor="Mestre" role="master" />
    </div>
  )
}

function TrackerCard({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (delta: number) => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => onChange(-1)} className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white transition hover:bg-white/10">
          -
        </button>
        <span className="text-lg font-bold text-white">{value}</span>
        <button type="button" onClick={() => onChange(1)} className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white transition hover:bg-white/10">
          +
        </button>
      </div>
    </div>
  )
}

function TriggerCard({ trigger }: { trigger: RollTrigger }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
        <Dice5 size={12} />
        {trigger.attribute} {trigger.testType} • {trigger.difficulty}
      </div>
      <p className="text-sm font-medium text-white">{trigger.situation}</p>
      <div className="mt-2 space-y-1 text-xs text-text-muted">
        <div>
          <span className="text-emerald-300">Sucesso:</span> {trigger.onSuccess || 'Sem efeito descrito.'}
        </div>
        <div>
          <span className="text-rose-300">Falha:</span> {trigger.onFailure || 'Sem efeito descrito.'}
        </div>
      </div>
    </article>
  )
}
