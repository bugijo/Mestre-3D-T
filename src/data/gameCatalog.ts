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
  rarity: 'comum' | 'incomum' | 'raro' | 'épico' | 'lendário'
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

function intelFrom(skill: number, resistance: number) {
  return Math.max(1, Math.floor((skill + resistance) / 2))
}

function rarityByPower(item: EquipmentItem): CatalogItem['rarity'] {
  const total = item.bonusF + item.bonusH + item.bonusR + item.bonusA + item.bonusPdF
  if (total >= 10) return 'lendário'
  if (total >= 7) return 'épico'
  if (total >= 4) return 'raro'
  if (total >= 2) return 'incomum'
  return 'comum'
}

function effectsFrom(item: EquipmentItem): string[] {
  const e: string[] = []
  if (item.bonusF) e.push(`+${item.bonusF} Força`)
  if (item.bonusH) e.push(`+${item.bonusH} Habilidade`)
  if (item.bonusR) e.push(`+${item.bonusR} Resistência`)
  if (item.bonusA) e.push(`+${item.bonusA} Armadura`)
  if (item.bonusPdF) e.push(`+${item.bonusPdF} PdF`)
  return e.length ? e : ['Sem bônus']
}

function sellValue(item: EquipmentItem) {
  const base = item.bonusF + item.bonusH + item.bonusR + item.bonusA + item.bonusPdF
  return Math.max(1, base * 25)
}

function relate(characters: Character[]): Record<string, CatalogCharacter['relationships']> {
  const ids = characters.map(c => c.id)
  const types: CatalogCharacter['relationships'][number]['type'][] = ['aliado','rival','mentor','inimigo']
  const out: Record<string, CatalogCharacter['relationships']> = {}
  for (const c of characters) {
    const picks: string[] = []
    for (let i = 0; i < 3; i++) {
      const target = ids[(ids.indexOf(c.id) + i * 7) % ids.length]
      if (target && target !== c.id) picks.push(target)
    }
    out[c.id] = picks.map((pid, i) => ({ targetId: pid, type: types[(i + ids.indexOf(c.id)) % types.length] }))
  }
  return out
}

export async function buildGameCatalog(): Promise<GameCatalog> {
  const gen = await generateAutoContent()
  const allChars: Character[] = [...gen.characters, ...gen.npcs]
  const relMap = relate(allChars)
  const characters: CatalogCharacter[] = allChars.map(c => ({
    id: c.id,
    name: c.name,
    description: c.role,
    background: `Objetivo: ${c.goal}. Estilo: ${c.speechStyle}.`,
    specialSkills: c.powers.map(p => p.name),
    stats: { forca: c.strength, agilidade: c.skill, inteligencia: intelFrom(c.skill, c.resistance), resistencia: c.resistance, armadura: c.armor, poderDeFogo: c.firepower },
    relationships: relMap[c.id] || [],
    image: c.portraitUri || c.imageUri,
  }))

  const itemIcons = [...gen.icons.items, ...gen.icons.skills]
  const items: CatalogItem[] = catalog.items.map((it, i) => ({
    id: it.id,
    name: it.name,
    type: it.type,
    description: it.description,
    effects: effectsFrom(it),
    rarity: rarityByPower(it),
    location: ['loja','baú','forja','evento','drop'][i % 5],
    sellValue: sellValue(it),
    icon: itemIcons[i % itemIcons.length]?.dataUrl ?? null,
  }))

  const villains = catalog.villains
  const maps: CatalogMap[] = gen.maps.map((m: Scene, i: number) => ({
    id: m.id,
    name: m.name,
    layout: m.description,
    pointsOfInterest: m.hooks,
    npcIds: gen.npcs.slice(i % gen.npcs.length, (i % gen.npcs.length) + 3).map(n => n.id),
    hiddenItemIds: items.slice(i % items.length, (i % items.length) + 2).map(it => it.id),
    enemyIds: villains.slice(i % villains.length, (i % villains.length) + 3).map(v => v.id),
    difficulty: 1 + (i % 5),
    background: m.backgroundImageDataUrl,
  }))

  const system: CatalogSystem = {
    mechanics: ['Teste de Perícia','Rolagem de Dano','Iniciativa e Turnos','Condições de Estado','Resistências e Armadura'],
    progression: ['XP por encontro','Distribuição de ouro','Aquisição de itens','Melhoria de atributos','Marcos de campanha'],
    missions: [
      'Explorar áreas: revelar pontos de interesse e atalhos',
      'Investigar eventos: coletar pistas e interrogar testemunhas',
      'Escoltar NPCs: proteger e conduzir ao destino',
      'Recuperar relíquias: resolver quebra-cabeças e obter chaves',
      'Derrotar chefes: identificar fraquezas e usar habilidades certas',
    ],
    secrets: [
      'Salas ocultas: portas disfarçadas ativadas por alavancas',
      'Chaves simbólicas: runas que destravam compartimentos secretos',
      'Atalhos de cenário: túneis e trepadeiras conectam áreas',
      'NPCs com segredos: diálogos alternativos revelam itens raros',
      'Easter eggs visuais: arte escondida concede pequenos bônus',
    ],
  }

  return { characters, items, maps, system }
}
