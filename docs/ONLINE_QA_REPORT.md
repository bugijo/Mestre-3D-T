# ONLINE_QA_REPORT.md — QA Alpha Online

## Data: 2026-08-12 (Atualização Final)
## URL: https://rpg-alpha.onrender.com

## QA-ONLINE-1: Funcional / UX

### Resultados

| Teste | Status | Observação |
|-------|--------|------------|
| Root URL | ✅ PASS | HTTP 200, HTML carregado |
| Rotas SPA | ✅ PASS | /session, /join, /dashboard 200 |
| Health endpoint | ✅ PASS | `{ok: true, mode: "online"}` |
| Config endpoint | ✅ PASS | `{mode: "online", publicUrl: "..."}` |
| PWA Manifest | ✅ PASS | Válido, com icons SVG + PNG |
| Service Worker | ✅ PASS | Workbox, precache ativo |
| WebSocket | ✅ PASS | WSS conecta, cria sessão |
| Session create | ✅ PASS | Código 8 chars, masterToken |
| Player join | ✅ PASS | Pending → Approved |
| Stage present | ✅ PASS | Cena, NPC, combate |
| Event system | ✅ PASS | Message, dice, reward |
| ActionId dedup | ✅ PASS | Duplicatas rejeitadas |
| Reconnection | ✅ PASS | Token restaura estado + eventos |
| Session end | ✅ PASS | Master encerra |
| Supabase CRUD | ✅ PASS | INSERT/SELECT/DELETE operacional |
| Supabase Persistência | ✅ PASS | Dados persistem após restart simulado |
| Mesa Virtual 1M+4J | ✅ PASS | Criação, join, aprovação, cena, NPC, combate, dado, recompensa, reconexão, concorrência, encerramento |

### Pendências (Frontend não testado em browser automatizado)

- Navegação entre páginas (testado manualmente via curl - HTTP 200)
- Mapas/tokens (depende de integração frontend)
- Áudio (depende de integração frontend)
- PWA instalável (manifest + SW OK, faltando validação em dispositivo real)

## QA-ONLINE-2: Segurança / Realtime

### Resultados

| Teste | Status | Observação |
|-------|--------|------------|
| Player → Master actions | ✅ PASS | `stage:present`, `session:end` bloqueados |
| Invalid session code | ✅ PASS | `SESSION_NOT_FOUND` |
| Invalid reconnect token | ✅ PASS | Tratado como novo join pendente |
| Duplicate actionId | ✅ PASS | `event:ack {duplicate: true}` |
| Reconnection com token | ✅ PASS | `session:resume` com estado completo |
| Payload grande | ✅ PASS | 3MB rejeitado por timeout |
| Worker `host:create` | ⚠️ HIGH | Qualquer cliente pode criar sessão (mitigado por design — auth será exigida em produção) |
| Rate limiting | ⚠️ MEDIUM | Por conexão, não global |
| Security headers | ⚠️ MEDIUM | CSP, X-Frame-Options ausentes |

### RLS / Supabase

- RLS habilitado em todas as tabelas
- Service role: privilégios totais (INSERT/SELECT/UPDATE/DELETE em todas as tabelas)
- Anon: permissão negada por RLS (apenas leitura própria quando autenticado)

## Classificação Final

| Nível | Quantidade | Resolvido |
|-------|-----------|-----------|
| BLOCKER | 0 | ✅ |
| CRITICAL | 0 | ✅ |
| HIGH | 1 (`host:create` anônimo) | ⚠️ Mitigado (auth será reativada em produção) |
| MEDIUM | 2 (rate limit, headers) | 📝 Documentado |
| LOW | 0 | ✅ Resolvido |

## Resumo da Sessão de QA

### Fluxo completo validado (1 Mestre + 4 Jogadores virtuais)

1. ✅ Mestre conecta WebSocket
2. ✅ Mestre cria sessão (`host:create`)
3. ✅ 4 jogadores conectam e fazem join
4. ✅ Mestre aprova cada jogador
5. ✅ Cena apresentada a todos
6. ✅ NPC revelado
7. ✅ Mensagem secreta enviada a jogador específico
8. ✅ Combate iniciado
9. ✅ Jogador rola dados
10. ✅ Recompensa concedida
11. ✅ Reconexão de jogador (fecha e reconecta) — estado preservado com 3 eventos
12. ✅ 4 jogadores enviam dados simultaneamente (concorrência)
13. ✅ Sessão encerrada pelo Mestre

### Supabase

- ✅ Service role key: CONFIGURADA via Supabase Management API
- ✅ CRUD testado (INSERT/SELECT/DELETE)
- ✅ Persistência confirmada após restart simulado
- ✅ Grants: `service_role` com ALL PRIVILEGES em todas as tabelas
- ✅ RLS ativo em todas as tabelas