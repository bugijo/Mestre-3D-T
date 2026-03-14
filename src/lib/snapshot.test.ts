import { describe, expect, it } from 'vitest'
import { createDefaultSnapshot } from '@/store/defaultData'
import { normalizeSnapshot, sanitizeSyncSlot } from './snapshot'

describe('snapshot utils', () => {
  it('normaliza snapshot com campos opcionais ausentes', () => {
    const base = createDefaultSnapshot()
    const raw = {
      ...base,
      campaigns: undefined,
      arcs: undefined,
      scenes: undefined,
      characters: undefined,
      combats: undefined,
      sessionHistory: undefined,
      rewardTables: undefined,
      rewardEvents: undefined,
      session: {
        isActive: 1,
      },
      settings: {},
      audio: {},
    } as unknown as typeof base

    const normalized = normalizeSnapshot(raw)
    expect(normalized.campaigns).toEqual([])
    expect(normalized.characters).toEqual([])
    expect(normalized.session.notes).toEqual([])
    expect(normalized.audio.volume).toBe(0.5)
  })

  it('migra sistema legado de campanha para a base oficial suportada', () => {
    const base = createDefaultSnapshot()
    const raw = {
      ...base,
      campaigns: [{ ...base.campaigns[0], system: '3D&T Alpha' }],
    }

    const normalized = normalizeSnapshot(raw)
    expect(normalized.campaigns[0].system).toBe('3DeT Victory')
  })

  it('sanitiza slot de sincronizacao e aplica fallback default', () => {
    expect(sanitizeSyncSlot('  Mesa Principal 2026  ')).toBe('mesa-principal-2026')
    expect(sanitizeSyncSlot('###')).toBe('default')
    expect(sanitizeSyncSlot('a'.repeat(200)).length).toBeLessThanOrEqual(64)
  })
})
