import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { AdminAccessProvider, useAdminAccess } from './AdminAccessContext'
import { generateTotpCode } from '@/lib/adminSecurity'

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useAdminAccess>) => void }) {
  const api = useAdminAccess()
  onReady(api)
  return null
}

async function setupAccessApi() {
  let current: ReturnType<typeof useAdminAccess> | null = null

  render(
    <AdminAccessProvider>
      <Probe onReady={(api) => (current = api)} />
    </AdminAccessProvider>,
  )

  await waitFor(() => expect(current).not.toBeNull())
  return () => current!
}

async function bootstrapAndLoginCeo(getApi: () => ReturnType<typeof useAdminAccess>) {
  const bootstrap = await getApi().bootstrapFirstUser({
    name: 'CEO',
    email: 'ceo@empresa.com',
    password: 'SenhaSuperForte!123',
    role: 'CEO',
  })
  expect(bootstrap.ok).toBe(true)
  if (!bootstrap.secret) throw new Error('Segredo TOTP nao retornado')

  await waitFor(() => expect(getApi().vault.users.length).toBe(1))
  const login = await getApi().beginLogin('ceo@empresa.com', 'SenhaSuperForte!123')
  expect(login.ok).toBe(true)
  const code = await generateTotpCode(bootstrap.secret)
  const verified = await getApi().verifySecondFactor(code)
  expect(verified.ok).toBe(true)
  await waitFor(() => expect(getApi().isAuthenticated).toBe(true))
  return bootstrap.secret
}

describe('AdminAccessProvider', { timeout: 20_000 }, () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.localStorage.removeItem('mestre3dt:admin-vault:v1')
  })

  it('faz bootstrap do CEO e conclui login com 2FA', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)
    expect(getApi().currentUser?.role).toBe('CEO')
  })

  it('retorna erro para login com usuario inexistente e para senha incorreta', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)
    getApi().logout()

    const missingUser = await getApi().beginLogin('naoexiste@empresa.com', 'qualquer')
    expect(missingUser.ok).toBe(false)
    expect(missingUser.error).toContain('inativo')

    const wrongPassword = await getApi().beginLogin('ceo@empresa.com', 'senha-errada')
    expect(wrongPassword.ok).toBe(false)
    expect(wrongPassword.error).toContain('Credenciais')
  })

  it('bloqueia criacao de usuario privilegiado para ADMIN (nao CEO)', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)

    const createdByCeo = await getApi().createPrivilegedUser({
      name: 'Admin Operacional',
      email: 'admin@empresa.com',
      password: 'AdminForte!123',
      role: 'ADMIN',
    })
    expect(createdByCeo.ok).toBe(true)
    if (!createdByCeo.secret) throw new Error('Segredo do admin nao retornado')

    getApi().logout()
    await waitFor(() => expect(getApi().isAuthenticated).toBe(false))

    const login = await getApi().beginLogin('admin@empresa.com', 'AdminForte!123')
    expect(login.ok).toBe(true)
    const adminCode = await generateTotpCode(createdByCeo.secret)
    const verified = await getApi().verifySecondFactor(adminCode)
    expect(verified.ok).toBe(true)
    await waitFor(() => expect(getApi().currentUser?.role).toBe('ADMIN'))

    const denied = await getApi().createPrivilegedUser({
      name: 'Outro Admin',
      email: 'outro@empresa.com',
      password: 'OutraSenha!123',
      role: 'ADMIN',
    })
    expect(denied.ok).toBe(false)
    expect(denied.error).toContain('CEO')
  })

  it('impede CEO de desativar a propria conta ativa', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)

    const currentUserId = getApi().currentUser?.id
    expect(currentUserId).toBeTruthy()
    const result = getApi().togglePrivilegedUserActive(currentUserId as string)
    expect(result.ok).toBe(false)
    expect(result.error).toContain('propria conta')
  })

  it('bloqueia cadastro quando criacao de admins esta desativada e estende sessao ao atualizar timeout', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)

    const previousExpiresAt = getApi().vault.session?.expiresAt ?? 0
    getApi().updateSystemSettings({ allowAdminUserCreation: false, sessionTimeoutMinutes: 40 })
    await waitFor(() => expect(getApi().vault.systemSettings.allowAdminUserCreation).toBe(false))
    expect((getApi().vault.session?.expiresAt ?? 0)).toBeGreaterThan(previousExpiresAt)

    const result = await getApi().createPrivilegedUser({
      name: 'Admin bloqueado',
      email: 'bloqueado@empresa.com',
      password: 'SenhaForte!123',
      role: 'ADMIN',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toContain('bloqueado')
  })

  it('nao permite bootstrap duplicado apos cofre inicializado', async () => {
    const getApi = await setupAccessApi()
    await bootstrapAndLoginCeo(getApi)

    const secondBootstrap = await getApi().bootstrapFirstUser({
      name: 'Outro CEO',
      email: 'ceo2@empresa.com',
      password: 'SenhaForte!123',
      role: 'CEO',
    })

    expect(secondBootstrap.ok).toBe(false)
    expect(secondBootstrap.error).toContain('ja foi inicializado')
  })

  it('expira desafio de 2FA antigo e exige reinicio do login', async () => {
    const dateNowSpy = vi.spyOn(Date, 'now')
    let currentTime = new Date('2026-03-11T12:00:00Z').valueOf()
    dateNowSpy.mockImplementation(() => currentTime)
    try {
      const getApi = await setupAccessApi()
      const bootstrap = await getApi().bootstrapFirstUser({
        name: 'CEO',
        email: 'ceo@empresa.com',
        password: 'SenhaSuperForte!123',
        role: 'CEO',
      })
      expect(bootstrap.ok).toBe(true)
      if (!bootstrap.secret) throw new Error('Segredo TOTP nao retornado')
      await waitFor(() => expect(getApi().vault.users.length).toBe(1))

      const login = await getApi().beginLogin('ceo@empresa.com', 'SenhaSuperForte!123')
      expect(login.ok).toBe(true)

      currentTime = new Date('2026-03-11T12:06:00Z').valueOf()
      const code = await generateTotpCode(bootstrap.secret)
      const verified = await getApi().verifySecondFactor(code)
      expect(verified.ok).toBe(false)
      expect(verified.error).toContain('expirado')
    } finally {
      dateNowSpy.mockRestore()
    }
  })
})
