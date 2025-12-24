export type ImageCategory = 'CHARACTER' | 'SCENE' | 'ITEM' | 'CREATURE'

export type ImageTheme = 'classic' | 'neon' | 'grimdark' | 'arcane'

export type ImageGenOptions = {
  category: ImageCategory
  title?: string
  theme?: ImageTheme
  mood?: 'neutral' | 'tense' | 'calm' | 'epic' | 'mysterious'
  seed?: number
  width?: number
  height?: number
  transparentBackground?: boolean
  watermarkText?: string | null
  gridOverlay?: boolean
}

export type ImageMeta = {
  author: string
  generator: string
  category: ImageCategory
  title: string
  seed: number
  theme: ImageTheme
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}


function palette(theme: ImageTheme, mood: NonNullable<ImageGenOptions['mood']>) {
  if (theme === 'classic') {
    if (mood === 'epic') return ['#2c1a1a', '#8b2e2e', '#e3a84b', '#f5d06d', '#ffffff']
    if (mood === 'mysterious') return ['#12121a', '#2c2c44', '#6c6ca3', '#b0a5d1', '#e5e9f2']
    if (mood === 'tense') return ['#1a1a1a', '#3b2f2f', '#8a6f4d', '#c7b08a', '#f2e9e1']
    if (mood === 'calm') return ['#111417', '#22404f', '#3c7a89', '#7fb3c8', '#eaf6ff']
    return ['#171717', '#343434', '#6b5b53', '#b79b85', '#f3efe8']
  }
  if (theme === 'neon') {
    if (mood === 'epic') return ['#0b0b12', '#ff0055', '#ffd400', '#00e5ff', '#ffffff']
    if (mood === 'mysterious') return ['#0a0d12', '#7a00ff', '#00e5ff', '#00ffa2', '#e6d9ff']
    if (mood === 'tense') return ['#0b0b12', '#ff4d00', '#ff0055', '#ffd400', '#ffffff']
    if (mood === 'calm') return ['#0b0d12', '#00ffa2', '#00e5ff', '#7a00ff', '#e6fff6']
    return ['#0b0d12', '#7a00ff', '#ffd400', '#00e5ff', '#ffffff']
  }
  if (theme === 'grimdark') {
    if (mood === 'epic') return ['#0e0e10', '#3a2b28', '#7b4e39', '#a57a55', '#e8d7c3']
    if (mood === 'mysterious') return ['#0c0c0e', '#23232b', '#4a4a5a', '#8a8aa1', '#d9d9ea']
    if (mood === 'tense') return ['#0e0e10', '#2a1e1d', '#59423e', '#8a6b63', '#dbc9bd']
    if (mood === 'calm') return ['#0c0d0f', '#1f2a2c', '#3e575a', '#6e8a8e', '#c8d8da']
    return ['#0e0e10', '#23232b', '#4a4a5a', '#8a8aa1', '#d9d9ea']
  }
  if (theme === 'arcane') {
    if (mood === 'epic') return ['#0e0a12', '#6a2ebd', '#caa84b', '#4de1cc', '#f6f2ff']
    if (mood === 'mysterious') return ['#0a0b12', '#2e3ebd', '#6a8ad9', '#b0c4ff', '#f2f6ff']
    if (mood === 'tense') return ['#0e0a12', '#bd5a2e', '#bd2e6a', '#e1cc4d', '#fff6f2']
    if (mood === 'calm') return ['#0e0a12', '#2ebd9c', '#4de1cc', '#8ad9d1', '#e8fff9']
    return ['#0e0a12', '#6a2ebd', '#caa84b', '#4de1cc', '#f6f2ff']
  }
  return ['#111', '#333', '#666', '#999', '#fff']
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, alpha: number) {
  const img = ctx.createImageData(w, h)
  const data = img.data
  for (let i = 0; i < w * h; i++) {
    const n = Math.floor(r() * 255)
    data[i * 4] = n
    data[i * 4 + 1] = n
    data[i * 4 + 2] = n
    data[i * 4 + 3] = Math.floor(alpha * 255)
  }
  ctx.putImageData(img, 0, 0)
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.6)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function strokeShape(ctx: CanvasRenderingContext2D, r: () => number, w: number, h: number, color: string, count: number, thick: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = thick
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const x = r() * w
    const y = r() * h
    const len = Math.min(w, h) * (0.2 + r() * 0.4)
    const ang = r() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
    ctx.stroke()
  }
}

function radialRim(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, r: () => number) {
  const cx = w * 0.5
  const cy = h * 0.5
  const rad = Math.min(w, h) * (0.35 + r() * 0.2)
  const g = ctx.createRadialGradient(cx, cy, rad * 0.7, cx, cy, rad)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.fill()
}

function grid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, size: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += size) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += size) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

function composeCharacter(ctx: CanvasRenderingContext2D, r: () => number, w: number, h: number, colors: string[]) {
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, w, h)
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, colors[1])
  g.addColorStop(1, colors[2])
  ctx.globalAlpha = 0.6
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1
  ctx.fillStyle = colors[3]
  ctx.beginPath()
  const cx = w * 0.5
  const cy = h * 0.6
  const rw = Math.min(w, h) * 0.28
  const rh = Math.min(w, h) * 0.42
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 32) {
    const nx = cx + Math.cos(a) * rw * (0.95 + r() * 0.05)
    const ny = cy + Math.sin(a) * rh * (0.95 + r() * 0.05)
    if (a === 0) ctx.moveTo(nx, ny)
    else ctx.lineTo(nx, ny)
  }
  ctx.closePath()
  ctx.fill()
  radialRim(ctx, w, h, colors[4] + '55', r)
  strokeShape(ctx, r, w, h, colors[4], 12, 3)
}

function composeScene(ctx: CanvasRenderingContext2D, r: () => number, w: number, h: number, colors: string[]) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, colors[1])
  g.addColorStop(1, colors[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = colors[3]
  const layers = 6
  for (let i = 0; i < layers; i++) {
    const y = h * (0.3 + i * 0.1)
    const amp = Math.min(h, w) * (0.05 + i * 0.02)
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += w / 20) {
      const ny = y + Math.sin(x * 0.01 + i) * amp * (0.5 + r())
      ctx.lineTo(x, ny)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.globalAlpha = 0.15 + i * 0.1
    ctx.fill()
    ctx.globalAlpha = 1
  }
  vignette(ctx, w, h, colors[0] + 'cc')
}

function composeItem(ctx: CanvasRenderingContext2D, r: () => number, w: number, h: number, colors: string[]) {
  ctx.clearRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.min(w, h) * 0.6)
  g.addColorStop(0, colors[2])
  g.addColorStop(1, colors[1])
  ctx.globalAlpha = 0.5
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1
  ctx.strokeStyle = colors[4]
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.01)
  ctx.fillStyle = colors[3]
  const s = Math.min(w, h) * 0.3
  ctx.beginPath()
  ctx.moveTo(w / 2, h / 2 - s)
  ctx.lineTo(w / 2 + s, h / 2 + s)
  ctx.lineTo(w / 2 - s, h / 2 + s)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  strokeShape(ctx, r, w, h, colors[4], 8, 2)
}

function composeCreature(ctx: CanvasRenderingContext2D, r: () => number, w: number, h: number, colors: string[]) {
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, w, h)
  const arcs = 18
  for (let i = 0; i < arcs; i++) {
    const cx = w * (0.2 + r() * 0.6)
    const cy = h * (0.3 + r() * 0.6)
    const rad = Math.min(w, h) * (0.1 + r() * 0.4)
    ctx.beginPath()
    ctx.arc(cx, cy, rad, r() * Math.PI * 2, r() * Math.PI * 2)
    ctx.fillStyle = i % 2 === 0 ? colors[2] + 'aa' : colors[3] + 'aa'
    ctx.fill()
  }
  radialRim(ctx, w, h, colors[4] + '55', r)
  vignette(ctx, w, h, colors[0] + 'cc')
}

function renderWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  ctx.save()
  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px Rajdhani, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, w - 16, h - 12)
  ctx.restore()
}

function crc32(buf: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) {
      const m = c & 1
      c >>>= 1
      if (m) c ^= 0xedb88320
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function u32(n: number) {
  const b = new Uint8Array(4)
  b[0] = (n >>> 24) & 0xff
  b[1] = (n >>> 16) & 0xff
  b[2] = (n >>> 8) & 0xff
  b[3] = n & 0xff
  return b
}

function ascii(s: string) {
  const b = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i)
  return b
}

function buildTextChunk(keyword: string, text: string) {
  const type = ascii('tEXt')
  const data = new Uint8Array(keyword.length + 1 + text.length)
  data.set(ascii(keyword), 0)
  data[keyword.length] = 0
  data.set(ascii(text), keyword.length + 1)
  const len = u32(data.length)
  const crc = u32(crc32(new Uint8Array([...type, ...data])))
  return new Uint8Array([...len, ...type, ...data, ...crc])
}

async function injectTextChunks(pngDataUrl: string, meta: Record<string, string>) {
  const bin = Uint8Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0))
  let offset = 8
  let iendStart = -1
  while (offset < bin.length) {
    const len = (bin[offset] << 24) | (bin[offset + 1] << 16) | (bin[offset + 2] << 8) | bin[offset + 3]
    const type = String.fromCharCode(bin[offset + 4], bin[offset + 5], bin[offset + 6], bin[offset + 7])
    if (type === 'IEND') {
      iendStart = offset
      break
    }
    offset += 12 + len
  }
  const before = bin.slice(0, iendStart)
  const after = bin.slice(iendStart)
  const chunks: Uint8Array[] = []
  Object.keys(meta).forEach(k => {
    chunks.push(buildTextChunk(k, meta[k]))
  })
  const totalLen = before.length + chunks.reduce((a, c) => a + c.length, 0) + after.length
  const out = new Uint8Array(totalLen)
  let pos = 0
  out.set(before, pos); pos += before.length
  for (const c of chunks) { out.set(c, pos); pos += c.length }
  out.set(after, pos)
  const b64 = btoa(Array.from(out).map(b => String.fromCharCode(b)).join(''))
  return 'data:image/png;base64,' + b64
}

export async function generateImage(opts: ImageGenOptions): Promise<{ dataUrl: string; meta: ImageMeta }> {
  const w = Math.max(1, opts.width ?? 1920)
  const h = Math.max(1, opts.height ?? 1080)
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31)
  const r = rng(seed)
  const mood = opts.mood ?? 'mysterious'
  const theme = opts.theme ?? 'classic'
  const colors = palette(theme, mood)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const meta: ImageMeta = {
    author: 'Mestre 3D&T',
    generator: 'ImageGen v1',
    category: opts.category,
    title: opts.title ?? '',
    seed,
    theme,
  }
  if (!ctx) {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const withText = await injectTextChunks(dataUrl, {
      Author: meta.author,
      Generator: meta.generator,
      Category: meta.category,
      Title: meta.title,
      Seed: String(meta.seed),
      Theme: meta.theme,
    })
    return { dataUrl: withText, meta }
  }
  if (opts.transparentBackground) {
    ctx.clearRect(0, 0, w, h)
  } else {
    ctx.fillStyle = colors[0]
    ctx.fillRect(0, 0, w, h)
  }
  if (opts.category === 'CHARACTER') composeCharacter(ctx, r, w, h, colors)
  else if (opts.category === 'SCENE') composeScene(ctx, r, w, h, colors)
  else if (opts.category === 'ITEM') composeItem(ctx, r, w, h, colors)
  else composeCreature(ctx, r, w, h, colors)
  ctx.globalAlpha = 0.06
  noise(ctx, w, h, r, 0.12)
  ctx.globalAlpha = 1
  if (opts.gridOverlay) grid(ctx, w, h, '#ffffff11', Math.max(24, Math.floor(Math.min(w, h) / 32)))
  if (opts.watermarkText) renderWatermark(ctx, w, h, opts.watermarkText)
  const dataUrl = canvas.toDataURL('image/png')
  const withText = await injectTextChunks(dataUrl, {
    Author: meta.author,
    Generator: meta.generator,
    Category: meta.category,
    Title: meta.title,
    Seed: String(meta.seed),
    Theme: meta.theme,
  })
  return { dataUrl: withText, meta }
}

export async function generateBatch(base: ImageGenOptions, count: number, variations?: Partial<ImageGenOptions>) {
  const out: Array<{ dataUrl: string; meta: ImageMeta }> = []
  for (let i = 0; i < count; i++) {
    const opts = { ...base, ...variations, seed: (base.seed ?? 12345) + i }
    // eslint-disable-next-line no-await-in-loop
    const img = await generateImage(opts)
    out.push(img)
  }
  return out
}
