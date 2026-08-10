import { useMemo, useState } from 'react'
import { Activity, Clipboard, ScrollText, Search, Swords, Timer, Trophy, Users } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import {
  buildSessionInsights,
  buildSessionReportMarkdown,
  filterSessionSummaries,
  formatDuration,
} from '@/lib/sessionReports'
import { logError, logInfo } from '@/lib/logger'
import { safeClipboard } from '@/lib/clipboard'

export function SessionReports() {
  const { state } = useAppStore()
  const [campaignFilter, setCampaignFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const campaignOptions = useMemo(
    () => Array.from(new Set(state.sessionHistory.map((summary) => summary.campaignTitle))).sort(),
    [state.sessionHistory],
  )
  const filteredSummaries = useMemo(
    () => filterSessionSummaries(state.sessionHistory, { campaignTitle: campaignFilter, query }),
    [campaignFilter, query, state.sessionHistory],
  )
  const insights = useMemo(() => buildSessionInsights(filteredSummaries), [filteredSummaries])

  const copyReport = async (summaryId: string) => {
    const summary = filteredSummaries.find((entry) => entry.id === summaryId)
    if (!summary) return

    try {
      await safeClipboard(buildSessionReportMarkdown(summary))
      setCopiedId(summaryId)
      logInfo('reports:copy', 'Relatorio de sessao copiado', { summaryId })
      window.setTimeout(() => setCopiedId((current) => (current === summaryId ? null : current)), 1800)
    } catch (error) {
      logError('reports:copy', error, { summaryId })
    }
  }

  const copyDigest = async () => {
    const content = filteredSummaries.map(buildSessionReportMarkdown).join('\n\n---\n\n')
    if (!content) return
    try {
      await safeClipboard(content)
      setCopiedId('digest')
      logInfo('reports:copy-digest', 'Digest de relatorios copiado', { count: filteredSummaries.length })
      window.setTimeout(() => setCopiedId((current) => (current === 'digest' ? null : current)), 1800)
    } catch (error) {
      logError('reports:copy-digest', error, { count: filteredSummaries.length })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(0,255,157,0.12),_transparent_28%),linear-gradient(135deg,rgba(8,12,20,0.98),rgba(3,5,10,0.98))] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-text-muted">Analise da Mesa</div>
            <h1 className="mt-2 text-4xl font-display font-bold text-white">Relatorios de Sessao</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
              Consolide sessoes encerradas, identifique recorrencias da campanha e exporte resumos para planejamento.
            </p>
          </div>
          <button
            type="button"
            onClick={copyDigest}
            disabled={filteredSummaries.length === 0}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            {copiedId === 'digest' ? 'Digest copiado' : 'Copiar digest'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <InsightCard icon={ScrollText} label="Sessoes" value={`${insights.totalSessions}`} hint="sessoes no filtro atual" />
        <InsightCard icon={Timer} label="Media" value={formatDuration(insights.averageDurationMs)} hint="duracao media" />
        <InsightCard
          icon={Trophy}
          label="Campanha dominante"
          value={insights.topCampaign || 'Sem dados'}
          hint={insights.topCampaign ? `${insights.topCampaignSessions} sessoes` : 'sem recorrencia'}
        />
        <InsightCard
          icon={Swords}
          label="Inimigos derrotados"
          value={`${insights.totalDefeatedEnemies}`}
          hint={insights.topNpc ? `NPC frequente: ${insights.topNpc}` : 'sem NPC recorrente'}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_180px]">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por cena, NPC, inimigo ou nota..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-10 py-3 text-sm text-white outline-none focus:border-secondary"
            />
          </label>
          <select
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">Todas as campanhas</option>
            {campaignOptions.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text-muted">
            {filteredSummaries.length} resultado(s)
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {filteredSummaries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-text-muted">
            Nenhum relatorio encontrado para os filtros atuais.
          </div>
        ) : (
          filteredSummaries.map((summary) => (
            <article key={summary.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{summary.campaignTitle}</div>
                  <h2 className="mt-2 text-2xl font-rajdhani font-bold text-white">
                    {new Date(summary.endedAt).toLocaleString('pt-BR')}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Timer size={12} />
                      {formatDuration(summary.durationMs)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Activity size={12} />
                      {summary.sceneNames.length} cena(s)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {summary.npcNames.length} NPC(s)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyReport(summary.id)}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clipboard size={14} />
                    {copiedId === summary.id ? 'Copiado' : 'Copiar relatorio'}
                  </span>
                </button>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <DetailCard title="Cenas usadas" items={summary.sceneNames} emptyLabel="Nenhuma cena registrada." />
                <DetailCard title="NPCs relevantes" items={summary.npcNames} emptyLabel="Nenhum NPC registrado." />
                <DetailCard title="Inimigos derrotados" items={summary.defeatedEnemyNames} emptyLabel="Nenhum inimigo derrotado." />
                <DetailCard title="Notas importantes" items={summary.importantNotes} emptyLabel="Nenhuma nota importante." />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function InsightCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ScrollText
  label: string
  value: string
  hint: string
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</span>
        <Icon size={16} className="text-accent" />
      </div>
      <div className="mt-4 text-2xl font-bold text-white">{value}</div>
      <div className="mt-2 text-sm text-text-muted">{hint}</div>
    </article>
  )
}

function DetailCard({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-text-muted">{title}</div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={`${title}:${item}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
              {item}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
