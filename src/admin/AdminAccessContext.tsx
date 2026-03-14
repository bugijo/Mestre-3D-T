import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAuditEntry,
  createPrivilegedUserRecord,
  createTotpUri,
  decryptUserTotpSecret,
  type AdminSession,
  type AdminSystemSettings,
  type AdminVaultState,
  type AuditEntry,
  type PrivilegedRole,
  type PrivilegedUser,
  verifyPassword,
  verifyTotpCode,
} from '@/lib/adminSecurity'
import { logError, logInfo, logWarn } from '@/lib/logger'
import {
  ADMIN_VAULT_STORAGE_KEY,
  ADMIN_VAULT_SYNC_KEY,
  hydrateAdminVault,
  loadLocalAdminVault,
  persistAdminVault,
} from '@/admin/adminVaultPersistence'

const MAX_AUDIT_ENTRIES = 300
const CHALLENGE_TTL_MS = 5 * 60 * 1000

type PendingChallenge = {
  userId: string
  email: string
  password: string
  issuedAt: number
}

type CreatePrivilegedUserInput = {
  name: string
  email: string
  password: string
  role: PrivilegedRole
}

type AdminAccessContextValue = {
  vault: AdminVaultState
  currentUser: PrivilegedUser | null
  isBootstrapRequired: boolean
  isAuthenticated: boolean
  pendingChallengeEmail: string | null
  bootstrapFirstUser: (input: Omit<CreatePrivilegedUserInput, 'role'> & { role?: PrivilegedRole }) => Promise<{ ok: boolean; secret?: string; error?: string }>
  beginLogin: (email: string, password: string) => Promise<{ ok: boolean; requiresTwoFactor?: boolean; error?: string }>
  verifySecondFactor: (code: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  createPrivilegedUser: (input: CreatePrivilegedUserInput) => Promise<{ ok: boolean; secret?: string; error?: string }>
  togglePrivilegedUserActive: (userId: string) => { ok: boolean; error?: string }
  updateSystemSettings: (patch: Partial<AdminSystemSettings>) => void
  appendAudit: (entry: Omit<AuditEntry, 'id' | 'createdAt'>) => void
}

const AdminAccessContext = createContext<AdminAccessContextValue | null>(null)

function loadVault() {
  return loadLocalAdminVault()
}

function challengeIsValid(challenge: PendingChallenge | null) {
  return !!challenge && Date.now() - challenge.issuedAt <= CHALLENGE_TTL_MS
}

function sessionIsValid(session: AdminSession | null) {
  if (!session) return false
  return session.expiresAt > Date.now()
}

function sanitizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function sanitizeName(value: string) {
  return value.trim()
}

function createSession(user: PrivilegedUser, timeoutMinutes: number) {
  return {
    userId: user.id,
    role: user.role,
    grantedAt: Date.now(),
    expiresAt: Date.now() + timeoutMinutes * 60 * 1000,
  } satisfies AdminSession
}

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const [vault, setVault] = useState<AdminVaultState>(() => {
    const loaded = loadVault()
    if (!sessionIsValid(loaded.session)) {
      return { ...loaded, session: null }
    }
    return loaded
  })
  const [hasHydratedVault, setHasHydratedVault] = useState(false)
  const [pendingChallengeEmail, setPendingChallengeEmail] = useState<string | null>(null)
  const pendingChallengeRef = useRef<PendingChallenge | null>(null)

  useEffect(() => {
    if (!hasHydratedVault) return
    void persistAdminVault(vault)
  }, [hasHydratedVault, vault])

  useEffect(() => {
    let active = true

    void hydrateAdminVault()
      .then((remoteVault) => {
        if (!active) return
        setVault((current) => {
          const currentHasData = current.users.length > 0 || current.auditEntries.length > 0 || current.session !== null
          const remoteHasData = remoteVault.users.length > 0 || remoteVault.auditEntries.length > 0 || remoteVault.session !== null
          if (currentHasData && !remoteHasData) return current
          return remoteVault
        })
        setHasHydratedVault(true)
      })
      .catch((error) => {
        logError('admin-access:hydrate-remote-vault', error)
        setHasHydratedVault(true)
      })

    return () => {
      active = false
    }
  }, [])

  const currentUser = useMemo(
    () => vault.users.find((user) => user.id === vault.session?.userId) ?? null,
    [vault.session?.userId, vault.users],
  )

  const appendAudit = (entry: Omit<AuditEntry, 'id' | 'createdAt'>) => {
    setVault((current) => ({
      ...current,
      auditEntries: [createAuditEntry(entry), ...current.auditEntries].slice(0, MAX_AUDIT_ENTRIES),
    }))
  }

  const clearPendingChallenge = () => {
    pendingChallengeRef.current = null
    setPendingChallengeEmail(null)
  }

  const bootstrapFirstUser: AdminAccessContextValue['bootstrapFirstUser'] = async (input) => {
    if (vault.users.length > 0) {
      return { ok: false, error: 'O cofre administrativo ja foi inicializado.' }
    }

    try {
      const normalizedEmail = sanitizeEmail(input.email)
      const normalizedName = sanitizeName(input.name)
      if (!normalizedEmail || !normalizedName || !input.password.trim()) {
        return { ok: false, error: 'Preencha nome, email e senha.' }
      }

      const { user, totpSecret } = await createPrivilegedUserRecord({
        id: crypto.randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        password: input.password,
        role: input.role || 'CEO',
      })

      setVault((current) => ({
        ...current,
        users: [user],
      }))
      appendAudit({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'admin.bootstrap',
        targetType: 'admin-user',
        targetId: user.id,
        status: 'success',
        severity: 'critical',
        details: 'Primeiro usuario privilegiado criado.',
      })
      logInfo('admin-access:bootstrap', 'Primeiro usuario privilegiado criado', { email: user.email, role: user.role })
      return { ok: true, secret: totpSecret }
    } catch (error) {
      logError('admin-access:bootstrap', error)
      return { ok: false, error: 'Falha ao inicializar o cofre administrativo.' }
    }
  }

  const beginLogin: AdminAccessContextValue['beginLogin'] = async (email, password) => {
    const normalizedEmail = sanitizeEmail(email)
    const user = vault.users.find((entry) => entry.email === normalizedEmail)

    if (!user || !user.isActive) {
      appendAudit({
        actorUserId: null,
        actorEmail: normalizedEmail,
        action: 'admin.login',
        targetType: 'admin-session',
        targetId: null,
        status: 'failure',
        severity: 'warning',
        details: 'Tentativa de login com usuario inexistente ou inativo.',
      })
      return { ok: false, error: 'Usuario nao encontrado ou inativo.' }
    }

    const passwordMatches = await verifyPassword(user, password)
    if (!passwordMatches) {
      appendAudit({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'admin.login',
        targetType: 'admin-session',
        targetId: user.id,
        status: 'failure',
        severity: 'warning',
        details: 'Senha incorreta.',
      })
      return { ok: false, error: 'Credenciais invalidas.' }
    }

    pendingChallengeRef.current = {
      userId: user.id,
      email: user.email,
      password,
      issuedAt: Date.now(),
    }
    setPendingChallengeEmail(user.email)
    appendAudit({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'admin.login.password',
      targetType: 'admin-session',
      targetId: user.id,
      status: 'success',
      severity: 'info',
      details: 'Senha validada. Aguardando segundo fator.',
    })
    return { ok: true, requiresTwoFactor: true }
  }

  const verifySecondFactor: AdminAccessContextValue['verifySecondFactor'] = async (code) => {
    const challenge = pendingChallengeRef.current
    if (!challenge) return { ok: false, error: 'Nenhum desafio de autenticacao pendente.' }
    if (!challengeIsValid(challenge)) {
      clearPendingChallenge()
      appendAudit({
        actorUserId: challenge.userId,
        actorEmail: challenge.email,
        action: 'admin.login.2fa',
        targetType: 'admin-session',
        targetId: challenge.userId,
        status: 'failure',
        severity: 'warning',
        details: 'Desafio 2FA expirado.',
      })
      return { ok: false, error: 'Desafio 2FA expirado. Reinicie o login.' }
    }

    const user = vault.users.find((entry) => entry.id === challenge.userId)
    if (!user) return { ok: false, error: 'Usuario nao encontrado.' }

    try {
      const secret = await decryptUserTotpSecret(user, challenge.password)
      const isValidCode = await verifyTotpCode(secret, code)
      if (!isValidCode) {
        appendAudit({
          actorUserId: user.id,
          actorEmail: user.email,
          action: 'admin.login.2fa',
          targetType: 'admin-session',
          targetId: user.id,
          status: 'failure',
          severity: 'warning',
          details: 'Codigo 2FA invalido.',
        })
        return { ok: false, error: 'Codigo 2FA invalido.' }
      }

      const session = createSession(user, vault.systemSettings.sessionTimeoutMinutes)
      setVault((current) => ({
        ...current,
        session,
        users: current.users.map((entry) =>
          entry.id === user.id ? { ...entry, lastLoginAt: Date.now(), updatedAt: Date.now() } : entry,
        ),
      }))
      clearPendingChallenge()
      appendAudit({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'admin.login.2fa',
        targetType: 'admin-session',
        targetId: user.id,
        status: 'success',
        severity: 'critical',
        details: 'Autenticacao administrativa concluida.',
      })
      return { ok: true }
    } catch (error) {
      logError('admin-access:verify-2fa', error)
      return { ok: false, error: 'Nao foi possivel validar o segundo fator.' }
    }
  }

  const logout = () => {
    if (currentUser) {
      appendAudit({
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        action: 'admin.logout',
        targetType: 'admin-session',
        targetId: currentUser.id,
        status: 'success',
        severity: 'info',
        details: 'Sessao administrativa encerrada.',
      })
    }
    clearPendingChallenge()
    setVault((current) => ({ ...current, session: null }))
  }

  const createPrivilegedUser: AdminAccessContextValue['createPrivilegedUser'] = async (input) => {
    if (!currentUser || currentUser.role !== 'CEO') {
      return { ok: false, error: 'Apenas o CEO pode cadastrar novos usuarios privilegiados.' }
    }
    if (!vault.systemSettings.allowAdminUserCreation) {
      return { ok: false, error: 'O cadastro de administradores esta bloqueado nas configuracoes.' }
    }
    const normalizedEmail = sanitizeEmail(input.email)
    if (vault.users.some((entry) => entry.email === normalizedEmail)) {
      return { ok: false, error: 'Ja existe um usuario privilegiado com este email.' }
    }

    try {
      const { user, totpSecret } = await createPrivilegedUserRecord({
        id: crypto.randomUUID(),
        name: sanitizeName(input.name),
        email: normalizedEmail,
        password: input.password,
        role: input.role,
      })
      setVault((current) => ({
        ...current,
        users: [user, ...current.users],
      }))
      appendAudit({
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        action: 'admin.user.create',
        targetType: 'admin-user',
        targetId: user.id,
        status: 'success',
        severity: 'critical',
        details: `Usuario privilegiado criado com role ${user.role}.`,
      })
      return { ok: true, secret: totpSecret }
    } catch (error) {
      logError('admin-access:create-user', error)
      return { ok: false, error: 'Falha ao criar usuario privilegiado.' }
    }
  }

  const togglePrivilegedUserActive: AdminAccessContextValue['togglePrivilegedUserActive'] = (userId) => {
    if (!currentUser || currentUser.role !== 'CEO') {
      return { ok: false, error: 'Apenas o CEO pode alterar o status de contas privilegiadas.' }
    }

    const targetUser = vault.users.find((entry) => entry.id === userId)
    if (!targetUser) return { ok: false, error: 'Usuario nao encontrado.' }
    if (targetUser.id === currentUser.id) {
      return { ok: false, error: 'Nao e permitido desativar a propria conta ativa.' }
    }

    setVault((current) => ({
      ...current,
      users: current.users.map((entry) =>
        entry.id === userId ? { ...entry, isActive: !entry.isActive, updatedAt: Date.now() } : entry,
      ),
    }))
    appendAudit({
      actorUserId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'admin.user.toggle-active',
      targetType: 'admin-user',
      targetId: userId,
      status: 'success',
      severity: 'critical',
      details: `Status da conta alterado para ${targetUser.isActive ? 'inativa' : 'ativa'}.`,
    })
    return { ok: true }
  }

  const updateSystemSettings = (patch: Partial<AdminSystemSettings>) => {
    if (!currentUser) return
    setVault((current) => ({
      ...current,
      systemSettings: {
        ...current.systemSettings,
        ...patch,
      },
      session: current.session
        ? { ...current.session, expiresAt: Date.now() + (patch.sessionTimeoutMinutes ?? current.systemSettings.sessionTimeoutMinutes) * 60 * 1000 }
        : current.session,
    }))
    appendAudit({
      actorUserId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'admin.settings.update',
      targetType: 'system-settings',
      targetId: null,
      status: 'success',
      severity: 'critical',
      details: 'Configuracoes administrativas atualizadas.',
    })
  }

  useEffect(() => {
    if (!vault.session) return
    if (sessionIsValid(vault.session)) return
    logWarn('admin-access:session-expired', 'Sessao administrativa expirada')
    setVault((current) => ({ ...current, session: null }))
  }, [vault.session])

  useEffect(() => {
    if (!vault.session || !currentUser) return
    if (currentUser.isActive) return
    logWarn('admin-access:session-revoked', 'Sessao administrativa revogada por desativacao da conta', {
      userId: currentUser.id,
    })
    setVault((current) => ({ ...current, session: null }))
  }, [currentUser, vault.session])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_VAULT_STORAGE_KEY && event.key !== ADMIN_VAULT_SYNC_KEY) return
      setVault(loadVault())
      if (!event.newValue) clearPendingChallenge()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<AdminAccessContextValue>(
    () => ({
      vault,
      currentUser,
      isBootstrapRequired: vault.users.length === 0,
      isAuthenticated: sessionIsValid(vault.session) && currentUser != null && currentUser.isActive,
      pendingChallengeEmail,
      bootstrapFirstUser,
      beginLogin,
      verifySecondFactor,
      logout,
      createPrivilegedUser,
      togglePrivilegedUserActive,
      updateSystemSettings,
      appendAudit,
    }),
    [currentUser, pendingChallengeEmail, vault],
  )

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>
}

export function useAdminAccess() {
  const context = useContext(AdminAccessContext)
  if (!context) throw new Error('AdminAccessProvider ausente')
  return context
}

export function formatTotpSetupSecret(email: string, secret: string) {
  return {
    secret,
    uri: createTotpUri(email, secret),
  }
}
