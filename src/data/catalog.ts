import type { Character, EquipmentItem, Power, Mood, Scene } from '@/domain/models'
import { createId } from '@/lib/id'

type SystemKey = '3DT' | 'DND5E'

type StoryVariant = {
  system: SystemKey
  scenes: Array<Pick<Scene, 'name' | 'description' | 'objective' | 'mood' | 'opening'>>
  difficulty: number
}

export type StoryOption = {
  id: string
  name: string
  summary: string
  tags: string[]
  variants: [StoryVariant, StoryVariant]
}

type PrebuiltCharacter = Omit<Character, 'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'currentHp' | 'currentMp'> & {
  id: string
  campaignId: null
  createdAt: number
  updatedAt: number
  currentHp: number
  currentMp: number
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const firstNames = ['Aiden','Luna','Kai','Mara','Orion','Selene','Darius','Aria','Riven','Nyx','Kellan','Eira','Thorne','Lyra','Cassian','Elara','Rowan','Zara','Drake','Nia']
const lastNames = ['Blackwood','Stormborn','Silverleaf','Nightfall','Ashenvale','Ironheart','Sunspire','Frostbane','Starcrest','Shadowmere','Dawnhollow','Emberwild','Rivenguard','Moonblade','Skysong','Flameborn','Mistwalker','Oakenshield','Stonehelm','Brightwind']
const roles = ['Guerreiro','Mago','Rogue','Clérigo','Ranger','Bardo','Paladino','Druida','Monge','Feiticeiro','Warlock','Arqueiro','Alquimista','Guardião','Vanguarda']
const dndClasses = ['Fighter','Wizard','Rogue','Cleric','Barbarian','Paladin','Ranger','Druid','Bard','Monk','Sorcerer','Warlock']
const dndRaces = ['Human','Elf','Dwarf','Halfling','Half-Orc','Tiefling','Gnome','Dragonborn']

function pick<T>(arr: T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)]
}

function makeEquipment(r: () => number): EquipmentItem[] {
  const items: EquipmentItem[] = []
  const count = 1 + Math.floor(r() * 3)
  for (let i = 0; i < count; i++) {
    items.push({
      id: createId(),
      name: ['Espada Curta','Arco Composto','Escudo Leve','Armadura de Couro','Cajado Rúnico'][Math.floor(r() * 5)],
      type: ['WEAPON','ARMOR','SHIELD','ACCESSORY'][Math.floor(r() * 4)] as EquipmentItem['type'],
      description: 'Item padrão do catálogo',
      bonusF: Math.floor(r() * 2),
      bonusH: Math.floor(r() * 2),
      bonusR: Math.floor(r() * 2),
      bonusA: Math.floor(r() * 2),
      bonusPdF: Math.floor(r() * 2),
      special: '',
      imageUri: null,
      isEquipped: true,
    })
  }
  return items
}

function makePowers(r: () => number): Power[] {
  const list: Power[] = []
  const count = 1 + Math.floor(r() * 3)
  for (let i = 0; i < count; i++) {
    list.push({
      id: createId(),
      name: ['Investida Relâmpago','Corte Preciso','Bênção Menor','Toque Gélido','Seta Ígnea'][Math.floor(r() * 5)],
      description: 'Poder pré-definido do catálogo',
      mpCost: 1 + Math.floor(r() * 5),
      target: 'único',
      testReminder: null,
      onSuccess: 'Efeito aplicado',
      onFailure: 'Sem efeito',
      damage: ['1d6','1d8','2d6'][Math.floor(r() * 3)],
      range: 'curto',
      areaEffect: r() < 0.2,
    })
  }
  return list
}

function pointBuyCost(v: number) {
  if (v <= 8) return 0
  if (v === 9) return 1
  if (v === 10) return 2
  if (v === 11) return 3
  if (v === 12) return 4
  if (v === 13) return 5
  if (v === 14) return 7
  return 9
}

function mod(v: number) {
  return Math.floor((v - 10) / 2)
}

function hitDie(cls: string) {
  if (cls === 'Barbarian') return 12
  if (cls === 'Fighter' || cls === 'Paladin' || cls === 'Ranger') return 10
  if (cls === 'Sorcerer' || cls === 'Wizard') return 6
  return 8
}

function avgPerLevel(die: number) {
  if (die === 12) return 7
  if (die === 10) return 6
  if (die === 8) return 5
  return 4
}

function makeDndBlock(r: () => number) {
  const level = 1 + Math.floor(r() * 20)
  const cls = pick(dndClasses, r)
  const race = pick(dndRaces, r)
  const background = ['Acolyte','Criminal','Folk Hero','Noble','Sage','Soldier','Hermit','Outlander'][Math.floor(r() * 8)]
  const base = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }
  let remaining = 27
  const keys = ['STR','DEX','CON','INT','WIS','CHA'] as const
  for (let i = 0; i < 20; i++) {
    const k = keys[Math.floor(r() * keys.length)]
    const next = Math.min(15, base[k] + 1)
    const cost = pointBuyCost(next)
    const curCost = pointBuyCost(base[k])
    if (remaining - (cost - curCost) >= 0) {
      remaining -= (cost - curCost)
      base[k] = next
    }
  }
  const prof = Math.min(6, 2 + Math.floor((Math.max(1, level) - 1) / 4))
  const die = hitDie(cls)
  const first = die + mod(base.CON)
  const rest = Math.max(0, level - 1) * (avgPerLevel(die) + mod(base.CON))
  const maxHp = Math.max(1, first + rest)
  const ac = 10 + mod(base.DEX)
  return { level, class: cls, race, background, abilityScores: base, proficiencyBonus: prof, armorClass: ac, maxHp }
}

function make3dtStats(r: () => number) {
  const budget = 10 + Math.floor(r() * 10)
  let F = 0, H = 0, R = 0, A = 0, PdF = 0
  for (let i = 0; i < budget; i++) {
    const idx = Math.floor(r() * 5)
    if (idx === 0 && F < 5) F++
    else if (idx === 1 && H < 5) H++
    else if (idx === 2 && R < 5) R++
    else if (idx === 3 && A < 5) A++
    else if (PdF < 5) PdF++
  }
  return { strength: F, skill: H, resistance: R, armor: A, firepower: PdF }
}

function makePersonality(r: () => number) {
  const traits = ['corajoso','cauteloso','impulsivo','metódico','carismático','frio','observador','ambicioso','leal','misterioso']
  const styles = ['fala pausada','voz firme','sussurra','riso fácil','olhar sério','entonação dramática']
  const goals = ['proteger a cidade','buscar redenção','descobrir segredos','acumular poder','defender amigos','recuperar relíquia']
  return {
    personality: pick(traits, r),
    speechStyle: pick(styles, r),
    goal: pick(goals, r),
  }
}

function makeCharacter(seed: number, type: Character['type']): PrebuiltCharacter {
  const r = rng(seed)
  const name = `${pick(firstNames, r)} ${pick(lastNames, r)}`
  const role = pick(roles, r)
  const three = make3dtStats(r)
  const dnd = makeDndBlock(r)
  const maxHp3 = Math.max(1, three.resistance * 5)
  const maxMp3 = Math.max(1, three.resistance * 5)
  const eq = makeEquipment(r)
  const pw = makePowers(r)
  const pd = makePersonality(r)
  return {
    id: createId(),
    name,
    type,
    role,
    imageUri: null,
    portraitUri: null,
    tags: [],
    strength: three.strength,
    skill: three.skill,
    resistance: three.resistance,
    armor: three.armor,
    firepower: three.firepower,
    currentHp: maxHp3,
    currentMp: maxMp3,
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: pd.personality,
    speechStyle: pd.speechStyle,
    mannerisms: [],
    goal: pd.goal,
    secrets: {},
    quickPhrases: [],
    advantages: [],
    disadvantages: [],
    equipment: eq,
    powers: pw,
    dnd,
    campaignId: null,
    isTemplate: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function makeStory(seed: number): StoryOption {
  const r = rng(seed)
  const name = ['Sussurros na Floresta','As Cinzas do Rei','Eco do Abismo','A Torre de Vidro','Sombras em Blackwood'][Math.floor(r() * 5)]
  const summary = 'Aventura completa com três cenas e objetivos claros.'
  const tags = ['investigação','combate','exploração']
  const diff = 1 + Math.floor(r() * 5)
  const mkScene = (title: string, mood: Mood) => ({
    name: title,
    description: 'Descrição detalhada da cena com ganchos e desafios.',
    objective: 'Objetivo claro e mensurável.',
    mood,
    opening: 'Abertura dramática com NPC relevante.',
  })
  const s3 = [mkScene('Encontro na Taverna', 'mysterious'), mkScene('Trilha na Floresta', 'tense'), mkScene('Confronto Final', 'epic')]
  const sd = [mkScene('Mensageiro Urgente', 'mysterious'), mkScene('Cripta Ancestral', 'tense'), mkScene('Vínculo Arcano', 'epic')]
  return {
    id: createId(),
    name,
    summary,
    tags,
    variants: [
      { system: '3DT', scenes: s3, difficulty: diff },
      { system: 'DND5E', scenes: sd, difficulty: diff },
    ],
  }
}

function buildArray<T>(count: number, builder: (i: number) => T): T[] {
  const arr: T[] = []
  for (let i = 0; i < count; i++) arr.push(builder(i + 1))
  return arr
}

const heroes: PrebuiltCharacter[] = buildArray(100, (i) => makeCharacter(1000 + i, 'PLAYER'))
const npcs: PrebuiltCharacter[] = buildArray(100, (i) => makeCharacter(2000 + i, 'NPC'))
const villains: PrebuiltCharacter[] = buildArray(100, (i) => makeCharacter(3000 + i, 'ENEMY'))
const stories: StoryOption[] = buildArray(100, (i) => makeStory(4000 + i))

export const catalog = { heroes, npcs, villains, stories }

export function filterCharactersBySystem(list: PrebuiltCharacter[], system: SystemKey | 'ALL') {
  if (system === 'ALL') return list
  if (system === 'DND5E') return list.filter((c) => !!c.dnd)
  return list
}

export function powerValue(c: PrebuiltCharacter, prefer: SystemKey | 'ALL') {
  if (prefer === 'DND5E' && c.dnd) return c.dnd.level
  return c.strength + c.skill + c.resistance + c.armor + c.firepower
}

export function filterStoriesBySystem(list: StoryOption[], system: SystemKey | 'ALL') {
  if (system === 'ALL') return list
  return list.filter((s) => s.variants.some((v) => v.system === system))
}
