import { describe, expect, it } from 'vitest'
import { buildSessionInsights, buildSessionReportMarkdown, filterSessionSummaries, formatDuration } from './sessionReports'
import type { SessionSummary } from '@/domain/models'

const summaries: SessionSummary[] = [
  {
    id: 's1',
    campaignId: 'c1',
    campaignTitle: 'Guerra das Sombras',
    startedAt: 1,
    endedAt: 2,
    durationMs: 90 * 60 * 1000,
    sceneNames: ['Taverna', 'Ruinas'],
    npcNames: ['Eldrin'],
    defeatedEnemyNames: ['Goblin', 'Lobo'],
    importantNotes: ['Pista encontrada'],
  },
  {
    id: 's2',
    campaignId: 'c1',
    campaignTitle: 'Guerra das Sombras',
    startedAt: 3,
    endedAt: 4,
    durationMs: 30 * 60 * 1000,
    sceneNames: ['Bosque'],
    npcNames: ['Eldrin', 'Mira'],
    defeatedEnemyNames: [],
    importantNotes: [],
  },
]

describe('sessionReports', () => {
  it('agrega insights principais', () => {
    const insights = buildSessionInsights(summaries)
    expect(insights.totalSessions).toBe(2)
    expect(insights.totalDefeatedEnemies).toBe(2)
    expect(insights.topCampaign).toBe('Guerra das Sombras')
    expect(insights.topNpc).toBe('Eldrin')
  })

  it('filtra por campanha e termo livre', () => {
    expect(filterSessionSummaries(summaries, { campaignTitle: 'Guerra das Sombras' })).toHaveLength(2)
    expect(filterSessionSummaries(summaries, { query: 'bosque' })).toHaveLength(1)
    expect(filterSessionSummaries(summaries, { query: 'inexistente' })).toHaveLength(0)
  })

  it('formata duracao e markdown', () => {
    expect(formatDuration(30 * 60 * 1000)).toBe('30 min')
    expect(formatDuration(90 * 60 * 1000)).toBe('1h 30min')
    expect(buildSessionReportMarkdown(summaries[0])).toContain('Relatorio da Sessao')
    expect(buildSessionReportMarkdown(summaries[0])).toContain('Pista encontrada')
  })
})
