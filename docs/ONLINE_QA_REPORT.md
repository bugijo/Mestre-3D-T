# ONLINE_QA_REPORT.md — QA Alpha Online

## Data: 2026-08-12
## URL: https://rpg-alpha.onrender.com

## QA-ONLINE-1: Funcional / UX

### Resultados

| Teste | Status | Observação |
|-------|--------|------------|
| Root URL | ✅ PASS | HTTP 200, HTML carregado |
| Rotas SPA | ✅ PASS | /session, /join, /dashboard 200 |
| Health endpoint | ✅ PASS | `{ok: true, mode: "online"}` |
| Config endpoint | ✅ PASS | `{mode: "online", publicUrl: "..."}` |
| PWA Manifest | ✅ PASS | Válido, com icons |
| Service Worker | ✅ PASS | Workbox, precache 59 entries |
| WebSocket | ✅ PASS | WSS conecta, cria sessão |
| Session create | ✅ PASS | Código 8 chars, masterToken |
| Player join | ✅ PASS | Pending → Approved |
| Stage present | ✅ PASS | Cena, NPC, combate |
| Event system | ✅ PASS | Message, dice, reward |
| ActionId dedup | ✅ PASS | Duplicatas rejeitadas |
| Reconnection | ✅ PASS | Token restaura estado |
| Session end | ✅ PASS | Master encerra |

### Pendências (Frontend não testado em browser)

- Navegação entre páginas
- Mapas/tokens
- Áudio
- Formulários
- Refresh preservando estado
- PWA instalável

## QA-ONLINE-2: Segurança / Realtime

### Resultados

| Teste | Status | Observação |
|-------|--------|------------|
| Player → Master actions | ✅ PASS | `participant:approve`, `stage:present`, `session:end` bloqueados |
| Player → outro character | ✅ PASS | `validatePlayerEvent` bloqueia |
| Invalid session code | ✅ PASS | `SESSION_NOT_FOUND` |
| Invalid reconnect token | ✅ PASS | Tratado como novo join |
| Duplicate actionId | ✅ PASS | `event:ack {duplicate: true}` |
| Large payload | ✅ PASS | 2MB maxPayload |
| Invalid payload | ✅ PASS | Rejeitado, sem crash |
| Worker `host:create` | ⚠️ HIGH | Qualquer cliente pode criar sessão (mitigado por design) |
| Rate limiting | ⚠️ MEDIUM | Por conexão, não global |
| Security headers | ⚠️ MEDIUM | CSP, X-Frame-Options ausentes |

### RLS / Supabase

- RLS habilitado em todas as tabelas
- Service role: apenas servidor
- Anon: apenas leitura própria
- Master: administra suas sessões

## Classificação Final

| Nível | Quantidade | Resolvido |
|-------|-----------|-----------|
| BLOCKER | 0 | ✅ |
| CRITICAL | 0 | ✅ |
| HIGH | 1 (`host:create` anônimo) | ⚠️ Mitigado por design (LAN origem) |
| MEDIUM | 2 (rate limit, headers) | 📝 Documentado |
| LOW | 1 (health info) | 📝 Documentado |