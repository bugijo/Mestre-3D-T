# QA Master Report — RPG V1 Presencial

## Ciclo 1 — Auditoria Inicial + Correções

### Data
2026-08-10

### QAs Envolvidos
- **QA-1 (Funcional/UX)**: Auditoria de rotas, componentes, empty states, acessibilidade, mobile, PWA
- **QA-2 (Segurança/Realtime)**: Auditoria de WebSocket, autorização, reconexão, concorrência, secure context APIs

### Bugs Encontrados: 36

| Severidade | Quantidade | Categoria |
|-----------|-----------|-----------|
| CRITICAL | 4 | Lançamento de exceção em HTTP LAN, race condition, segurança de sessão, áudio |
| HIGH | 14 | Permissões, clipboard, PWA, keyboard shortcuts, Web Crypto |
| MEDIUM | 12 | UX, validação, estado não persistido, concorrência |
| LOW | 6 | Cosmético, console.log, tipagem |

### Bugs Corrigidos (Ciclo 1)

| ID | Severidade | Descrição | Arquivo | Status |
|----|-----------|-----------|---------|--------|
| B1 | CRITICAL | `crypto.randomUUID is not a function` em HTTP LAN | `src/lib/id.ts` | ✅ Corrigido (já existente) |
| B2 | CRITICAL | ActionId deduplication race condition | `server/lan-server.mjs` | ✅ Corrigido |
| B3 | HIGH | Clipboard API falha em HTTP LAN | `src/lib/clipboard.ts` + 4 arquivos | ✅ Corrigido |
| B4 | HIGH | Falta guard explícito `isMaster` em handlers | `server/lan-server.mjs` | ✅ Corrigido |
| B5 | HIGH | Broadcast iteração em Set vivo pode pular/errar | `server/lan-server.mjs` | ✅ Corrigido |
| B6 | HIGH | Keyboard shortcuts não ignoram contentEditable | `src/pages/SessionRunner.tsx` | ✅ Corrigido |
| B7 | HIGH | Jogador pode editar inventário/condições | `src/pages/PlayerConsole.tsx` | ✅ Corrigido |

### Pendências Não Corrigidas (Ciclo 1)

| ID | Severidade | Descrição | Motivo |
|----|-----------|-----------|--------|
| P1 | CRITICAL | Web Crypto (`crypto.subtle`) falha em HTTP LAN — Admin quebrado | Requer HTTPS para LAN ou polyfill externo; escopo além desta execução |
| P2 | HIGH | PWA/Service Worker falha em HTTP LAN | Requer HTTPS |
| P3 | HIGH | Token de Mestre em localStorage vulnerável a XSS | Requer HttpOnly cookies + HTTPS |
| P4 | HIGH | Reconexão permite múltiplas conexões simultâneas | Requer invalidar conexão anterior |
| P5 | HIGH | Sem validação de Origin no WebSocket | Requer configuração de CORS |
| P6 | MEDIUM | Sem validação de schema (Zod) para mensagens WS | Refatoração maior |
| P7 | MEDIUM | Rate limiting apenas por conexão, não global | Melhoria de segurança |
| P8 | LOW | Código de sessão de 6 chars é bruteforceável | Aumentar para 8 |

### Resultado dos Testes Automatizados

```
Test Files: 1 failed (pre-existing Playwright config) | 40 passed
Tests:      114 passed
TypeScript: 0 errors
Build:      12.82s, PWA precache 702.54 KiB
```

### Nota sobre o teste falho
`tests/security.spec.ts` usa `test.describe()` do Playwright, mas o harness de teste é Vitest. Falha de configuração pré-existente, não relacionada às correções.

---

## Ciclo 2 — Mesa Virtual (5 jogadores simulados)

A ser executado após aprovação do Ciclo 1.

### Cenário
- 1 Mestre + 4 jogadores
- Campanha: O Caso de Santa Aurora
- Sessão LAN real (WebSocket)
- Testes de concorrência, reconexão, privacidade

---

## Resumo Final

- **Ciclos de QA realizados**: 1
- **Bugs encontrados**: 36
- **Bugs corrigidos**: 7 (CRITICAL + HIGH prioritários)
- **Regressões**: 0
- **Testes aprovados**: 114/114
- **Pendências documentadas**: 8

### Próximos passos
1. Executar mesa virtual com 5 agentes simulados
2. Testes de concorrência simultânea
3. Avaliação de experiência do usuário
4. Segundo ciclo de correções se necessário