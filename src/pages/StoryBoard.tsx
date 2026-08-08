import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Link2, Network, Play, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { createId } from '@/lib/id'

export function StoryBoard() {
  const { state, updateScene, setActiveScene } = useAppStore()
  const [campaignId, setCampaignId] = useState(state.session.activeCampaignId || state.campaigns[0]?.id || '')
  const scenes = useMemo(
    () => state.scenes.filter((scene) => scene.campaignId === campaignId).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    [campaignId, state.scenes],
  )
  const [fromSceneId, setFromSceneId] = useState('')
  const [toSceneId, setToSceneId] = useState('')
  const [label, setLabel] = useState('Próxima cena')
  const [condition, setCondition] = useState('')
  const [consequence, setConsequence] = useState('')

  const reorder = (sceneId: string, direction: -1 | 1) => {
    const index = scenes.findIndex((scene) => scene.id === sceneId)
    const neighbor = scenes[index + direction]
    const scene = scenes[index]
    if (!scene || !neighbor) return
    updateScene(scene.id, { orderIndex: neighbor.orderIndex })
    updateScene(neighbor.id, { orderIndex: scene.orderIndex })
  }

  const addConnection = () => {
    const source = scenes.find((scene) => scene.id === fromSceneId)
    if (!source || !toSceneId || source.id === toSceneId) return
    updateScene(source.id, {
      connections: [
        ...(source.connections ?? []),
        { id: createId(), toSceneId, label: label.trim() || 'Alternativa', condition: condition.trim(), consequence: consequence.trim() },
      ],
    })
    setCondition('')
    setConsequence('')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="app-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#cfa3a3]"><Network size={15} /> História</div><h1 className="mt-2 text-3xl font-bold text-white">Quadro narrativo</h1><p className="mt-2 max-w-2xl text-sm text-text-muted">Organize a sequência e registre caminhos alternativos sem transformar a preparação em um diagrama pesado.</p></div>
          <Link to={campaignId ? `/campaigns/${campaignId}` : '/campaigns'} className="btn-ghost">Editar cenas da campanha</Link>
        </div>
        <label className="mt-5 block max-w-md"><span className="field-label">Campanha</span><select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setFromSceneId(''); setToSceneId('') }} className="field mt-2"><option value="">Escolha uma campanha</option>{state.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select></label>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {scenes.map((scene, index) => (
            <article key={scene.id} className="dossier-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1"><button type="button" aria-label={`Mover ${scene.name} para cima`} disabled={index === 0} onClick={() => reorder(scene.id, -1)} className="rounded border border-white/10 p-1 text-text-muted disabled:opacity-25"><ChevronUp size={14} /></button><button type="button" aria-label={`Mover ${scene.name} para baixo`} disabled={index === scenes.length - 1} onClick={() => reorder(scene.id, 1)} className="rounded border border-white/10 p-1 text-text-muted disabled:opacity-25"><ChevronDown size={14} /></button></div>
                <div className="min-w-0 flex-1"><div className="text-[10px] uppercase tracking-[0.22em] text-[#cfa3a3]">Cartão {index + 1} · {scene.mood}</div><h2 className="mt-1 text-xl font-semibold text-white">{scene.name}</h2><p className="mt-2 text-sm text-text-muted">{scene.objective || scene.description || 'Sem objetivo descrito.'}</p>
                  {(scene.connections ?? []).length ? <div className="mt-4 space-y-2 border-t border-white/10 pt-3">{(scene.connections ?? []).map((connection) => { const target = scenes.find((entry) => entry.id === connection.toSceneId); return <div key={connection.id} className="flex items-start gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs"><ArrowRight size={14} className="mt-0.5 shrink-0 text-[#cfa3a3]" /><div className="min-w-0 flex-1"><span className="font-semibold text-white">{connection.label}</span><span className="text-text-muted"> → {target?.name || 'Cena removida'}</span>{connection.condition ? <div className="mt-1 text-[#d7c8b5]">Se: {connection.condition}</div> : null}{connection.consequence ? <div className="text-text-muted">Consequência: {connection.consequence}</div> : null}</div><button type="button" aria-label="Remover conexão" onClick={() => updateScene(scene.id, { connections: (scene.connections ?? []).filter((entry) => entry.id !== connection.id) })} className="text-text-muted hover:text-rose-200"><Trash2 size={13} /></button></div> })}</div> : null}
                </div>
                <button type="button" onClick={() => setActiveScene(scene.campaignId, scene.id)} className="btn-ghost"><Play size={14} /> Preparar</button>
              </div>
            </article>
          ))}
          {campaignId && scenes.length === 0 ? <div className="dossier-card border-dashed p-8 text-center text-sm text-text-muted">Esta campanha ainda não possui cenas.</div> : null}
        </div>

        <aside className="app-panel h-fit p-4 lg:sticky lg:top-28">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#cfa3a3]"><Link2 size={14} /> Nova conexão</div>
          <div className="mt-4 space-y-3">
            <label className="block"><span className="field-label">Da cena</span><select value={fromSceneId} onChange={(event) => setFromSceneId(event.target.value)} className="field mt-1"><option value="">Selecione</option>{scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>
            <label className="block"><span className="field-label">Para a cena</span><select value={toSceneId} onChange={(event) => setToSceneId(event.target.value)} className="field mt-1"><option value="">Selecione</option>{scenes.filter((scene) => scene.id !== fromSceneId).map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>
            <label className="block"><span className="field-label">Alternativa</span><input value={label} onChange={(event) => setLabel(event.target.value)} className="field mt-1" placeholder="Seguir a pista" /></label>
            <label className="block"><span className="field-label">Condição opcional</span><input value={condition} onChange={(event) => setCondition(event.target.value)} className="field mt-1" placeholder="Se encontrarem o relatório" /></label>
            <label className="block"><span className="field-label">Consequência</span><textarea value={consequence} onChange={(event) => setConsequence(event.target.value)} className="field mt-1 min-h-20" placeholder="O contato passa a confiar no grupo." /></label>
            <button type="button" disabled={!fromSceneId || !toSceneId} onClick={addConnection} className="btn-primary w-full"><ArrowRight size={15} /> Conectar cenas</button>
          </div>
        </aside>
      </section>
    </div>
  )
}
