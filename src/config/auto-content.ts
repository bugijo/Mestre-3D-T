import type { AppSnapshot, Arc, Campaign, Character, Mood, Scene } from '@/domain/models'
import { createId } from '@/lib/id'
import { generateImage } from '@/lib/imageGen'
import { mapWithConcurrency } from '@/lib/async'
import { THREE_DET_CAMPAIGN_SYSTEM } from '@/lib/campaignSystems'
import { createEmptyV1DomainState } from '@/domain/v1'

type AutoAsset = { id: string; name: string; kind: 'icon' | 'sprite' | 'portrait' | 'background' | 'map'; path: string; dataUrl: string; meta: Record<string, string> }
type AutoIcons = { items: AutoAsset[]; skills: AutoAsset[]; status: AutoAsset[]; menu: AutoAsset[] }
type AutoConfigSpec = { schemaVersion: string; fileFormat: 'data-url-png'; version: string; createdAt: number; folders: Record<string, string> }

const GENERATION_CONCURRENCY = 10
let autoContentPromise: Promise<{ config: AutoConfigSpec; campaign: Campaign; arcs: Arc[]; characters: Character[]; npcs: Character[]; maps: Scene[]; icons: AutoIcons }> | null = null
let autoSnapshotPromise: Promise<AppSnapshot> | null = null

function now() { return Date.now() }

function range(n: number) { return Array.from({ length: n }, (_, i) => i) }

function pick<T>(arr: T[], r: () => number) { return arr[Math.floor(r() * arr.length)] }

function normalizeMeta(meta: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, String(value)]))
}

async function makePortrait(name: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'CHARACTER', title: name, seed, theme: 'neon', mood: 'mysterious', width: 512, height: 512, watermarkText: 'Mestre 3D&T' })
  return { id: createId(), name, kind: 'portrait', path: `generated/characters/${name}.png`, dataUrl, meta: normalizeMeta(meta as Record<string, unknown>) }
}

async function makeSprite(name: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'CREATURE', title: name, seed, theme: 'neon', mood: 'epic', width: 256, height: 256, transparentBackground: true, gridOverlay: true })
  return { id: createId(), name, kind: 'sprite', path: `generated/npcs/${name}.png`, dataUrl, meta: normalizeMeta(meta as Record<string, unknown>) }
}

async function makeBackground(title: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'SCENE', title, seed, theme: 'arcane', mood: 'mysterious', width: 1600, height: 900, watermarkText: 'Mestre 3D&T' })
  return { id: createId(), name: title, kind: 'background', path: `generated/maps/${title}.png`, dataUrl, meta: normalizeMeta(meta as Record<string, unknown>) }
}

async function makeIcon(name: string, seed: number, path: string): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'ITEM', title: name, seed, theme: 'neon', mood: 'calm', width: 128, height: 128, transparentBackground: true })
  return { id: createId(), name, kind: 'icon', path, dataUrl, meta: normalizeMeta(meta as Record<string, unknown>) }
}

function makeDialogues(seed: number) {
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 0) / 4294967296 }
  const topics = ['rumores', 'missao', 'comercio', 'alerta', 'historia', 'segredo']
  const styles = ['formal', 'casual', 'rispido', 'bem-humorado', 'misterioso']
  const phrases = ['Bem-vindo, viajante.', 'Tenho algo para voce.', 'Cuidado adiante.', 'Ouvi sussurros estranhos.', 'Buscando trabalho?']
  return {
    style: pick(styles, r),
    topics: range(3).map(() => pick(topics, r)),
    lines: range(5).map(() => pick(phrases, r)),
  }
}

function makeAttributes(seed: number) {
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 0) / 4294967296 }
  const F = 1 + Math.floor(r() * 5)
  const H = 1 + Math.floor(r() * 5)
  const R = 1 + Math.floor(r() * 5)
  const A = Math.max(0, Math.floor(r() * 5))
  const PdF = Math.max(0, Math.floor(r() * 5))
  return { strength: F, skill: H, resistance: R, armor: A, firepower: PdF }
}

function makeObjective(seed: number) {
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 0) / 4294967296 }
  const list = ['explorar ruinas', 'investigar desaparecimentos', 'proteger caravanas', 'recuperar reliquia', 'neutralizar ameaca', 'descobrir passagem']
  return pick(list, r)
}

function moods(): Mood[] { return ['neutral', 'tense', 'calm', 'epic', 'mysterious'] }

async function generateAutoContentInternal() {
  const config: AutoConfigSpec = {
    schemaVersion: '1.0.0',
    fileFormat: 'data-url-png',
    version: 'auto-1',
    createdAt: now(),
    folders: { characters: 'generated/characters', npcs: 'generated/npcs', maps: 'generated/maps', icons: 'generated/icons' },
  }

  const campaign: Campaign = { id: createId(), title: 'Auto Generated - 3D&T', system: THREE_DET_CAMPAIGN_SYSTEM, rulesetId: '3det-victory', description: 'Conteudo gerado automaticamente', coverDataUrl: null, createdAt: now(), updatedAt: now() }
  const arcs: Arc[] = range(10).map((i) => ({ id: createId(), name: `Capitulo ${i + 1}`, description: 'Arc auto', campaignId: campaign.id, orderIndex: i, createdAt: now(), updatedAt: now() }))

  const namesA = ['Aiden', 'Luna', 'Kai', 'Mara', 'Orion', 'Selene', 'Darius', 'Aria', 'Riven', 'Nyx', 'Kellan', 'Eira', 'Thorne', 'Lyra', 'Cassian', 'Elara', 'Rowan', 'Zara', 'Drake', 'Nia']
  const namesB = ['Blackwood', 'Stormborn', 'Silverleaf', 'Nightfall', 'Ashenvale', 'Ironheart', 'Sunspire', 'Frostbane', 'Starcrest', 'Shadowmere', 'Dawnhollow', 'Emberwild', 'Rivenguard', 'Moonblade', 'Skysong', 'Flameborn', 'Mistwalker', 'Oakenshield', 'Stonehelm', 'Brightwind']
  const makeName = (index: number) => `${namesA[index % namesA.length]} ${namesB[index % namesB.length]}`

  const characters = await mapWithConcurrency(range(100), GENERATION_CONCURRENCY, async (index) => {
    const id = createId()
    const name = makeName(index)
    const attrs = makeAttributes(1000 + index)
    const portrait = await makePortrait(name, 1000 + index)
    return {
      id,
      name,
      type: 'PLAYER',
      role: 'Heroi',
      imageUri: portrait.dataUrl,
      portraitUri: portrait.dataUrl,
      tags: ['gerado', 'auto', '3DT'],
      strength: attrs.strength,
      skill: attrs.skill,
      resistance: attrs.resistance,
      armor: attrs.armor,
      firepower: attrs.firepower,
      currentHp: Math.max(1, attrs.resistance * 5),
      currentMp: Math.max(1, attrs.resistance * 5),
      activeConditions: [],
      xp: 0,
      gold: 0,
      personality: 'corajoso',
      speechStyle: 'voz firme',
      mannerisms: ['observa', 'analisa'],
      goal: 'proteger a cidade',
      secrets: {},
      quickPhrases: ['Avante!', 'Segurem a linha!', 'Nada nos detem.'],
      advantages: [],
      disadvantages: [],
      equipment: [],
      powers: [],
      dnd: undefined,
      campaignId: campaign.id,
      isTemplate: false,
      createdAt: now(),
      updatedAt: now(),
    } satisfies Character
  })

  const npcs = await mapWithConcurrency(range(100), GENERATION_CONCURRENCY, async (index) => {
    const id = createId()
    const name = `NPC ${index + 1}`
    const attrs = makeAttributes(2000 + index)
    const sprite = await makeSprite(name, 2000 + index)
    const dialog = makeDialogues(2000 + index)
    return {
      id,
      name,
      type: 'NPC',
      role: 'Informante',
      imageUri: sprite.dataUrl,
      portraitUri: sprite.dataUrl,
      tags: ['npc', 'auto'],
      strength: attrs.strength,
      skill: attrs.skill,
      resistance: attrs.resistance,
      armor: attrs.armor,
      firepower: attrs.firepower,
      currentHp: Math.max(1, attrs.resistance * 5),
      currentMp: Math.max(1, attrs.resistance * 5),
      activeConditions: [],
      xp: 0,
      gold: 0,
      personality: dialog.style,
      speechStyle: dialog.style,
      mannerisms: ['gesticula', 'olhar atento'],
      goal: 'orientar o grupo',
      secrets: { contexto: dialog.topics.join(',') },
      quickPhrases: dialog.lines,
      advantages: [],
      disadvantages: [],
      equipment: [],
      powers: [],
      dnd: undefined,
      campaignId: campaign.id,
      isTemplate: false,
      createdAt: now(),
      updatedAt: now(),
    } satisfies Character
  })

  const moodList = moods()
  const maps = await mapWithConcurrency(range(100), GENERATION_CONCURRENCY, async (index) => {
    const title = `Mapa ${index + 1}`
    const bg = await makeBackground(title, 3000 + index)
    const arc = arcs[index % arcs.length]
    return {
      id: createId(),
      name: title,
      description: 'Layout completo com interatividade.',
      objective: makeObjective(3000 + index),
      mood: moodList[index % moodList.length],
      opening: 'Introducao breve e contexto inicial.',
      mapImageDataUrl: bg.dataUrl,
      backgroundImageDataUrl: bg.dataUrl,
      soundtrackUrl: null,
      enemyIds: [],
      npcIds: [],
      hooks: ['ponto de interesse: entrada', 'ponto de interesse: altar', 'conexao: passagem norte'],
      triggers: [
        { id: createId(), situation: 'Alavanca oculta', testType: 'Pericia', attribute: 'Habilidade', difficulty: 'Media', onSuccess: 'Porta abre', onFailure: 'Nada acontece' },
        { id: createId(), situation: 'Armadilha de chao', testType: 'Percepcao', attribute: 'Habilidade', difficulty: 'Alta', onSuccess: 'Evita dano', onFailure: 'Sofre 1d6 dano' },
      ],
      campaignId: campaign.id,
      arcId: arc.id,
      orderIndex: index,
      isCompleted: false,
      completedAt: null,
      createdAt: now(),
      updatedAt: now(),
    } satisfies Scene
  })

  const iconNamesItems = ['Espada', 'Arco', 'Elmo', 'Botas', 'Amuleto', 'Pocao', 'Escudo', 'Livro', 'Gema', 'Chave']
  const iconNamesSkills = ['Corte', 'Furtividade', 'Bencao', 'Gelo', 'Raio', 'Fogo', 'Cura', 'Barreira', 'Golpe', 'Salto']
  const iconNamesStatus = ['Queimando', 'Envenenado', 'Atordoado', 'Abencoado', 'Condenado', 'Invisible', 'Voador', 'Prostrado', 'Preso', 'Assustado']
  const iconNamesMenu = ['Inventario', 'Mapa', 'Personagens', 'NPCs', 'Configuracoes', 'Som', 'Sessao', 'Combate', 'Diario', 'Catalogo']

  const [itemIcons, skillIcons, statusIcons, menuIcons] = await Promise.all([
    mapWithConcurrency(iconNamesItems, GENERATION_CONCURRENCY, (name, index) => makeIcon(name, 4000 + index, `generated/icons/items/${name}.png`)),
    mapWithConcurrency(iconNamesSkills, GENERATION_CONCURRENCY, (name, index) => makeIcon(name, 4100 + index, `generated/icons/skills/${name}.png`)),
    mapWithConcurrency(iconNamesStatus, GENERATION_CONCURRENCY, (name, index) => makeIcon(name, 4200 + index, `generated/icons/status/${name}.png`)),
    mapWithConcurrency(iconNamesMenu, GENERATION_CONCURRENCY, (name, index) => makeIcon(name, 4300 + index, `generated/icons/menu/${name}.png`)),
  ])

  return {
    config,
    campaign,
    arcs,
    characters,
    npcs,
    maps,
    icons: {
      items: itemIcons,
      skills: skillIcons,
      status: statusIcons,
      menu: menuIcons,
    },
  }
}

export async function generateAutoContent() {
  if (!autoContentPromise) {
    autoContentPromise = generateAutoContentInternal()
  }
  return autoContentPromise
}

export async function generateAutoSnapshot(): Promise<AppSnapshot> {
  if (!autoSnapshotPromise) {
    autoSnapshotPromise = generateAutoContent().then((generated) => ({
      version: 1,
      campaigns: [generated.campaign],
      arcs: generated.arcs,
      scenes: generated.maps,
      characters: [...generated.characters, ...generated.npcs],
      combats: [],
      session: { isActive: false, activeCampaignId: generated.campaign.id, activeSceneId: generated.maps[0]?.id ?? null, activeCombatId: null, startedAt: null, endedAt: null, notes: [] },
      settings: { nextSessionAt: now() },
      audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false, loop: true },
      sessionHistory: [],
      rewardTables: [],
      rewardEvents: [],
      v1: createEmptyV1DomainState(),
    }))
  }
  return autoSnapshotPromise
}

export function clearAutoContentCache() {
  autoContentPromise = null
  autoSnapshotPromise = null
}

export function getAutoContentCacheStatus() {
  return {
    contentReady: autoContentPromise !== null,
    snapshotReady: autoSnapshotPromise !== null,
    concurrency: GENERATION_CONCURRENCY,
  }
}
