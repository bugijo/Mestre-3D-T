import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateImageMock = vi.fn(async () => ({ dataUrl: 'data:image/png;base64,AAA', meta: {} }))

vi.mock('@/lib/imageGen', () => ({
  generateImage: (...args: unknown[]) => generateImageMock(...args),
}))

describe('auto-content cache', () => {
  beforeEach(async () => {
    generateImageMock.mockClear()
    const mod = await import('./auto-content')
    mod.clearAutoContentCache()
  })

  it('reutiliza cache entre chamadas e permite invalidacao manual', async () => {
    const mod = await import('./auto-content')

    const first = await mod.generateAutoContent()
    const second = await mod.generateAutoContent()
    expect(first).toBe(second)
    expect(generateImageMock).toHaveBeenCalledTimes(340)
    expect(mod.getAutoContentCacheStatus().contentReady).toBe(true)

    mod.clearAutoContentCache()
    expect(mod.getAutoContentCacheStatus().contentReady).toBe(false)
  }, 30000)
})
