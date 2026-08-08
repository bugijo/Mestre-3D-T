import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { PageHero } from '@/components/ui/PageHero'
import {
  DEFAULT_CAMPAIGN_SYSTEM,
  SUPPORTED_CAMPAIGN_SYSTEMS,
  type SupportedCampaignSystem,
  isSupportedCampaignSystem,
  normalizeCampaignSystem,
} from '@/lib/campaignSystems'
import type { CharacterEntryMode } from '@/domain/v1'

export function CampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { state, createCampaign, updateCampaign } = useAppStore()!

  const [title, setTitle] = useState('')
  const [system, setSystem] = useState<SupportedCampaignSystem | ''>(DEFAULT_CAMPAIGN_SYSTEM)
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<string>('')
  const [systemNotice, setSystemNotice] = useState<string | null>(null)
  const [entryMode, setEntryMode] = useState<CharacterEntryMode>('new_start')
  const [minProgression, setMinProgression] = useState(0)
  const [maxProgression, setMaxProgression] = useState(100)

  const isEditing = !!id
  const campaignCharacterCount = id ? state.characters.filter((character) => character.campaignId === id).length : 0
  const canEditSystem = !isEditing || campaignCharacterCount === 0

  useEffect(() => {
    if (!id) {
      setSystem(DEFAULT_CAMPAIGN_SYSTEM)
      setSystemNotice(null)
      return
    }
    const campaign = state.campaigns.find((entry) => entry.id === id)
    if (!campaign) return
    const normalizedSystem = normalizeCampaignSystem(campaign.system)
    setTitle(campaign.title)
    setSystem(isSupportedCampaignSystem(normalizedSystem) ? normalizedSystem : '')
    setDescription(campaign.description)
    setCover(campaign.coverDataUrl || '')
    setEntryMode(campaign.entryPolicy?.mode ?? 'new_start')
    setMinProgression(campaign.entryPolicy?.minProgression ?? 0)
    setMaxProgression(campaign.entryPolicy?.maxProgression ?? 100)
    if (!isSupportedCampaignSystem(normalizedSystem)) {
      setSystemNotice(`A campanha usa "${campaign.system}", que nao possui criacao guiada suportada nesta versao. Escolha uma base oficial antes de salvar.`)
      return
    }
    if (normalizedSystem !== campaign.system) {
      setSystemNotice(`Sistema legado detectado: "${campaign.system}". Ao salvar, a campanha sera alinhada para "${normalizedSystem}".`)
      return
    }
    setSystemNotice(null)
  }, [id, state.campaigns])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !system) return

    if (isEditing && id) {
      updateCampaign(id, {
        title,
        system,
        description,
        coverDataUrl: cover || null,
        entryPolicy: { mode: entryMode, minProgression: entryMode === 'range' ? minProgression : undefined, maxProgression: entryMode === 'range' ? maxProgression : undefined, requiresMasterApproval: true },
        defaultSessionMode: 'in_person',
      })
    } else {
      createCampaign({
        title,
        system,
        description,
        coverDataUrl: cover,
        entryPolicy: { mode: entryMode, minProgression: entryMode === 'range' ? minProgression : undefined, maxProgression: entryMode === 'range' ? maxProgression : undefined, requiresMasterApproval: true },
        defaultSessionMode: 'in_person',
      })
    }

    navigate(isEditing ? `/campaigns/${id}` : '/campaigns')
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHero
        eyebrow="Configuracao narrativa"
        title={isEditing ? 'Editar campanha' : 'Nova campanha'}
        description={isEditing ? 'Atualize os detalhes da sua aventura sem quebrar a consistencia visual da mesa.' : 'Configure o cenario da proxima jornada com estrutura clara e pronta para jogo.'}
        actions={
          <button type="button" onClick={() => navigate('/campaigns')} className="btn-ghost">
            <ArrowLeft size={16} />
            Voltar para campanhas
          </button>
        }
      />

      <div className="app-panel mx-auto w-full max-w-3xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="field-label">Titulo da campanha</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: A Lenda de Arton"
              className="field"
              required
            />
          </div>

          <fieldset className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Entrada de personagens</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['new_start', 'Novo começo', 'Todos começam na progressão da campanha.'],
                ['existing', 'Personagens existentes', 'Aceita histórico anterior com aprovação.'],
                ['range', 'Faixa permitida', 'Restringe a progressão mínima e máxima.'],
                ['adapted', 'Adaptado à campanha', 'Cria uma versão temporária sem destruir o original.'],
                ['full_legacy', 'Legado completo', 'Traz progresso e itens, sujeito ao Mestre.'],
              ].map(([value, label, detail]) => (
                <button key={value} type="button" onClick={() => setEntryMode(value as CharacterEntryMode)} className={`rounded-2xl border p-3 text-left ${entryMode === value ? 'border-secondary/40 bg-secondary/10 text-white' : 'border-white/10 text-text-muted'}`}>
                  <div className="text-sm font-semibold">{label}</div><div className="mt-1 text-xs">{detail}</div>
                </button>
              ))}
            </div>
            {entryMode === 'range' ? <div className="grid grid-cols-2 gap-3"><label><span className="field-label">Mínimo</span><input type="number" min={0} max={100} value={minProgression} onChange={(event) => setMinProgression(Number(event.target.value))} className="field" /></label><label><span className="field-label">Máximo</span><input type="number" min={0} max={100} value={maxProgression} onChange={(event) => setMaxProgression(Number(event.target.value))} className="field" /></label></div> : null}
            <p className="text-xs text-text-muted">O personagem pertence ao jogador; a aceitação da participação e dos recursos pertence ao Mestre.</p>
          </fieldset>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="field-label">Sistema de regras</label>
              <select value={system} onChange={(event) => setSystem(event.target.value as SupportedCampaignSystem | '')} className="field" disabled={!canEditSystem}>
                {!system ? <option value="">Selecione um sistema suportado</option> : null}
                {SUPPORTED_CAMPAIGN_SYSTEMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {systemNotice ? <p className="text-sm text-amber-200">{systemNotice}</p> : null}
              {!canEditSystem ? <p className="text-sm text-text-muted">O sistema fica travado depois que a campanha recebe personagens.</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="field-label">Descricao / Sinopse</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva brevemente o enredo principal..."
              rows={4}
              className="field resize-none"
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              label="Capa da Campanha"
              currentImage={cover}
              onImageSelected={setCover}
              config={{ compressionQuality: 0.7, maxSizeInBytes: 3 * 1024 * 1024 }}
            />
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <button type="button" onClick={() => navigate('/campaigns')} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              <Save size={16} />
              {isEditing ? 'Salvar alteracoes' : 'Criar campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
