import { beforeAll, describe, expect, it } from 'vitest'
import { buildGameCatalog } from './gameCatalog'

let catalog: Awaited<ReturnType<typeof buildGameCatalog>>

describe('Catalogo do Jogo', () => {
  beforeAll(async () => {
    catalog = await buildGameCatalog()
  }, 30000)

  it('constroi listas completas de personagens, itens e mapas', () => {
    expect(catalog.characters.length).toBe(200)
    expect(catalog.items.length).toBe(100)
    expect(catalog.maps.length).toBe(100)
    expect(catalog.system.mechanics.length).toBeGreaterThanOrEqual(5)
    expect(catalog.system.missions.length).toBeGreaterThanOrEqual(5)
    expect(catalog.system.secrets.length).toBeGreaterThanOrEqual(5)
  })

  it('personagens possuem imagem valida e relacoes mapeadas', () => {
    const character = catalog.characters[0]
    expect(typeof character.image).toBe('string')
    expect(character.image as string).toMatch(/^data:image\/png;base64,/)
    expect(character.relationships.length).toBeGreaterThanOrEqual(1)
    const allowed = ['aliado', 'rival', 'mentor', 'inimigo']
    expect(allowed.includes(character.relationships[0].type)).toBe(true)
  })

  it('itens possuem icone quando disponivel e raridade valida', () => {
    const withIcon = catalog.items.find((item) => !!item.icon)
    expect(withIcon && (withIcon.icon as string)).toMatch(/^data:image\/png;base64,/)
    const allowed = ['comum', 'incomum', 'raro', 'epico', 'lendario']
    expect(allowed.includes(catalog.items[0].rarity)).toBe(true)
  })

  it('mapas vinculam NPCs, itens escondidos e inimigos com fundo valido', () => {
    const map = catalog.maps[0]
    expect(map.npcIds.length).toBeGreaterThanOrEqual(1)
    expect(map.hiddenItemIds.length).toBeGreaterThanOrEqual(1)
    expect(map.enemyIds.length).toBeGreaterThanOrEqual(1)
    expect(typeof map.background).toBe('string')
    expect(map.background as string).toMatch(/^data:image\/png;base64,/)
  })
})
