import type { Character, EquipmentItem, Scene } from '@/domain/models'
import { generateAutoContent } from '@/config/auto-content'
import { catalog } from '@/data/catalog'

export type CatalogCharacter = {
  id: string
  name: string
  description: string
  background: string
  specialSkills: string[]
  stats: { forca: number; agilidade: number; inteligencia: number; resistencia: number; armadura: number; poderDeFogo: number }
  relationships: { targetId: string; type: 'aliado' | 'rival' | 'mentor' | 'inimigo' }[]
  image: string | null
}

export type CatalogItem = {
  id: string
  name: string
  type: EquipmentItem['type']
  description: string
  effects: string[]
  rarity: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario'
  location: string
  sellValue: number
  icon: string | null
}

export type CatalogMap = {
  id: string
  name: string
  layout: string
  pointsOfInterest: string[]
  npcIds: string[]
  hiddenItemIds: string[]
  enemyIds: string[]
  difficulty: number
  background: string | null
}

export type CatalogSystem = {
  mechanics: string[]
  progression: string[]
  missions: string[]
  secrets: string[]
}

export type GameCatalog = {
  characters: CatalogCharacter[]
  items: CatalogItem[]
  maps: CatalogMap[]
  system: CatalogSystem
}

let catalogPromise: Promise<GameCatalog> | null = null

function intelFrom(skill: number, resistance: number) {
  return Math.max(1, Math.floor((skill + resistance) / 2))
}

function rarityByPower(item: EquipmentItem): CatalogItem['rarity'] {
  const total = item.bonusF + item.bonusH + item.bonusR + item.bonusA + item.bonusPdF
  if (total >= 10) return 'lendario'
  if (total >= 7) return 'epico'
  if (total >= 4) return 'raro'
  if (total >= 2) return 'incomum'
  return 'comum'
}

function effectsFrom(item: EquipmentItem): string[] {
  const effects: string[] = []
  if (item.bonusF) effects.push(`+${item.bonusF} Forca`)
  if (item.bonusH) effects.push(`+${item.bonusH} Habilidade`)
  if (item.bonusR) effects.push(`+${item.bonusR} Resistencia`)
  if (item.bonusA) effects.push(`+${item.bonusA} Armadura`)
  if (item.bonusPdF) effects.push(`+${item.bonusPdF} PdF`)
  return effects.length ? effects : ['Sem bonus']
}

function sellValue(item: EquipmentItem) {
  const base = item.bonusF + item.bonusH + item.bonusR + item.bonusA + item.bonusPdF
  return Math.max(1, base * 25)
}

function relate(characters: Character[]): Record<string, CatalogCharacter['relationships']> {
  const ids = characters.map((character) => character.id)
  const types: CatalogCharacter['relationships'][number]['type'][] = ['aliado', 'rival', 'mentor', 'inimigo']
  const output: Record<string, CatalogCharacter['relationships']> = {}

  for (const character of characters) {
    const picks: string[] = []
    for (let index = 0; index < 3; index++) {
      const target = ids[(ids.indexOf(character.id) + index * 7) % ids.length]
      if (target && target !== character.id) picks.push(target)
    }
    output[character.id] = picks.map((targetId, index) => ({
      targetId,
      type: types[(index + ids.indexOf(character.id)) % types.length],
    }))
  }

  return output
}

async function buildGameCatalogInternal(): Promise<GameCatalog> {
  const generated = await generateAutoContent()
  const allCharacters: Character[] = [...generated.characters, ...generated.npcs]
  const relationMap = relate(allCharacters)

  const characters: CatalogCharacter[] = allCharacters.map((character) => ({
    id: character.id,
    name: character.name,
    description: character.role,
    background: `Objetivo: ${character.goal}. Estilo: ${character.speechStyle}.`,
    specialSkills: character.powers.map((power) => power.name),
    stats: {
      forca: character.strength,
      agilidade: character.skill,
      inteligencia: intelFrom(character.skill, character.resistance),
      resistencia: character.resistance,
      armadura: character.armor,
      poderDeFogo: character.firepower,
    },
    relationships: relationMap[character.id] || [],
    image: character.portraitUri || character.imageUri,
  }))

  const itemIcons = [...generated.icons.items, ...generated.icons.skills]
  const items: CatalogItem[] = catalog.items.map((item, index) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description,
    effects: effectsFrom(item),
    rarity: rarityByPower(item),
    location: ['loja', 'bau', 'forja', 'evento', 'drop'][index % 5],
    sellValue: sellValue(item),
    icon: itemIcons[index % itemIcons.length]?.dataUrl ?? null,
  }))

  const villains = catalog.villains
  const maps: CatalogMap[] = generated.maps.map((map: Scene, index: number) => ({
    id: map.id,
    name: map.name,
    layout: map.description,
    pointsOfInterest: map.hooks,
    npcIds: generated.npcs.slice(index % generated.npcs.length, (index % generated.npcs.length) + 3).map((npc) => npc.id),
    hiddenItemIds: items.slice(index % items.length, (index % items.length) + 2).map((item) => item.id),
    enemyIds: villains.slice(index % villains.length, (index % villains.length) + 3).map((villain) => villain.id),
    difficulty: 1 + (index % 5),
    background: map.backgroundImageDataUrl,
  }))

  const system: CatalogSystem = {
    mechanics: ['Teste de Pericia', 'Rolagem de Dano', 'Iniciativa e Turnos', 'Condicoes de Estado', 'Resistencias e Armadura'],
    progression: ['XP por encontro', 'Distribuicao de ouro', 'Aquisicao de itens', 'Melhoria de atributos', 'Marcos de campanha'],
    missions: [
      'Explorar areas: revelar pontos de interesse e atalhos',
      'Investigar eventos: coletar pistas e interrogar testemunhas',
      'Escoltar NPCs: proteger e conduzir ao destino',
      'Recuperar reliquias: resolver quebra-cabecas e obter chaves',
      'Derrotar chefes: identificar fraquezas e usar habilidades certas',
    ],
    secrets: [
      'Salas ocultas: portas disfarçadas ativadas por alavancas',
      'Chaves simbolicas: runas que destravam compartimentos secretos',
      'Atalhos de cenario: tuneis e trepadeiras conectam areas',
      'NPCs com segredos: dialogos alternativos revelam itens raros',
      'Easter eggs visuais: arte escondida concede pequenos bonus',
    ],
  }

  return { characters, items, maps, system }
}

export async function buildGameCatalog(): Promise<GameCatalog> {
  if (!catalogPromise) {
    catalogPromise = buildGameCatalogInternal()
  }
  return catalogPromise
}

export function clearGameCatalogCache() {
  catalogPromise = null
}

export function getGameCatalogCacheStatus() {
  return {
    ready: catalogPromise !== null,
  }
}
