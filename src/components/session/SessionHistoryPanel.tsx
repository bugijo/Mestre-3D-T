import { Link } from 'react-router-dom'
import { Clock3, ScrollText, Swords } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { formatDuration } from '@/lib/sessionReports'

export function SessionHistoryPanel() {
  const { state } = useAppStore()
  const summaries = state.sessionHistory

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <ScrollText size={16} className="text-accent" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Historico de Sessoes</h3>
          <p className="mt-1 text-sm text-text-muted">Resumo persistido das ultimas sessoes encerradas.</p>
        </div>
        <Link to="/reports" className="ml-auto text-xs text-secondary hover:underline">
          Abrir relatorios
        </Link>
      </div>

      <div className="space-y-3">
        {summaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-text-muted">
            Nenhuma sessao encerrada ainda.
          </div>
        ) : (
          summaries.map((summary) => (
            <article key={summary.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{summary.campaignTitle}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock3 size={12} />
                      {new Date(summary.endedAt).toLocaleString('pt-BR')}
                    </span>
                    <span>{formatDuration(summary.durationMs)}</span>
                  </div>
                </div>
                <div className="text-xs text-text-muted">{summary.sceneNames.length} cenas</div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">Cenas usadas</div>
                  <p className="text-sm text-white">
                    {summary.sceneNames.length ? summary.sceneNames.join(', ') : 'Nenhuma registrada.'}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">NPCs relevantes</div>
                  <p className="text-sm text-white">
                    {summary.npcNames.length ? summary.npcNames.join(', ') : 'Nenhum registrado.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    <Swords size={11} />
                    Inimigos derrotados
                  </div>
                  <p className="text-sm text-white">
                    {summary.defeatedEnemyNames.length ? summary.defeatedEnemyNames.join(', ') : 'Nenhum registrado.'}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">Notas importantes</div>
                  <p className="text-sm text-white">
                    {summary.importantNotes.length ? summary.importantNotes.slice(0, 3).join(' | ') : 'Nenhuma.'}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
