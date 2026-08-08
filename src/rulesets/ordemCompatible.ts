import type { DiceRequest, DiceResult, Ruleset } from './types'

function d20(random: () => number) {
  return Math.floor(random() * 20) + 1
}

export function rollOrdemCompatible(request: DiceRequest, random: () => number = Math.random): DiceResult {
  const diceCount = Math.max(1, Math.floor(request.attributeValue ?? 1))
  const rolls = Array.from({ length: diceCount }, () => d20(random))
  const kept = [Math.max(...rolls)]
  const bonus = Math.floor(request.bonus ?? 0)
  const total = kept[0] + bonus
  const difficulty = request.difficulty
  let outcome: DiceResult['outcome']

  if (kept[0] === 20) outcome = 'critical'
  else if (kept[0] === 1 && diceCount === 1) outcome = 'fumble'
  else if (difficulty != null) outcome = total >= difficulty ? 'success' : 'failure'

  return {
    expression: request.expression || `${diceCount}d20kh1${bonus ? `${bonus > 0 ? '+' : ''}${bonus}` : ''}`,
    rolls,
    kept,
    total,
    outcome,
  }
}

export const ordemCompatibleRuleset: Ruleset = {
  id: 'ordem-compatible',
  name: 'Protocolo Paranormal',
  shortName: 'Paranormal',
  description: 'Ruleset original compatível com investigação paranormal, tensão e recursos de esforço e sanidade.',
  capabilities: {
    aiGenerationAllowed: false,
    customSheetAllowed: true,
    commercialContentAllowed: false,
    characterImportAllowed: true,
  },
  character: {
    identityFields: [
      { id: 'name', label: 'Nome', required: true },
      { id: 'origin', label: 'Origem', required: true },
      { id: 'path', label: 'Caminho', required: true },
      { id: 'concept', label: 'Conceito', required: false },
    ],
    attributes: [
      { id: 'agility', label: 'Agilidade', shortLabel: 'AGI', description: 'Reflexos, coordenação e velocidade.', min: 0, max: 5, defaultValue: 1 },
      { id: 'intellect', label: 'Intelecto', shortLabel: 'INT', description: 'Raciocínio, memória e investigação.', min: 0, max: 5, defaultValue: 1 },
      { id: 'presence', label: 'Presença', shortLabel: 'PRE', description: 'Percepção, convicção e força social.', min: 0, max: 5, defaultValue: 1 },
      { id: 'strength', label: 'Força', shortLabel: 'FOR', description: 'Potência física e capacidade de carga.', min: 0, max: 5, defaultValue: 1 },
      { id: 'vigor', label: 'Vigor', shortLabel: 'VIG', description: 'Resistência física e fôlego.', min: 0, max: 5, defaultValue: 1 },
    ],
    resources: [
      { id: 'health', label: 'Pontos de Vida', shortLabel: 'PV', color: '#a95c61', derivedFrom: 'vigor' },
      { id: 'effort', label: 'Pontos de Esforço', shortLabel: 'PE', color: '#b38a5b', derivedFrom: 'presence' },
      { id: 'sanity', label: 'Sanidade', shortLabel: 'SAN', color: '#708c89', derivedFrom: 'presence' },
    ],
    skills: [
      { id: 'athletics', label: 'Atletismo', attributeId: 'strength', description: 'Esforço físico e movimento.' },
      { id: 'reflexes', label: 'Reflexos', attributeId: 'agility', description: 'Reação rápida e esquiva.' },
      { id: 'investigation', label: 'Investigação', attributeId: 'intellect', description: 'Analisar pistas e relações.' },
      { id: 'medicine', label: 'Medicina', attributeId: 'intellect', description: 'Primeiros socorros e diagnóstico.' },
      { id: 'perception', label: 'Percepção', attributeId: 'presence', description: 'Notar detalhes e ameaças.' },
      { id: 'will', label: 'Vontade', attributeId: 'presence', description: 'Resistir a medo e influência.' },
      { id: 'stealth', label: 'Furtividade', attributeId: 'agility', description: 'Mover-se sem ser percebido.' },
      { id: 'technology', label: 'Tecnologia', attributeId: 'intellect', description: 'Operar e compreender sistemas.' },
    ],
  },
  items: {
    categories: [
      { id: 'weapon', label: 'Arma' },
      { id: 'protection', label: 'Proteção' },
      { id: 'gear', label: 'Equipamento' },
      { id: 'consumable', label: 'Consumível' },
      { id: 'special', label: 'Item especial' },
    ],
    supportsQuantity: true,
    supportsWeight: false,
  },
  conditions: [
    { id: 'injured', label: 'Ferido', description: 'O personagem sofreu dano relevante.' },
    { id: 'frightened', label: 'Amedrontado', description: 'A ameaça compromete decisões e concentração.' },
    { id: 'stunned', label: 'Atordoado', description: 'O personagem tem dificuldade para agir.' },
    { id: 'unconscious', label: 'Inconsciente', description: 'O personagem não pode agir.' },
  ],
  combat: {
    initiativeAttributeId: 'agility',
    supportsGrid: true,
    turnBased: true,
  },
  dice: {
    defaultExpression: '1d20kh1',
    roll: rollOrdemCompatible,
  },
  progression: {
    label: 'Exposição',
    min: 0,
    max: 100,
    defaultValue: 5,
  },
  theme: {
    id: 'paranormal-dossier',
    label: 'Dossiê Paranormal',
    className: 'theme-paranormal',
    colors: {
      background: '#11100f',
      surface: '#1b1917',
      primary: '#9c4d52',
      accent: '#aa8c68',
      text: '#ebe5dc',
    },
  },
}
