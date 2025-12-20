import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/AppStore'
import type { Scene, Character } from '@/domain/models'
import { cn } from '@/lib/cn'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Plus, Minus, RotateCcw, Upload, Download, Layers, Grid, MousePointer2 } from 'lucide-react'

type Viewport = { zoom: number; offsetX: number; offsetY: number }
type MapToken = {
  id: string
  name: string
  kind: Character['type']
  imageUri: string | null
  x: number
  y: number
  scale: number
  rotation: number
}

type MapState = {
  viewport: Viewport
  tokens: MapToken[]
  showGrid: boolean
}

function makeKey(sceneId: string) {
  return `map-state:${sceneId}`
}

function loadMapState(sceneId: string): MapState {
  const raw = localStorage.getItem(makeKey(sceneId))
  if (!raw) return { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, tokens: [], showGrid: true }
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.viewport) parsed.viewport = { zoom: 1, offsetX: 0, offsetY: 0 }
    if (!Array.isArray(parsed.tokens)) parsed.tokens = []
    if (typeof parsed.showGrid !== 'boolean') parsed.showGrid = true
    return parsed
  } catch {
    return { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, tokens: [], showGrid: true }
  }
}

function saveMapState(sceneId: string, state: MapState) {
  localStorage.setItem(makeKey(sceneId), JSON.stringify(state))
}

function createTokenFromCharacter(c: Character, x: number, y: number): MapToken {
  return {
    id: c.id,
    name: c.name,
    kind: c.type,
    imageUri: c.imageUri,
    x,
    y,
    scale: 1,
    rotation: 0,
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, cell: number, offsetX: number, offsetY: number, zoom: number) {
  const step = cell * zoom
  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  for (let x = -offsetX % step; x < w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = -offsetY % step; y < h; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, viewport: Viewport, w: number, h: number) {
  const iw = img.naturalWidth * viewport.zoom
  const ih = img.naturalHeight * viewport.zoom
  const x = viewport.offsetX + (w - iw) / 2
  const y = viewport.offsetY + (h - ih) / 2
  ctx.drawImage(img, x, y, iw, ih)
}

function drawToken(ctx: CanvasRenderingContext2D, token: MapToken, viewport: Viewport, sprite: HTMLImageElement | null) {
  const size = 64 * viewport.zoom * token.scale
  const x = token.x * viewport.zoom + viewport.offsetX
  const y = token.y * viewport.zoom + viewport.offsetY
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((token.rotation * Math.PI) / 180)
  if (sprite) {
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size)
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function hitTestToken(mx: number, my: number, token: MapToken, viewport: Viewport) {
  const size = 64 * viewport.zoom * token.scale
  const x = token.x * viewport.zoom + viewport.offsetX
  const y = token.y * viewport.zoom + viewport.offsetY
  const dx = mx - x
  const dy = my - y
  return Math.sqrt(dx * dx + dy * dy) <= size / 2
}

export function InteractiveMap({ scene }: { scene: Scene }) {
  const { state, updateScene } = useAppStore()!
  const activeCampaign = state.campaigns.find(c => c.id === state.session.activeCampaignId)
  const isDnd = !!activeCampaign && activeCampaign.system?.toLowerCase().includes('5e')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mapImg, setMapImg] = useState<HTMLImageElement | null>(null)
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null)
  const [map, setMap] = useState<MapState>(() => {
    const saved = loadMapState(scene.id)
    const hasSaved = !!localStorage.getItem(makeKey(scene.id))
    if (!hasSaved) {
      saved.showGrid = isDnd
    }
    return saved
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const sprites = useRef<Record<string, HTMLImageElement>>({})
  const undoStack = useRef<MapState[]>([])
  const redoStack = useRef<MapState[]>([])

  const sceneChars = useMemo(() => {
    return state.characters.filter(c => scene.npcIds.includes(c.id) || scene.enemyIds.includes(c.id))
  }, [state.characters, scene.npcIds, scene.enemyIds])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const onResize = () => {
      const dpr = window.devicePixelRatio || 1
      c.width = Math.floor(c.clientWidth * dpr)
      c.height = Math.floor(c.clientHeight * dpr)
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    onResize()
    const RO = (window as any).ResizeObserver
    if (RO) {
      const ro = new RO(onResize)
      ro.observe(c)
      return () => ro.disconnect()
    } else {
      const handler = () => onResize()
      window.addEventListener('resize', handler)
      return () => window.removeEventListener('resize', handler)
    }
  }, [])

  useEffect(() => {
    const load = (url: string | null, setter: (img: HTMLImageElement | null) => void) => {
      if (!url) return setter(null)
      const img = new Image()
      img.onload = () => setter(img)
      img.src = url
    }
    load(scene.mapImageDataUrl, setMapImg)
    load(scene.backgroundImageDataUrl, setBgImg)
  }, [scene.mapImageDataUrl, scene.backgroundImageDataUrl])

  useEffect(() => {
    for (const t of map.tokens) {
      if (t.imageUri && !sprites.current[t.id]) {
        const img = new Image()
        img.onload = () => {
          sprites.current[t.id] = img
        }
        img.src = t.imageUri
      }
    }
  }, [map.tokens])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    const render = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      if (bgImg) drawImage(ctx, bgImg, map.viewport, c.width, c.height)
      if (mapImg) drawImage(ctx, mapImg, map.viewport, c.width, c.height)
      if (map.showGrid) drawGrid(ctx, c.width, c.height, isDnd ? 64 : 48, map.viewport.offsetX, map.viewport.offsetY, map.viewport.zoom)
      for (const t of map.tokens) {
        const sprite = sprites.current[t.id] || null
        drawToken(ctx, t, map.viewport, sprite)
        if (selectedId === t.id) {
          ctx.save()
          const size = 64 * map.viewport.zoom * t.scale
          const x = t.x * map.viewport.zoom + map.viewport.offsetX
          const y = t.y * map.viewport.zoom + map.viewport.offsetY
          ctx.strokeStyle = 'rgba(0,255,255,0.6)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }
      if (isDnd && map.showGrid) {
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        const cell = (isDnd ? 64 : 48) * map.viewport.zoom
        const x0 = 20
        const y0 = c.height - 30
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x0 + cell, y0)
        ctx.stroke()
        ctx.font = '12px sans-serif'
        ctx.fillText('5 ft', x0 + cell + 8, y0 - 4)
        ctx.restore()
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [map.viewport, map.tokens, map.showGrid, mapImg, bgImg, selectedId])

  useEffect(() => {
    saveMapState(scene.id, map)
  }, [scene.id, map])

  const snapshot = () => JSON.parse(JSON.stringify(map)) as MapState
  const setWithHistory = (updater: (prev: MapState) => MapState) => {
    undoStack.current.push(snapshot())
    const next = updater(map)
    setMap(next)
    redoStack.current = []
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const dz = e.deltaY < 0 ? 0.05 : -0.05
    const zoom = Math.min(4, Math.max(0.2, map.viewport.zoom + dz))
    setWithHistory(s => ({ ...s, viewport: { ...s.viewport, zoom } }))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (let i = map.tokens.length - 1; i >= 0; i--) {
      const t = map.tokens[i]
      if (hitTestToken(mx, my, t, map.viewport)) {
        setSelectedId(t.id)
        setDragging({ id: t.id, ox: mx, oy: my })
        return
      }
    }
    setSelectedId(null)
    setDragging({ id: '', ox: mx - map.viewport.offsetX, oy: my - map.viewport.offsetY })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    if (dragging.id) {
      setMap(s => ({
        ...s,
        tokens: s.tokens.map(t => (t.id === dragging.id ? { ...t, x: (mx - s.viewport.offsetX) / s.viewport.zoom, y: (my - s.viewport.offsetY) / s.viewport.zoom } : t)),
      }))
    } else {
      const dx = mx - dragging.ox
      const dy = my - dragging.oy
      setMap(s => ({ ...s, viewport: { ...s.viewport, offsetX: dx, offsetY: dy } }))
    }
  }

  const onPointerUp = () => {
    setDragging(null)
  }

  const addToken = (t: MapToken) => {
    setWithHistory(s => ({ ...s, tokens: [t, ...s.tokens] }))
    setSelectedId(t.id)
  }

  const removeSelected = () => {
    if (!selectedId) return
    setWithHistory(s => ({ ...s, tokens: s.tokens.filter(t => t.id !== selectedId) }))
    setSelectedId(null)
  }

  const adjustSelected = (delta: Partial<Pick<MapToken, 'scale' | 'rotation'>>) => {
    if (!selectedId) return
    setMap(s => ({
      ...s,
      tokens: s.tokens.map(t => (t.id === selectedId ? { ...t, scale: Math.max(0.2, Math.min(3, delta.scale ?? t.scale)), rotation: (delta.rotation ?? t.rotation) % 360 } : t)),
    }))
  }

  const undo = () => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(snapshot())
    setMap(prev)
  }
  const redo = () => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(snapshot())
    setMap(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (selectedId) {
        if (e.key === 'Delete') {
          e.preventDefault()
          removeSelected()
          return
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          const d = 10 / map.viewport.zoom
          setWithHistory(s => ({
            ...s,
            tokens: s.tokens.map(t => {
              if (t.id !== selectedId) return t
              if (e.key === 'ArrowUp') return { ...t, y: t.y - d }
              if (e.key === 'ArrowDown') return { ...t, y: t.y + d }
              if (e.key === 'ArrowLeft') return { ...t, x: t.x - d }
              return { ...t, x: t.x + d }
            }),
          }))
          return
        }
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setWithHistory(s => ({ ...s, viewport: { ...s.viewport, zoom: Math.min(4, s.viewport.zoom + 0.1) } }))
        return
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setWithHistory(s => ({ ...s, viewport: { ...s.viewport, zoom: Math.max(0.2, s.viewport.zoom - 0.1) } }))
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, map.viewport.zoom])

  const exportJson = () => {
    const data = JSON.stringify(map)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `map-${scene.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const loaded = JSON.parse(String(reader.result))
        if (!loaded.viewport || !Array.isArray(loaded.tokens)) return
        setMap({ viewport: loaded.viewport, tokens: loaded.tokens, showGrid: !!loaded.showGrid })
      } catch {}
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWithHistory(s => ({ ...s, showGrid: !s.showGrid }))} className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">
            <Grid size={16} />
          </button>
          <button onClick={() => setWithHistory(s => ({ ...s, viewport: { ...s.viewport, zoom: Math.min(4, s.viewport.zoom + 0.1) } }))} className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">
            <Plus size={16} />
          </button>
          <button onClick={() => setWithHistory(s => ({ ...s, viewport: { ...s.viewport, zoom: Math.max(0.2, s.viewport.zoom - 0.1) } }))} className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">
            <Minus size={16} />
          </button>
          <button onClick={() => setWithHistory(s => ({ ...s, viewport: { zoom: 1, offsetX: 0, offsetY: 0 } }))} className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white cursor-pointer">
            <Upload size={16} />
            <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files && importJson(e.target.files[0])} />
          </label>
          <button onClick={exportJson} className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <div className="h-[480px] w-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>
        </div>
        <div className="col-span-3 space-y-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-2"><Layers size={14} /> Camadas</div>
            <ImageUpload label="Plano de Fundo" currentImage={scene.backgroundImageDataUrl || undefined} onImageSelected={(d) => updateScene(scene.id, { backgroundImageDataUrl: d || null })} className="mb-3" />
            <ImageUpload label="Mapa" currentImage={scene.mapImageDataUrl || undefined} onImageSelected={(d) => updateScene(scene.id, { mapImageDataUrl: d || null })} />
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-2"><MousePointer2 size={14} /> Token</div>
            <div className="flex items-center gap-2">
              <button onClick={removeSelected} disabled={!selectedId} className={cn("px-3 py-2 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs", !selectedId && 'opacity-50 cursor-not-allowed')}>Excluir</button>
              <input type="range" min={0.2} max={3} step={0.05} value={map.tokens.find(t => t.id === selectedId)?.scale ?? 1} onChange={(e) => adjustSelected({ scale: parseFloat(e.target.value) })} />
              <input type="range" min={0} max={360} step={1} value={map.tokens.find(t => t.id === selectedId)?.rotation ?? 0} onChange={(e) => adjustSelected({ rotation: parseFloat(e.target.value) })} />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs font-bold text-text-muted uppercase mb-2">Adicionar elementos</div>
            <div className="space-y-2">
              {sceneChars.length === 0 ? (
                <div className="text-xs text-text-muted">Sem personagens vinculados.</div>
              ) : (
                sceneChars.map(c => (
                  <button key={c.id} onClick={() => addToken(createTokenFromCharacter(c, 64, 64))} className="w-full flex items-center gap-2 p-2 rounded bg-black/30 border border-white/10 text-left hover:bg-black/40">
                    <div className="w-8 h-8 rounded bg-white/10 overflow-hidden">
                      {c.imageUri ? <img src={c.imageUri} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                    </div>
                    <span className="text-sm text-white truncate">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
