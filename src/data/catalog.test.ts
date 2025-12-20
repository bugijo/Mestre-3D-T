import { describe, it, expect } from 'vitest'
import { catalog } from './catalog'

function pointBuyCost(v: number) {
  if (v <= 8) return 0
  if (v === 9) return 1
  if (v === 10) return 2
  if (v === 11) return 3
  if (v === 12) return 4
  if (v === 13) return 5
  if (v === 14) return 7
  return 9
}

describe('Catálogo gerado', () => {
  it('tem contagens mínimas por categoria', () => {
    expect(catalog.heroes.length).toBeGreaterThanOrEqual(100)
    expect(catalog.npcs.length).toBeGreaterThanOrEqual(100)
    expect(catalog.villains.length).toBeGreaterThanOrEqual(100)
    expect(catalog.stories.length).toBeGreaterThanOrEqual(100)
  })

  it('personagens 3D&T têm atributos válidos e orçamento coerente', () => {
    const all = [...catalog.heroes, ...catalog.npcs, ...catalog.villains]
    for (const c of all) {
      const vals = [c.strength, c.skill, c.resistance, c.armor, c.firepower]
      vals.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(5)
      })
      const sum = vals.reduce((a, b) => a + b, 0)
      expect(sum).toBeGreaterThanOrEqual(10)
      expect(sum).toBeLessThanOrEqual(20)
    }
  })

  it('personagens D&D obedecem ao point buy ≤ 27', () => {
    const all = [...catalog.heroes, ...catalog.npcs, ...catalog.villains]
    for (const c of all) {
      const d = (c as any).dnd
      expect(d).toBeTruthy()
      const scores = d.abilityScores
      const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
      const spent = keys.reduce((acc, k) => acc + pointBuyCost(scores[k]), 0)
      expect(spent).toBeLessThanOrEqual(27)
      expect(d.level).toBeGreaterThanOrEqual(1)
      expect(d.level).toBeLessThanOrEqual(20)
      expect(typeof d.maxHp).toBe('number')
      expect(typeof d.armorClass).toBe('number')
      expect(typeof d.proficiencyBonus).toBe('number')
    }
  })

  it('aventuras possuem variantes para ambos os sistemas', () => {
    for (const s of catalog.stories) {
      const sys = s.variants.map((v) => v.system)
      expect(sys).toContain('3DT')
      expect(sys).toContain('DND5E')
      s.variants.forEach((v) => {
        expect(v.scenes.length).toBeGreaterThanOrEqual(3)
        expect(v.difficulty).toBeGreaterThanOrEqual(1)
      })
    }
  })
})

