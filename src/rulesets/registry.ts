import { ordemCompatibleRuleset } from './ordemCompatible'
import type { Ruleset, RulesetId } from './types'

const registry = new Map<RulesetId, Ruleset>([[ordemCompatibleRuleset.id, ordemCompatibleRuleset]])

export function registerRuleset(ruleset: Ruleset) {
  registry.set(ruleset.id, ruleset)
}

export function getRuleset(id: string | null | undefined): Ruleset {
  if (id && registry.has(id as RulesetId)) return registry.get(id as RulesetId)!
  return ordemCompatibleRuleset
}

export function listRulesets() {
  return Array.from(registry.values())
}

export { ordemCompatibleRuleset }
export type { Ruleset, RulesetId } from './types'
