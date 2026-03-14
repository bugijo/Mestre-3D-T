import { logError } from '@/lib/logger'

export type PrivilegedRole = 'ADMIN' | 'CEO'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export type AuditEntry = {
  id: string
  actorUserId: string | null
  actorEmail: string | null
  action: string
  targetType: string
  targetId: string | null
  status: 'success' | 'failure'
  severity: AuditSeverity
  createdAt: number
  details: string
}

export type PrivilegedUser = {
  id: string
  name: string
  email: string
  role: PrivilegedRole
  passwordHash: string
  passwordSalt: string
  encryptionSalt: string
  totpSecretCiphertext: string
  totpSecretIv: string
  twoFactorEnabled: boolean
  isActive: boolean
  createdAt: number
  updatedAt: number
  lastLoginAt: number | null
}

export type AdminSystemSettings = {
  maintenanceMode: boolean
  sessionTimeoutMinutes: number
  financeAlertThreshold: number
  auditRetentionDays: number
  allowAdminUserCreation: boolean
}

export type AdminSession = {
  userId: string
  role: PrivilegedRole
  grantedAt: number
  expiresAt: number
}

export type AdminVaultState = {
  version: 1
  users: PrivilegedUser[]
  auditEntries: AuditEntry[]
  systemSettings: AdminSystemSettings
  session: AdminSession | null
}

const VAULT_VERSION = 1
const HASH_ITERATIONS = 120_000
const DEFAULT_TIME_STEP_SECONDS = 30

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const DEFAULT_ADMIN_SYSTEM_SETTINGS: AdminSystemSettings = {
  maintenanceMode: false,
  sessionTimeoutMinutes: 20,
  financeAlertThreshold: 500,
  auditRetentionDays: 30,
  allowAdminUserCreation: true,
}

function encoder() {
  return new TextEncoder()
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function toByteView(bytes: Uint8Array) {
  return new Uint8Array(bytes)
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function leftPad(value: string, size: number) {
  return value.padStart(size, '0')
}

function normalizeBase32(input: string) {
  return input.replace(/=+$/g, '').replace(/[^A-Z2-7]/gi, '').toUpperCase()
}

export function base32Encode(bytes: Uint8Array) {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

export function base32Decode(input: string) {
  const normalized = normalizeBase32(input)
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return new Uint8Array(bytes)
}

async function derivePasswordBits(password: string) {
  const imported = await crypto.subtle.importKey('raw', encoder().encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
  return imported
}

async function hashPassword(password: string, saltBase64: string) {
  const salt = base64ToBytes(saltBase64)
  const keyMaterial = await derivePasswordBits(password)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return bytesToBase64(new Uint8Array(bits))
}

async function deriveAesKey(password: string, saltBase64: string) {
  const salt = base64ToBytes(saltBase64)
  const keyMaterial = await derivePasswordBits(password)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder().encode(value))
  return bytesToBase64(new Uint8Array(digest))
}

export async function encryptSensitiveText(password: string, plaintext: string, encryptionSaltBase64?: string) {
  const encryptionSalt = encryptionSaltBase64 || bytesToBase64(randomBytes(16))
  const iv = randomBytes(12)
  const key = await deriveAesKey(password, encryptionSalt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, toByteView(encoder().encode(plaintext)))
  return {
    encryptionSalt,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptSensitiveText(password: string, encryptionSaltBase64: string, ivBase64: string, ciphertextBase64: string) {
  const key = await deriveAesKey(password, encryptionSaltBase64)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivBase64) },
    key,
    toByteView(base64ToBytes(ciphertextBase64)),
  )
  return new TextDecoder().decode(decrypted)
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20))
}

async function hmacSha1(secretBytes: Uint8Array, counter: number) {
  const key = await crypto.subtle.importKey('raw', toByteView(secretBytes), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(4, counter, false)
  const signature = await crypto.subtle.sign('HMAC', key, buffer)
  return new Uint8Array(signature)
}

export async function generateTotpCode(secretBase32: string, timestamp = Date.now(), digits = 6) {
  const secretBytes = base32Decode(secretBase32)
  const counter = Math.floor(timestamp / 1000 / DEFAULT_TIME_STEP_SECONDS)
  const digest = await hmacSha1(secretBytes, counter)
  const offset = digest[digest.length - 1] & 0x0f
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  const code = binary % 10 ** digits
  return leftPad(String(code), digits)
}

export async function verifyTotpCode(secretBase32: string, code: string, timestamp = Date.now(), window = 1) {
  const normalizedCode = code.replace(/\D/g, '')
  for (let step = -window; step <= window; step += 1) {
    const candidate = await generateTotpCode(secretBase32, timestamp + step * DEFAULT_TIME_STEP_SECONDS * 1000)
    if (candidate === normalizedCode) return true
  }
  return false
}

export async function createPrivilegedUserRecord(input: {
  id: string
  name: string
  email: string
  password: string
  role: PrivilegedRole
}) {
  const passwordSalt = bytesToBase64(randomBytes(16))
  const passwordHash = await hashPassword(input.password, passwordSalt)
  const totpSecret = generateTotpSecret()
  const encryptedSecret = await encryptSensitiveText(input.password, totpSecret)
  const now = Date.now()

  const user: PrivilegedUser = {
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    passwordHash,
    passwordSalt,
    encryptionSalt: encryptedSecret.encryptionSalt,
    totpSecretCiphertext: encryptedSecret.ciphertext,
    totpSecretIv: encryptedSecret.iv,
    twoFactorEnabled: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  }

  return { user, totpSecret }
}

export async function verifyPassword(user: PrivilegedUser, password: string) {
  const candidateHash = await hashPassword(password, user.passwordSalt)
  return candidateHash === user.passwordHash
}

export async function decryptUserTotpSecret(user: PrivilegedUser, password: string) {
  return decryptSensitiveText(password, user.encryptionSalt, user.totpSecretIv, user.totpSecretCiphertext)
}

export async function rotateUserTotp(user: PrivilegedUser, password: string) {
  const totpSecret = generateTotpSecret()
  const encryptedSecret = await encryptSensitiveText(password, totpSecret, user.encryptionSalt)
  return {
    totpSecret,
    user: {
      ...user,
      totpSecretCiphertext: encryptedSecret.ciphertext,
      totpSecretIv: encryptedSecret.iv,
      twoFactorEnabled: true,
      updatedAt: Date.now(),
    },
  }
}

export function createAuditEntry(input: Omit<AuditEntry, 'id' | 'createdAt'>) {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...input,
  } satisfies AuditEntry
}

export function createEmptyAdminVault(): AdminVaultState {
  return {
    version: VAULT_VERSION,
    users: [],
    auditEntries: [],
    systemSettings: { ...DEFAULT_ADMIN_SYSTEM_SETTINGS },
    session: null,
  }
}

export function isAdminVaultState(value: unknown): value is AdminVaultState {
  return typeof value === 'object' && value !== null && (value as AdminVaultState).version === VAULT_VERSION
}

export function normalizeAdminVaultState(value: AdminVaultState): AdminVaultState {
  return {
    version: VAULT_VERSION,
    users: Array.isArray(value.users) ? value.users : [],
    auditEntries: Array.isArray(value.auditEntries) ? value.auditEntries.slice(0, 300) : [],
    systemSettings: {
      maintenanceMode: Boolean(value.systemSettings?.maintenanceMode),
      sessionTimeoutMinutes: value.systemSettings?.sessionTimeoutMinutes ?? DEFAULT_ADMIN_SYSTEM_SETTINGS.sessionTimeoutMinutes,
      financeAlertThreshold: value.systemSettings?.financeAlertThreshold ?? DEFAULT_ADMIN_SYSTEM_SETTINGS.financeAlertThreshold,
      auditRetentionDays: value.systemSettings?.auditRetentionDays ?? DEFAULT_ADMIN_SYSTEM_SETTINGS.auditRetentionDays,
      allowAdminUserCreation:
        value.systemSettings?.allowAdminUserCreation ?? DEFAULT_ADMIN_SYSTEM_SETTINGS.allowAdminUserCreation,
    },
    session: value.session ?? null,
  }
}

export function createTotpUri(email: string, secret: string, issuer = 'Mestre 3D&T') {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const issuerName = encodeURIComponent(issuer)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerName}&algorithm=SHA1&digits=6&period=30`
}

export async function fingerprintSensitiveString(value: string) {
  try {
    return await sha256(value)
  } catch (error) {
    logError('admin-security:fingerprint', error)
    return ''
  }
}
