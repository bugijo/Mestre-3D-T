import { describe, it, expect } from 'vitest'
import { generateAutoContent, generateAutoSnapshot } from './auto-content'

describe('Configuração automática de conteúdo', () => {
  it('gera exatamente 100 personagens, 100 NPCs e 100 mapas', async () => {
    const gen = await generateAutoContent()
    expect(gen.characters.length).toBe(100)
    expect(gen.npcs.length).toBe(100)
    expect(gen.maps.length).toBe(100)
  })

  it('assets possuem dataUrl PNG válido e paths organizados', async () => {
    const gen = await generateAutoContent()
    const anyPortrait = gen.characters[0]?.portraitUri
    const anySprite = gen.npcs[0]?.imageUri
    const anyMap = gen.maps[0]?.mapImageDataUrl
    expect(typeof anyPortrait).toBe('string')
    expect(typeof anySprite).toBe('string')
    expect(typeof anyMap).toBe('string')
    expect((anyPortrait as string)).toMatch(/^data:image\/png;base64,/)
    expect((anySprite as string)).toMatch(/^data:image\/png;base64,/)
    expect((anyMap as string)).toMatch(/^data:image\/png;base64,/)
    expect(gen.icons.items.every(i => i.path.includes('generated/icons/items'))).toBe(true)
    expect(gen.icons.skills.every(i => i.path.includes('generated/icons/skills'))).toBe(true)
    expect(gen.icons.status.every(i => i.path.includes('generated/icons/status'))).toBe(true)
    expect(gen.icons.menu.every(i => i.path.includes('generated/icons/menu'))).toBe(true)
  })

  it('snapshot está pronto para implementação imediata', async () => {
    const snap = await generateAutoSnapshot()
    expect(snap.version).toBe(1)
    expect(snap.campaigns.length).toBeGreaterThanOrEqual(1)
    expect(snap.scenes.length).toBe(100)
    expect(snap.characters.length).toBe(200)
    expect(typeof snap.session.activeCampaignId).toBe('string')
  })
})

