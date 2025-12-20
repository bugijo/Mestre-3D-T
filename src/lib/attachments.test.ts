import { describe, it, expect, afterEach, vi } from 'vitest'
import { processAttachment } from './attachments'

function makeFile(contents: string, type: string, name = 'file.dat') {
  const blob = new Blob([contents], { type })
  return new File([blob], name, { type })
}

describe('Regra de Anexos Automatizados', () => {
  const OriginalImage = global.Image
  const originalCreateElement = global.document.createElement

  afterEach(() => {
    global.Image = OriginalImage
    global.document.createElement = originalCreateElement
    vi.restoreAllMocks()
  })

  it('falha quando tipo não é permitido', async () => {
    const file = makeFile('pdfdata', 'application/pdf', 'doc.pdf')
    const res = await processAttachment(file)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Tipo de arquivo não permitido/)
  })

  it('falha quando excede tamanho máximo', async () => {
    const file = makeFile('1234567890', 'image/png', 'big.png')
    const res = await processAttachment(file, { maxSizeInBytes: 5 })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Arquivo muito grande/)
  })

  it('sucesso ao ler imagem válida', async () => {
    const file = makeFile('hello-world', 'image/png', 'ok.png')
    const res = await processAttachment(file, { compressionQuality: 1 })
    expect(res.success).toBe(true)
    expect(res.dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('mantém original quando compressão falha', async () => {
    class FailingImage {
      onload: (() => void) | null = null
      onerror: ((err: any) => void) | null = null
      width = 100
      height = 50
      set src(_val: string) {
        setTimeout(() => this.onerror && this.onerror(new Error('decode fail')), 0)
      }
    }
    ;(global as any).Image = FailingImage as any

    const file = makeFile('hello-compress', 'image/png', 'compress.png')
    const res = await processAttachment(file, { compressionQuality: 0.7 })
    expect(res.success).toBe(true)
    expect(res.dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('usa imagem comprimida quando menor que original', async () => {
    class OkImage {
      onload: (() => void) | null = null
      onerror: ((err: any) => void) | null = null
      width = 2000
      height = 1000
      set src(_val: string) {
        setTimeout(() => this.onload && this.onload(), 0)
      }
    }
    ;(global as any).Image = OkImage as any

    global.document.createElement = vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({ drawImage: vi.fn() })),
          toDataURL: vi.fn(() => 'data:image/png;base64,AAA'),
        } as any
      }
      return originalCreateElement.call(document, tag)
    }) as any

    const file = makeFile('very-long-original-data', 'image/png', 'img.png')
    const res = await processAttachment(file, { compressionQuality: 0.7 })
    expect(res.success).toBe(true)
    expect(res.dataUrl).toBe('data:image/png;base64,AAA')
  })

  it('falha para arquivo vazio', async () => {
    const empty = new File([new Blob([], { type: 'image/png' })], 'empty.png', { type: 'image/png' })
    const res = await processAttachment(empty)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Arquivo vazio/)
  })

  it('sucesso para GIF sem compressão', async () => {
    const file = makeFile('gifdata', 'image/gif', 'anim.gif')
    const res = await processAttachment(file, { compressionQuality: 0.5 })
    expect(res.success).toBe(true)
    expect(res.dataUrl).toMatch(/^data:image\/gif;base64,/)
  })

  it('falha quando excede dimensão máxima', async () => {
    class BigImage {
      onload: (() => void) | null = null
      onerror: ((err: any) => void) | null = null
      width = 3000
      height = 3000
      set src(_val: string) {
        setTimeout(() => this.onload && this.onload(), 0)
      }
    }
    ;(global as any).Image = BigImage as any

    const file = makeFile('big', 'image/png', 'big.png')
    const res = await processAttachment(file, { maxWidth: 1920, maxHeight: 1080 })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Dimensão excedida/)
  })
})
