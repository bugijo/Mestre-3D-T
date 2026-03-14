# Status do projeto

## Implementado

- Plataforma Web/PWA com roteamento e shell principal.
- Painel administrativo restrito com CEO bootstrap, login 2FA, trilha de auditoria e configuracoes privilegiadas.
- Persistencia offline via IndexedDB e migracao de snapshot legado.
- Dashboard do mestre com cards de campanha, agenda da proxima sessao, backup, relatorios e historico de sessoes.
- Design system visual consolidado com tokens, primitives reutilizaveis e shell responsivo.
- Painel de diagnostico local com logs persistidos, resumo de erros e estado dos caches internos.
- CRUD de campanhas, arcos, cenas e personagens.
- Session Runner com combate, iniciativa, feed de eventos, mapa, audio, painel de improviso e confirmacao visual para encerramento.
- Visao do jogador com ficha, recursos, inventario, condicoes e quadro compartilhado.
- Sincronizacao local entre abas via `BroadcastChannel`.
- Sync remoto manual de snapshots por slot no Supabase.
- Cache assincrono para geracao automatica de conteudo e catalogo.
- Pipeline de anexos com logger central, cache leve e drag and drop no upload.
- Area de relatorios com filtros, indicadores de mesa e exportacao de resumos de sessao.
- Testes unitarios e de integracao para store, rotas e fluxos principais.
- Suite QA consolidada (regressao, cobertura, performance e seguranca), com relatorio e log de defeitos em `docs/`.
- Simulacao automatizada de jogo com 1 mestre e 5 jogadores validando ciclo completo de sessao, combate e recompensas.
- Smoke cross-browser automatizado (Chromium, Firefox e WebKit) com validacao de rotas criticas em desktop e mobile.

## Em aberto

- Colaboracao distribuida em tempo real entre dispositivos.
- Pipeline de deploy e observabilidade remota de producao.
- Multiplayer remoto em tempo real ainda depende de backend e autenticacao dedicados.
- O cofre administrativo ainda e local ao navegador; nao existe federacao ou IAM remoto.

## Marco atual

O backlog descrito em `ideia.md` e `tarefas.md` esta funcionalmente coberto na versao Web/PWA, com excecao do multiplayer remoto em tempo real e da preparacao final de infraestrutura para producao.
