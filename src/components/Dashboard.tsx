import { CalendarClock, ChevronRight, Compass, FolderKanban, MoreVertical, ScrollText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import loginBg from '@/assets/login-bg.webp'
import { generateImage } from '@/lib/imageGen'
import { useAppStore } from '@/store/AppStore'
import { SnapshotControlPanel } from '@/components/backup/SnapshotControlPanel'
import { SessionHistoryPanel } from '@/components/session/SessionHistoryPanel'
import { AppDiagnosticsPanel } from '@/components/diagnostics/AppDiagnosticsPanel'
import { PageHero } from '@/components/ui/PageHero'
import { MetricTile } from '@/components/ui/MetricTile'
import { logError } from '@/lib/logger'

const generatedCoverCache = new Map<string, string>()

type TabKey = 'ALL' | 'ACTIVE' | 'ARCHIVED'

export function Dashboard() {
  const navigate = useNavigate()
  const { state, setNextSessionAt } = useAppStore()
  const [tab, setTab] = useState<TabKey>('ALL')
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 35, secs: 22 })
  const [images, setImages] = useState<Record<string, string>>({})
  const [nextSessionInput, setNextSessionInput] = useState('')

  const campaigns = useMemo(() => {
    return [...state.campaigns]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((campaign) => {
        const scenes = state.scenes.filter((scene) => scene.campaignId === campaign.id)
        const completed = scenes.filter((scene) => scene.isCompleted).length
        const progress = scenes.length > 0 ? Math.round((completed / scenes.length) * 100) : 0
        const players = state.characters.filter((character) => character.type === 'PLAYER' && character.campaignId === campaign.id).length
        return {
          id: campaign.id,
          campaignId: campaign.id,
          title: campaign.title,
          description: campaign.description,
          progress,
          players,
          sceneCount: scenes.length,
          coverDataUrl: campaign.coverDataUrl,
          updatedAt: campaign.updatedAt,
        }
      })
  }, [state.campaigns, state.scenes, state.characters])

  const activeCampaigns = campaigns.filter((campaign) => campaign.progress > 0 && campaign.progress < 100).length
  const archivedCampaigns = campaigns.filter((campaign) => campaign.progress >= 100).length
  const totalPlayers = state.characters.filter((character) => character.type === 'PLAYER').length
  const nextCampaign = campaigns[0]
  const nextSessionLabel = state.settings.nextSessionAt ? new Date(state.settings.nextSessionAt).toLocaleString('pt-BR') : 'Defina a data'

  useEffect(() => {
    const tick = () => {
      const target = state.settings.nextSessionAt || Date.now()
      const diff = Math.max(0, target - Date.now())
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const mins = Math.floor((diff / (1000 * 60)) % 60)
      const secs = Math.floor((diff / 1000) % 60)
      setTimeLeft({ days, hours, mins, secs })
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [state.settings.nextSessionAt])

  useEffect(() => {
    if (!state.settings.nextSessionAt) {
      setNextSessionInput('')
      return
    }

    const tzOffset = new Date().getTimezoneOffset() * 60000
    const local = new Date(state.settings.nextSessionAt - tzOffset).toISOString().slice(0, 16)
    setNextSessionInput(local)
  }, [state.settings.nextSessionAt])

  const handleSaveNextSession = () => {
    if (!nextSessionInput) return
    const parsed = Date.parse(nextSessionInput)
    if (Number.isNaN(parsed)) return
    setNextSessionAt(parsed)
  }

  useEffect(() => {
    let mounted = true

    async function run() {
      const nextImages: Record<string, string> = {}

      for (const campaign of campaigns) {
        if (campaign.coverDataUrl) continue

        const cached = generatedCoverCache.get(campaign.id)
        if (cached) {
          nextImages[campaign.id] = cached
          continue
        }

        try {
          const { dataUrl } = await generateImage({
            category: 'SCENE',
            title: campaign.title,
            theme: 'neon',
            mood: 'mysterious',
            width: 960,
            height: 540,
            transparentBackground: false,
            watermarkText: 'Mestre 3D&T',
            gridOverlay: false,
          })

          generatedCoverCache.set(campaign.id, dataUrl)
          nextImages[campaign.id] = dataUrl
        } catch (error) {
          logError('dashboard:cover-image', error, { campaignId: campaign.id, title: campaign.title })
        }
      }

      if (mounted && Object.keys(nextImages).length > 0) {
        setImages((previous) => ({ ...previous, ...nextImages }))
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [campaigns])

  return (
    <div className="space-y-8 pb-12">
      <PageHero
        eyebrow="Centro de comando"
        title={
          <>
            Planejamento tático para a <span className="text-gradient-secondary">próxima sessão</span>
          </>
        }
        description="A dashboard agora prioriza contexto, ritmo e tomada de decisão: agenda, campanhas em andamento, relatórios e ferramentas de mesa ficam no mesmo eixo visual."
        actions={
          <>
            <button onClick={() => navigate('/session')} aria-label="Preparar sessao" className="btn-primary">
              PREPARAR AGORA
            </button>
            <Link to="/reports" className="btn-secondary">
              Abrir relatórios
            </Link>
            <Link to="/campaigns" className="btn-ghost">
              Ver campanhas
            </Link>
          </>
        }
        aside={
          <div className="app-panel-muted w-full max-w-md p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">PRÓXIMA SESSÃO</div>
                <div className="mt-2 text-lg font-semibold text-white">{nextCampaign?.title || 'Nenhuma campanha definida'}</div>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-ember">
                <CalendarClock size={20} />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                { label: 'Dias', value: timeLeft.days },
                { label: 'Horas', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.mins },
                { label: 'Seg', value: timeLeft.secs },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4 text-center">
                  <div className="font-display text-3xl font-semibold text-white">{String(item.value).padStart(2, '0')}</div>
                  <div className="mt-1 text-[0.65rem] uppercase tracking-[0.24em] text-text-muted">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-text-muted">Agendamento</div>
              <p className="mt-2 text-sm text-text-secondary">{nextSessionLabel}</p>
              <div className="mt-4 flex flex-col gap-2">
                <input
                  type="datetime-local"
                  value={nextSessionInput}
                  onChange={(event) => setNextSessionInput(event.target.value)}
                  className="field"
                />
                <button onClick={handleSaveNextSession} className="btn-ghost">
                  Salvar data
                </button>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={FolderKanban} label="Campanhas" value={`${campaigns.length}`} detail={`${activeCampaigns} em execução`} tone="secondary" />
        <MetricTile icon={Users} label="Jogadores" value={`${totalPlayers}`} detail={`${state.characters.length} personagens cadastrados`} tone="success" />
        <MetricTile icon={Compass} label="Cenas" value={`${state.scenes.length}`} detail={`${archivedCampaigns} campanhas concluídas`} tone="primary" />
        <MetricTile icon={ScrollText} label="Sessões" value={`${state.sessionHistory.length}`} detail="Histórico e relatórios prontos para revisão" tone="secondary" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-panel-strong p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="eyebrow">Fluxo operacional</div>
              <h2 className="mt-2 text-2xl font-display text-white">Ações rápidas da mesa</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Atalhos para sessão, relatórios e governança da plataforma. O foco aqui é reduzir navegação desnecessária durante o preparo e a operação.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <QuickActionCard
              icon={Sparkles}
              title="Ritmo da sessão"
              description="Entre direto na visão do mestre para iniciar combate, narrativa e ferramentas improvisadas."
              href="/session"
              cta="Ir para jogar"
            />
            <QuickActionCard
              icon={ScrollText}
              title="Relatórios gerenciais"
              description="Revise histórico, métricas de mesa e resumos exportáveis para o planejamento do próximo arco."
              href="/reports"
              cta="Ver relatórios"
            />
            <QuickActionCard
              icon={ShieldCheck}
              title="Governança e auditoria"
              description="Acesse segurança administrativa, usuários privilegiados e trilha de auditoria."
              href="/admin"
              cta="Abrir admin"
            />
          </div>
        </div>

        <div className="app-panel p-5">
          <div className="eyebrow">Observabilidade e backup</div>
          <h2 className="mt-2 text-xl font-display text-white">Controles operacionais</h2>
          <p className="mt-2 text-sm text-text-muted">
            Backup, exportação e conectividade ficam em destaque para reduzir risco operacional da mesa.
          </p>
          <div className="mt-5">
            <SnapshotControlPanel />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SessionHistoryPanel />
        <AppDiagnosticsPanel />
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow">Biblioteca de campanhas</div>
            <h2 className="mt-2 text-2xl font-display text-white">Explorar frentes narrativas</h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Cards reorganizados com mais contraste, progresso visível e leitura rápida de jogadores, cenas e atualização recente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TabButton label="Todas" active={tab === 'ALL'} onClick={() => setTab('ALL')} />
            <TabButton label="Ativas" active={tab === 'ACTIVE'} onClick={() => setTab('ACTIVE')} />
            <TabButton label="Arquivadas" active={tab === 'ARCHIVED'} onClick={() => setTab('ARCHIVED')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {campaigns
            .filter((campaign) => {
              if (tab === 'ACTIVE') return campaign.progress > 0 && campaign.progress < 100
              if (tab === 'ARCHIVED') return campaign.progress >= 100
              return true
            })
            .map((campaign) => (
              <Link
                to={`/campaigns/${campaign.campaignId}`}
                key={campaign.id}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface/75 shadow-soft-md transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-soft-lg"
              >
                <div className="relative h-56 overflow-hidden">
                  <img src={campaign.coverDataUrl || images[campaign.id] || loginBg} alt={campaign.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white backdrop-blur-md">
                    <Sparkles size={12} className="text-primary" />
                    {campaign.sceneCount} cenas
                  </div>
                  <div className="absolute right-4 top-4">
                    <button
                      aria-label="Mais opções"
                      onClick={(event) => {
                        event.preventDefault()
                        navigate(`/campaigns/${campaign.campaignId}`)
                      }}
                      className="rounded-2xl border border-white/10 bg-black/30 p-2 text-white/80 backdrop-blur-md transition-colors hover:text-white"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
                      <span className="text-sm font-semibold text-white">{campaign.players} jogadores</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                        Atualizada {new Date(campaign.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-xl font-display font-semibold text-white transition-colors group-hover:text-secondary">{campaign.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{campaign.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-text-muted">
                      <span>Progresso narrativo</span>
                      <span>{campaign.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-secondary via-accent to-primary transition-all"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="chip">
                      <Users size={12} />
                      {campaign.players} jogadores
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                      Abrir campanha
                      <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

          <Link
            to="/campaigns/new"
            className="group flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-text-muted transition-all hover:border-primary/35 hover:bg-primary/5 hover:text-white"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-primary/25 bg-primary/10 text-4xl text-primary shadow-ember transition-transform duration-300 group-hover:scale-105">
              +
            </div>
            <div>
              <div className="text-lg font-display font-semibold text-white">Criar nova campanha</div>
              <p className="mt-2 max-w-xs text-sm text-text-muted">
                Inicie um novo arco com identidade visual já alinhada ao workspace atualizado.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Link to={href} className="glass-card flex h-full flex-col justify-between p-5">
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-secondary">
          <Icon size={18} />
        </span>
        <h3 className="mt-4 text-xl font-display font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
        {cta}
        <ChevronRight size={16} />
      </span>
    </Link>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        'rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all',
        active
          ? 'border-secondary/35 bg-secondary/15 text-white shadow-soft-md'
          : 'border-white/10 bg-white/[0.03] text-text-muted hover:border-white/20 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
