# Status do projeto

## Implementado

- Plataforma Web/PWA com roteamento e shell principal.
- Painel administrativo restrito com CEO bootstrap, login 2FA, trilha de auditoria e configurações privilegiadas.
- Persistência offline via IndexedDB e migração de snapshot legado.
- Dashboard do mestre com cards de campanha, agenda da próxima sessão, backup, relatórios e histórico de sessões.
- Design system visual consolidado com tokens, primitives reutilizáveis e shell responsivo.
- Painel de diagnóstico local com logs persistidos, resumo de erros e estado dos caches internos.
- CRUD de campanhas, arcos, cenas e personagens.
- Session Runner com combate, iniciativa, feed de eventos, mapa, áudio, painel de improviso e confirmação visual para encerramento.
- Visão do jogador com ficha, recursos, inventário, condições e quadro compartilhado.
- Sincronização local entre abas via `BroadcastChannel`.
- Sync remoto manual de snapshots por slot no Supabase.
- Cache assíncrono para geração automática de conteúdo e catálogo.
- Pipeline de anexos com logger central, cache leve e drag and drop no upload.
- Área de relatórios com filtros, indicadores de mesa e exportação de resumos de sessão.
- Testes unitários e de integração para store, rotas e fluxos principais.
- Suite QA consolidada (regressão, cobertura, performance e segurança), com relatório e log de defeitos em `docs/`.
- Simulação automatizada de jogo com 1 mestre e 5 jogadores validando ciclo completo de sessão, combate e recompensas.
- Smoke cross-browser automatizado (Chromium, Firefox e WebKit) com validação de rotas críticas em desktop e mobile.

## Alpha Online — NOVO (2026-08-12)

- **URL:** https://rpg-alpha.onrender.com
- **Deploy:** LIVE ✅
- **Supabase persistência:** ✅ CRUD + restart
- **WebSocket realtime:** ✅ Sessão multi-jogador, reconexão, concorrência
- **Segurança:** ✅ Autorização, dedup, validação
- **Mesa virtual (1M+4J):** ✅ Fluxo completo validado
- **PWA:** ✅ Manifest + Service Worker + ícones
- **QA:** BLOCKER=0, CRITICAL=0, HIGH=1 (mitigado), MEDIUM=2 (documentado)

### Serviço Render

- **Nome:** rpg-alpha
- **Tipo:** Web Service (Node.js)
- **Plano:** Free (512 MB RAM, suspensão por inatividade)
- **Branch:** alpha-online
- **Repositório:** https://github.com/bugijo/Mestre-3D-T
- **Variáveis de ambiente:** SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WS_URL, etc.

## Em aberto

- Colaboração distribuída em tempo real entre dispositivos (funcional via WebSocket, testada com 4 jogadores simultâneos).
- Pipeline de deploy e observabilidade remota de produção.
- Multiplayer remoto em tempo real: backend e autenticação funcionais, pendente frontend dedicado para sessão remota.
- O cofre administrativo ainda é local ao navegador; não existe federação ou IAM remoto.
- Auth Supabase para Mestre (atualmente em modo degradado — será reativada em produção).