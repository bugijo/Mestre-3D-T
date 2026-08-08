import { describe, expect, it } from 'vitest'
import { ordemCompatibleRuleset, rollOrdemCompatible } from './ordemCompatible'

describe('ordem-compatible', () => {
  it('rola um d20 por ponto de atributo, mantém o maior e soma o bônus', () => {
    const values = [0, 0.95, 0.5]
    const result = rollOrdemCompatible({ attributeValue: 3, bonus: 5, difficulty: 24 }, () => values.shift() ?? 0)

    expect(result.rolls).toEqual([1, 20, 11])
    expect(result.kept).toEqual([20])
    expect(result.total).toBe(25)
    expect(result.outcome).toBe('critical')
    expect(result.expression).toBe('3d20kh1+5')
  })

  it('registra falha crítica somente quando há um único dado', () => {
    expect(rollOrdemCompatible({ attributeValue: 1 }, () => 0).outcome).toBe('fumble')
    expect(rollOrdemCompatible({ attributeValue: 2, difficulty: 10 }, () => 0).outcome).toBe('failure')
  })

  it('declara recursos, capacidades e tema sem conteúdo comercial', () => {
    expect(ordemCompatibleRuleset.character.resources.map((resource) => resource.shortLabel)).toEqual(['PV', 'PE', 'SAN'])
    expect(ordemCompatibleRuleset.capabilities).toMatchObject({ customSheetAllowed: true, commercialContentAllowed: false })
    expect(ordemCompatibleRuleset.theme.className).toBe('theme-paranormal')
  })
})
