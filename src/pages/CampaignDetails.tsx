import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Link2,
  Play,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { ImageGenerator } from '@/components/ui/ImageGenerator'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/cn'
import type { Arc, Character, Mood, RollTrigger, Scene } from '@/domain/models'
import { createId } from '@/lib/id'
import { isDndCampaignSystem } from '@/lib/campaignSystems'

const MOODS: Mood[] = ['neutral', 'calm', 'tense', 'epic', 'mysterious']
const DEFAULT_TRIGGER = {
  situation: '',
  testType: 'Teste',
  attribute: 'Habilidade',
  difficulty: 'Normal',
  onSuccess: '',
  onFailure: '',
}

type PendingDelete =
  | { type: 'campaign'; campaignId: string; label: string }
  | { type: 'arc'; arcId: string; label: string }
  | { type: 'scene'; sceneId: string; label: string }
  | null

export function CampaignDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    state,
    createArc,
    createScene,
    deleteArc,
    deleteCampaign,
    deleteScene,
    linkCharacterToScene,
    setActiveScene,
    startSession,
    unlinkCharacterFromScene,
    updateArc,
    updateScene,
  } = useAppStore()

  const campaign = state.campaigns.find((entry) => entry.id === id)
  const arcs = useMemo(
    () => state.arcs.filter((entry) => entry.campaignId === id).sort((a, b) => a.orderIndex - b.orderIndex),
    [id, state.arcs],
  )
  const campaignScenes = useMemo(
    () => state.scenes.filter((entry) => entry.campaignId === id).sort((a, b) => a.orderIndex - b.orderIndex),
    [id, state.scenes],
  )
  const campaignCharacters = useMemo(
    () => state.characters.filter((entry) => entry.campaignId === id),
    [id, state.characters],
  )

  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>({})
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [newArcName, setNewArcName] = useState('')
  const [newArcDescription, setNewArcDescription] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)

  useEffect(() => {
    if (!campaignScenes.length) {
      setSelectedSceneId(null)
      return
    }
    setSelectedSceneId((current) =>
      current && campaignScenes.some((scene) => scene.id === current) ? current : campaignScenes[0].id,
    )
  }, [campaignScenes])

  if (!campaign) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-text-muted">
        <h2 className="text-xl">Campanha não encontrada</h2>
        <Link to="/campaigns" className="text-secondary hover:underline">
          Voltar para campanhas
        </Link>
      </div>
    )
  }

  const selectedScene = campaignScenes.find((scene) => scene.id === selectedSceneId) ?? null

  const handleDeleteCampaign = () => {
    setPendingDelete({ type: 'campaign', campaignId: campaign.id, label: campaign.title })
  }

  const handleCreateArc = () => {
    const name = newArcName.trim()
    if (!name) return
    const arc = createArc(campaign.id, name, newArcDescription.trim())
    setExpandedArcs((current) => ({ ...current, [arc.id]: true }))
    setNewArcName('')
    setNewArcDescription('')
  }

  const handleCreateScene = (arcId: string) => {
    const template = isDndCampaignSystem(campaign.system)
      ? {
          name: 'Nova Cena 5e',
          description: 'Encontro com gancho claro, espaço para exploração e resolução em grupo.',
          objective: 'Investigar o local, obter pistas e decidir a próxima ação.',
          mood: 'mysterious' as const,
          opening: 'As tochas tremulam quando uma nova presença entra no cenário.',
        }
      : {
          name: 'Nova Cena 3D&T',
          description: 'Cena dinâmica com conflito direto, pistas visuais e espaço para improviso.',
          objective: 'Superar o obstáculo e avançar a narrativa com estilo.',
          mood: 'epic' as const,
          opening: 'Um clarão corta o horizonte e todos percebem que a ação começou.',
        }
    const scene = createScene(campaign.id, arcId, template)
    setExpandedArcs((current) => ({ ...current, [arcId]: true }))
    setSelectedSceneId(scene.id)
  }

  return (
    <div className="space-y-8 pb-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10">
        {campaign.coverDataUrl ? (
          <img src={campaign.coverDataUrl} alt={campaign.title} className="h-72 w-full object-cover opacity-55" />
        ) : (
          <div className="h-72 w-full bg-[radial-gradient(circle_at_top,_rgba(0,255,157,0.18),_transparent_35%),linear-gradient(135deg,#14081f,#04060c)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-text-muted">Workspace Narrativo</p>
              <h1 className="text-4xl font-display font-bold text-white">{campaign.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
                {campaign.description || 'Campanha sem sinopse. Use os campos abaixo para estruturar arcos, cenas e gatilhos.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
              >
                Editar campanha
              </button>
              <button
                onClick={handleDeleteCampaign}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Arcos</h2>
            </div>

            <div className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input
                type="text"
                value={newArcName}
                onChange={(event) => setNewArcName(event.target.value)}
                placeholder="Nome do novo arco"
                className="field"
              />
              <textarea
                value={newArcDescription}
                onChange={(event) => setNewArcDescription(event.target.value)}
                rows={3}
                placeholder="Objetivo e tom do arco"
                className="field"
              />
              <button
                onClick={handleCreateArc}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/15 px-3 py-2 text-sm text-white transition hover:bg-secondary/25"
              >
                <Plus size={14} />
                Criar arco
              </button>
            </div>

            <div className="space-y-3">
              {arcs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-text-muted">
                  Nenhum arco criado ainda.
                </div>
              ) : (
                arcs.map((arc) => (
                  <ArcWorkspaceCard
                    key={arc.id}
                    arc={arc}
                    expanded={!!expandedArcs[arc.id]}
                    onToggle={() => setExpandedArcs((current) => ({ ...current, [arc.id]: !current[arc.id] }))}
                    onCreateScene={() => handleCreateScene(arc.id)}
                    onDelete={() => {
                      setPendingDelete({ type: 'arc', arcId: arc.id, label: arc.name })
                    }}
                    onSave={(patch) => updateArc(arc.id, patch)}
                    scenes={campaignScenes.filter((scene) => scene.arcId === arc.id)}
                    selectedSceneId={selectedSceneId}
                    onSelectScene={(sceneId) => setSelectedSceneId(sceneId)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Preparação Rápida</h2>
            </div>
            <div className="space-y-2 text-sm text-text-muted">
              <p>{arcs.length} arcos</p>
              <p>{campaignScenes.length} cenas</p>
              <p>{campaignCharacters.length} personagens vinculados</p>
              <p>{campaignScenes.filter((scene) => scene.isCompleted).length} cenas concluídas</p>
            </div>
          </section>
        </aside>

        <main>
          {selectedScene ? (
            <SceneEditor
              key={selectedScene.id}
              campaignId={campaign.id}
              characters={campaignCharacters}
              onDelete={() => {
                setPendingDelete({ type: 'scene', sceneId: selectedScene.id, label: selectedScene.name })
              }}
              onLaunch={() => {
                setActiveScene(campaign.id, selectedScene.id)
                if (!state.session.isActive) startSession()
                navigate('/session')
              }}
              onLinkCharacter={(characterId, kind, enabled) => {
                if (enabled) {
                  linkCharacterToScene(selectedScene.id, characterId, kind)
                  return
                }
                unlinkCharacterFromScene(selectedScene.id, characterId, kind)
              }}
              onSave={(patch) => updateScene(selectedScene.id, patch)}
              scene={selectedScene}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-text-muted">
              Selecione uma cena para editar seus detalhes.
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.type === 'campaign'
            ? 'Excluir campanha'
            : pendingDelete?.type === 'arc'
              ? 'Excluir arco'
              : 'Excluir cena'
        }
        description={
          pendingDelete?.type === 'campaign'
            ? `A campanha ${pendingDelete.label} e todos os seus arcos e cenas serao removidos.`
            : pendingDelete?.type === 'arc'
              ? `O arco ${pendingDelete.label} e todas as cenas vinculadas a ele serao removidos.`
              : pendingDelete
                ? `A cena ${pendingDelete.label} sera removida permanentemente do workspace.`
                : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          if (pendingDelete.type === 'campaign') {
            deleteCampaign(pendingDelete.campaignId)
            navigate('/campaigns')
          } else if (pendingDelete.type === 'arc') {
            deleteArc(pendingDelete.arcId)
          } else {
            deleteScene(pendingDelete.sceneId)
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function ArcWorkspaceCard({
  arc,
  expanded,
  onCreateScene,
  onDelete,
  onSave,
  onSelectScene,
  onToggle,
  scenes,
  selectedSceneId,
}: {
  arc: Arc
  expanded: boolean
  onCreateScene: () => void
  onDelete: () => void
  onSave: (patch: Partial<Arc>) => void
  onSelectScene: (sceneId: string) => void
  onToggle: () => void
  scenes: Scene[]
  selectedSceneId: string | null
}) {
  const [name, setName] = useState(arc.name)
  const [description, setDescription] = useState(arc.description)

  useEffect(() => {
    setName(arc.name)
    setDescription(arc.description)
  }, [arc.description, arc.name])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-start gap-3 p-4">
        <button onClick={onToggle} className="rounded-lg p-1 text-text-muted transition hover:bg-white/10 hover:text-white">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => name.trim() && name !== arc.name && onSave({ name: name.trim() })}
            className="field"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => description !== arc.description && onSave({ description: description.trim() })}
            rows={2}
            className="field text-xs text-text-muted"
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{scenes.length} cenas</span>
            <div className="flex gap-2">
              <button onClick={onCreateScene} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white transition hover:bg-white/10">
                Nova cena
              </button>
              <button onClick={onDelete} className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-red-200 transition hover:bg-red-500/20">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-white/5 px-4 pb-4 pt-3">
          {scenes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-xs text-text-muted">
              Nenhuma cena neste arco.
            </div>
          ) : (
            scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-left transition',
                  selectedSceneId === scene.id
                    ? 'border-secondary/40 bg-secondary/15'
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{scene.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">{scene.mood}</div>
                  </div>
                  {scene.isCompleted && <CheckCircle2 size={16} className="text-primary" />}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SceneEditor({
  campaignId,
  characters,
  onDelete,
  onLaunch,
  onLinkCharacter,
  onSave,
  scene,
}: {
  campaignId: string
  characters: Character[]
  onDelete: () => void
  onLaunch: () => void
  onLinkCharacter: (characterId: string, kind: 'npc' | 'enemy', enabled: boolean) => void
  onSave: (patch: Partial<Scene>) => void
  scene: Scene
}) {
  const [draft, setDraft] = useState(scene)
  const [hookInput, setHookInput] = useState('')
  const [triggerDraft, setTriggerDraft] = useState(DEFAULT_TRIGGER)
  const [showBgGen, setShowBgGen] = useState(false)
  const [showMapGen, setShowMapGen] = useState(false)

  useEffect(() => {
    setDraft(scene)
    setHookInput('')
    setTriggerDraft(DEFAULT_TRIGGER)
  }, [scene])

  const sceneCharacters = useMemo(
    () => characters.filter((character) => character.campaignId === campaignId),
    [campaignId, characters],
  )
  const npcs = sceneCharacters.filter((character) => character.type === 'NPC' || character.type === 'COMPANION')
  const enemies = sceneCharacters.filter((character) => character.type === 'ENEMY' || character.type === 'BOSS')

  const persist = (patch: Partial<Scene>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    onSave(patch)
  }

  const addHook = () => {
    const value = hookInput.trim()
    if (!value || draft.hooks.includes(value)) return
    persist({ hooks: [...draft.hooks, value] })
    setHookInput('')
  }

  const addTrigger = () => {
    if (!triggerDraft.situation.trim()) return
    const trigger: RollTrigger = {
      id: createId(),
      situation: triggerDraft.situation.trim(),
      testType: triggerDraft.testType.trim(),
      attribute: triggerDraft.attribute.trim(),
      difficulty: triggerDraft.difficulty.trim(),
      onSuccess: triggerDraft.onSuccess.trim(),
      onFailure: triggerDraft.onFailure.trim(),
    }
    persist({ triggers: [...draft.triggers, trigger] })
    setTriggerDraft(DEFAULT_TRIGGER)
  }

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Cena selecionada</p>
          <h2 className="mt-2 text-3xl font-rajdhani font-bold text-white">{draft.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onLaunch}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/15 px-4 py-2 text-sm text-white transition hover:bg-primary/25"
          >
            <Play size={15} />
            Preparar na sessão
          </button>
          <button
            onClick={onDelete}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
          >
            Excluir cena
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Field label="Nome da cena">
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              onBlur={() => draft.name.trim() && onSave({ name: draft.name.trim() })}
              className="field"
            />
          </Field>
          <Field label="Objetivo">
            <textarea
              value={draft.objective}
              onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value }))}
              onBlur={() => onSave({ objective: draft.objective.trim() })}
              rows={3}
              className="field"
            />
          </Field>
          <Field label="Clima">
            <select
              value={draft.mood}
              onChange={(event) => persist({ mood: event.target.value as Mood })}
              className="field"
            >
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => persist({ isCompleted: !draft.isCompleted, completedAt: draft.isCompleted ? null : Date.now() })}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm transition',
                draft.isCompleted
                  ? 'border-primary/30 bg-primary/15 text-white'
                  : 'border-white/10 bg-white/5 text-text-muted hover:text-white',
              )}
            >
              {draft.isCompleted ? 'Marcar como pendente' : 'Concluir cena'}
            </button>
            <button
              onClick={() => persist({ soundtrackUrl: draft.soundtrackUrl ? null : 'https://' })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-muted transition hover:text-white"
            >
              {draft.soundtrackUrl ? 'Remover trilha' : 'Adicionar trilha'}
            </button>
          </div>
          {draft.soundtrackUrl !== null && (
            <Field label="URL da trilha">
              <input
                type="url"
                value={draft.soundtrackUrl || ''}
                onChange={(event) => setDraft((current) => ({ ...current, soundtrackUrl: event.target.value }))}
                onBlur={() => onSave({ soundtrackUrl: draft.soundtrackUrl?.trim() || null })}
                className="field"
              />
            </Field>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Field label="Descrição / leitura">
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              onBlur={() => onSave({ description: draft.description.trim() })}
              rows={6}
              className="field"
            />
          </Field>
          <Field label="Abertura">
            <textarea
              value={draft.opening}
              onChange={(event) => setDraft((current) => ({ ...current, opening: event.target.value }))}
              onBlur={() => onSave({ opening: draft.opening.trim() })}
              rows={4}
              className="field"
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MediaEditorCard
          image={draft.backgroundImageDataUrl}
          label="Fundo da cena"
          onChange={(value) => persist({ backgroundImageDataUrl: value || null })}
          onToggleGenerator={() => setShowBgGen((current) => !current)}
          showGenerator={showBgGen}
          onGenerated={(value) => persist({ backgroundImageDataUrl: value })}
        />
        <MediaEditorCard
          image={draft.mapImageDataUrl}
          label="Mapa da cena"
          onChange={(value) => persist({ mapImageDataUrl: value || null })}
          onToggleGenerator={() => setShowMapGen((current) => !current)}
          showGenerator={showMapGen}
          onGenerated={(value) => persist({ mapImageDataUrl: value })}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Hooks</h3>
          </div>
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={hookInput}
              onChange={(event) => setHookInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addHook())}
              placeholder="Adicionar gancho narrativo"
              className="field"
            />
            <button onClick={addHook} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10">
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {draft.hooks.length === 0 ? (
              <EmptyState text="Nenhum hook cadastrado." />
            ) : (
              draft.hooks.map((hook) => (
                <div key={hook} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
                  <span>{hook}</span>
                  <button
                    onClick={() => persist({ hooks: draft.hooks.filter((entry) => entry !== hook) })}
                    className="rounded-lg bg-red-500/15 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/25"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-300" />
            <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Gatilhos de Rolagem</h3>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input value={triggerDraft.situation} onChange={(event) => setTriggerDraft((current) => ({ ...current, situation: event.target.value }))} placeholder="Situação" className="field" />
            <input value={triggerDraft.attribute} onChange={(event) => setTriggerDraft((current) => ({ ...current, attribute: event.target.value }))} placeholder="Atributo" className="field" />
            <input value={triggerDraft.testType} onChange={(event) => setTriggerDraft((current) => ({ ...current, testType: event.target.value }))} placeholder="Tipo de teste" className="field" />
            <input value={triggerDraft.difficulty} onChange={(event) => setTriggerDraft((current) => ({ ...current, difficulty: event.target.value }))} placeholder="Dificuldade" className="field" />
            <textarea value={triggerDraft.onSuccess} onChange={(event) => setTriggerDraft((current) => ({ ...current, onSuccess: event.target.value }))} placeholder="Resultado em sucesso" rows={2} className="field md:col-span-2" />
            <textarea value={triggerDraft.onFailure} onChange={(event) => setTriggerDraft((current) => ({ ...current, onFailure: event.target.value }))} placeholder="Resultado em falha" rows={2} className="field md:col-span-2" />
          </div>
          <button onClick={addTrigger} className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10">
            Salvar gatilho
          </button>

          <div className="mt-4 space-y-2">
            {draft.triggers.length === 0 ? (
              <EmptyState text="Nenhum gatilho cadastrado." />
            ) : (
              draft.triggers.map((trigger) => (
                <article key={trigger.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{trigger.situation}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                        {trigger.attribute} • {trigger.testType} • {trigger.difficulty}
                      </div>
                    </div>
                    <button
                      onClick={() => persist({ triggers: draft.triggers.filter((entry) => entry.id !== trigger.id) })}
                      className="rounded-lg bg-red-500/15 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/25"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-text-muted">
                    <p><span className="text-primary">Sucesso:</span> {trigger.onSuccess || 'Sem descrição.'}</p>
                    <p><span className="text-red-300">Falha:</span> {trigger.onFailure || 'Sem descrição.'}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CharacterLinkCard
          characters={npcs}
          label="NPCs e aliados"
          linkedIds={draft.npcIds}
          onToggle={(characterId, enabled) => onLinkCharacter(characterId, 'npc', enabled)}
        />
        <CharacterLinkCard
          characters={enemies}
          label="Inimigos e chefes"
          linkedIds={draft.enemyIds}
          onToggle={(characterId, enabled) => onLinkCharacter(characterId, 'enemy', enabled)}
        />
      </section>

      <div className="flex justify-end">
        <button
          onClick={() => onSave(draft)}
          className="btn-primary px-4 py-2 text-sm"
        >
          <Save size={14} />
          Salvar tudo
        </button>
      </div>
    </div>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.22em] text-text-muted">{label}</span>
      {children}
    </label>
  )
}

function MediaEditorCard({
  image,
  label,
  onChange,
  onGenerated,
  onToggleGenerator,
  showGenerator,
}: {
  image: string | null
  label: string
  onChange: (value: string) => void
  onGenerated: (value: string) => void
  onToggleGenerator: () => void
  showGenerator: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2">
        <ImageIcon size={15} className="text-accent" />
        <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">{label}</h3>
      </div>
      <ImageUpload
        label={label}
        currentImage={image || ''}
        onImageSelected={onChange}
        config={{ compressionQuality: 0.7, maxSizeInBytes: 3 * 1024 * 1024, maxWidth: 2048, maxHeight: 2048 }}
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleGenerator}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
        >
          {showGenerator ? 'Ocultar gerador' : 'Gerar imagem'}
        </button>
        <span className="text-[11px] text-text-muted">{image ? `${Math.round((image.length / 4) * 3 / 1024)} KB` : 'Sem imagem'}</span>
      </div>
      {showGenerator && (
        <div className="mt-3">
          <ImageGenerator initialCategory="SCENE" onGenerated={onGenerated} />
        </div>
      )}
    </div>
  )
}

function CharacterLinkCard({
  characters,
  label,
  linkedIds,
  onToggle,
}: {
  characters: Character[]
  label: string
  linkedIds: string[]
  onToggle: (characterId: string, enabled: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white">{label}</h3>
      <div className="space-y-2">
        {characters.length === 0 ? (
          <EmptyState text="Nenhum personagem compatível encontrado." />
        ) : (
          characters.map((character) => {
            const checked = linkedIds.includes(character.id)
            return (
              <label key={character.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">{character.name}</div>
                  <div className="text-xs text-text-muted">{character.role || character.type}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onToggle(character.id, event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-secondary focus:ring-secondary"
                />
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-sm text-text-muted">{text}</div>
}
