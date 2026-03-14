import { AlertTriangle, Database, ScrollText, ShieldCheck } from 'lucide-react'
import { useDiagnostics } from '@/hooks/useDiagnostics'

export function AppDiagnosticsPanel() {
  const { logs, stats, clearLogs } = useDiagnostics()

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Diagnostico do App</h3>
          <p className="mt-1 text-sm text-text-muted">Erros recentes, estado dos caches e sinais de operacao local.</p>
        </div>
        <button onClick={clearLogs} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white transition hover:bg-black/30">
          Limpar logs
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Logs" value={stats.total} icon={ScrollText} accent="text-accent" />
        <MetricCard label="Erros" value={stats.errors} icon={AlertTriangle} accent="text-rose-300" />
        <MetricCard label="Cache Auto" value={stats.autoContent.contentReady ? 'ON' : 'OFF'} icon={Database} accent="text-amber-300" />
        <MetricCard label="Catalogo" value={stats.gameCatalog.ready ? 'ON' : 'OFF'} icon={ShieldCheck} accent="text-primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">Resumo tecnico</div>
          <div className="space-y-2 text-sm text-text-muted">
            <p>Concorrencia do gerador: <span className="text-white">{stats.autoContent.concurrency}</span></p>
            <p>Snapshot em cache: <span className="text-white">{stats.autoContent.snapshotReady ? 'pronto' : 'nao aquecido'}</span></p>
            <p>Ultimo evento: <span className="text-white">{stats.latest ? `${stats.latest.source} • ${stats.latest.message}` : 'sem ocorrencias'}</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">Eventos recentes</div>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-5 text-sm text-text-muted">
                Nenhum evento relevante registrado nesta sessao.
              </div>
            ) : (
              logs.slice(0, 6).map((entry) => (
                <article key={entry.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-white">{entry.source}</span>
                    <span className="text-text-muted">{new Date(entry.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <div className="mt-1 text-sm text-white">{entry.message}</div>
                  {entry.context && <div className="mt-1 line-clamp-2 text-xs text-text-muted">{entry.context}</div>}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon: typeof ScrollText
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</span>
        <Icon size={14} className={accent} />
      </div>
      <div className="mt-2 text-lg font-bold text-white">{value}</div>
    </div>
  )
}
