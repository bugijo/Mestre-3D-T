# Ruleset Architecture — Multi-Ruleset para Dungeon Keeper V1

> Documentação da arquitetura de rulesets.  
> Estado: **implementado e validado** com `ordem-compatible` (V1).  
> Preparado para: `dnd5e`, `3det-victory`, `custom`.

---

## Princípios

1. **Isolamento total** — Regras **nunca** em componentes React. Apenas em `src/rulesets/`.
2. **Registry único** — `RulesetRegistry` é a fonte da verdade; `getRuleset(id)` retorna o ruleset ativo.
3. **Capabilities** — Ligam/desligam features por ruleset (IA, ficha custom, conteúdo comercial, importação).
4. **Tema por ruleset** — Visual radicalmente diferente via `ThemeDefinition` + CSS variables.
5. **Extensibilidade** — Novos rulesets = novo arquivo em `src/rulesets/` + registro no registry.

---

## Estrutura de Arquivos

```
src/rulesets/
├── types.ts              # Tipos canônicos (exportados para domain, UI, server)
├── registry.ts           # Registry + getRuleset() + listRulesets()
├── ordemCompatible.ts    # V1: Protocolo Paranormal (implementado)
├── dnd5e.ts              # Futuro: D&D 5e (stub)
├── 3det-victory.ts       # Futuro: 3DeT Victory (stub)
└── custom.ts             # Futuro: Ruleset customizado (stub)
```

---

## Tipos Canônicos (`types.ts`)

### RulesetId
```typescript
type RulesetId = 'ordem-compatible' | 'dnd5e' | '3det-victory' | 'custom'
```

### RulesetCapability
```typescript
type RulesetCapability = {
  aiGenerationAllowed: boolean      // Retrato por IA, geração de conteúdo
  customSheetAllowed: boolean       // Ficha livre (veteranos) vs guiada
  commercialContentAllowed: boolean // Conteúdo oficial licenciado
  characterImportAllowed: boolean   // Importar imagem/PDF/arquivo
}
```

### CharacterSchema
```typescript
type CharacterSchema = {
  identityFields: Array<{ id: string; label: string; required: boolean }>
  attributes: AttributeDefinition[]
  resources: ResourceDefinition[]
  skills: SkillDefinition[]
}
```

### AttributeDefinition
```typescript
type AttributeDefinition = {
  id: string
  label: string
  shortLabel: string        // Ex: "AGI", "FOR", "STR"
  description: string
  min: number
  max: number
  defaultValue: number
}
```

### ResourceDefinition
```typescript
type ResourceDefinition = {
  id: string
  label: string
  shortLabel: string        // Ex: "PV", "PE", "SAN", "HP", "MP"
  color: string             // Hex para UI (barra de recurso)
  derivedFrom?: string      // AttributeId de onde deriva (opcional)
}
```

### SkillDefinition
```typescript
type SkillDefinition = {
  id: string
  label: string
  attributeId: string       // Referência a AttributeDefinition.id
  description: string
}
```

### ItemDefinition
```typescript
type ItemDefinition = {
  categories: Array<{ id: string; label: string }>
  supportsQuantity: boolean
  supportsWeight: boolean
}
```

### ConditionDefinition
```typescript
type ConditionDefinition = {
  id: string
  label: string
  description: string
}
```

### DiceRules
```typescript
type DiceRequest = {
  expression?: string       // Ex: "2d20kh1+3"
  attributeId?: string      // Atributo rolado
  attributeValue?: number   // Valor do atributo (para calcular qtd dados)
  bonus?: number            // Bônus/plano
  difficulty?: number       // CD/Dificuldade
}

type DiceResult = {
  expression: string
  rolls: number[]           // Todos os dados rolados
  kept: number[]            // Dados mantidos (após keep highest/lowest)
  total: number             // Soma final + bônus
  outcome?: 'critical' | 'success' | 'failure' | 'fumble'
}

type DiceRules = {
  defaultExpression: string // Ex: "1d20kh1"
  roll: (request: DiceRequest, random?: () => number) => DiceResult
}
```

### CombatRules
```typescript
type CombatRules = {
  initiativeAttributeId: string  // Atributo para iniciativa
  supportsGrid: boolean          // Mapa tático com grid
  turnBased: boolean             // Turn-based vs tempo real
}
```

### ProgressionRules
```typescript
type ProgressionRules = {
  label: string       // Ex: "Exposição", "Nível", "XP"
  min: number
  max: number
  defaultValue: number
}
```

### ThemeDefinition
```typescript
type ThemeDefinition = {
  id: string              // Ex: 'paranormal-dossier', 'dnd5e-classic'
  label: string           // Nome amigável
  className: string       // Classe CSS no <html> (ex: 'theme-paranormal')
  colors: {
    background: string    // Fundo principal
    surface: string       // Cards, modais, painéis
    primary: string       // Cor principal (botões, links)
    accent: string        // Destaque secundário
    text: string          // Texto principal
  }
}
```

### Ruleset (Aggregate)
```typescript
type Ruleset = {
  id: RulesetId
  name: string            // Nome completo
  shortName: string       // Abreviação (ex: "Paranormal", "5e")
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
```

---

## Registry (`registry.ts`)

```typescript
import type { Ruleset, RulesetId } from './types'
import { ordemCompatibleRuleset } from './ordemCompatible'

const registry = new Map<RulesetId, Ruleset>([
  ['ordem-compatible', ordemCompatibleRuleset],
  // Futuro: ['dnd5e', dnd5eRuleset],
  // Futuro: ['3det-victory', d3etVictoryRuleset],
  // Futuro: ['custom', customRuleset],
])

export function getRuleset(id: RulesetId): Ruleset {
  const ruleset = registry.get(id)
  if (!ruleset) throw new Error(`Ruleset não registrado: ${id}`)
  return ruleset
}

export function listRulesets(): Ruleset[] {
  return Array.from(registry.values())
}

export function registerRuleset(ruleset: Ruleset): void {
  if (registry.has(ruleset.id)) {
    throw new Error(`Ruleset já registrado: ${ruleset.id}`)
  }
  registry.set(ruleset.id, ruleset)
}

export const DEFAULT_RULESET: RulesetId = 'ordem-compatible'
```

### Uso na UI

```typescript
import { getRuleset, DEFAULT_RULESET } from '@/rulesets/registry'

// No CharacterWizard
const ruleset = getRuleset(DEFAULT_RULESET)
// ruleset.character.identityFields → campos do formulário
// ruleset.character.attributes → seletores de atributo
// ruleset.dice.roll(request) → rolagem

// No LivePlayerPage (recursos)
const resources = ruleset.character.resources
// resources.map(r => ({ ...r, current: char.resources[r.id].current, max: ... }))
```

---

## Ordem Compatible (V1) — `ordemCompatible.ts`

### Atributos (5)
| ID | Label | Short | Range | Default | Deriva |
|----|-------|-------|-------|---------|--------|
| agility | Agilidade | AGI | 0–5 | 1 | Reflexos, Iniciativa |
| intellect | Intelecto | INT | 0–5 | 1 | Investigação, Tecnologia, Medicina |
| presence | Presença | PRE | 0–5 | 1 | Vontade, Percepção, PE, SAN |
| strength | Força | FOR | 0–5 | 1 | Atletismo, Dano corpo-a-corpo |
| vigor | Vigor | VIG | 0–5 | 1 | PV, Resistência física |

### Recursos (3)
| ID | Label | Short | Cor | Deriva de |
|----|-------|-------|-----|-----------|
| health | Pontos de Vida | PV | `#a95c61` | vigor |
| effort | Pontos de Esforço | PE | `#b38a5b` | presence |
| sanity | Sanidade | SAN | `#708c89` | presence |

### Perícias (8)
| ID | Label | Atributo |
|----|-------|----------|
| athletics | Atletismo | strength |
| reflexes | Reflexos | agility |
| investigation | Investigação | intellect |
| medicine | Medicina | intellect |
| perception | Percepção | presence |
| will | Vontade | presence |
| stealth | Furtividade | agility |
| technology | Tecnologia | intellect |

### Identidade (4 campos)
| ID | Label | Obrigatório |
|----|-------|-------------|
| name | Nome | Sim |
| origin | Origem | Sim |
| path | Caminho | Sim |
| concept | Conceito | Não |

### Condições (4)
| ID | Label | Descrição |
|----|-------|-----------|
| injured | Ferido | Dano relevante sofrido |
| frightened | Amedrontado | Ameaça compromete decisões |
| stunned | Atordoado | Dificuldade para agir |
| unconscious | Inconsciente | Não pode agir |

### Combate
- Iniciativa: **Agilidade**
- Grid: **Suportado**
- Turn-based: **Sim**

### Dados — Sistema "Vantagem/Desvantagem" (kh1)
```
Rolagem: Nd20kh1 + bônus
  - N = valor do atributo (mín 1)
  - kh1 = keep highest 1 (vantagem)
  - Crítico: d20 natural = 20
  - Fumble: d20 natural = 1 (apenas se 1 dado)
  - Sucesso/Falha: total >= CD
```

### Progressão
- Label: **Exposição**
- Range: 0–100
- Default: 5

### Tema — "Dossiê Paranormal"
```css
.theme-paranormal {
  --color-background: #11100f;  /* preto/carvão */
  --color-surface: #1b1917;     /* cinza escuro */
  --color-primary: #9c4d52;     /* vermelho dessaturado */
  --color-accent: #aa8c68;      /* dourado/âmbar */
  --color-text: #ebe5dc;        /* off-white */
}
```
Aplicado via `<html class="theme-paranormal">` no `index.html` + `index.css`.

---

## Integração com Domain (v1.ts)

### CharacterData por Ruleset
```typescript
// Em v1.ts — tipo específico para ordem-compatible
export type OrdemCompatibleCharacterData = {
  origin: string
  path: string
  progression: number
  attributes: Record<'agility'|'intellect'|'presence'|'strength'|'vigor', number>
  skills: Record<string, number>
  resources: Record<'health'|'effort'|'sanity', { current: number; max: number }>
  abilities: string[]
  biography: string
  appearance: string
}
```

### LibraryEntity (agnóstico de ruleset)
```typescript
export type LibraryEntity = {
  id: string
  ownerUserId: string
  rulesetId: RulesetId        // ← Vincula entidade ao ruleset
  kind: LibraryEntityKind     // npc, creature, item, place, scene, map, etc
  name: string
  summary: string
  imageDataUrl: string | null
  parentId: string | null     // Hierarquia geográfica
  tags: string[]
  privateNotes: string        // Só Mestre vê
  data: Record<string, unknown>  // Dados específicos do ruleset
  createdAt: number
  updatedAt: number
}
```

---

## Capabilities — Feature Flags por Ruleset

| Feature | ordem-compatible | dnd5e (futuro) | 3det-victory (futuro) | custom (futuro) |
|---------|------------------|----------------|----------------------|-----------------|
| AI Generation | ❌ | ❌/✅ | ❌/✅ | ✅ |
| Custom Sheet | ✅ | ✅ | ✅ | ✅ |
| Commercial Content | ❌ | ✅ (SRD) | ❌/✅ | ✅ |
| Character Import | ✅ | ✅ | ✅ | ✅ |

### Uso na UI
```typescript
const { capabilities } = getRuleset(currentRulesetId)

{capabilities.aiGenerationAllowed && <AIPortraitButton />}
{capabilities.customSheetAllowed && <FreeSheetTab />}
{capabilities.commercialContentAllowed && <OfficialContentStore />}
{capabilities.characterImportAllowed && <ImportCharacterButton />}
```

---

## Adicionando Novo Ruleset (Checklist)

1. **Criar arquivo** `src/rulesets/<id>.ts` exportando `const <id>Ruleset: Ruleset`
2. **Registrar** em `registry.ts`:
   ```typescript
   import { <id>Ruleset } from './<id>'
   const registry = new Map([..., ['<id>', <id>Ruleset]])
   ```
3. **Adicionar** `RulesetId` em `types.ts` se novo
4. **Criar tema CSS** em `index.css`:
   ```css
   .theme-<id> {
     --color-background: ...;
     --color-surface: ...;
     --color-primary: ...;
     --color-accent: ...;
     --color-text: ...;
   }
   ```
5. **Testes** — `ordemCompatible.test.ts` como modelo:
   - Valida schema completo
   - Testa `dice.roll()` com casos: crítico, fumble, sucesso, falha
   - Testa derivação de recursos (PV = f(vigor), etc)
6. **Demo** — Adicionar personagens/NPCs/criaturas de exemplo no seed

---

## Validação em Tempo de Execução

### Client-side (CharacterWizard)
- `identityFields.required` → campos obrigatórios
- `attributes.min/max` → clamp no input
- `skills` → só exibidas se atributo base > 0 (opcional)

### Server-side (lan-server.mjs)
- `safeText()` — sanitização genérica
- Projeção sanitizada — jogador só vê próprio personagem
- Eventos de jogador validados — `validatePlayerEvent()` bloqueia:
  - `kind` em `MASTER_ACTIONS` (reward, grant, system, etc)
  - `payload.characterId` diferente do personagem do jogador

---

## Migração de Dados (Futuro)

Quando houver múltiplos rulesets ativos:

```typescript
// CharacterVersion para migração entre rulesets
type CharacterVersion = {
  id: string
  characterId: string
  rulesetId: RulesetId
  data: Record<string, unknown>  // Dados no formato do ruleset
  createdAt: number
  label: string                  // Ex: "v1 - Ordem Paranormal"
}
```

> **Regra:** Personagem pertence ao jogador. Mudança de ruleset = nova versão, **nunca** sobrescreve original.

---

## Referências Rápidas

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/rulesets/types.ts` | Tipos TypeScript compartilhados |
| `src/rulesets/registry.ts` | Registry, getRuleset, listRulesets |
| `src/rulesets/ordemCompatible.ts` | Implementação V1 completa |
| `src/domain/v1.ts` | Tipos de domínio V1 (CharacterParticipation, LibraryEntity, etc) |
| `src/realtime/protocol.ts` | Tipos de mensagem WS (usam RulesetId) |
| `index.css` | CSS variables por tema (`.theme-paranormal`, etc) |
| `tailwind.config.js` | Extensão de cores via `theme.extend.colors` |

---

## Decisões de Design (ADR-style)

### ADR-001: Ruleset como dado, não código espalhado
**Decisão:** Toda regra vive em `src/rulesets/`. Zero `if (ruleset === 'x')` em componentes.
**Motivo:** Manutenibilidade, testabilidade, adição de rulesets sem tocar UI.

### ADR-002: DiceRules.roll é função pura
**Decisão:** `roll(request, random?) → DiceResult`. `random` injetável para testes.
**Motivo:** Testes determinísticos, reprodutibilidade, auditoria.

### ADR-003: Theme via CSS class no <html>
**Decisão:** `<html class="theme-{id}">` + CSS variables. Sem CSS-in-JS.
**Motivo:** Performance, PWA, troca de tema instantânea, sem rebuild.

### ADR-004: Capabilities = feature flags, não permissões
**Decisão:** `capabilities` diz o que o ruleset *permite*, não o que o usuário *pode*.
**Motivo:** Separação de conceitos — ruleset define identidade; entitlement/plano define acesso.

### ADR-005: CharacterSchema derivado do Ruleset
**Decisão:** `CharacterSchema` vive dentro do `Ruleset`. Não existe schema global.
**Motivo:** D&D 5e tem 6 atributos; Ordem tem 5; 3DeT tem 3. Schema é intrínseco ao ruleset.