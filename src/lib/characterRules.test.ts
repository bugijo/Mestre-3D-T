import { describe, expect, it } from 'vitest'
import {
  buildDndCharacterPayload,
  buildThreeDetCharacterPayload,
  createDefaultDndBuilder,
  createDefaultThreeDetBuilder,
  validateDndBuilder,
  validateThreeDetBuilder,
} from '@/lib/characterRules'

const base = {
  name: 'Teste',
  role: 'Aventureiro',
  type: 'PLAYER' as const,
  imageUri: null,
  campaignId: 'camp-1',
}

describe('characterRules', () => {
  it('aceita ficha valida de 3DeT Victory e calcula PV/PM oficiais suportados', () => {
    const builder = createDefaultThreeDetBuilder()
    builder.skillIds = ['MISTICA']
    builder.advantageIds = ['MAGIA']

    expect(validateThreeDetBuilder(builder)).toHaveLength(0)

    const payload = buildThreeDetCharacterPayload(base, builder)
    expect(payload.threeDet?.edition).toBe('VICTORY')
    expect(payload.currentHp).toBe(10)
    expect(payload.currentMp).toBe(10)
    expect(payload.advantages).toContain('Magia')
  })

  it('bloqueia vantagem com prerequisito ausente em 3DeT Victory', () => {
    const builder = createDefaultThreeDetBuilder()
    builder.advantageIds = ['MAGIA']

    const issues = validateThreeDetBuilder(builder)
    expect(issues.some((issue) => /Mistica/i.test(issue.message))).toBe(true)
  })

  it('bloqueia excesso de credito por desvantagens em 3DeT Victory', () => {
    const builder = createDefaultThreeDetBuilder()
    builder.disadvantageIds = ['ANTIPATICO', 'ATRAPALHADO', 'FRAGIL']

    const issues = validateThreeDetBuilder(builder)
    expect(issues.some((issue) => /desvantagens iniciais/i.test(issue.message))).toBe(true)
  })

  it('aceita ficha valida de D&D 5e com point buy oficial e pacote inicial', () => {
    const builder = createDefaultDndBuilder()
    builder.classId = 'WIZARD'
    builder.raceId = 'HIGH_ELF'
    builder.backgroundId = 'SAGE'
    builder.abilityScores = { STR: 8, DEX: 14, CON: 14, INT: 15, WIS: 10, CHA: 10 }

    expect(validateDndBuilder(builder)).toHaveLength(0)

    const payload = buildDndCharacterPayload(base, builder)
    expect(payload.dnd?.class).toBe('Wizard')
    expect(payload.dnd?.race).toBe('High Elf')
    expect(payload.dnd?.abilityScores.INT).toBe(16)
    expect(payload.dnd?.startingEquipment?.length).toBeGreaterThan(0)
    expect(payload.xp).toBe(0)
  })

  it('bloqueia score fora do point buy ou nivel inicial invalido em D&D 5e', () => {
    const builder = createDefaultDndBuilder()
    builder.level = 2
    builder.abilityScores.STR = 16

    const issues = validateDndBuilder(builder)
    expect(issues.some((issue) => /nivel 1/i.test(issue.message))).toBe(true)
    expect(issues.some((issue) => /entre 8 e 15/i.test(issue.message))).toBe(true)
  })
})
