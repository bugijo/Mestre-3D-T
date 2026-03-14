import { describe, expect, it } from 'vitest'
import {
  base32Decode,
  base32Encode,
  createPrivilegedUserRecord,
  decryptUserTotpSecret,
  encryptSensitiveText,
  generateTotpCode,
  verifyPassword,
  verifyTotpCode,
} from './adminSecurity'

describe('adminSecurity', () => {
  it('codifica e decodifica base32', () => {
    const raw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    const encoded = base32Encode(raw)
    const decoded = base32Decode(encoded)
    expect(Array.from(decoded)).toEqual(Array.from(raw))
  })

  it('cripta e decripta texto sensivel com senha derivada', async () => {
    const encrypted = await encryptSensitiveText('senha-super-forte', 'segredo-2fa')
    const decrypted = await decryptUserTotpSecret(
      {
        id: 'u1',
        name: 'CEO',
        email: 'ceo@empresa.com',
        role: 'CEO',
        passwordHash: '',
        passwordSalt: '',
        encryptionSalt: encrypted.encryptionSalt,
        totpSecretCiphertext: encrypted.ciphertext,
        totpSecretIv: encrypted.iv,
        twoFactorEnabled: true,
        isActive: true,
        createdAt: 0,
        updatedAt: 0,
        lastLoginAt: null,
      },
      'senha-super-forte',
    )
    expect(decrypted).toBe('segredo-2fa')
  })

  it('cria usuario privilegiado com senha validavel e TOTP funcional', async () => {
    const { user, totpSecret } = await createPrivilegedUserRecord({
      id: 'root',
      name: 'CEO',
      email: 'ceo@empresa.com',
      password: 'senha-super-forte',
      role: 'CEO',
    })
    expect(await verifyPassword(user, 'senha-super-forte')).toBe(true)
    expect(await decryptUserTotpSecret(user, 'senha-super-forte')).toBe(totpSecret)
    const code = await generateTotpCode(totpSecret, 1_700_000_000_000)
    expect(await verifyTotpCode(totpSecret, code, 1_700_000_000_000)).toBe(true)
  })
})
