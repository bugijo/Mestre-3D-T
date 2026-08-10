import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, Clipboard, Coins, Database, Fingerprint, KeyRound, Lock, ShieldCheck, UserCog, Users } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { useAdminAccess, formatTotpSetupSecret } from '@/admin/AdminAccessContext'
import { buildAdminMetrics } from '@/admin/adminMetrics'
import { PageHero } from '@/components/ui/PageHero'
import { MetricTile } from '@/components/ui/MetricTile'
import { getLogEntries } from '@/lib/logger'
import { formatDuration } from '@/lib/sessionReports'
import { safeClipboard } from '@/lib/clipboard'

export function AdminPortal() {
  const { state } = useAppStore()
  const {
    vault,
    currentUser,
    isBootstrapRequired,
    isAuthenticated,
    pendingChallengeEmail,
    bootstrapFirstUser,
    beginLogin,
    verifySecondFactor,
    logout,
    createPrivilegedUser,
    togglePrivilegedUserActive,
    updateSystemSettings,
    appendAudit,
  } = useAdminAccess()
  const [bootstrapForm, setBootstrapForm] = useState({ name: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' as 'ADMIN' | 'CEO' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [totpSetup, setTotpSetup] = useState<{ secret: string; email: string } | null>(null)
  const auditLoggedRef = useRef(false)

  const appLogs = useMemo(() => getLogEntries(), [vault.auditEntries.length])
  const metrics = useMemo(() => buildAdminMetrics(state, vault, appLogs), [appLogs, state, vault])
  const recentUsers = useMemo(() => [...vault.users].sort((a, b) => b.createdAt - a.createdAt), [vault.users])
  const recentAudit = useMemo(() => vault.auditEntries.slice(0, 12), [vault.auditEntries])

  useEffect(() => {
    if (!isAuthenticated || !currentUser || auditLoggedRef.current) return
    appendAudit({
      actorUserId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'admin.portal.view',
      targetType: 'admin-portal',
      targetId: currentUser.id,
      status: 'success',
      severity: 'info',
      details: 'Painel administrativo acessado.',
    })
    auditLoggedRef.current = true
  }, [appendAudit, currentUser, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      auditLoggedRef.current = false
    }
  }, [isAuthenticated])

  const copySetupSecret = async () => {
    if (!totpSetup) return
    const payload = formatTotpSetupSecret(totpSetup.email, totpSetup.secret)
    await safeClipboard(`${payload.secret}\n${payload.uri}`)
    setFeedback('Segredo 2FA copiado para a area de transferencia.')
  }

  if (isBootstrapRequired) {
    return (
      <BootstrapPanel
        form={bootstrapForm}
        feedback={feedback}
        onChange={setBootstrapForm}
        onSubmit={async () => {
          const result = await bootstrapFirstUser({ ...bootstrapForm, role: 'CEO' })
          if (!result.ok || !result.secret) {
            setFeedback(result.error || 'Falha ao inicializar o cofre administrativo.')
            return
          }
          setTotpSetup({ secret: result.secret, email: bootstrapForm.email.trim().toLowerCase() })
          setFeedback('CEO inicial criado. Registre o segredo 2FA antes de entrar.')
        }}
        setup={totpSetup}
        onCopySetup={copySetupSecret}
      />
    )
  }

  if (!isAuthenticated && pendingChallengeEmail) {
    return (
      <SecondFactorPanel
        email={pendingChallengeEmail}
        code={twoFactorCode}
        feedback={feedback}
        onChange={setTwoFactorCode}
        onSubmit={async () => {
          const result = await verifySecondFactor(twoFactorCode)
          setFeedback(result.ok ? 'Autenticacao administrativa concluida.' : result.error || 'Codigo invalido.')
          if (result.ok) setTwoFactorCode('')
        }}
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        form={loginForm}
        feedback={feedback}
        onChange={setLoginForm}
        onSubmit={async () => {
          const result = await beginLogin(loginForm.email, loginForm.password)
          setFeedback(result.ok ? 'Senha validada. Informe o segundo fator.' : result.error || 'Falha no login.')
        }}
      />
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHero
        eyebrow="Governanca privilegiada"
        title={
          <>
            Painel <span className="text-gradient-primary">Administrativo</span>
          </>
        }
        description="Visao consolidada da operacao da plataforma com controles restritos, auditoria, metricas executivas e governanca de contas privilegiadas para administradores e CEO."
        actions={
          <>
            <span className="badge">{currentUser?.role}</span>
            <span className="badge">{currentUser?.email}</span>
            <button type="button" onClick={logout} className="btn-danger">
              Encerrar sessao admin
            </button>
          </>
        }
        aside={
          <div className="app-panel-muted max-w-sm p-5">
            <div className="eyebrow">Postura de seguranca</div>
            <div className="mt-3 space-y-3 text-sm text-text-secondary">
              <p>2FA obrigatorio para todas as contas administrativas.</p>
              <p>Segredos protegidos com AES-GCM e senha derivada via PBKDF2.</p>
              <p>Auditoria persistida para acessos e alteracoes sensiveis.</p>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Database} label="Campanhas" value={`${metrics.totalCampaigns}`} detail={`${metrics.totalScenes} cenas`} tone="secondary" />
        <MetricTile icon={Users} label="Usuarios da mesa" value={`${metrics.totalPlayers}`} detail={`${metrics.totalCharacters} personagens`} tone="success" />
        <MetricTile icon={Coins} label="Financeiro" value={`${metrics.totalGoldInCirculation} ouro`} detail={`${metrics.totalRewardsDistributed} distribuido`} tone="primary" />
        <MetricTile icon={ShieldCheck} label="Administracao" value={`${metrics.activePrivilegedUsers} contas ativas`} detail={`${metrics.totalAuditEvents} eventos auditados`} tone="secondary" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Painel consolidado</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StatRow label="Sessoes registradas" value={`${metrics.totalSessions}`} />
            <StatRow label="Combates armazenados" value={`${metrics.totalCombatEncounters}`} />
            <StatRow label="Duracao media" value={formatDuration(metrics.averageSessionDurationMs)} />
            <StatRow label="Sessao ativa" value={metrics.activeSession ? 'Sim' : 'Nao'} />
            <StatRow label="Erros de app" value={`${metrics.totalAppErrors}`} />
            <StatRow label="Maintenance mode" value={vault.systemSettings.maintenanceMode ? 'Ativo' : 'Desligado'} />
          </div>
        </div>

        <div className="app-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-300" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Seguranca</h2>
          </div>
          <div className="space-y-3 text-sm text-text-muted">
            <p>2FA obrigatorio para todas as contas administrativas.</p>
            <p>Segredos TOTP armazenados com AES-GCM derivado da senha do usuario.</p>
            <p>Hash de senha persistido via PBKDF2 SHA-256.</p>
            <p>Trilha de auditoria local persistida para logins, acessos e alteracoes sensiveis.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="app-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserCog size={16} className="text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Usuarios privilegiados</h2>
          </div>

          {currentUser?.role === 'CEO' && (
            <div className="mb-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-text-muted">Criar administrador</div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={newUserForm.name} onChange={(event) => setNewUserForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome" className="field" />
                <input value={newUserForm.email} onChange={(event) => setNewUserForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="field" />
                <input value={newUserForm.password} onChange={(event) => setNewUserForm((current) => ({ ...current, password: event.target.value }))} type="password" placeholder="Senha" className="field" />
                <select value={newUserForm.role} onChange={(event) => setNewUserForm((current) => ({ ...current, role: event.target.value as 'ADMIN' | 'CEO' }))} className="field">
                  <option value="ADMIN">ADMIN</option>
                  <option value="CEO">CEO</option>
                </select>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const result = await createPrivilegedUser(newUserForm)
                  if (!result.ok || !result.secret) {
                    setFeedback(result.error || 'Falha ao criar usuario privilegiado.')
                    return
                  }
                  setTotpSetup({ secret: result.secret, email: newUserForm.email.trim().toLowerCase() })
                  setFeedback('Conta privilegiada criada com 2FA habilitado.')
                  setNewUserForm({ name: '', email: '', password: '', role: 'ADMIN' })
                }}
                className="btn-primary mt-3"
              >
                Criar conta privilegiada
              </button>
            </div>
          )}

          <div className="space-y-3">
            {recentUsers.map((user) => (
              <article key={user.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-text-muted">{user.email}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-white">{user.role}</span>
                    <span className={`rounded-full border px-2 py-1 ${user.isActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-rose-400/20 bg-rose-400/10 text-rose-100'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-white">2FA</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  <span>Ultimo login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Nunca'}</span>
                  {currentUser?.role === 'CEO' && currentUser.id !== user.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const result = togglePrivilegedUserActive(user.id)
                        setFeedback(result.ok ? 'Status da conta atualizado.' : result.error || 'Falha ao alterar status.')
                      }}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      {user.isActive ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="app-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={16} className="text-amber-300" />
              <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Configuracoes do sistema</h2>
            </div>
            <div className="space-y-4">
              <ToggleRow
                label="Maintenance mode"
                value={vault.systemSettings.maintenanceMode}
                onChange={(value) => updateSystemSettings({ maintenanceMode: value })}
              />
              <ToggleRow
                label="Permitir criacao de admins"
                value={vault.systemSettings.allowAdminUserCreation}
                onChange={(value) => updateSystemSettings({ allowAdminUserCreation: value })}
              />
              <NumericRow
                label="Timeout da sessao admin (min)"
                value={vault.systemSettings.sessionTimeoutMinutes}
                onChange={(value) => updateSystemSettings({ sessionTimeoutMinutes: value })}
              />
              <NumericRow
                label="Threshold financeiro"
                value={vault.systemSettings.financeAlertThreshold}
                onChange={(value) => updateSystemSettings({ financeAlertThreshold: value })}
              />
              <NumericRow
                label="Retencao de auditoria (dias)"
                value={vault.systemSettings.auditRetentionDays}
                onChange={(value) => updateSystemSettings({ auditRetentionDays: value })}
              />
            </div>
          </section>

          <section className="app-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Fingerprint size={16} className="text-secondary" />
              <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">2FA e provisao</h2>
            </div>
            {totpSetup ? (
              <div className="space-y-3 text-sm text-text-muted">
                <p>Registre o segredo abaixo em um autenticador TOTP compativel.</p>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white break-all">{totpSetup.secret}</div>
                <button type="button" onClick={copySetupSecret} className="btn-ghost">
                  <span className="inline-flex items-center gap-2">
                    <Clipboard size={14} />
                    Copiar segredo e URI
                  </span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum segredo 2FA pendente de provisao.</p>
            )}
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="app-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Auditoria administrativa</h2>
          </div>
          <div className="space-y-3">
            {recentAudit.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-text-muted">
                Nenhum evento de auditoria registrado ainda.
              </div>
            ) : (
              recentAudit.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                    <span>{entry.action}</span>
                    <span>{new Date(entry.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="mt-2 text-sm text-white">{entry.details}</div>
                  <div className="mt-1 text-xs text-text-muted">
                    {entry.actorEmail || 'Origem anonima'} • {entry.status} • {entry.severity}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="app-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Eventos da plataforma</h2>
          </div>
          <div className="space-y-3">
            {appLogs.slice(0, 12).map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                  <span>{entry.source}</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <div className="mt-2 text-sm text-white">{entry.message}</div>
                {entry.context ? <div className="mt-1 line-clamp-2 text-xs text-text-muted">{entry.context}</div> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {feedback ? <div className="app-panel-muted px-4 py-3 text-sm text-white">{feedback}</div> : null}
    </div>
  )
}

function BootstrapPanel({
  form,
  feedback,
  setup,
  onChange,
  onSubmit,
  onCopySetup,
}: {
  form: { name: string; email: string; password: string }
  feedback: string | null
  setup: { secret: string; email: string } | null
  onChange: (value: { name: string; email: string; password: string }) => void
  onSubmit: () => Promise<void>
  onCopySetup: () => Promise<void>
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHero
        eyebrow="Bootstrap"
        title="Inicializar acesso CEO"
        description="Crie a primeira conta privilegiada da plataforma. Esta etapa aparece uma unica vez e estabelece o cofre administrativo local."
      />

      <section className="app-panel p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Nome completo" className="field" />
          <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} placeholder="Email privilegiado" className="field" />
          <input value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} type="password" placeholder="Senha forte" className="field md:col-span-2" />
        </div>
        <button type="button" onClick={onSubmit} className="btn-primary mt-4">
          Criar CEO inicial
        </button>
      </section>

      {setup ? (
        <section className="app-panel p-6">
          <div className="text-sm text-text-muted">Segredo 2FA do CEO</div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white break-all">{setup.secret}</div>
          <button type="button" onClick={onCopySetup} className="btn-ghost mt-4">
            Copiar segredo e URI
          </button>
        </section>
      ) : null}

      {feedback ? <div className="app-panel-muted px-4 py-3 text-sm text-white">{feedback}</div> : null}
    </div>
  )
}

function LoginPanel({
  form,
  feedback,
  onChange,
  onSubmit,
}: {
  form: { email: string; password: string }
  feedback: string | null
  onChange: (value: { email: string; password: string }) => void
  onSubmit: () => Promise<void>
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <PageHero
        eyebrow="Acesso restrito"
        title="Entrar no painel admin"
        description="Somente perfis com role ADMIN ou CEO podem prosseguir. O segundo fator sera exigido apos a validacao da senha."
      />
      <section className="app-panel p-6">
        <div className="grid gap-4">
          <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} placeholder="Email administrativo" className="field" />
          <input value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} type="password" placeholder="Senha" className="field" />
        </div>
        <button type="button" onClick={onSubmit} className="btn-secondary mt-4">
          Validar senha
        </button>
      </section>
      {feedback ? <div className="app-panel-muted px-4 py-3 text-sm text-white">{feedback}</div> : null}
    </div>
  )
}

function SecondFactorPanel({
  email,
  code,
  feedback,
  onChange,
  onSubmit,
}: {
  email: string
  code: string
  feedback: string | null
  onChange: (value: string) => void
  onSubmit: () => Promise<void>
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <PageHero
        eyebrow="Segundo fator"
        title="Confirmar autenticacao"
        description={<>Informe o codigo TOTP do autenticador vinculado a {email}.</>}
      />
      <section className="app-panel p-6">
        <input value={code} onChange={(event) => onChange(event.target.value)} placeholder="Codigo 2FA" className="field" />
        <button type="button" onClick={onSubmit} className="btn-primary mt-4">
          Validar 2FA
        </button>
      </section>
      {feedback ? <div className="app-panel-muted px-4 py-3 text-sm text-white">{feedback}</div> : null}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-white">{label}</span>
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-white/10 bg-surface-highlight text-secondary" />
    </label>
  )
}

function NumericRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-white">{label}</span>
      <input
        type="number"
        value={value}
        min={1}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
        className="mt-2 field"
      />
    </label>
  )
}
