export const DEFAULT_CAMPAIGN_SYSTEM = '3DeT Victory' as const
export const DND5E_CAMPAIGN_SYSTEM = 'D&D 5e' as const

export const SUPPORTED_CAMPAIGN_SYSTEMS = [DEFAULT_CAMPAIGN_SYSTEM, DND5E_CAMPAIGN_SYSTEM] as const

export type SupportedCampaignSystem = (typeof SUPPORTED_CAMPAIGN_SYSTEMS)[number]
export type SupportedCampaignRuleEngine = '3DT' | 'DND5E'

const LEGACY_3DT_ALIASES = new Set([
  '3d&t',
  '3d&t alpha',
  '3d&t victory',
  '3det',
  '3det alpha',
  '3det victory',
  '3dt',
  '3dt alpha',
  '3dt victory',
])

export function normalizeCampaignSystem(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return DEFAULT_CAMPAIGN_SYSTEM

  const normalized = trimmed.toLowerCase()
  if (normalized.includes('5e')) return DND5E_CAMPAIGN_SYSTEM
  if (LEGACY_3DT_ALIASES.has(normalized)) return DEFAULT_CAMPAIGN_SYSTEM
  return trimmed
}

export function isSupportedCampaignSystem(value: string | null | undefined): value is SupportedCampaignSystem {
  const normalized = normalizeCampaignSystem(value)
  return normalized === DEFAULT_CAMPAIGN_SYSTEM || normalized === DND5E_CAMPAIGN_SYSTEM
}

export function getSupportedCharacterSystemForCampaign(value: string | null | undefined): SupportedCampaignRuleEngine | null {
  const normalized = normalizeCampaignSystem(value)
  if (normalized === DEFAULT_CAMPAIGN_SYSTEM) return '3DT'
  if (normalized === DND5E_CAMPAIGN_SYSTEM) return 'DND5E'
  return null
}

export function isDndCampaignSystem(value: string | null | undefined) {
  return getSupportedCharacterSystemForCampaign(value) === 'DND5E'
}
