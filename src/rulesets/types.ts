export type RulesetId = 'ordem-compatible' | 'dnd5e' | '3det-victory' | 'custom'

export type RulesetCapability = {
  aiGenerationAllowed: boolean
  customSheetAllowed: boolean
  commercialContentAllowed: boolean
  characterImportAllowed: boolean
}

export type AttributeDefinition = {
  id: string
  label: string
  shortLabel: string
  description: string
  min: number
  max: number
  defaultValue: number
}

export type ResourceDefinition = {
  id: string
  label: string
  shortLabel: string
  color: string
  derivedFrom?: string
}

export type SkillDefinition = {
  id: string
  label: string
  attributeId: string
  description: string
}

export type ItemDefinition = {
  categories: Array<{ id: string; label: string }>
  supportsQuantity: boolean
  supportsWeight: boolean
}

export type ConditionDefinition = {
  id: string
  label: string
  description: string
}

export type DiceRequest = {
  expression?: string
  attributeId?: string
  attributeValue?: number
  bonus?: number
  difficulty?: number
}

export type DiceResult = {
  expression: string
  rolls: number[]
  kept: number[]
  total: number
  outcome?: 'critical' | 'success' | 'failure' | 'fumble'
}

export type CombatRules = {
  initiativeAttributeId: string
  supportsGrid: boolean
  turnBased: boolean
}

export type DiceRules = {
  defaultExpression: string
  roll: (request: DiceRequest, random?: () => number) => DiceResult
}

export type ProgressionRules = {
  label: string
  min: number
  max: number
  defaultValue: number
}

export type ThemeDefinition = {
  id: string
  label: string
  className: string
  colors: {
    background: string
    surface: string
    primary: string
    accent: string
    text: string
  }
}

export type CharacterSchema = {
  attributes: AttributeDefinition[]
  resources: ResourceDefinition[]
  skills: SkillDefinition[]
  identityFields: Array<{ id: string; label: string; required: boolean }>
}

export type Ruleset = {
  id: RulesetId
  name: string
  shortName: string
  description: string
  capabilities: RulesetCapability
  character: CharacterSchema
  items: ItemDefinition
  conditions: ConditionDefinition[]
  combat: CombatRules
  dice: DiceRules
  progression: ProgressionRules
  theme: ThemeDefinition
}
