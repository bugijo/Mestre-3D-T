import { useMemo, useState } from 'react'
import { Archive, FileUp, MapPin, Plus, Save, Search, Trash2, Wand2 } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useAppStore } from '@/store/AppStore'
import type { LibraryEntityKind } from '@/domain/v1'
import { cn } from '@/lib/cn'

const KINDS: Array<{ id: LibraryEntityKind; label: string }> = [
  { id: 'npc', label: 'NPC' }, { id: 'creature', label: 'Criatura' }, { id: 'villain', label: 'Vilão' },
  { id: 'item', label: 'Item' }, { id: 'equipment', label: 'Equipamento' }, { id: 'ability', label: 'Habilidade' },
  { id: 'place', label: 'Local' }, { id: 'settlement', label: 'Cidade / vila' }, { id: 'region', label: 'Região' },
  { id: 'country', label: 'País' }, { id: 'world', label: 'Mundo' }, { id: 'mission', label: 'Missão' },
  { id: 'scene', label: 'Cena' }, { id: 'map', label: 'Mapa' }, { id: 'audio', label: 'Áudio' }, { id: 'campaign', label: 'Campanha' },
]

type Draft = {
  kind: LibraryEntityKind
  name: string
  summary: string
  imageDataUrl: string
  parentId: string
  tags: string
  privateNotes: string
  behavior: string
  objective: string
  secret: string
}

const EMPTY_DRAFT: Draft = { kind: 'npc', name: '', summary: '', imageDataUrl: '', parentId: '', tags: '', privateNotes: '', behavior: '', objective: '', secret: '' }

export function MasterStudio() {
  const { state, createLibraryEntity, deleteLibraryEntity } = useAppStore()
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [mode, setMode] = useState<'quick' | 'complete'>('quick')
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<LibraryEntityKind | 'all'>('all')
  const [importFile, setImportFile] = useState<{ name: string; mimeType: string; size: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const filtered = useMemo(() => state.v1.library.filter((entity) => {
    const matchKind = kindFilter === 'all' || entity.kind === kindFilter
    const needle = query.trim().toLowerCase()
    return matchKind && (!needle || `${entity.name} ${entity.summary} ${entity.tags.join(' ')}`.toLowerCase().includes(needle))
  }), [kindFilter, query, state.v1.library])

  const save = () => {
    if (!draft.name.trim()) return
    createLibraryEntity({
      ownerUserId: 'demo-master',
      rulesetId: 'ordem-compatible',
      kind: draft.kind,
      name: draft.name.trim(),
      summary: draft.summary.trim(),
      imageDataUrl: draft.imageDataUrl || null,
      parentId: draft.parentId || null,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      privateNotes: draft.privateNotes.trim(),
      data: {
        behavior: draft.behavior.trim(),
        objective: draft.objective.trim(),
        secret: draft.secret.trim(),
        import: importFile,
        creationMode: mode,
      },
    })
    setDraft((current) => ({ ...EMPTY_DRAFT, kind: current.kind }))
    setImportFile(null)
  }

  const reviewImport = (file: File) => {
    setImportError(null)
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/json']
    if (!allowed.includes(file.type)) {
      setImportError('Formato não permitido. Use PDF, imagem, texto ou JSON.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportError('Arquivo acima do limite de 10 MB.')
      return
    }
    setImportFile({ name: file.name, mimeType: file.type, size: file.size })
    if (!draft.name) setDraft((current) => ({ ...current, name: file.name.replace(/\.[^.]+$/, '') }))
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHero eyebrow="Estúdio do Mestre" title={<>Biblioteca de <span className="text-gradient-secondary">dossiês reutilizáveis</span></>} description="Crie rápido durante a sessão ou registre uma versão completa. A hierarquia geográfica é opcional e qualquer nível pode existir sozinho." />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="app-panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Wand2 size={17} className="text-secondary" /><h2 className="text-lg font-semibold text-white">Novo conteúdo</h2></div>
            <div className="flex rounded-xl border border-white/10 p-1">{(['quick', 'complete'] as const).map((value) => <button key={value} type="button" onClick={() => setMode(value)} className={cn('rounded-lg px-3 py-1.5 text-xs', mode === value ? 'bg-secondary/20 text-white' : 'text-text-muted')}>{value === 'quick' ? 'Criação rápida' : 'Criação completa'}</button>)}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KINDS.map((kind) => <button key={kind.id} type="button" onClick={() => setDraft((current) => ({ ...current, kind: kind.id }))} className={cn('rounded-xl border px-2 py-2 text-xs', draft.kind === kind.id ? 'border-secondary/40 bg-secondary/10 text-white' : 'border-white/10 text-text-muted')}>{kind.label}</button>)}
          </div>

          <div className="mt-4 space-y-4">
            <label><span className="field-label">Nome</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome do dossiê" /></label>
            <label><span className="field-label">Resumo / descrição</span><textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} className="field min-h-24 resize-y" placeholder="O essencial para usar durante a mesa" /></label>
            <ImageUpload label="Imagem opcional" currentImage={draft.imageDataUrl} onImageSelected={(value) => setDraft((current) => ({ ...current, imageDataUrl: value }))} config={{ maxSizeInBytes: 4 * 1024 * 1024, compressionQuality: 0.75 }} />

            {mode === 'complete' ? <>
              <label><span className="field-label">Comportamento / personalidade</span><input value={draft.behavior} onChange={(event) => setDraft((current) => ({ ...current, behavior: event.target.value }))} className="field" /></label>
              <label><span className="field-label">Objetivo</span><input value={draft.objective} onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value }))} className="field" /></label>
              <label><span className="field-label">Segredo (somente Mestre)</span><textarea value={draft.secret} onChange={(event) => setDraft((current) => ({ ...current, secret: event.target.value }))} className="field min-h-20 resize-y" /></label>
              <label><span className="field-label">Localização pai opcional</span><select value={draft.parentId} onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value }))} className="field"><option value="">Sem nível pai</option>{state.v1.library.filter((entity) => ['place', 'settlement', 'region', 'country', 'world'].includes(entity.kind)).map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></label>
              <label><span className="field-label">Tags separadas por vírgula</span><input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} className="field" /></label>
              <label><span className="field-label">Notas privadas</span><textarea value={draft.privateNotes} onChange={(event) => setDraft((current) => ({ ...current, privateNotes: event.target.value }))} className="field min-h-24 resize-y" /></label>
            </> : null}

            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><FileUp size={15} /> Importar conteúdo</div>
              <p className="mt-1 text-xs text-text-muted">Anexe PDF, imagem, texto ou JSON. A revisão acontece aqui antes de persistir dados estruturados.</p>
              <label className="btn-ghost mt-3 cursor-pointer"><FileUp size={14} /> Selecionar arquivo<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,application/json" className="hidden" onChange={(event) => event.target.files?.[0] && reviewImport(event.target.files[0])} /></label>
              {importError ? <p className="mt-2 text-xs text-rose-200">{importError}</p> : null}
              {importFile ? <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"><strong>Revisar importação:</strong> {importFile.name} · preencha/confirme os campos acima antes de salvar.</div> : null}
            </div>

            <button type="button" onClick={save} disabled={!draft.name.trim()} className="btn-primary w-full"><Save size={15} /> Salvar na biblioteca</button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="app-panel flex flex-wrap gap-3 p-4"><label className="relative min-w-56 flex-1"><Search size={15} className="absolute left-3 top-3.5 text-text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field pl-9" placeholder="Buscar dossiês…" /></label><select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as LibraryEntityKind | 'all')} className="field w-auto"><option value="all">Todos os tipos</option>{KINDS.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select></div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((entity) => {
              const parent = state.v1.library.find((entry) => entry.id === entity.parentId)
              return <article key={entity.id} className="app-panel overflow-hidden"><div className="aspect-[16/7] bg-black/30">{entity.imageDataUrl ? <img src={entity.imageDataUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Archive size={28} className="text-white/15" /></div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[0.2em] text-secondary">{KINDS.find((kind) => kind.id === entity.kind)?.label}</div><h3 className="mt-1 text-xl font-semibold text-white">{entity.name}</h3></div><button type="button" aria-label={`Excluir ${entity.name}`} onClick={() => deleteLibraryEntity(entity.id)} className="rounded-lg border border-rose-400/20 p-2 text-rose-200"><Trash2 size={14} /></button></div><p className="mt-2 text-sm text-text-muted">{entity.summary || 'Sem resumo.'}</p>{parent ? <div className="mt-3 flex items-center gap-1 text-xs text-text-muted"><MapPin size={12} /> {parent.name}</div> : null}<div className="mt-3 flex flex-wrap gap-1">{entity.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-text-muted">{tag}</span>)}</div></div></article>
            })}
            {filtered.length === 0 ? <div className="app-panel-muted col-span-full p-10 text-center text-text-muted"><Plus size={24} className="mx-auto mb-3 opacity-30" />A biblioteca ainda não possui itens neste filtro.</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
