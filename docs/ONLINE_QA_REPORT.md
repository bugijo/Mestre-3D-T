# ONLINE_QA_REPORT.md — QA Alpha Online (Final)

## Data: 2026-08-13 (Validação Final)
## URL: https://rpg-alpha.onrender.com

## Autenticação do Mestre (Supabase Auth)

### Resultados dos Testes A–E

| Teste | Status | Observação |
|-------|--------|------------|
| A) WebSocket anônimo → host:create | ✅ PASS | BLOQUEADO com `AUTH_REQUIRED` |
| B) Mestre autenticado → host:create | ✅ PASS | PERMITIDO, sessão criada com código |
| C) Player → host:create | ✅ PASS | BLOQUEADO com `AUTH_REQUIRED` (player não autenticado) |
| D) Token falso → auth:login | ✅ PASS | BLOQUEADO com `AUTH_FAILED` |
| E) Token de outro usuário → auth:login | ✅ PASS | Token JWT válido autentica o usuário correto |

### Fluxo de Autenticação

- `POST /api/auth/signup` — Cria conta de Mestre via Supabase Auth (admin API)
- `POST /api/auth/login` — Retorna access_token JWT
- `auth:login` (WebSocket) — Valida token e associa userId à conexão
- `host:create` (WebSocket) — Exige `ws.meta.userId` em modo ONLINE
- LAN mode: preservado sem exigir autenticação

## Persistência Após Restart Real

### Procedimento

1. ✅ Criar sessão ONLINE com 2 participantes, cena, eventos, estado
2. ✅ Confirmar dados no Supabase (live_sessions, session_participants, session_events)
3. ✅ Disparar redeploy no Render (novo build, novo processo)
4. ✅ Aguardar novo processo ficar LIVE (uptime ≈ 120s)
5. ✅ Conectar e recuperar a MESMA sessão com masterToken
6. ✅ Validar: código, participantes (2), eventos (2), projeção, estágio

### Resultado: ✅ PASS

- Sessão `EVC5XXBJ` recuperada após restart real
- 2 participantes preservados (Player1, Player2) com character IDs
- 2 eventos preservados (mensagem pública + privada)
- Projeção preservada (characters com HP)
- Estágio preservado (Cena Inicial)

## QA Security / Realtime (Final)

### Resultados (Online)

| Teste | Status | Observação |
|-------|--------|------------|
| host:create anônimo | ✅ PASS | `AUTH_REQUIRED` |
| Auth válida | ✅ PASS | Login + host:create funciona |
| Auth inválida | ✅ PASS | Token falso rejeitado |
| Player → Master actions | ✅ PASS | stage:present, session:end bloqueados |
| Personagem alheio | ✅ PASS | Dado para outro char bloqueado |
| Segredo (audience) | ✅ PASS | Evento privado só chega ao alvo |
| Duplicate actionId | ✅ PASS | `event:ack {duplicate: true}` |
| Reconexão | ✅ PASS | `session:resume` com estado completo |
| Origin validation | ✅ PASS | Origin não permitida → WS fechado |
| Payload grande | ✅ PASS | Mensagens inválidas rejeitadas |
| Concorrência | ✅ PASS | 4 dados simultâneos processados |

### Classificação Final (Online)

| Nível | Quantidade | Resolvido |
|-------|-----------|-----------|
| BLOCKER | 0 | ✅ |
| CRITICAL | 0 | ✅ |
| HIGH | 0 | ✅ |
| MEDIUM | 2 (rate limit, headers) | 📝 Documentado |
| LOW | 0 | ✅ |

## Mesa Virtual (1 Mestre + 4 Jogadores)

### Fluxo Completo na URL Pública ✅

1. ✅ Mestre autentica (Supabase Auth)
2. ✅ Mestre cria sessão (`host:create`)
3. ✅ 4 jogadores conectam e fazem join
4. ✅ Mestre aprova cada jogador
5. ✅ Cena apresentada a todos
6. ✅ NPC revelado
7. ✅ Mensagem secreta enviada a jogador específico
8. ✅ Combate iniciado
9. ✅ Jogador rola dados
10. ✅ Recompensa concedida
11. ✅ Reconexão de jogador (fecha e reconecta) — estado preservado
12. ✅ 4 jogadores enviam dados simultaneamente (concorrência)
13. ✅ Sessão encerrada pelo Mestre

## Bugs Corrigidos

1. **campaign_id NULL** — `sessionToDb()` e endpoint `/api/persist` enviavam `null` para coluna NOT NULL do Supabase. Corrigido para enviar `''`.
2. **Testes sem auth** — `online-virtual-table.mjs` e `test-security.mjs` não autenticavam antes de `host:create`. Atualizados para usar fluxo de auth.

## Conclusão

**Alpha Online pronta para uso: ✅ SIM**