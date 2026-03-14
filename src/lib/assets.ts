import loginBg from '@/assets/login-bg.webp'

const STALE_LOGIN_BG_PATTERN = /login-bg-[a-z0-9_-]+\.(png|webp|jpg|jpeg)$/i

export function getDefaultCampaignCover() {
  return loginBg
}

export function sanitizePersistedMediaUrl(value: string | null | undefined) {
  if (!value) return null
  if (value.startsWith('data:') || value.startsWith('blob:')) return value
  if (/^https?:\/\//i.test(value)) return value
  if (value.includes('login-bg.') || STALE_LOGIN_BG_PATTERN.test(value)) {
    return loginBg
  }
  return value
}
