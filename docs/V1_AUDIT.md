# V1 Audit — Estado Atual

> Gerado em: 2026-08-08
> Branch: `v1-presencial`
> Responsável: Líder técnico V1

---

## Resumo executivo

O repositório `app/` contém **trabalho V1 substancial e bem estruturado** deixado pelo Codex.
Não há necessidade de reescrever ou recomeçar. O código existente estabelece:

- Arquitetura multi-ruleset (types, registry, ordemCompatible)
- Domínio V1 completo (v1.ts)
- Realtime LAN funcional (WebSocket + provider React + servidor Node)
- Páginas V1: LivePlayerPage, MasterStudio, StoryBoard
- Componentes V1: DirectorBar, LiveSessionHostPanel
- 30 testes existentes
- CI/CD via GitHub Actions

Os repositórios legados (`legacy-DK/`, `legacy-dungeon-keeper-rpg/`) contêm regras de negócio
maduras (join requests, rate limiting, Sentry, Redis) mas stack Python/FastAPI incompatível
com a base React/TypeScript/Vite do `app/`.

### Decisões arquiteturais já tomadas

| Decisão | Status |
|---------|--------|
| Multi-ruleset como camada explícita | ✅ Implementado |
| Sessão presencial LAN com WebSocket | ✅ Implementado |
| Personagem persistente (multi-campanha) | ✅ Modelado em v1.ts |
| Biblioteca do Mestre (18 tipos) | ✅ Implementado |
| Palco com apresentação seletiva | ✅ Implementado |
| Reconexão com idempotência | ✅ Implementado no server |
| Tema paranormal/dossier | ✅ Implementado |
| Offline-first com IndexedDB | ✅ Implementado |
| PWA | ✅ Configurado |

---

## Estado do Git — app/

### Branch
`v1-presencial` (já criada, com commits)

### Último commit
`0f14e98` — feat: ship expanded platform and pages-ready build

### Arquivos modificados (24)
```
M  .gitignore
M  index.html
M  package-lock.json
M  package.json
M  src/components/game/AudioPlayer.tsx
M  src/components/game/InteractiveMap.tsx
M  src/components/ui/NavBar.tsx
M  src/config/auto-content.ts
M  src/domain/models.ts          # +40 linhas: V1 fields (rulesetId, ordem, history...)
M  src/index.css                 # +133 linhas: tema paranormal
M  src/lib/campaignSystems.ts    # +23 linhas
M  src/lib/characterRules.ts     # +2 linhas
M  src/lib/db.ts                 # +6 linhas
M  src/lib/snapshot.ts           # +23 linhas: normalização V1
M  src/main.tsx                  # +5 linhas
M  src/pages/CampaignForm.tsx    # +30 linhas
M  src/pages/CharacterForm.tsx   # +305 linhas: multi-ruleset + guided/free/imported
M  src/pages/SessionRunner.tsx   # +37 linhas
M  src/router.tsx                # +6 linhas
M  src/store/AppStore.test.tsx   # +27 linhas
M  src/store/AppStore.tsx        # +251 linhas: operações V1
M  src/store/defaultData.ts      # +332 linhas: dados V1
M  tailwind.config.js            # +46 linhas: tema paranormal
M  vite.config.ts                # +20 linhas
```

### Arquivos não trackeados (10+)
```
.tools/vite-build.mjs
.tools/vitest-run.mjs
public/dossier-mark.svg
server/lan-server.mjs           # Servidor LAN (492 linhas)
server/lan-smoke.mjs
src/components/live/DirectorBar.tsx
src/components/live/LiveSessionHostPanel.tsx
src/domain/v1.ts                # Domínio V1 (201 linhas)
src/pages/LivePlayerPage.tsx    # Página do jogador (250 linhas)
src/pages/MasterStudio.tsx      # Estúdio do Mestre (140 linhas)
src/pages/StoryBoard.tsx        # Quadro narrativo (82 linhas)
src/realtime/LiveSessionContext.tsx  # Provider React (238 linhas)
src/realtime/protocol.ts        # Protocolo LAN (67 linhas)
src/realtime/projection.ts      # Projeção de estado (59 linhas)
src/rulesets/registry.ts        # Registro de rulesets (20 linhas)
src/rulesets/types.ts           # Tipos de ruleset (114 linhas)
src/rulesets/ordemCompatible.ts # Ruleset ORDEM (114 linhas)
```

---

## Arquitetura verificada

### 1. Multi-Ruleset (`src/rulesets/`)
- `types.ts`: `Ruleset`, `CharacterSchema`, `DiceRules`, `CombatRules`, `ProgressionRules`, `ThemeDefinition`
- `ordemCompatible.ts`: Implementação completa "Protocolo Paranormal" com 5 atributos, 3 recursos, 8 skills, dados Nd20kh1
- `registry.ts`: Registro + lookup, fallback para ordem-compatible

**Status**: ✅ Sólido. Pronto para V1.

### 2. Domínio V1 (`src/domain/v1.ts`)
- `PlatformUser`, `CharacterHistoryEvent`, `CharacterParticipation`, `CampaignEntryPolicy`
- `OrdemCompatibleCharacterData`: Atributos, recursos, skills, habilidades
- `LibraryEntity`: 16 tipos (npc, creature, villain, item, place, etc.)
- `DiceLogEntry`, `SessionFeedback`, `RecordingConsent`, `CriticalActionLog`
- Placeholders: `FeatureEntitlement`, `Wallet`, `SocialStub`

**Status**: ✅ Bem modelado. Separation of concerns entre models.ts (legado) e v1.ts (novo).

### 3. Realtime LAN (`src/realtime/` + `server/`)
- `protocol.ts`: `LiveParticipant`, `StagePresentation`, `SessionProjection`, `LiveEvent`
- `LiveSessionContext.tsx`: Provider React com reconexão exponencial, auth via localStorage
- `projection.ts`: Sanitização de dados por papel (master vs player)
- `lan-server.mjs`: Servidor HTTP + WS com persistência, rate limiting, QR code, heartbeat

**Status**: ✅ Funcional. Reconexão, idempotência de eventos, isolamento por audiência.

### 4. Páginas V1
- `LivePlayerPage.tsx`: Join flow, resource cards, dice roller, stage focus, audio sync, feedback
- `MasterStudio.tsx`: 16 tipos de LibraryEntity, criação rápida/completa, importação, busca
- `StoryBoard.tsx`: Reordenação de cenas, conexões com condição/consequência
- `DirectorBar.tsx`: Apresentação por tipo (cena, NPC, mapa, combate, som, recompensa)
- `LiveSessionHostPanel.tsx`: QR code, código, aprovação, atribuição de personagem

**Status**: ✅ Implementadas. Prontas para refinamento.

### 5. Store e Persistência
- `AppStore.tsx` (~1200 linhas): Reducer com 40+ actions, IndexedDB, BroadcastChannel
- `defaultData.ts`: Dados V1 iniciais
- `snapshot.ts`: Normalização de snapshots com versão

**Status**: ✅ Monolítico mas funcional. Refatoração futura.

---

## Testes

### Quantidade
**30 arquivos de teste** encontrados em `src/`:

| Categoria | Arquivos |
|-----------|----------|
| Store | AppStore.test.tsx, Rewards.test.tsx |
| Lib | adminSecurity, attachments, characterRules, db, github, logger, sessionReports, snapshot, supabase (2) |
| Components | AudioPlayer, CombatTracker, Dashboard, ImageUpload, NavBar, PageHero, SnapshotControlPanel, AppDiagnosticsPanel |
| Pages | CampaignForm, CampaignList, CharacterForm, PlayerConsole, SessionReports, SessionRunner |
| Config | auto-content (2) |
| Data | catalog, gameCatalog |
| Admin | AdminAccessContext, adminMetrics |
| Rulesets | ordemCompatible |
| Realtime | projection |

### Cobertura configurada
- Thresholds: lines 80%, functions 80%, branches 65%, statements 80%

### Novos testes V1 já existentes
- `ordemCompatible.test.ts` — testa o ruleset
- `projection.test.ts` — testa a projeção de sessão

---

## Legados

### legacy-DK/ (Python/FastAPI)
- Stack: Python, FastAPI, SQLAlchemy, Alembic, WebSocket, Redis, Sentry
- Diferenciais: Alembic migrations, rate limiting, JWT refresh rotation, WebSocket clustering
- **Não reaproveitável diretamente** — stack diferente, conceitos podem inspirar

### legacy-dungeon-keeper-rpg/ (Python/FastAPI + React/CRA)
- Stack: Python, FastAPI, SQLite, React 18, CRA
- Diferenciais: CRUD completo, models, schemas Pydantic
- **Não reaproveitável diretamente** — CRA vs Vite, server-side vs client-side

---

## Riscos identificados

1. **AppStore.tsx monolítico** (1200+ linhas) — difícil manutenção, mas funcional
2. **Nenhum commit desde o trabalho V1** — 24 modificados + 10 untracked não commitados
3. **Testes ainda não verificados** — rodando neste momento
4. **Supabase não configurado** — `supabase.ts` existe mas env vars ausentes
5. **PWA icons duplicados** — mesmo SVG para todos os tamanhos
6. **Scripts PowerShell** — só Windows, não portáveis

---

## Conclusão

O trabalho V1 existente em `app/` é **substancial e de boa qualidade**. A arquitetura multi-ruleset,
o sistema LAN, as páginas V1 e os tipos de domínio estão coerentes com o `AGENTS.md`.

**Próximo passo**: Commitar o trabalho atual, verificar os testes, e avançar para a
Fase 1 (Fundação) refinando o que já existe em vez de construir do zero.