import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Heart,
  FileText,
  PenLine,
  Save,
  Shield,
  Sparkles,
  User,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react'
import { ImageGenerator } from '@/components/ui/ImageGenerator'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { PageHero } from '@/components/ui/PageHero'
import {
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_POINT_BUY_BUDGET,
  DND_RACES,
  THREE_DET_ARCHETYPES,
  THREE_DET_DISADVANTAGE_CAP,
  THREE_DET_POINTS_BUDGET,
  THREE_DET_SKILLS,
  THREE_DET_TRAITS,
  applyDndRaceBonuses,
  buildDndCharacterPayload,
  buildThreeDetCharacterPayload,
  createDefaultDndBuilder,
  createDefaultThreeDetBuilder,
  getAbilityModifier,
  getDndPointBuyCost,
  getDndPointBuyRemaining,
  getDndPointBuySpent,
  getThreeDetPoints,
  hydrateDndBuilderFromCharacter,
  hydrateThreeDetBuilderFromCharacter,
  validateDndBuilder,
  validateThreeDetBuilder,
  type DndBuilderState,
  type SupportedCharacterSystem,
  type ThreeDetBuilderState,
} from '@/lib/characterRules'
import { calcVictoryMaxHp, calcVictoryMaxMp, type CharacterType } from '@/domain/models'
import type { Character, EquipmentItem } from '@/domain/models'
import type { OrdemCompatibleCharacterData } from '@/domain/v1'
import { getSupportedCharacterSystemForCampaign, normalizeCampaignSystem } from '@/lib/campaignSystems'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/AppStore'
import { ordemCompatibleRuleset } from '@/rulesets/registry'

const CHARACTER_TYPES: { value: CharacterType; label: string; detail: string }[] = [
  { value: 'PLAYER', label: 'Jogador', detail: 'Participante controlado por um jogador.' },
  { value: 'NPC', label: 'NPC', detail: 'Aliado, contato ou ator narrativo.' },
  { value: 'ENEMY', label: 'Inimigo', detail: 'Ameaca comum da campanha.' },
  { value: 'BOSS', label: 'Chefe', detail: 'Ameaca principal do encontro ou arco.' },
  { value: 'COMPANION', label: 'Aliado', detail: 'Companheiro de suporte em cena.' },
]

const DND_ABILITY_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const

type CreationMode = 'guided' | 'free' | 'imported'
type OrdemBuilderState = OrdemCompatibleCharacterData

function createDefaultOrdemBuilder(): OrdemBuilderState {
  return {
    origin: '',
    path: '',
    progression: 5,
    attributes: { agility: 1, intellect: 1, presence: 1, strength: 1, vigor: 1 },
    skills: {},
    resources: {
      health: { current: 15, max: 15 },
      effort: { current: 8, max: 8 },
      sanity: { current: 18, max: 18 },
    },
    abilities: [],
    biography: '',
    appearance: '',
  }
}

function deriveOrdemResources(state: OrdemBuilderState): OrdemBuilderState['resources'] {
  const health = 12 + state.attributes.vigor * 3
  const effort = 6 + state.attributes.presence * 2
  const sanity = 15 + state.attributes.presence * 3
  return { health: { current: health, max: health }, effort: { current: effort, max: effort }, sanity: { current: sanity, max: sanity } }
}

function buildOrdemPayload(
  base: { name: string; role: string; type: CharacterType; imageUri: string | null; campaignId: string | null },
  state: OrdemBuilderState,
  creationMode: CreationMode,
  sourceAttachment?: Character['sourceAttachment'],
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  const resources = creationMode === 'guided' ? deriveOrdemResources(state) : state.resources
  const emptyItemList: EquipmentItem[] = []
  return {
    ...base,
    name: base.name.trim(),
    role: base.role.trim() || state.path,
    portraitUri: null,
    tags: ['paranormal', state.origin, state.path].filter(Boolean),
    strength: state.attributes.strength,
    skill: state.attributes.agility,
    resistance: state.attributes.vigor,
    armor: 0,
    firepower: 0,
    currentHp: resources.health.current,
    currentMp: resources.effort.current,
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: '',
    speechStyle: '',
    mannerisms: [],
    goal: '',
    secrets: {},
    quickPhrases: [],
    advantages: [],
    disadvantages: [],
    equipment: emptyItemList,
    powers: [],
    isTemplate: false,
    rulesetId: 'ordem-compatible',
    lifeStatus: 'active',
    history: [],
    creationMode,
    sourceAttachment,
    ordem: { ...state, resources },
  }
}

export function CharacterForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, createCharacter, updateCharacter } = useAppStore()
  const isEditing = Boolean(id)
  const existingCharacter = state.characters.find((character) => character.id === id) ?? null
  const targetCampaignId = existingCharacter?.campaignId ?? state.session.activeCampaignId
  const targetCampaign = state.campaigns.find((campaign) => campaign.id === targetCampaignId) ?? null
  const campaignSystemLabel = targetCampaign ? normalizeCampaignSystem(targetCampaign.system) : null
  const campaignRuleSystem = getSupportedCharacterSystemForCampaign(targetCampaign?.system)

  const [systemChoice, setSystemChoice] = useState<SupportedCharacterSystem>(() => {
    if (existingCharacter?.ordem) return 'ORDEM'
    if (existingCharacter?.dnd) return 'DND5E'
    return campaignRuleSystem ?? '3DT'
  })
  const [creationMode, setCreationMode] = useState<CreationMode>(existingCharacter?.creationMode ?? 'guided')
  const [name, setName] = useState(existingCharacter?.name ?? '')
  const [role, setRole] = useState(existingCharacter?.role ?? '')
  const [type, setType] = useState<CharacterType>(existingCharacter?.type ?? 'NPC')
  const [image, setImage] = useState(existingCharacter?.imageUri ?? '')
  const [showGenerator, setShowGenerator] = useState(false)
  const [threeDetState, setThreeDetState] = useState<ThreeDetBuilderState>(
    existingCharacter ? hydrateThreeDetBuilderFromCharacter(existingCharacter) : createDefaultThreeDetBuilder(),
  )
  const [dndState, setDndState] = useState<DndBuilderState>(
    existingCharacter ? hydrateDndBuilderFromCharacter(existingCharacter) : createDefaultDndBuilder(),
  )
  const [ordemState, setOrdemState] = useState<OrdemBuilderState>(existingCharacter?.ordem ?? createDefaultOrdemBuilder())
  const [importAttachment, setImportAttachment] = useState<Character['sourceAttachment'] | undefined>(existingCharacter?.sourceAttachment)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!existingCharacter) return
    setName(existingCharacter.name)
    setRole(existingCharacter.role)
    setType(existingCharacter.type)
    setImage(existingCharacter.imageUri ?? '')
    setSystemChoice(existingCharacter.ordem ? 'ORDEM' : existingCharacter.dnd ? 'DND5E' : '3DT')
    setCreationMode(existingCharacter.creationMode ?? 'guided')
    setThreeDetState(hydrateThreeDetBuilderFromCharacter(existingCharacter))
    setDndState(hydrateDndBuilderFromCharacter(existingCharacter))
    setOrdemState(existingCharacter.ordem ?? createDefaultOrdemBuilder())
    setImportAttachment(existingCharacter.sourceAttachment)
  }, [existingCharacter])

  useEffect(() => {
    if (existingCharacter) return
    if (!campaignRuleSystem) return
    setSystemChoice(campaignRuleSystem)
  }, [campaignRuleSystem, existingCharacter])

  const commonIssues = useMemo(() => {
    const issues: string[] = []
    if (!name.trim()) issues.push('Informe o nome do personagem.')
    if (!type) issues.push('Escolha o tipo de ficha.')
    if (!targetCampaign) issues.push('Selecione uma campanha ativa antes de criar ou editar fichas.')
    if (targetCampaign && !campaignRuleSystem) {
      issues.push(`A campanha associada usa "${targetCampaign.system}", que ainda nao possui criacao guiada suportada.`)
    }
    if (campaignRuleSystem && systemChoice !== campaignRuleSystem) {
      issues.push(`A campanha associada usa ${campaignSystemLabel}. Salve a ficha nesse mesmo sistema.`)
    }
    return issues
  }, [campaignRuleSystem, campaignSystemLabel, name, systemChoice, targetCampaign, type])

  const threeDetPoints = useMemo(() => getThreeDetPoints(threeDetState), [threeDetState])
  const threeDetIssues = useMemo(() => validateThreeDetBuilder(threeDetState), [threeDetState])
  const dndIssues = useMemo(() => validateDndBuilder(dndState), [dndState])
  const dndRemaining = useMemo(() => getDndPointBuyRemaining(dndState.abilityScores), [dndState.abilityScores])
  const dndSpent = useMemo(() => getDndPointBuySpent(dndState.abilityScores), [dndState.abilityScores])
  const dndFinalScores = useMemo(
    () => applyDndRaceBonuses(dndState.abilityScores, DND_RACES[dndState.raceId].abilityBonuses),
    [dndState.abilityScores, dndState.raceId],
  )

  const ordemIssues = useMemo(() => {
    const issues: Array<{ message: string }> = []
    if (!ordemState.origin.trim()) issues.push({ message: 'Informe a origem do personagem.' })
    if (!ordemState.path.trim()) issues.push({ message: 'Informe o caminho ou função do personagem.' })
    if (Object.values(ordemState.attributes).reduce((total, value) => total + value, 0) > 9 && creationMode === 'guided') {
      issues.push({ message: 'Na criação guiada, distribua no máximo 9 pontos entre os atributos.' })
    }
    if (Object.values(ordemState.attributes).some((value) => !Number.isInteger(value) || value < 0 || value > 5)) {
      issues.push({ message: 'Atributos precisam ser inteiros entre 0 e 5.' })
    }
    if (creationMode === 'imported' && !importAttachment) issues.push({ message: 'Anexe a ficha e revise os dados antes de salvar.' })
    return issues
  }, [creationMode, importAttachment, ordemState])
  const currentIssues = systemChoice === 'ORDEM' ? ordemIssues : systemChoice === '3DT' ? threeDetIssues : dndIssues
  const allIssueMessages = [...commonIssues, ...currentIssues.map((issue) => issue.message)]
  const isValid = allIssueMessages.length === 0
  const allowSystemRepair = Boolean(isEditing && campaignRuleSystem && systemChoice !== campaignRuleSystem)
  const systemSelectionLocked = Boolean(targetCampaign) && !allowSystemRepair

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isValid) return

    const base = {
      name,
      role,
      type,
      imageUri: image || null,
      campaignId: targetCampaignId,
    }
    const payload = systemChoice === 'ORDEM'
      ? buildOrdemPayload(base, ordemState, creationMode, importAttachment)
      : systemChoice === '3DT'
        ? buildThreeDetCharacterPayload(base, threeDetState)
        : buildDndCharacterPayload(base, dndState)

    if (isEditing && id) {
      updateCharacter(id, existingCharacter ? {
        ...payload,
        xp: existingCharacter.xp,
        gold: existingCharacter.gold,
        equipment: existingCharacter.equipment,
        activeConditions: existingCharacter.activeConditions,
        history: existingCharacter.history ?? [],
        ownerUserId: existingCharacter.ownerUserId,
        lifeStatus: existingCharacter.lifeStatus ?? 'active',
        personality: existingCharacter.personality,
        speechStyle: existingCharacter.speechStyle,
        mannerisms: existingCharacter.mannerisms,
        goal: existingCharacter.goal,
        secrets: existingCharacter.secrets,
        quickPhrases: existingCharacter.quickPhrases,
      } : payload)
    } else {
      createCharacter(payload)
    }
    navigate('/characters')
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHero
        eyebrow="Criacao guiada"
        title={
          <>
            {isEditing ? 'Editar ficha' : 'Novo personagem'} com <span className="text-gradient-secondary">regras validadas</span>
          </>
        }
        description="Escolha criação guiada, ficha livre ou importação revisável. O ruleset faz cálculos e validações sem prender o personagem a uma única campanha."
        actions={
          <button onClick={() => navigate('/characters')} className="btn-ghost">
            <ArrowLeft size={16} />
            Voltar para a lista
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="app-panel p-5">
            <SectionHeader
              icon={<BookOpen size={16} className="text-secondary" />}
              title="Ruleset da ficha"
              description="A ficha herda o ruleset da campanha. Regras e tema ficam isolados dos componentes para permitir novos sistemas."
            />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SystemCard
                active={systemChoice === 'ORDEM'}
                title="Protocolo Paranormal"
                description="Investigação, esforço, sanidade e rolagem de d20 compatível com campanhas paranormais. Conteúdo original."
                disabled={systemSelectionLocked}
                onClick={() => setSystemChoice('ORDEM')}
              />
              <SystemCard
                active={systemChoice === '3DT'}
                title="3DeT Victory"
                description="Padrao inicial de 10 pontos, ate 2 pontos em desvantagens, atributos P/H/R e arquetipos oficiais suportados."
                disabled={systemSelectionLocked}
                onClick={() => setSystemChoice('3DT')}
              />
              <SystemCard
                active={systemChoice === 'DND5E'}
                title="D&D 5e"
                description="Criacao oficial de nivel 1 com point buy 27, raca, classe e equipamento inicial do conjunto suportado."
                disabled={systemSelectionLocked}
                onClick={() => setSystemChoice('DND5E')}
              />
            </div>
            {systemChoice === 'ORDEM' ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Modo de criação">
                <CreationModeCard active={creationMode === 'guided'} icon={<BookOpen size={16} />} title="Criação Guiada" detail="Narrativa, opções válidas e cálculos automáticos." onClick={() => setCreationMode('guided')} />
                <CreationModeCard active={creationMode === 'free'} icon={<PenLine size={16} />} title="Ficha Livre" detail="Preenchimento direto com avisos e validações." onClick={() => setCreationMode('free')} />
                <CreationModeCard active={creationMode === 'imported'} icon={<Upload size={16} />} title="Importar" detail="PDF ou imagem com revisão manual obrigatória." onClick={() => setCreationMode('imported')} />
              </div>
            ) : null}
            {targetCampaign ? (
              <div
                className={cn(
                  'mt-4 rounded-3xl border px-4 py-3 text-sm',
                  campaignRuleSystem ? 'border-secondary/20 bg-secondary/10 text-white' : 'border-amber-400/20 bg-amber-400/10 text-amber-50',
                )}
              >
                {campaignRuleSystem
                  ? `Sistema herdado da campanha associada: ${campaignSystemLabel}.`
                  : `A campanha associada usa "${targetCampaign.system}" e precisa ser migrada para 3DeT Victory ou D&D 5e antes de aceitar novas fichas.`}
              </div>
            ) : null}
          </section>

          <section className="app-panel p-5">
            <SectionHeader
              icon={<User size={16} className="text-primary" />}
              title="Identidade da ficha"
              description="Campos comuns usados por mestre, jogadores e combate."
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <input value={name} onChange={(event) => setName(event.target.value)} className="field" placeholder="Ex: Cloud Strife" />
              </Field>
              <Field label={systemChoice === 'DND5E' ? 'Classe / funcao' : systemChoice === 'ORDEM' ? 'Conceito / função' : 'Conceito / funcao'}>
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="field"
                  placeholder={systemChoice === 'DND5E' ? 'Ex: Fighter veterano' : systemChoice === 'ORDEM' ? 'Ex: Perita forense em campo' : 'Ex: Duelista de aluguel'}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CHARACTER_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition',
                    type === option.value
                      ? 'border-secondary/40 bg-secondary/12 text-white'
                      : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-white',
                  )}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="mt-1 text-xs">{option.detail}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="app-panel p-5">
            <SectionHeader
              icon={<Sparkles size={16} className="text-amber-300" />}
              title="Avatar"
              description="Upload local com gerador opcional. Esta area nao interfere na validacao de regras."
            />
            <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                <div className="aspect-[3/4]">
                  <ImageUpload currentImage={image} onImageSelected={setImage} className="h-full w-full" />
                </div>
              </div>
              <div className="space-y-3">
                {systemChoice !== 'ORDEM' || ordemCompatibleRuleset.capabilities.aiGenerationAllowed ? <button type="button" onClick={() => setShowGenerator((value) => !value)} className="btn-secondary">
                  <Wand2 size={16} />
                  {showGenerator ? 'Ocultar gerador' : 'Gerar imagem'}
                </button> : <p className="text-sm text-text-muted">IA é opcional e está desativada neste ruleset. O upload local funciona offline.</p>}
                {showGenerator ? (
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <ImageGenerator
                      initialCategory={type === 'ENEMY' || type === 'BOSS' ? 'CREATURE' : 'CHARACTER'}
                      onGenerated={(dataUrl) => setImage(dataUrl)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {systemChoice === 'ORDEM' ? (
            <OrdemCompatibleBuilder
              state={ordemState}
              onChange={setOrdemState}
              mode={creationMode}
              attachment={importAttachment}
              importError={importError}
              onImport={async (file) => {
                setImportError(null)
                const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
                if (!allowed.includes(file.type)) {
                  setImportError('Use PDF, PNG, JPEG ou WebP.')
                  return
                }
                if (file.size > 10 * 1024 * 1024) {
                  setImportError('O arquivo deve ter no máximo 10 MB.')
                  return
                }
                let dataUrl: string | undefined
                if (file.type.startsWith('image/')) {
                  dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(String(reader.result))
                    reader.onerror = () => reject(reader.error)
                    reader.readAsDataURL(file)
                  })
                }
                setImportAttachment({ name: file.name, mimeType: file.type, size: file.size, dataUrl, reviewedAt: Date.now() })
              }}
            />
          ) : systemChoice === '3DT' ? (
            <ThreeDetGuidedBuilder
              state={threeDetState}
              onChange={setThreeDetState}
              points={threeDetPoints}
              issues={threeDetIssues.map((issue) => issue.message)}
            />
          ) : (
            <DndGuidedBuilder
              state={dndState}
              onChange={setDndState}
              remaining={dndRemaining}
              spent={dndSpent}
              finalScores={dndFinalScores}
              issues={dndIssues.map((issue) => issue.message)}
            />
          )}

          <section className="app-panel-strong p-5">
            <SectionHeader
              icon={isValid ? <CheckCircle2 size={16} className="text-emerald-300" /> : <AlertTriangle size={16} className="text-amber-300" />}
              title="Resumo de conformidade"
              description={isValid ? 'A ficha esta dentro das regras suportadas e pronta para salvar.' : 'Corrija os itens abaixo antes de salvar.'}
            />
            <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              {allIssueMessages.length === 0 ? (
                <div className="space-y-2 text-sm text-text-muted">
                  <p>Sistema: <span className="text-white">{systemChoice === 'ORDEM' ? 'Protocolo Paranormal' : systemChoice === '3DT' ? '3DeT Victory' : 'D&D 5e'}</span></p>
                  <p>Nome: <span className="text-white">{name || 'Sem nome'}</span></p>
                  <p>Tipo: <span className="text-white">{CHARACTER_TYPES.find((item) => item.value === type)?.label}</span></p>
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-amber-100">
                  {allIssueMessages.map((message, index) => (
                    <li key={`${message}-${index}`} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
                      {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => navigate('/characters')} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" disabled={!isValid} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={16} />
                {isEditing ? 'Salvar alteracoes' : 'Criar personagem'}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}

function OrdemCompatibleBuilder({
  state,
  onChange,
  mode,
  attachment,
  importError,
  onImport,
}: {
  state: OrdemBuilderState
  onChange: (next: OrdemBuilderState) => void
  mode: CreationMode
  attachment?: Character['sourceAttachment']
  importError: string | null
  onImport: (file: File) => void
}) {
  const ruleset = ordemCompatibleRuleset
  const resources = mode === 'guided' ? deriveOrdemResources(state) : state.resources
  const attributeTotal = Object.values(state.attributes).reduce((total, value) => total + value, 0)
  const origins = ['Acadêmico', 'Atleta', 'Comunicador', 'Perita', 'Profissional de saúde', 'Técnico', 'Trabalhador rural']
  const paths = ['Especialista', 'Operador', 'Ocultista', 'Sobrevivente', 'Investigador independente']

  const setAttribute = (id: keyof OrdemBuilderState['attributes'], value: number) => {
    const next = { ...state, attributes: { ...state.attributes, [id]: Math.max(0, Math.min(5, value)) } }
    onChange(mode === 'guided' ? { ...next, resources: deriveOrdemResources(next) } : next)
  }

  return (
    <>
      {mode === 'imported' ? (
        <section className="app-panel p-5">
          <SectionHeader icon={<FileText size={16} className="text-secondary" />} title="Anexar ficha existente" description="O arquivo fica anexado como fonte. A criação só acontece depois da revisão manual abaixo; nenhum dado extraído é aceito cegamente." />
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center hover:border-secondary/40">
            <Upload size={24} className="text-secondary" />
            <span className="mt-3 text-sm font-semibold text-white">Selecionar PDF ou imagem</span>
            <span className="mt-1 text-xs text-text-muted">PDF, PNG, JPEG ou WebP · até 10 MB</span>
            <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} />
          </label>
          {importError ? <p className="mt-3 text-sm text-rose-200">{importError}</p> : null}
          {attachment ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="text-sm font-semibold text-emerald-50">Arquivo pronto para revisão</div>
              <div className="mt-1 text-xs text-emerald-100/70">{attachment.name} · {(attachment.size / 1024).toFixed(1)} KB</div>
              {attachment.dataUrl ? <img src={attachment.dataUrl} alt="Prévia da ficha importada" className="mt-3 max-h-72 rounded-xl object-contain" /> : <p className="mt-3 text-xs text-emerald-100/70">PDF anexado. Use o documento como referência e revise os campos estruturados abaixo.</p>}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="app-panel p-5">
        <SectionHeader icon={<BookOpen size={16} className="text-secondary" />} title="Resumo do Personagem — identidade" description={mode === 'free' ? 'Ficha livre com validações ativas.' : 'Escolhas narrativas curtas e editáveis. As opções são originais da plataforma.'} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Origem">
            <input list="ordem-origins" value={state.origin} onChange={(event) => onChange({ ...state, origin: event.target.value })} className="field" placeholder="Selecione ou descreva" />
            <datalist id="ordem-origins">{origins.map((origin) => <option key={origin} value={origin} />)}</datalist>
          </Field>
          <Field label="Caminho">
            <input list="ordem-paths" value={state.path} onChange={(event) => onChange({ ...state, path: event.target.value })} className="field" placeholder="Selecione ou descreva" />
            <datalist id="ordem-paths">{paths.map((path) => <option key={path} value={path} />)}</datalist>
          </Field>
          <Field label="Progressão / exposição">
            <input type="number" min={0} max={100} value={state.progression} onChange={(event) => onChange({ ...state, progression: Math.max(0, Math.min(100, Number(event.target.value))) })} className="field" />
          </Field>
          <Field label="Aparência">
            <input value={state.appearance} onChange={(event) => onChange({ ...state, appearance: event.target.value })} className="field" placeholder="Descrição curta" />
          </Field>
        </div>
        <Field label="História">
          <textarea value={state.biography} onChange={(event) => onChange({ ...state, biography: event.target.value })} className="field mt-4 min-h-28 resize-y" placeholder="O que trouxe este personagem até o paranormal?" />
        </Field>
      </section>

      <section className="app-panel p-5">
        <SectionHeader icon={<Zap size={16} className="text-primary" />} title="Atributos e recursos" description={mode === 'guided' ? `Distribua até 9 pontos. Total atual: ${attributeTotal}/9. PV, PE e Sanidade são calculados automaticamente.` : 'Edite atributos e recursos diretamente; limites e avisos continuam ativos.'} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {ruleset.character.attributes.map((attribute) => (
            <CounterCard key={attribute.id} label={attribute.shortLabel} value={state.attributes[attribute.id as keyof typeof state.attributes]} onChange={(value) => setAttribute(attribute.id as keyof typeof state.attributes, value)} />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ruleset.character.resources.map((resource) => {
            const value = resources[resource.id as keyof typeof resources]
            return (
              <div key={resource.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{resource.shortLabel}</div>
                {mode === 'guided' ? <div className="mt-2 text-2xl font-bold text-white">{value.current}/{value.max}</div> : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input aria-label={`${resource.label} atual`} type="number" min={0} value={value.current} onChange={(event) => onChange({ ...state, resources: { ...state.resources, [resource.id]: { ...value, current: Number(event.target.value) } } })} className="field" />
                    <input aria-label={`${resource.label} máximo`} type="number" min={1} value={value.max} onChange={(event) => onChange({ ...state, resources: { ...state.resources, [resource.id]: { ...value, max: Number(event.target.value) } } })} className="field" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader icon={<Shield size={16} className="text-secondary" />} title="Perícias e habilidades" description="Clique em uma perícia para alternar entre sem treino, treinada (+5) e veterana (+10)." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ruleset.character.skills.map((skill) => {
            const value = state.skills[skill.id] ?? 0
            return <button key={skill.id} type="button" onClick={() => onChange({ ...state, skills: { ...state.skills, [skill.id]: value === 0 ? 5 : value === 5 ? 10 : 0 } })} className={cn('rounded-2xl border p-3 text-left', value ? 'border-secondary/35 bg-secondary/10 text-white' : 'border-white/10 bg-black/20 text-text-muted')}><div className="flex items-center justify-between"><span className="text-sm font-semibold">{skill.label}</span><span className="text-xs">{value ? `+${value}` : '—'}</span></div><p className="mt-1 text-xs">{skill.description}</p></button>
          })}
        </div>
        <Field label="Habilidades / poderes (uma por linha)">
          <textarea value={state.abilities.join('\n')} onChange={(event) => onChange({ ...state, abilities: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} className="field mt-4 min-h-28 resize-y" placeholder="Olhar clínico&#10;Treinamento de campo" />
        </Field>
      </section>
    </>
  )
}

function CreationModeCard({ active, icon, title, detail, onClick }: { active: boolean; icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn('rounded-2xl border p-4 text-left transition', active ? 'border-secondary/40 bg-secondary/12 text-white' : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20')}><div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div><div className="mt-2 text-xs leading-relaxed">{detail}</div></button>
}

function ThreeDetGuidedBuilder({
  state,
  onChange,
  points,
  issues,
}: {
  state: ThreeDetBuilderState
  onChange: (next: ThreeDetBuilderState) => void
  points: ReturnType<typeof getThreeDetPoints>
  issues: string[]
}) {
  const maxHp = calcVictoryMaxHp(state.resistance)
  const maxMp = calcVictoryMaxMp(state.skill)

  const toggleSkill = (skillId: keyof typeof THREE_DET_SKILLS) => {
    onChange({
      ...state,
      skillIds: state.skillIds.includes(skillId)
        ? state.skillIds.filter((current) => current !== skillId)
        : [...state.skillIds, skillId],
    })
  }

  const toggleTrait = (traitId: keyof typeof THREE_DET_TRAITS) => {
    const trait = THREE_DET_TRAITS[traitId]
    const listName = trait.type === 'advantage' ? 'advantageIds' : 'disadvantageIds'
    const currentList = state[listName]
    onChange({
      ...state,
      [listName]: currentList.includes(traitId)
        ? currentList.filter((current) => current !== traitId)
        : [...currentList, traitId],
    } as ThreeDetBuilderState)
  }

  return (
    <>
      <section className="app-panel p-5">
        <SectionHeader
          icon={<BookOpen size={16} className="text-secondary" />}
          title="Passo 1: arquetipo oficial"
          description="Subset suportado a partir do material oficial de 3DeT Victory usado nesta versao."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(THREE_DET_ARCHETYPES).map((archetype) => (
            <OptionCard
              key={archetype.id}
              active={state.archetypeId === archetype.id}
              title={`${archetype.label} (${archetype.cost} pt)`}
              description={archetype.description}
              details={archetype.rulesText}
              onClick={() => onChange({ ...state, archetypeId: archetype.id })}
            />
          ))}
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<Zap size={16} className="text-primary" />}
          title="Passo 2: atributos base"
          description="Criacao padrao com Poder, Habilidade e Resistencia entre 0 e 5."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <CounterCard label="Poder" value={state.power} onChange={(value) => onChange({ ...state, power: value })} />
          <CounterCard label="Habilidade" value={state.skill} onChange={(value) => onChange({ ...state, skill: value })} />
          <CounterCard label="Resistencia" value={state.resistance} onChange={(value) => onChange({ ...state, resistance: value })} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryTile label="PV" value={`${maxHp}`} icon={<Heart size={14} className="text-rose-300" />} />
          <SummaryTile label="PM" value={`${maxMp}`} icon={<Zap size={14} className="text-sky-300" />} />
          <SummaryTile label="Gastos" value={`${points.spent}/${THREE_DET_POINTS_BUDGET}`} icon={<Sparkles size={14} className="text-amber-300" />} />
          <SummaryTile label="Desvantagens" value={`${points.disadvantageCredits}/${THREE_DET_DISADVANTAGE_CAP}`} icon={<AlertTriangle size={14} className="text-amber-300" />} />
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<Shield size={16} className="text-secondary" />}
          title="Passo 3: pericias"
          description="Cada pericia custa 1 ponto e libera combinacoes oficiais suportadas."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(THREE_DET_SKILLS).map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggleSkill(skill.id)}
              className={cn(
                'rounded-2xl border p-3 text-left transition',
                state.skillIds.includes(skill.id)
                  ? 'border-secondary/35 bg-secondary/12 text-white'
                  : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-white',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{skill.label}</div>
                <div className="text-xs uppercase tracking-[0.18em]">1 pt</div>
              </div>
              <div className="mt-2 text-xs">{skill.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<Wand2 size={16} className="text-primary" />}
          title="Passo 4: vantagens e desvantagens"
          description="O sistema marca prerequisitos invalidos em tempo real e limita o credito de desvantagens."
        />
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          <TraitPanel
            title="Vantagens"
            ids={state.advantageIds}
            traits={Object.values(THREE_DET_TRAITS).filter((trait) => trait.type === 'advantage')}
            onToggle={toggleTrait}
            state={state}
          />
          <TraitPanel
            title="Desvantagens"
            ids={state.disadvantageIds}
            traits={Object.values(THREE_DET_TRAITS).filter((trait) => trait.type === 'disadvantage')}
            onToggle={toggleTrait}
            state={state}
          />
        </div>
        {issues.length > 0 ? (
          <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            {issues[0]}
          </div>
        ) : null}
      </section>
    </>
  )
}

function DndGuidedBuilder({
  state,
  onChange,
  remaining,
  spent,
  finalScores,
  issues,
}: {
  state: DndBuilderState
  onChange: (next: DndBuilderState) => void
  remaining: number
  spent: number
  finalScores: Record<(typeof DND_ABILITY_KEYS)[number], number>
  issues: string[]
}) {
  const classDef = DND_CLASSES[state.classId]
  const raceDef = DND_RACES[state.raceId]
  const backgroundDef = DND_BACKGROUNDS[state.backgroundId]
  const dexMod = getAbilityModifier(finalScores.DEX)

  return (
    <>
      <section className="app-panel p-5">
        <SectionHeader
          icon={<Sparkles size={16} className="text-secondary" />}
          title="Passo 1: raca oficial"
          description="Subset suportado das regras oficiais com bonus raciais aplicados automaticamente."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(DND_RACES).map((race) => (
            <OptionCard
              key={race.id}
              active={state.raceId === race.id}
              title={race.label}
              description={race.description}
              details={race.traits.join(' | ')}
              onClick={() => onChange({ ...state, raceId: race.id })}
            />
          ))}
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<Shield size={16} className="text-primary" />}
          title="Passo 2: classe"
          description="A criacao guiada atual cobre classes oficiais basicas de nivel 1."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(DND_CLASSES).map((clazz) => (
            <OptionCard
              key={clazz.id}
              active={state.classId === clazz.id}
              title={`${clazz.label} (d${clazz.hitDie})`}
              description={clazz.description}
              details={`Atributos chave: ${clazz.primaryAbilities.join(', ')}`}
              onClick={() => onChange({ ...state, classId: clazz.id })}
            />
          ))}
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<Zap size={16} className="text-amber-300" />}
          title="Passo 3: atributos com point buy"
          description="Os valores base ficam entre 8 e 15, com teto oficial de 27 pontos."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DND_ABILITY_KEYS.map((key) => {
            const current = state.abilityScores[key]
            const nextValue = Math.min(15, current + 1)
            const increaseCost = getDndPointBuyCost(nextValue) - getDndPointBuyCost(current)
            return (
              <div key={key} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{key}</div>
                    <div className="mt-1 text-2xl font-bold text-white">{current}</div>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <div>Final</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {finalScores[key]} ({getAbilityModifier(finalScores[key]) >= 0 ? '+' : ''}
                      {getAbilityModifier(finalScores[key])})
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        abilityScores: { ...state.abilityScores, [key]: Math.max(8, current - 1) },
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        abilityScores: { ...state.abilityScores, [key]: nextValue },
                      })
                    }
                    disabled={current >= 15 || remaining < increaseCost}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SummaryTile label="Gastos" value={`${spent}/${DND_POINT_BUY_BUDGET}`} icon={<Sparkles size={14} className="text-amber-300" />} />
          <SummaryTile label="Restantes" value={`${remaining}`} icon={<CheckCircle2 size={14} className="text-emerald-300" />} />
          <SummaryTile label="XP inicial" value="0" icon={<BookOpen size={14} className="text-secondary" />} />
        </div>
      </section>

      <section className="app-panel p-5">
        <SectionHeader
          icon={<BookOpen size={16} className="text-secondary" />}
          title="Passo 4: antecedente e equipamento"
          description="O antecedente e narrativo nesta versao; o equipamento inicial e travado em pacotes oficiais validos por classe."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(DND_BACKGROUNDS).map((background) => (
            <OptionCard
              key={background.id}
              active={state.backgroundId === background.id}
              title={background.label}
              description={background.description}
              onClick={() => onChange({ ...state, backgroundId: background.id })}
            />
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SummaryTile label="PV iniciais" value={`${Math.max(1, classDef.hitDie + getAbilityModifier(finalScores.CON))}`} icon={<Heart size={14} className="text-rose-300" />} />
          <SummaryTile label="CA inicial" value={`${classDef.id === 'FIGHTER' ? 18 : classDef.id === 'CLERIC' ? 14 + Math.min(2, dexMod) + 2 : classDef.id === 'ROGUE' ? 11 + dexMod : 10 + dexMod}`} icon={<Shield size={14} className="text-sky-300" />} />
          <SummaryTile label="Prof." value="+2" icon={<Zap size={14} className="text-secondary" />} />
        </div>
        <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Pacote inicial oficial</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {classDef.startingEquipment.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-text-muted">
            Raca atual: {raceDef.label}. Antecedente: {backgroundDef.label}.
          </div>
        </div>
        {issues.length > 0 ? (
          <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            {issues[0]}
          </div>
        ) : null}
      </section>
    </>
  )
}

function TraitPanel({
  title,
  ids,
  traits,
  onToggle,
  state,
}: {
  title: string
  ids: string[]
  traits: Array<(typeof THREE_DET_TRAITS)[keyof typeof THREE_DET_TRAITS]>
  onToggle: (traitId: keyof typeof THREE_DET_TRAITS) => void
  state: ThreeDetBuilderState
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      {traits.map((trait) => {
        const prerequisiteMessage = trait.prerequisite?.(state)
        const selected = ids.includes(trait.id)
        return (
          <button
            key={trait.id}
            type="button"
            onClick={() => onToggle(trait.id)}
            className={cn(
              'w-full rounded-2xl border p-3 text-left transition',
              selected
                ? 'border-secondary/35 bg-secondary/12 text-white'
                : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-white',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">{trait.label}</div>
              <div className="text-xs uppercase tracking-[0.2em]">
                {trait.cost > 0 ? `+${trait.cost} pt` : `${trait.cost} pt`}
              </div>
            </div>
            <div className="mt-2 text-xs">{trait.description}</div>
            {prerequisiteMessage ? <div className="mt-2 text-xs text-amber-200">{prerequisiteMessage}</div> : null}
          </button>
        )
      })}
    </div>
  )
}

function SystemCard({
  active,
  title,
  description,
  disabled,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'rounded-[1.75rem] border p-4 text-left transition',
        active
          ? 'border-secondary/40 bg-secondary/12 text-white shadow-soft-md'
          : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-white',
        disabled ? 'cursor-not-allowed opacity-70' : '',
      )}
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-relaxed">{description}</div>
    </button>
  )
}

function OptionCard({
  active,
  title,
  description,
  details,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  details?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-4 text-left transition',
        active
          ? 'border-secondary/35 bg-secondary/12 text-white'
          : 'border-white/10 bg-black/20 text-text-muted hover:border-white/20 hover:text-white',
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-relaxed">{description}</div>
      {details ? <div className="mt-3 text-xs text-text-muted">{details}</div> : null}
    </button>
  )
}

function CounterCard({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10"
        >
          -
        </button>
        <div className="text-3xl font-bold text-white">{value}</div>
        <button
          type="button"
          onClick={() => onChange(Math.min(5, value + 1))}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10"
        >
          +
        </button>
      </div>
    </div>
  )
}

function SummaryTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-text-muted">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{title}</h2>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</div>
      {children}
    </label>
  )
}
