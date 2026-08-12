# Arquitetura Online — RPG Alpha

## Visão Geral

A Alpha Online transforma a V1 Presencial (LAN) em uma aplicação acessível pela internet, mantendo compatibilidade total com o modo LAN original.

## Modos de Operação

### LAN (in_person)
- Servidor local na rede do Mestre
- `ws://` + IP local
- Persistência via arquivo `.data/lan-sessions.json`
- Validação de origem: localhost, LAN IPs, *.local

### ONLINE
- Servidor público em nuvem (Render)
- `wss://` + HTTPS
- Persistência via Supabase PostgreSQL
- Validação de origem: configurável via `ALLOWED_ORIGINS`

## Stack

| Componente | Tecnologia |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind |
| Realtime | WebSocket (ws library) |
| Persistência | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Deploy | Render (Web Service) |
| PWA | Vite PWA Plugin + Workbox |

## Arquivos-Chave

| Arquivo | Função |
|---------|--------|
| `server/lan-server.mjs` | Servidor dual-mode (LAN + ONLINE) |
| `server/persistence.mjs` | Abstração de persistência (arquivo/Supabase) |
| `server/origin-validator.mjs` | Validação de origem por modo |
| `server/app-config.mjs` | Configuração centralizada via env vars |
| `src/realtime/LiveSessionContext.tsx` | Cliente WebSocket com suporte dual-mode |
| `src/lib/supabase.ts` | Cliente Supabase (frontend) |

## Supabase — Schema

Ver `docs/SUPABASE_SCHEMA.md` ou migrations em:
- `00001_create_profiles`
- `00002_create_live_sessions`
- `00003_create_session_participants`
- `00004_create_session_events`
- `00005_create_session_rewards`
- `00006_create_session_feedback`
- `00007_rls_policies_refined`
- `00008_fix_advisors`

## Fluxo de Sessão Online

1. Mestre autentica (Supabase Auth)
2. Mestre inicia sessão → servidor cria registro em `live_sessions`
3. Servidor gera código de 8 chars + master token
4. Jogador acessa URL pública com código
5. Servidor cria `session_participant` (pending)
6. Mestre aprova → servidor atualiza status
7. Eventos em tempo real via WebSocket
8. Estado persistido no Supabase via service role
9. Reconexão via reconnect token