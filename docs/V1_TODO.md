# V1 TODO List — Estado Atual

> Atualizado: 2026-08-19 (Documentação + Playwright)
> Branch: `mobile-alpha`

---

## ✅ Concluído

### Fase 0 — Estado atual
- [x] Auditoria dos 3 repositórios
- [x] Preservação do trabalho V1 do Codex
- [x] TypeScript limpo, build OK, 114/114 testes verdes
- [x] LAN smoke test: protocolo validado
- [x] Playtest E2E (31 passos, 0 falhas)
- [x] Playwright chromium smoke (desktop + mobile)

### Fase 1 — Fundação
- [x] Multi-ruleset implementado (types, registry, ordemCompatible)
- [x] Domínio V1 completo (v1.ts)
- [x] Tema paranormal/dossier em index.css + tailwind.config
- [x] Rotas V1 no router (MasterStudio, StoryBoard, LivePlayerPage, SessionRunner)
- [x] LivePlayerPage mobile-first
- [x] DirectorBar funcional
- [x] LiveSessionHostPanel com QR/código/aprovação

### Fase 2 — Personagem
- [x] 3 personagens jogadores na demo (Lia, Caio, Tainá)
- [x] NPC e criatura na demo
- [x] Criação guiada, livre e importação

### Fase 3 — Mestre
- [x] Biblioteca (MasterStudio) com 16 tipos de entidade
- [x] Criação rápida/completa
- [x] Importação com revisão

### Fase 4 — Sessão LAN
- [x] Servidor LAN com WebSocket
- [x] Host create/resume
- [x] Player join com token de reconexão
- [x] Approve/decline com atribuição de personagem
- [x] Session state sync (broadcastProjection)
- [x] Stage present com audience filtering
- [x] Event system com deduplicação
- [x] QR code em /api/qr
- [x] Persistência em disco
- [x] Rate limiting e heartbeat
- [x] **Validação de Origin no WebSocket** (P5)
- [x] **Reconexão single-connection** (P4)
- [x] **Código de sessão de 8 chars** (P8)
- [x] **maxPayload 2MB** (1.16)
- [x] **Jitter no reconnect backoff** (3.5)

### Fase 5 — Palco
- [x] DirectorBar → Stage (scene, npc_reveal, map, combat, reward, message)
- [x] Private stage (só jogador específico)
- [x] Projeção sanitizada por papel

### Fase 6 — Recursos de jogo
- [x] Rolador de dados com ruleset
- [x] Suporte a áudio sincronizado
- [x] Mapa com tokens e névoa de guerra
- [x] CombatTracker

### Fase 7 — Encerramento
- [x] End session
- [x] Histórico de eventos
- [x] Feedback do jogador
- [x] Recording consent

### Fase 8 — QA e Estabilidade
- [x] Demo "O Caso de Santa Aurora" completa
- [x] 3 personagens jogadores
- [x] Mesa virtual 1 Mestre + 4 jogadores (Ciclo 2 e Ciclo 3)
- [x] Ciclo 3: 6 correções de segurança/estabilidade
- [x] Graceful degradation Admin crypto em HTTP LAN (P1)
- [x] 114/114 testes, typecheck 0 erros, build OK
- [x] 0 BLOCKER / 0 CRITICAL / 0 HIGH restantes

### Documentação
- [x] docs/V1_PLAYTEST.md — resultados do playtest
- [x] docs/PLAYTEST_GUIDE.md — guia para usuário não técnico
- [x] docs/V1_TODO.md (este arquivo)
- [x] docs/QA_MASTER_REPORT.md — 3 ciclos de QA
- [x] docs/QA_SECURITY_REALTIME_REPORT.md — auditoria de segurança
- [x] docs/VIRTUAL_TABLE_PLAYTEST.md — mesa virtual

---

## 🔄 Pendente (próximas execuções)

### Prioridade Alta — Playtest físico
- [ ] **Teste em celular real** — toque, QR, áudio, Wi-Fi real
- [ ] **Teste 3+ celulares simultâneos** — validar concorrência real
- [ ] **Teste em rede doméstica com roteador** — latência, perda de pacote

### Prioridade Média
- [x] docs/V1_ARCHITECTURE.md — diagrama de camadas
- [x] docs/RULESET_ARCHITECTURE.md — multi-ruleset
- [ ] Integrar AppStore com LiveSessionContext (sync bidirecional)
- [ ] Página de histórico do personagem (CharacterHistoryEvent)
- [ ] Upload de imagem de personagem funcional
- [ ] HTTPS LAN (mkcert) — desbloqueia Admin completo, PWA, cookies seguros
- [ ] Schema validation (Zod) para mensagens WS
- [ ] Rate limiting global por IP

### Prioridade Baixa / Futuro
- [ ] Suporte a Firefox e WebKit no Playwright smoke
- [ ] Testes de carga (load testing) em rede real
- [ ] Refatoração do AppStore (~1200 linhas)
- [ ] Global rate limiting
- [ ] Seq gap detection no cliente

---

## Métricas atuais

| Métrica | Valor |
|---------|-------|
| Testes passando | 114/114 (40 arquivos) |
| TypeScript | Strict, 0 erros |
| Build | ✅ PWA + dist (20.55s) |
| Mesa virtual | ✅ 1 Mestre + 4 jogadores |
| BLOCKER/CRITICAL/HIGH | 0 |
| Commits locais não pusheados | vários (v1-presencial) |
| Pronto para playtest físico | ✅ SIM |