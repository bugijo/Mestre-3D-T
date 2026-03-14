import { beforeAll, describe, expect, it } from 'vitest'
import { generateAutoContent, generateAutoSnapshot } from './auto-content'

let generatedContent: Awaited<ReturnType<typeof generateAutoContent>>
let generatedSnapshot: Awaited<ReturnType<typeof generateAutoSnapshot>>

describe('Configuracao automatica de conteudo', () => {
  beforeAll(async () => {
    generatedContent = await generateAutoContent()
    generatedSnapshot = await generateAutoSnapshot()
  }, 30000)

  it('gera exatamente 100 personagens, 100 NPCs e 100 mapas', () => {
    expect(generatedContent.characters.length).toBe(100)
    expect(generatedContent.npcs.length).toBe(100)
    expect(generatedContent.maps.length).toBe(100)
  })

  it('assets possuem dataUrl PNG valido e paths organizados', () => {
    const anyPortrait = generatedContent.characters[0]?.portraitUri
    const anySprite = generatedContent.npcs[0]?.imageUri
    const anyMap = generatedContent.maps[0]?.mapImageDataUrl
    expect(typeof anyPortrait).toBe('string')
    expect(typeof anySprite).toBe('string')
    expect(typeof anyMap).toBe('string')
    expect(anyPortrait as string).toMatch(/^data:image\/png;base64,/)
    expect(anySprite as string).toMatch(/^data:image\/png;base64,/)
    expect(anyMap as string).toMatch(/^data:image\/png;base64,/)
    expect(generatedContent.icons.items.every((icon) => icon.path.includes('generated/icons/items'))).toBe(true)
    expect(generatedContent.icons.skills.every((icon) => icon.path.includes('generated/icons/skills'))).toBe(true)
    expect(generatedContent.icons.status.every((icon) => icon.path.includes('generated/icons/status'))).toBe(true)
    expect(generatedContent.icons.menu.every((icon) => icon.path.includes('generated/icons/menu'))).toBe(true)
  })

  it('snapshot esta pronto para implementacao imediata', () => {
    expect(generatedSnapshot.version).toBe(1)
    expect(generatedSnapshot.campaigns.length).toBeGreaterThanOrEqual(1)
    expect(generatedSnapshot.scenes.length).toBe(100)
    expect(generatedSnapshot.characters.length).toBe(200)
    expect(typeof generatedSnapshot.session.activeCampaignId).toBe('string')
  })
})
