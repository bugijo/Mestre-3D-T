# Matriz de Casos de Teste QA

Data de execucao base: 2026-03-04

Legenda de status:
- `PASS`: executado e aprovado
- `FAIL`: executado e reprovado
- `PENDING`: planejado e ainda nao executado manualmente

## 1) Fluxos funcionais - Mestre

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| FUN-MESTRE-001 | Dashboard renderiza metricas e tabs acessiveis | Automatizado | `src/components/Dashboard.test.tsx` | PASS |
| FUN-MESTRE-002 | Session Runner inicia/encerra sessao corretamente | Automatizado | `src/pages/SessionRunner.test.tsx` | PASS |
| FUN-MESTRE-003 | Session Runner registra/remover nota importante | Automatizado | `src/pages/SessionRunner.test.tsx` | PASS |
| FUN-MESTRE-004 | Combat Tracker avanca turno e encerra combate | Automatizado | `src/components/game/CombatTracker.test.tsx` | PASS |
| FUN-MESTRE-005 | Combat Tracker ajusta PV/PM e estado derrotado | Automatizado | `src/components/game/CombatTracker.test.tsx` | PASS |
| FUN-MESTRE-006 | Lista de campanhas mostra empty state sem dados | Automatizado | `src/pages/CampaignList.test.tsx` | PASS |
| FUN-MESTRE-007 | Formulario de campanha cria nova campanha | Automatizado | `src/pages/CampaignForm.test.tsx` | PASS |
| FUN-MESTRE-008 | Relatorios de sessao geram resumo copiavel | Automatizado | `src/pages/SessionReports.test.tsx` | PASS |

## 2) Fluxos funcionais - Jogador

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| FUN-PLAYER-001 | Console do jogador altera recursos e inventario | Automatizado | `src/pages/PlayerConsole.test.tsx` | PASS |
| FUN-PLAYER-002 | Store aplica regras de inventario/condicoes do personagem | Automatizado | `src/store/AppStore.test.tsx` | PASS |
| FUN-PLAYER-003 | Audio player controla mute/volume/play | Automatizado | `src/components/game/AudioPlayer.test.tsx` | PASS |

## 3) Fluxos funcionais - Admin/CEO

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| FUN-ADMIN-001 | Bootstrap inicial do CEO com segredo TOTP | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| FUN-ADMIN-002 | Login com 2FA conclui autenticacao | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| FUN-ADMIN-003 | Login invalido retorna erro (usuario/senha) | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| FUN-ADMIN-004 | Somente CEO cria novos usuarios privilegiados | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| FUN-ADMIN-005 | CEO nao pode desativar propria conta | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| FUN-ADMIN-006 | Sistema bloqueia criacao se configuracao desabilitar | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |

## 4) API endpoints/wrappers

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| API-001 | Lista de campanhas trata indisponibilidade de backend | Automatizado | `src/lib/supabase.api.test.ts` | PASS |
| API-002 | Lista de NPCs trata erro remoto sem quebrar UX | Automatizado | `src/lib/supabase.api.test.ts` | PASS |
| API-003 | Upload/download de snapshot falha de forma controlada | Automatizado | `src/lib/supabase.api.test.ts` | PASS |
| API-004 | Sync remoto por slot envia e restaura snapshot | Automatizado | `src/components/backup/SnapshotControlPanel.test.tsx` | PASS |

## 5) Banco de dados e integridade de dados

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| DB-001 | Persistencia IndexedDB salva snapshot local | Automatizado | `src/lib/db.test.ts` | PASS |
| DB-002 | Leitura IndexedDB retorna snapshot salvo | Automatizado | `src/lib/db.test.ts` | PASS |
| DB-003 | Erro de abertura do DB nao derruba aplicacao | Automatizado | `src/lib/db.test.ts` | PASS |
| DB-004 | Normalizacao de snapshot aplica defaults e sanificacao | Automatizado | `src/lib/snapshot.test.ts` | PASS |

## 6) Integracoes

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| INT-001 | Navegacao com basename funciona em raiz e subpath | Automatizado | `src/router.basename.test.tsx` | PASS |
| INT-002 | Upload de imagem valida tipo e fluxo drag/drop | Automatizado | `src/components/ui/ImageUpload.test.tsx` | PASS |
| INT-003 | Pipeline de anexos valida limites e metadados | Automatizado | `src/lib/attachments.test.ts` | PASS |
| INT-004 | Catalogo e autogeracao respeitam consistencia de dados | Automatizado | `src/data/catalog.test.ts`, `src/config/auto-content.test.ts` | PASS |
| INT-005 | Simulacao completa de mesa com 1 mestre e 5 jogadores (sessao, combate, recompensas e resumo) | Automatizado | `src/qa/tabletop.simulation.test.tsx` | PASS |

## 7) Performance

| ID | Caso | SLA | Evidencia | Status |
|---|---|---|---|---|
| PERF-001 | `normalizeSnapshot` com carga grande | < 2000ms | `src/qa/performance.qa.test.ts` | PASS |
| PERF-002 | `buildSessionInsights` com 2500 sessoes | < 2000ms | `src/qa/performance.qa.test.ts` | PASS |
| PERF-003 | `buildAdminMetrics` com massa alta de logs/usuarios | < 2000ms | `src/qa/performance.qa.test.ts` | PASS |

## 8) Seguranca

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| SEC-001 | Hash/salt de senha e verificacao criptografica | Automatizado | `src/lib/adminSecurity.test.ts` | PASS |
| SEC-002 | Criptografia/decriptografia de segredo TOTP | Automatizado | `src/lib/adminSecurity.test.ts` | PASS |
| SEC-003 | Politica de acesso por role (ADMIN/CEO) | Automatizado | `src/admin/AdminAccessContext.test.tsx` | PASS |
| SEC-004 | Scanner de segredos hardcoded no codigo fonte | Automatizado | `src/security/integrity.test.ts` | PASS |
| SEC-005 | Auditoria de dependencias de producao | Automatizado | `npm audit --omit=dev --json` | PASS |

## 9) Usabilidade e compatibilidade

| ID | Caso | Tipo | Evidencia | Status |
|---|---|---|---|---|
| UX-001 | Hero, nav e cards com hierarquia visual clara | Automatizado + Manual | `src/components/ui/PageHero.test.tsx`, `docs/VISUAL_QA_CHECKLIST.md` | PASS |
| UX-002 | Confirmacoes visuais em acoes sensiveis | Manual | `docs/VISUAL_QA_CHECKLIST.md` | PASS |
| COMP-001 | Responsividade mobile/tablet/desktop | Automatizado + Manual | testes de navbar/mobile + smoke Playwright em viewport desktop/mobile | PASS |
| COMP-002 | Smoke cross-browser (Chromium, Firefox, WebKit) | Automatizado | `npm run qa:browser-smoke` | PASS |
