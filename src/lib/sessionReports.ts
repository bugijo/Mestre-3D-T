import type { SessionSummary } from '@/domain/models'

export type SessionInsights = {
  totalSessions: number
  totalDurationMs: number
  averageDurationMs: number
  totalDefeatedEnemies: number
  topCampaign: string | null
  topCampaignSessions: number
  topNpc: string | null
  topNpcMentions: number
}

function countMostFrequent(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  let winner: string | null = null
  let winnerCount = 0
  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value
      winnerCount = count
    }
  }

  return { value: winner, count: winnerCount }
}

export function formatDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return `${hours}h ${minutes}min`
}

export function buildSessionInsights(summaries: SessionSummary[]): SessionInsights {
  const totalDurationMs = summaries.reduce((total, summary) => total + summary.durationMs, 0)
  const totalDefeatedEnemies = summaries.reduce((total, summary) => total + summary.defeatedEnemyNames.length, 0)
  const topCampaign = countMostFrequent(summaries.map((summary) => summary.campaignTitle))
  const topNpc = countMostFrequent(summaries.flatMap((summary) => summary.npcNames))

  return {
    totalSessions: summaries.length,
    totalDurationMs,
    averageDurationMs: summaries.length > 0 ? Math.round(totalDurationMs / summaries.length) : 0,
    totalDefeatedEnemies,
    topCampaign: topCampaign.value,
    topCampaignSessions: topCampaign.count,
    topNpc: topNpc.value,
    topNpcMentions: topNpc.count,
  }
}

export function filterSessionSummaries(
  summaries: SessionSummary[],
  filters: { campaignTitle?: string; query?: string },
) {
  const query = filters.query?.trim().toLowerCase()
  return summaries.filter((summary) => {
    const matchesCampaign =
      !filters.campaignTitle || filters.campaignTitle === 'ALL' || summary.campaignTitle === filters.campaignTitle
    if (!matchesCampaign) return false
    if (!query) return true

    const haystack = [
      summary.campaignTitle,
      ...summary.sceneNames,
      ...summary.npcNames,
      ...summary.defeatedEnemyNames,
      ...summary.importantNotes,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function buildSessionReportMarkdown(summary: SessionSummary) {
  const lines = [
    `# Relatorio da Sessao - ${summary.campaignTitle}`,
    '',
    `- Encerrada em: ${new Date(summary.endedAt).toLocaleString('pt-BR')}`,
    `- Duracao: ${formatDuration(summary.durationMs)}`,
    `- Cenas: ${summary.sceneNames.length ? summary.sceneNames.join(', ') : 'Nenhuma registrada'}`,
    `- NPCs relevantes: ${summary.npcNames.length ? summary.npcNames.join(', ') : 'Nenhum registrado'}`,
    `- Inimigos derrotados: ${summary.defeatedEnemyNames.length ? summary.defeatedEnemyNames.join(', ') : 'Nenhum registrado'}`,
    '',
    '## Notas importantes',
    ...(summary.importantNotes.length ? summary.importantNotes.map((note) => `- ${note}`) : ['- Nenhuma']),
  ]

  return lines.join('\n')
}
