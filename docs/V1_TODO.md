# V1 TODO List — Estado Atual

> Baseado no playtest E2E completo (2026-08-09)
> Branch: `v1-presencial`

---

## ✅ Concluído

### Fase 0 — Estado atual
- [x] Auditoria dos 3 repositórios
- [x] Preservação do trabalho V1 do Codex
- [x] TypeScript limpo, build OK, 104/104 testes verdes
- [x] LAN smoke test: protocolo validado
- [x] Playtest E2E (31 passos, 28 verificações, 0 falhas)
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

### Fase 8 — Playtest
- [x] Demo "O Caso de Santa Aurora" completa
- [x] 3 personagens jogadores
- [x] 2 cenas (investigação + combate)
- [x] NPC + criatura
- [x] Recompensas

### Documentação
- [x] docs/V1_PLAYTEST.md — resultados do playtest
- [x] docs/PLAYTEST_GUIDE.md — guia para usuário não técnico
- [x] docs/V1_TODO.md (este arquivo)
- [x] docs/V1_AUDIT.md — mantido da auditoria inicial

---

## 🔄 Pendente (próximas execuções)

### Prioridade Alta

- [ ] **Teste em celular real** — toque, QR, áudio, Wi-Fi real
- [ ] **Teste 3+ celulares simultâneos** — validar concorrência real
- [ ] **Teste em rede doméstica com roteador** — latência, perda de pacote

### Prioridade Média

- [ ] docs/V1_ARCHITECTURE.md — diagrama de camadas
- [ ] docs/RULESET_ARCHITECTURE.md — multi-ruleset
- [ ] Integrar AppStore com LiveSessionContext (sync bidirecional)
- [ ] Página de histórico do personagem (CharacterHistoryEvent)
- [ ] Upload de imagem de personagem funcional

### Prioridade Baixa / Futuro

- [ ] Suporte a Firefox e WebKit no Playwright smoke
- [ ] Testes de carga (load testing)
- [ ] Refatoração do AppStore (~1200 linhas)

---

## Métricas atuais

| Métrica | Valor |
|---------|-------|
| Testes passando | 104/104 (39 arquivos) |
| Playwright smoke | Chromium (desktop + mobile) |
| LAN smoke | ✅ Todos os cenários |
| Playtest E2E (31 passos) | ✅ 28 verificações, 0 falhas |
| TypeScript | Strict, 0 erros |
| Build | PWA + dist |
| Personagens demo | 3 jogadores + 1 NPC + 1 criatura |
| Cenas demo | 2 (investigação + combate) |
| Commits não pusheados | 1 (v1-presencial) |