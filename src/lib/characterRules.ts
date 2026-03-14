import type {
  Character,
  CharacterType,
  DndAbilityKey,
  EquipmentItem,
  EquipmentType,
  ThreeDetArchetypeId,
  ThreeDetCharacterData,
  ThreeDetSkillId,
  ThreeDetTraitId,
} from '@/domain/models'
import {
  calcVictoryMaxHp,
  calcVictoryMaxMp,
} from '@/domain/models'
import { createId } from '@/lib/id'

export type SupportedCharacterSystem = '3DT' | 'DND5E'

export type RuleIssue = {
  path: string
  message: string
}

export type CharacterBaseForm = {
  name: string
  role: string
  type: CharacterType
  imageUri: string | null
  campaignId: string | null
}

export type ThreeDetBuilderState = {
  archetypeId: ThreeDetArchetypeId | null
  power: number
  skill: number
  resistance: number
  skillIds: ThreeDetSkillId[]
  advantageIds: ThreeDetTraitId[]
  disadvantageIds: ThreeDetTraitId[]
}

export type DndBuilderState = {
  classId: DndClassId
  raceId: DndRaceId
  backgroundId: DndBackgroundId
  level: number
  abilityScores: Record<DndAbilityKey, number>
}

type ThreeDetTrait = {
  id: ThreeDetTraitId
  label: string
  type: 'advantage' | 'disadvantage'
  cost: number
  description: string
  prerequisite?: (state: ThreeDetBuilderState) => string | null
}

type ThreeDetArchetype = {
  id: ThreeDetArchetypeId
  label: string
  cost: number
  description: string
  rulesText: string
}

type ThreeDetSkill = {
  id: ThreeDetSkillId
  label: string
  description: string
}

type DndClassId = 'FIGHTER' | 'CLERIC' | 'ROGUE' | 'WIZARD'
type DndRaceId = 'HUMAN' | 'HILL_DWARF' | 'HIGH_ELF' | 'LIGHTFOOT_HALFLING'
type DndBackgroundId = 'ACOLYTE' | 'CRIMINAL' | 'SAGE' | 'SOLDIER'

type DndClassDef = {
  id: DndClassId
  label: string
  hitDie: number
  primaryAbilities: DndAbilityKey[]
  description: string
  startingEquipment: string[]
  buildEquipment: () => EquipmentItem[]
}

type DndRaceDef = {
  id: DndRaceId
  label: string
  description: string
  abilityBonuses: Partial<Record<DndAbilityKey, number>>
  traits: string[]
}

type DndBackgroundDef = {
  id: DndBackgroundId
  label: string
  description: string
}

const DND_POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export const THREE_DET_POINTS_BUDGET = 10
export const THREE_DET_DISADVANTAGE_CAP = 2
export const DND_POINT_BUY_BUDGET = 27

export const THREE_DET_ARCHETYPES: Record<ThreeDetArchetypeId, ThreeDetArchetype> = {
  HUMANO: {
    id: 'HUMANO',
    label: 'Humano',
    cost: 0,
    description: 'Versatilidade e adaptacao. Serve como baseline oficial sem custo extra.',
    rulesText: 'Nao concede modificadores numericos obrigatorios e deixa o restante dos pontos livre.',
  },
  ELFO: {
    id: 'ELFO',
    label: 'Elfo',
    cost: 1,
    description: 'Afinidade com arte, percepcao e conhecimentos refinados.',
    rulesText: 'Recebe vantagem em testes ligados a Artes, Esporte, Influencia, Manha, Mistica, Percepcao e Saber.',
  },
  KEMONO: {
    id: 'KEMONO',
    label: 'Kemono',
    cost: 1,
    description: 'Povos ferozes com armas naturais e presenca animal.',
    rulesText: 'Ataques desarmados causam dano de arma e podem usar ataques com Poder no lugar de armas convencionais.',
  },
  OSTEON: {
    id: 'OSTEON',
    label: 'Osteon',
    cost: 1,
    description: 'Nao mortos conscientes, resistentes a varios efeitos fisicos.',
    rulesText: 'Reduz dano convencional em R, ignora venenos e nao depende de alimentos ou consumiveis biologicos.',
  },
}

export const THREE_DET_SKILLS: Record<ThreeDetSkillId, ThreeDetSkill> = {
  ARTES: { id: 'ARTES', label: 'Artes', description: 'Atuacao, musica, pintura e expressoes artisticas.' },
  ESPORTE: { id: 'ESPORTE', label: 'Esporte', description: 'Acrobacia, competicao e controle corporal.' },
  INFLUENCIA: { id: 'INFLUENCIA', label: 'Influencia', description: 'Persuasao, etiqueta e impressao social.' },
  LUTA: { id: 'LUTA', label: 'Luta', description: 'Combate corpo a corpo, armas e postura ofensiva.' },
  MANHA: { id: 'MANHA', label: 'Manha', description: 'Furtividade, truques, crime e improviso urbano.' },
  MISTICA: { id: 'MISTICA', label: 'Mistica', description: 'Conhecimento sobrenatural e uso de magia.' },
  PERCEPCAO: { id: 'PERCEPCAO', label: 'Percepcao', description: 'Atencao, sentidos aguçados e leitura do ambiente.' },
  SABER: { id: 'SABER', label: 'Saber', description: 'Historia, ciencias, estrategia e cultura.' },
  SUSTENTO: { id: 'SUSTENTO', label: 'Sustento', description: 'Sobrevivencia, oficio e manutencao cotidiana.' },
}

export const THREE_DET_TRAITS: Record<ThreeDetTraitId, ThreeDetTrait> = {
  AGIL: {
    id: 'AGIL',
    label: 'Agil',
    type: 'advantage',
    cost: 1,
    description: 'Reflexos e mobilidade acima do normal.',
  },
  ARTEFATO: {
    id: 'ARTEFATO',
    label: 'Artefato',
    type: 'advantage',
    cost: 1,
    description: 'Item especial ligado ao conceito do personagem.',
  },
  ATAQUE_ESPECIAL: {
    id: 'ATAQUE_ESPECIAL',
    label: 'Ataque Especial',
    type: 'advantage',
    cost: 1,
    description: 'Tecnica ofensiva diferenciada para golpes marcantes.',
    prerequisite: (state) => (state.power <= 0 && !state.skillIds.includes('LUTA') ? 'Exige Poder 1+ ou a pericia Luta.' : null),
  },
  CARISMATICO: {
    id: 'CARISMATICO',
    label: 'Carismatico',
    type: 'advantage',
    cost: 1,
    description: 'Presenca inspiradora ou magnetica.',
  },
  FORTE: {
    id: 'FORTE',
    label: 'Forte',
    type: 'advantage',
    cost: 1,
    description: 'Capacidade fisica superior em tarefas de impacto e carga.',
  },
  GENIO: {
    id: 'GENIO',
    label: 'Genio',
    type: 'advantage',
    cost: 1,
    description: 'Capacidade intelectual acima da media.',
  },
  ILUSAO: {
    id: 'ILUSAO',
    label: 'Ilusao',
    type: 'advantage',
    cost: 1,
    description: 'Manipula sentidos e aparencias com efeitos ilusorios.',
    prerequisite: (state) => (!state.skillIds.includes('MISTICA') ? 'Exige a pericia Mistica.' : null),
  },
  MAGIA: {
    id: 'MAGIA',
    label: 'Magia',
    type: 'advantage',
    cost: 1,
    description: 'Permite lancar magias dentro do conjunto oficial suportado.',
    prerequisite: (state) => (!state.skillIds.includes('MISTICA') ? 'Exige a pericia Mistica.' : null),
  },
  RESOLUTO: {
    id: 'RESOLUTO',
    label: 'Resoluto',
    type: 'advantage',
    cost: 1,
    description: 'Mantem foco e coragem mesmo sob pressao.',
  },
  SENTIDO: {
    id: 'SENTIDO',
    label: 'Sentido',
    type: 'advantage',
    cost: 1,
    description: 'Sentido extraordinario ou ampliado.',
  },
  VIGOROSO: {
    id: 'VIGOROSO',
    label: 'Vigoroso',
    type: 'advantage',
    cost: 1,
    description: 'Mais folego e resistencia para jornadas longas.',
  },
  ANTIPATICO: {
    id: 'ANTIPATICO',
    label: 'Antipatico',
    type: 'disadvantage',
    cost: -1,
    description: 'Dificulta interacoes sociais por comportamento ou reputacao.',
  },
  ATRAPALHADO: {
    id: 'ATRAPALHADO',
    label: 'Atrapalhado',
    type: 'disadvantage',
    cost: -1,
    description: 'Comete erros simples com frequencia.',
  },
  DIFERENTE: {
    id: 'DIFERENTE',
    label: 'Diferente',
    type: 'disadvantage',
    cost: -1,
    description: 'Aparencia ou origem causa estranhamento imediato.',
  },
  FRACOTE: {
    id: 'FRACOTE',
    label: 'Fracote',
    type: 'disadvantage',
    cost: -1,
    description: 'Tem dificuldade com esforco fisico e carga.',
  },
  FRAGIL: {
    id: 'FRAGIL',
    label: 'Fragil',
    type: 'disadvantage',
    cost: -1,
    description: 'Tolera menos impacto e desgaste.',
  },
  INDECISO: {
    id: 'INDECISO',
    label: 'Indeciso',
    type: 'disadvantage',
    cost: -1,
    description: 'Hesita demais em momentos de pressao.',
  },
  TAPADO: {
    id: 'TAPADO',
    label: 'Tapado',
    type: 'disadvantage',
    cost: -1,
    description: 'Tem dificuldade para perceber o obvio ou interpretar pistas.',
  },
}

export const DND_CLASSES: Record<DndClassId, DndClassDef> = {
  FIGHTER: {
    id: 'FIGHTER',
    label: 'Fighter',
    hitDie: 10,
    primaryAbilities: ['STR', 'DEX'],
    description: 'Especialista em combate marcial, sobrevivendo bem na linha de frente.',
    startingEquipment: ['Chain Mail', 'Martial Weapon', 'Shield', 'Light Crossbow', '20 Bolts', "Dungeoneer's Pack"],
    buildEquipment: () => [
      createEquipment('Chain Mail', 'ARMOR'),
      createEquipment('Martial Weapon', 'WEAPON'),
      createEquipment('Shield', 'SHIELD'),
      createEquipment('Light Crossbow', 'WEAPON'),
      createEquipment('20 Bolts', 'CONSUMABLE'),
      createEquipment("Dungeoneer's Pack", 'ACCESSORY'),
    ],
  },
  CLERIC: {
    id: 'CLERIC',
    label: 'Cleric',
    hitDie: 8,
    primaryAbilities: ['WIS'],
    description: 'Conjurador divino com suporte, protecao e resiliencia taticos.',
    startingEquipment: ['Scale Mail', 'Shield', 'Mace', 'Light Crossbow', '20 Bolts', "Priest's Pack", 'Holy Symbol'],
    buildEquipment: () => [
      createEquipment('Scale Mail', 'ARMOR'),
      createEquipment('Shield', 'SHIELD'),
      createEquipment('Mace', 'WEAPON'),
      createEquipment('Light Crossbow', 'WEAPON'),
      createEquipment('20 Bolts', 'CONSUMABLE'),
      createEquipment("Priest's Pack", 'ACCESSORY'),
      createEquipment('Holy Symbol', 'ACCESSORY'),
    ],
  },
  ROGUE: {
    id: 'ROGUE',
    label: 'Rogue',
    hitDie: 8,
    primaryAbilities: ['DEX'],
    description: 'Especialista em precisao, furtividade e solucoes fora do padrao.',
    startingEquipment: ['Leather Armor', 'Rapier', 'Shortbow', '20 Arrows', "Burglar's Pack", "Thieves' Tools", 'Daggers x2'],
    buildEquipment: () => [
      createEquipment('Leather Armor', 'ARMOR'),
      createEquipment('Rapier', 'WEAPON'),
      createEquipment('Shortbow', 'WEAPON'),
      createEquipment('20 Arrows', 'CONSUMABLE'),
      createEquipment("Burglar's Pack", 'ACCESSORY'),
      createEquipment("Thieves' Tools", 'ACCESSORY'),
      createEquipment('Daggers x2', 'WEAPON'),
    ],
  },
  WIZARD: {
    id: 'WIZARD',
    label: 'Wizard',
    hitDie: 6,
    primaryAbilities: ['INT'],
    description: 'Conjurador arcano versatil baseado em estudo e preparacao.',
    startingEquipment: ['Quarterstaff', 'Component Pouch', "Scholar's Pack", 'Spellbook'],
    buildEquipment: () => [
      createEquipment('Quarterstaff', 'WEAPON'),
      createEquipment('Component Pouch', 'ACCESSORY'),
      createEquipment("Scholar's Pack", 'ACCESSORY'),
      createEquipment('Spellbook', 'ACCESSORY'),
    ],
  },
}

export const DND_RACES: Record<DndRaceId, DndRaceDef> = {
  HUMAN: {
    id: 'HUMAN',
    label: 'Human',
    description: 'Versatil, com melhoria ampla em todos os atributos.',
    abilityBonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    traits: ['+1 em todos os atributos', 'Idioma extra opcional no conjunto oficial'],
  },
  HILL_DWARF: {
    id: 'HILL_DWARF',
    label: 'Hill Dwarf',
    description: 'Robusto e resistente, com afinidade para sabedoria e durabilidade.',
    abilityBonuses: { CON: 2, WIS: 1 },
    traits: ['Darkvision', 'Dwarven Resilience', 'Dwarven Toughness'],
  },
  HIGH_ELF: {
    id: 'HIGH_ELF',
    label: 'High Elf',
    description: 'Agil e intelectualmente treinado, com magica menor e sentidos refinados.',
    abilityBonuses: { DEX: 2, INT: 1 },
    traits: ['Darkvision', 'Keen Senses', 'Elf Weapon Training', 'Cantrip extra'],
  },
  LIGHTFOOT_HALFLING: {
    id: 'LIGHTFOOT_HALFLING',
    label: 'Lightfoot Halfling',
    description: 'Discreto, sortudo e naturalmente escorregadio.',
    abilityBonuses: { DEX: 2, CHA: 1 },
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy'],
  },
}

export const DND_BACKGROUNDS: Record<DndBackgroundId, DndBackgroundDef> = {
  ACOLYTE: {
    id: 'ACOLYTE',
    label: 'Acolyte',
    description: 'Ligacao religiosa, treinamento doutrinario e acesso a redes de templo.',
  },
  CRIMINAL: {
    id: 'CRIMINAL',
    label: 'Criminal',
    description: 'Submundo, codigos de rua e contatos ilegais.',
  },
  SAGE: {
    id: 'SAGE',
    label: 'Sage',
    description: 'Formacao academica, pesquisa e recuperacao de conhecimento.',
  },
  SOLDIER: {
    id: 'SOLDIER',
    label: 'Soldier',
    description: 'Disciplina militar, cadeia de comando e experiencia em campanha.',
  },
}

export function createDefaultThreeDetBuilder(): ThreeDetBuilderState {
  return {
    archetypeId: 'HUMANO',
    power: 2,
    skill: 2,
    resistance: 2,
    skillIds: [],
    advantageIds: [],
    disadvantageIds: [],
  }
}

export function createDefaultDndBuilder(): DndBuilderState {
  return {
    classId: 'FIGHTER',
    raceId: 'HUMAN',
    backgroundId: 'SOLDIER',
    level: 1,
    abilityScores: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  }
}

export function getDndPointBuyCost(score: number) {
  return DND_POINT_BUY_COSTS[score] ?? Number.POSITIVE_INFINITY
}

export function getDndPointBuySpent(scores: Record<DndAbilityKey, number>) {
  return Object.values(scores).reduce((acc, score) => acc + getDndPointBuyCost(score), 0)
}

export function getDndPointBuyRemaining(scores: Record<DndAbilityKey, number>) {
  return DND_POINT_BUY_BUDGET - getDndPointBuySpent(scores)
}

export function getThreeDetPoints(state: ThreeDetBuilderState) {
  const archetypeCost = state.archetypeId ? THREE_DET_ARCHETYPES[state.archetypeId].cost : 0
  const skillsCost = state.skillIds.length
  const advantagesCost = state.advantageIds.reduce((acc, id) => acc + THREE_DET_TRAITS[id].cost, 0)
  const disadvantageCredits = state.disadvantageIds.reduce((acc, id) => acc + Math.abs(THREE_DET_TRAITS[id].cost), 0)
  const attributeCost = state.power + state.skill + state.resistance
  const spent = attributeCost + archetypeCost + skillsCost + advantagesCost - Math.min(disadvantageCredits, THREE_DET_DISADVANTAGE_CAP)
  return {
    attributeCost,
    archetypeCost,
    skillsCost,
    advantagesCost,
    disadvantageCredits,
    spent,
    remaining: THREE_DET_POINTS_BUDGET - spent,
  }
}

export function validateThreeDetBuilder(state: ThreeDetBuilderState): RuleIssue[] {
  const issues: RuleIssue[] = []
  const numbers = [
    ['power', state.power],
    ['skill', state.skill],
    ['resistance', state.resistance],
  ] as const

  for (const [path, value] of numbers) {
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      issues.push({ path, message: 'Atributos de 3DeT Victory devem ficar entre 0 e 5 na criacao padrao.' })
    }
  }

  const points = getThreeDetPoints(state)
  if (points.disadvantageCredits > THREE_DET_DISADVANTAGE_CAP) {
    issues.push({ path: 'disadvantages', message: 'O limite oficial suportado de desvantagens iniciais e 2 pontos.' })
  }
  if (points.spent > THREE_DET_POINTS_BUDGET) {
    issues.push({ path: 'points', message: 'A ficha excede o orcamento inicial de 10 pontos.' })
  }

  const duplicateIds = findDuplicates([...state.skillIds, ...state.advantageIds, ...state.disadvantageIds])
  if (duplicateIds.length > 0) {
    issues.push({ path: 'duplicates', message: 'Nao e permitido selecionar a mesma opcao mais de uma vez.' })
  }

  for (const advantageId of state.advantageIds) {
    const prerequisiteMessage = THREE_DET_TRAITS[advantageId].prerequisite?.(state)
    if (prerequisiteMessage) {
      issues.push({ path: `advantage:${advantageId}`, message: prerequisiteMessage })
    }
  }

  const conflictingIds = state.advantageIds.filter((id) => state.disadvantageIds.includes(id))
  if (conflictingIds.length > 0) {
    issues.push({ path: 'conflicts', message: 'Uma mesma caracteristica nao pode existir como vantagem e desvantagem ao mesmo tempo.' })
  }

  return issues
}

export function validateDndBuilder(state: DndBuilderState): RuleIssue[] {
  const issues: RuleIssue[] = []

  if (state.level !== 1) {
    issues.push({ path: 'level', message: 'A criacao guiada oficial suportada nesta versao e apenas para personagens de nivel 1.' })
  }

  for (const [key, score] of Object.entries(state.abilityScores) as [DndAbilityKey, number][]) {
    if (!Number.isInteger(score) || score < 8 || score > 15) {
      issues.push({ path: key, message: 'No point buy oficial, os atributos base devem ficar entre 8 e 15 antes dos bonus raciais.' })
    }
  }

  const spent = getDndPointBuySpent(state.abilityScores)
  if (spent > DND_POINT_BUY_BUDGET) {
    issues.push({ path: 'point-buy', message: 'A distribuicao excede o orcamento oficial de 27 pontos.' })
  }

  return issues
}

export function buildThreeDetCharacterPayload(base: CharacterBaseForm, state: ThreeDetBuilderState): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  const issues = validateThreeDetBuilder(state)
  if (issues.length > 0) {
    throw new Error(issues[0].message)
  }

  const points = getThreeDetPoints(state)
  const maxHp = calcVictoryMaxHp(state.resistance)
  const maxMp = calcVictoryMaxMp(state.skill)
  const threeDet: ThreeDetCharacterData = {
    edition: 'VICTORY',
    archetypeId: state.archetypeId,
    skillIds: [...state.skillIds],
    advantageIds: [...state.advantageIds],
    disadvantageIds: [...state.disadvantageIds],
    pointsBudget: THREE_DET_POINTS_BUDGET,
    pointsSpent: points.spent,
    disadvantagePoints: points.disadvantageCredits,
    maxHp,
    maxMp,
  }

  return {
    name: base.name.trim(),
    role: base.role.trim(),
    type: base.type,
    imageUri: base.imageUri,
    portraitUri: null,
    tags: ['3DeT Victory'],
    strength: state.power,
    skill: state.skill,
    resistance: state.resistance,
    armor: 0,
    firepower: 0,
    currentHp: maxHp,
    currentMp: maxMp,
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: '',
    speechStyle: '',
    mannerisms: [],
    goal: '',
    secrets: {},
    quickPhrases: [],
    advantages: buildThreeDetLabels(state.advantageIds),
    disadvantages: buildThreeDetLabels(state.disadvantageIds),
    equipment: [],
    powers: state.advantageIds.includes('MAGIA')
      ? [
          {
            id: createId(),
            name: 'Magia Inicial',
            description: 'Espaco reservado para o primeiro efeito magico oficial do personagem.',
            mpCost: 1,
            target: 'Single',
            testReminder: 'Use Mistica quando a cena exigir teste.',
            onSuccess: null,
            onFailure: null,
            damage: null,
            range: 'Medium',
            areaEffect: false,
          },
        ]
      : [],
    threeDet,
    campaignId: base.campaignId,
    isTemplate: false,
  }
}

export function buildDndCharacterPayload(base: CharacterBaseForm, state: DndBuilderState): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  const issues = validateDndBuilder(state)
  if (issues.length > 0) {
    throw new Error(issues[0].message)
  }

  const race = DND_RACES[state.raceId]
  const clazz = DND_CLASSES[state.classId]
  const background = DND_BACKGROUNDS[state.backgroundId]
  const finalScores = applyDndRaceBonuses(state.abilityScores, race.abilityBonuses)
  const conMod = getAbilityModifier(finalScores.CON)
  const dexMod = getAbilityModifier(finalScores.DEX)
  const maxHp = Math.max(1, clazz.hitDie + conMod)
  const armorClass = getStartingArmorClass(state.classId, dexMod)

  return {
    name: base.name.trim(),
    role: base.role.trim() || clazz.label,
    type: base.type,
    imageUri: base.imageUri,
    portraitUri: null,
    tags: ['D&D 5e', race.label, clazz.label, background.label],
    strength: 0,
    skill: 0,
    resistance: 1,
    armor: 0,
    firepower: 0,
    currentHp: maxHp,
    currentMp: 0,
    activeConditions: [],
    xp: 0,
    gold: 0,
    personality: '',
    speechStyle: '',
    mannerisms: [],
    goal: '',
    secrets: {},
    quickPhrases: [],
    advantages: race.traits,
    disadvantages: [],
    equipment: clazz.buildEquipment(),
    powers: [],
    dnd: {
      level: 1,
      class: clazz.label,
      race: race.label,
      background: background.label,
      abilityScores: finalScores,
      proficiencyBonus: 2,
      armorClass,
      maxHp,
      startingEquipment: [...clazz.startingEquipment],
    },
    campaignId: base.campaignId,
    isTemplate: false,
  }
}

export function hydrateThreeDetBuilderFromCharacter(character: Character): ThreeDetBuilderState {
  return {
    archetypeId: character.threeDet?.archetypeId ?? 'HUMANO',
    power: character.strength,
    skill: character.skill,
    resistance: character.resistance,
    skillIds: [...(character.threeDet?.skillIds ?? [])],
    advantageIds: [...(character.threeDet?.advantageIds ?? [])],
    disadvantageIds: [...(character.threeDet?.disadvantageIds ?? [])],
  }
}

export function hydrateDndBuilderFromCharacter(character: Character): DndBuilderState {
  const dnd = character.dnd
  return {
    classId: findDndClassId(dnd?.class) ?? 'FIGHTER',
    raceId: findDndRaceId(dnd?.race) ?? 'HUMAN',
    backgroundId: findDndBackgroundId(dnd?.background) ?? 'SOLDIER',
    level: dnd?.level ?? 1,
    abilityScores: dnd?.abilityScores ?? { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  }
}

export function buildThreeDetLabels(ids: ThreeDetTraitId[]) {
  return ids.map((id) => THREE_DET_TRAITS[id].label)
}

export function applyDndRaceBonuses(
  abilityScores: Record<DndAbilityKey, number>,
  bonuses: Partial<Record<DndAbilityKey, number>>,
) {
  return {
    STR: abilityScores.STR + (bonuses.STR ?? 0),
    DEX: abilityScores.DEX + (bonuses.DEX ?? 0),
    CON: abilityScores.CON + (bonuses.CON ?? 0),
    INT: abilityScores.INT + (bonuses.INT ?? 0),
    WIS: abilityScores.WIS + (bonuses.WIS ?? 0),
    CHA: abilityScores.CHA + (bonuses.CHA ?? 0),
  }
}

export function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

function getStartingArmorClass(classId: DndClassId, dexMod: number) {
  if (classId === 'FIGHTER') return 18
  if (classId === 'CLERIC') return 14 + Math.min(2, dexMod) + 2
  if (classId === 'ROGUE') return 11 + dexMod
  return 10 + dexMod
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

function createEquipment(name: string, type: EquipmentType): EquipmentItem {
  return {
    id: createId(),
    name,
    type,
    description: '',
    bonusF: 0,
    bonusH: 0,
    bonusR: 0,
    bonusA: 0,
    bonusPdF: 0,
    special: '',
    imageUri: null,
    isEquipped: false,
  }
}

function findDndClassId(label?: string | null): DndClassId | null {
  return (Object.values(DND_CLASSES).find((entry) => entry.label === label)?.id ?? null) as DndClassId | null
}

function findDndRaceId(label?: string | null): DndRaceId | null {
  return (Object.values(DND_RACES).find((entry) => entry.label === label)?.id ?? null) as DndRaceId | null
}

function findDndBackgroundId(label?: string | null): DndBackgroundId | null {
  return (Object.values(DND_BACKGROUNDS).find((entry) => entry.label === label)?.id ?? null) as DndBackgroundId | null
}
