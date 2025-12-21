import { useMemo, useState } from 'react'
import type { ImageCategory, ImageTheme } from '@/lib/imageGen'
import { generateImage, generateBatch } from '@/lib/imageGen'

export function ImageGenerator({ initialCategory, onGenerated }: { initialCategory: ImageCategory; onGenerated: (dataUrl: string) => void }) {
  const [category, setCategory] = useState<ImageCategory>(initialCategory)
  const [theme, setTheme] = useState<ImageTheme>('classic')
  const [mood, setMood] = useState<'neutral' | 'tense' | 'calm' | 'epic' | 'mysterious'>('mysterious')
  const [title, setTitle] = useState('')
  const [transparent, setTransparent] = useState(false)
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [gridOverlay, setGridOverlay] = useState(false)
  const [seed, setSeed] = useState(Math.floor(Math.random() * 2 ** 20))
  const [watermark, setWatermark] = useState('Mestre 3D&T')
  const [count, setCount] = useState(1)
  const [preview, setPreview] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const ratioLabel = useMemo(() => {
    const g = (n: number) => Math.round(n * 100) / 100
    return `${g(width / height)}:1`
  }, [width, height])

  async function runOnce() {
    setIsGenerating(true)
    const { dataUrl } = await generateImage({ category, title, theme, mood, seed, width, height, transparentBackground: transparent, watermarkText: watermark || null, gridOverlay })
    setPreview(dataUrl)
    onGenerated(dataUrl)
    setIsGenerating(false)
  }

  async function runBatch() {
    setIsGenerating(true)
    const imgs = await generateBatch({ category, title, theme, mood, seed, width, height, transparentBackground: transparent, watermarkText: watermark || null, gridOverlay }, Math.max(1, count))
    if (imgs[0]) setPreview(imgs[0].dataUrl)
    onGenerated(imgs[0].dataUrl)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-3 p-3 border border-white/10 rounded-xl bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Categoria</label>
          <select value={category} onChange={e=>setCategory(e.target.value as ImageCategory)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white">
            <option value="CHARACTER">Personagem</option>
            <option value="SCENE">Cenário</option>
            <option value="ITEM">Item</option>
            <option value="CREATURE">Criatura</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Tema</label>
          <select value={theme} onChange={e=>setTheme(e.target.value as ImageTheme)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white">
            <option value="classic">Clássico</option>
            <option value="neon">Neon</option>
            <option value="grimdark">Grimdark</option>
            <option value="arcane">Arcano</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Clima</label>
          <select value={mood} onChange={e=>setMood(e.target.value as any)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white">
            <option value="mysterious">Misterioso</option>
            <option value="epic">Épico</option>
            <option value="tense">Tenso</option>
            <option value="calm">Calmo</option>
            <option value="neutral">Neutro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Título</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Resolução</label>
          <div className="flex gap-2">
            <input type="number" min={1} value={width} onChange={e=>setWidth(parseInt(e.target.value||'1920',10)||1920)} className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
            <input type="number" min={1} value={height} onChange={e=>setHeight(parseInt(e.target.value||'1080',10)||1080)} className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
            <span className="text-[10px] text-text-muted self-center">{ratioLabel}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Opções</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-white/80"><input type="checkbox" checked={transparent} onChange={e=>setTransparent(e.target.checked)} /> Fundo transparente</label>
            <label className="flex items-center gap-2 text-xs text-white/80"><input type="checkbox" checked={gridOverlay} onChange={e=>setGridOverlay(e.target.checked)} /> Grade</label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Seed</label>
          <input type="number" value={seed} onChange={e=>setSeed(parseInt(e.target.value||'0',10)||0)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Marca d'água</label>
          <input value={watermark} onChange={e=>setWatermark(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase">Lote</label>
          <input type="number" min={1} max={10} value={count} onChange={e=>setCount(parseInt(e.target.value||'1',10)||1)} className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="flex gap-2">
        <button disabled={isGenerating} onClick={runOnce} className="px-4 py-2 rounded-lg bg-neon-green text-black font-bold disabled:opacity-50">Gerar</button>
        <button disabled={isGenerating} onClick={runBatch} className="px-4 py-2 rounded-lg bg-neon-purple text-white font-bold disabled:opacity-50">Gerar Lote</button>
      </div>

      {preview && (
        <div className="mt-3">
          <img src={preview} alt="preview" className="w-full h-auto rounded-lg border border-white/10" />
        </div>
      )}
    </div>
  )
}

