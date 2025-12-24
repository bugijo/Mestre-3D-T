import type { AppSnapshot, Arc, Campaign, Character, Mood, Scene } from '@/domain/models'
import { createId } from '@/lib/id'
import { generateImage } from '@/lib/imageGen'

type AutoAsset = { id: string; name: string; kind: 'icon' | 'sprite' | 'portrait' | 'background' | 'map'; path: string; dataUrl: string; meta: Record<string, string> }
type AutoIcons = { items: AutoAsset[]; skills: AutoAsset[]; status: AutoAsset[]; menu: AutoAsset[] }
type AutoConfigSpec = { schemaVersion: string; fileFormat: 'data-url-png'; version: string; createdAt: number; folders: Record<string, string> }

function now() { return Date.now() }

function range(n: number) { return Array.from({ length: n }, (_, i) => i) }

function pick<T>(arr: T[], r: () => number) { return arr[Math.floor(r() * arr.length)] }

async function makePortrait(name: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'CHARACTER', title: name, seed, theme: 'neon', mood: 'mysterious', width: 512, height: 512, watermarkText: 'Mestre 3D&T' })
  return { id: createId(), name, kind: 'portrait', path: `generated/characters/${name}.png`, dataUrl, meta: { ...meta as any } }
}

async function makeSprite(name: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'CREATURE', title: name, seed, theme: 'neon', mood: 'epic', width: 256, height: 256, transparentBackground: true, gridOverlay: true })
  return { id: createId(), name, kind: 'sprite', path: `generated/npcs/${name}.png`, dataUrl, meta: { ...meta as any } }
}

async function makeBackground(title: string, seed: number): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'SCENE', title, seed, theme: 'arcane', mood: 'mysterious', width: 1600, height: 900, watermarkText: 'Mestre 3D&T' })
  return { id: createId(), name: title, kind: 'background', path: `generated/maps/${title}.png`, dataUrl, meta: { ...meta as any } }
}

async function makeIcon(name: string, seed: number, path: string): Promise<AutoAsset> {
  const { dataUrl, meta } = await generateImage({ category: 'ITEM', title: name, seed, theme: 'neon', mood: 'calm', width: 128, height: 128, transparentBackground: true })
  return { id: createId(), name, kind: 'icon', path, dataUrl, meta: { ...meta as any } }
}

function makeDialogues(seed: number) {
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 0) / 4294967296 }
  const topics = ['rumores', 'missão', 'comércio', 'alerta', 'história', 'segredo']
  const styles = ['formal', 'casual', 'ríspido', 'bem-humorado', 'misterioso']
  const phrases = ['Bem-vindo, viajante.', 'Tenho algo para você.', 'Cuidado adiante.', 'Ouvi sussurros estranhos.', 'Buscando trabalho?']
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
  const list = ['explorar ruínas', 'investigar desaparecimentos', 'proteger caravanas', 'recuperar relíquia', 'neutralizar ameaça', 'descobrir passagem']
  return pick(list, r)
}

function moods(): Mood[] { return ['neutral','tense','calm','epic','mysterious'] }

export async function generateAutoContent(): Promise<{ config: AutoConfigSpec; campaign: Campaign; arcs: Arc[]; characters: Character[]; npcs: Character[]; maps: Scene[]; icons: AutoIcons }> {
  const config: AutoConfigSpec = {
    schemaVersion: '1.0.0',
    fileFormat: 'data-url-png',
    version: 'auto-1',
    createdAt: now(),
    folders: { characters: 'generated/characters', npcs: 'generated/npcs', maps: 'generated/maps', icons: 'generated/icons' },
  }

  const campaign: Campaign = { id: createId(), title: 'Auto Generated — 3D&T', system: '3D&T', description: 'Conteúdo gerado automaticamente', coverDataUrl: null, createdAt: now(), updatedAt: now() }
  const arcs: Arc[] = range(10).map(i => ({ id: createId(), name: `Capítulo ${i + 1}`, description: 'Arc auto', campaignId: campaign.id, orderIndex: i, createdAt: now(), updatedAt: now() }))

  const namesA = ['Aiden','Luna','Kai','Mara','Orion','Selene','Darius','Aria','Riven','Nyx','Kellan','Eira','Thorne','Lyra','Cassian','Elara','Rowan','Zara','Drake','Nia']
  const namesB = ['Blackwood','Stormborn','Silverleaf','Nightfall','Ashenvale','Ironheart','Sunspire','Frostbane','Starcrest','Shadowmere','Dawnhollow','Emberwild','Rivenguard','Moonblade','Skysong','Flameborn','Mistwalker','Oakenshield','Stonehelm','Brightwind']

  const makeName = (i: number) => `${namesA[i % namesA.length]} ${namesB[i % namesB.length]}`

  const characters: Character[] = []
  for (let i = 0; i < 100; i++) {
    const id = createId()
    const name = makeName(i)
    const attrs = makeAttributes(1000 + i)
    const portrait = await makePortrait(name, 1000 + i)
    characters.push({
      id,
      name,
      type: 'PLAYER',
      role: 'Herói',
      imageUri: portrait.dataUrl,
      portraitUri: portrait.dataUrl,
      tags: ['gerado','auto','3DT'],
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
      quickPhrases: ['Avante!', 'Segurem a linha!', 'Nada nos detém.'],
      advantages: [],
      disadvantages: [],
      equipment: [],
      powers: [],
      dnd: undefined,
      campaignId: campaign.id,
      isTemplate: false,
      createdAt: now(),
      updatedAt: now(),
    })
  }

  const npcs: Character[] = []
  for (let i = 0; i < 100; i++) {
    const id = createId()
    const name = `NPC ${i + 1}`
    const attrs = makeAttributes(2000 + i)
    const sprite = await makeSprite(name, 2000 + i)
    const dialog = makeDialogues(2000 + i)
    npcs.push({
      id,
      name,
      type: 'NPC',
      role: 'Informante',
      imageUri: sprite.dataUrl,
      portraitUri: sprite.dataUrl,
      tags: ['npc','auto'],
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
      mannerisms: ['gesticula','olhar atento'],
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
    })
  }

  const maps: Scene[] = []
  for (let i = 0; i < 100; i++) {
    const title = `Mapa ${i + 1}`
    const bg = await makeBackground(title, 3000 + i)
    const arc = arcs[i % arcs.length]
    const mood = moods()[i % moods().length]
    maps.push({
      id: createId(),
      name: title,
      description: 'Layout completo com interatividade.',
      objective: makeObjective(3000 + i),
      mood,
      opening: 'Introdução breve e contexto inicial.',
      mapImageDataUrl: bg.dataUrl,
      backgroundImageDataUrl: bg.dataUrl,
      soundtrackUrl: null,
      enemyIds: [],
      npcIds: [],
      hooks: ['ponto de interesse: entrada', 'ponto de interesse: altar', 'conexão: passagem norte'],
      triggers: [
        { id: createId(), situation: 'Alavanca oculta', testType: 'Perícia', attribute: 'Habilidade', difficulty: 'Média', onSuccess: 'Porta abre', onFailure: 'Nada acontece' },
        { id: createId(), situation: 'Armadilha de chão', testType: 'Percepção', attribute: 'Habilidade', difficulty: 'Alta', onSuccess: 'Evita dano', onFailure: 'Sofre 1d6 dano' },
      ],
      campaignId: campaign.id,
      arcId: arc.id,
      orderIndex: i,
      isCompleted: false,
      completedAt: null,
      createdAt: now(),
      updatedAt: now(),
    })
  }

  const iconNamesItems = ['Espada','Arco','Elmo','Botas','Amuleto','Poção','Escudo','Livro','Gema','Chave']
  const iconNamesSkills = ['Corte','Furtividade','Bênção','Gelo','Raio','Fogo','Cura','Barreira','Golpe','Salto']
  const iconNamesStatus = ['Queimando','Envenenado','Atordoado','Abençoado','Condenado','Invisible','Voador','Prostrado','Preso','Assustado']
  const iconNamesMenu = ['Inventário','Mapa','Personagens','NPCs','Configurações','Som','Sessão','Combate','Diário','Catálogo']

  const icons: AutoIcons = { items: [], skills: [], status: [], menu: [] }
  for (let i = 0; i < 10; i++) {
    icons.items.push(await makeIcon(iconNamesItems[i], 4000 + i, `generated/icons/items/${iconNamesItems[i]}.png`))
    icons.skills.push(await makeIcon(iconNamesSkills[i], 4100 + i, `generated/icons/skills/${iconNamesSkills[i]}.png`))
    icons.status.push(await makeIcon(iconNamesStatus[i], 4200 + i, `generated/icons/status/${iconNamesStatus[i]}.png`))
    icons.menu.push(await makeIcon(iconNamesMenu[i], 4300 + i, `generated/icons/menu/${iconNamesMenu[i]}.png`))
  }

  return { config, campaign, arcs, characters, npcs, maps, icons }
}

export async function generateAutoSnapshot(): Promise<AppSnapshot> {
  const gen = await generateAutoContent()
  return {
    version: 1,
    campaigns: [gen.campaign],
    arcs: gen.arcs,
    scenes: gen.maps,
    characters: [...gen.characters, ...gen.npcs],
    combats: [],
    session: { isActive: false, activeCampaignId: gen.campaign.id, activeSceneId: gen.maps[0]?.id ?? null, activeCombatId: null, startedAt: null, endedAt: null, notes: [] },
    settings: { nextSessionAt: now() },
    audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false },
    rewardTables: [],
    rewardEvents: [],
  }
}
