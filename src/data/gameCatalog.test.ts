import { describe, it, expect } from 'vitest'
import { buildGameCatalog } from './gameCatalog'

describe('Catálogo do Jogo', () => {
  it('constrói listas completas de personagens, itens e mapas', async () => {
    const cat = await buildGameCatalog()
    expect(cat.characters.length).toBe(200)
    expect(cat.items.length).toBe(100)
    expect(cat.maps.length).toBe(100)
    expect(cat.system.mechanics.length).toBeGreaterThanOrEqual(5)
    expect(cat.system.missions.length).toBeGreaterThanOrEqual(5)
    expect(cat.system.secrets.length).toBeGreaterThanOrEqual(5)
  })

  it('personagens possuem imagem válida e relações mapeadas', async () => {
    const cat = await buildGameCatalog()
    const c = cat.characters[0]
    expect(typeof c.image).toBe('string')
    expect((c.image as string)).toMatch(/^data:image\/png;base64,/)
    expect(c.relationships.length).toBeGreaterThanOrEqual(1)
    const allowed = ['aliado','rival','mentor','inimigo']
    expect(allowed.includes(c.relationships[0].type)).toBe(true)
  })

  it('itens possuem ícone quando disponível e raridade válida', async () => {
    const cat = await buildGameCatalog()
    const anyWithIcon = cat.items.find(i => !!i.icon)
    expect(anyWithIcon && (anyWithIcon.icon as string)).toMatch(/^data:image\/png;base64,/)
    const allowed = ['comum','incomum','raro','épico','lendário']
    expect(allowed.includes(cat.items[0].rarity)).toBe(true)
  })

  it('mapas vinculam NPCs, itens escondidos e inimigos com fundo válido', async () => {
    const cat = await buildGameCatalog()
    const m = cat.maps[0]
    expect(m.npcIds.length).toBeGreaterThanOrEqual(1)
    expect(m.hiddenItemIds.length).toBeGreaterThanOrEqual(1)
    expect(m.enemyIds.length).toBeGreaterThanOrEqual(1)
    expect(typeof m.background).toBe('string')
    expect((m.background as string)).toMatch(/^data:image\/png;base64,/)
  })
})

