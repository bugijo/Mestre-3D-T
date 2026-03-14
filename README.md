# Mestre 3D&T (Web/PWA)

Aplicacao Web/PWA para mesas de 3D&T com foco em operacao de sessao, organizacao de campanha e uso offline-first.

## Estado atual

- Dashboard do mestre com campanhas, backup local/remoto, acesso a relatorios e historico de sessoes.
- Painel administrativo exclusivo com bootstrap do CEO, login com 2FA, auditoria e metricas operacionais.
- Painel de diagnostico com logs locais, estado de cache e sinais operacionais do app.
- Workspace de campanha com CRUD de arcos e cenas.
- Runner de sessao com combate, iniciativa, feed da mesa, audio, confirmacao visual para acoes criticas e ferramentas de improviso.
- Console do jogador com ficha, inventario, condicoes e comunicacao da mesa.
- Relatorios de sessao com filtros, insights e exportacao rapida para clipboard.
- Persistencia local via IndexedDB e sync manual opcional por slot no Supabase.
- Logging local persistido para erros e eventos operacionais relevantes.
- PWA com cache offline e instalacao no navegador.
- Sistema visual reformulado com design system coeso, heros reutilizaveis, metricas padronizadas e shell responsivo.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- IndexedDB
- Supabase opcional

## Rodando localmente

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

Preview aberto para a rede local:

```bash
npm run preview:public
```

Publicacao rapida para testes externos:

```bash
npm run publish:test
```

Supervisor para reabrir o tunel se cair:

```bash
npm run publish:watch
```

Consultar a ultima URL publica capturada:

```bash
npm run publish:url
```

Se quiser servir em subpasta depois, defina antes do build:

```bash
VITE_APP_BASE_PATH=/sua-subpasta/
npm run build
```

Testes:

```bash
npm test -- --run
```

Se ja existir um preview publico rodando na porta `4173`, rode o smoke em outra porta:

```bash
$env:QA_PORT='4174'
npm run qa:browser-smoke
```

## Sync remoto opcional

1. Crie um projeto no Supabase.
2. Rode o SQL de `QUICK_SETUP.sql` no editor SQL do Supabase.
3. Defina as variaveis:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_TABLE=mestre_snapshots
```

4. No dashboard, use o painel "Backup da Mesa" para validar a conexao e enviar/baixar snapshots por slot.

Para o cofre administrativo remoto opcional:

```bash
VITE_SUPABASE_ADMIN_TABLE=mestre_admin_vaults
VITE_SUPABASE_ADMIN_SLOT=default-admin
```

## Observabilidade local

- O dashboard expoe um painel "Diagnostico do App" com erros recentes, estado dos caches internos e eventos operacionais.
- Os logs ficam persistidos localmente para facilitar suporte e depuracao da mesa sem depender de backend externo.
- A geracao automatica de conteudo e o catalogo usam cache em memoria para evitar recomputacao desnecessaria.
- O fluxo de anexos usa telemetria central, validacao consistente e suporte real a arrastar e soltar imagens.

## Painel administrativo

- A rota `/admin` exige autenticacao em duas etapas para perfis privilegiados.
- O primeiro acesso faz bootstrap do CEO inicial e gera um segredo TOTP para provisionamento em autenticador compativel.
- Senhas usam hash PBKDF2 SHA-256 e o segredo TOTP fica cifrado com AES-GCM derivado da senha do proprio usuario.
- A auditoria administrativa registra login, 2FA, acessos ao portal, criacao de contas privilegiadas e alteracoes de configuracao.
- A implementacao atual e local-first com persistencia remota opcional do cofre via Supabase; a identidade privilegiada ainda nao esta integrada ao Supabase Auth.

## Teste externo

- `npm run preview:public` deixa a plataforma acessivel na LAN.
- `npm run publish:test` abre um tunel publico via `localhost.run`, usando `ssh`, e grava a URL em `.tools/public-url.txt`.
- `npm run publish:watch` mantem um supervisor simples para reabrir o tunel caso o processo finalize.
- `npm run publish:url` mostra a ultima URL publica registrada pelo supervisor.
- Se o tunel falhar, normalmente faltou internet na maquina ou a conexao SSH de tunel foi encerrada.
- Para dominio proprio depois, basta apontar para um host/VM e ajustar `VITE_APP_BASE_PATH` se a aplicacao ficar em subpasta.
- O plano de deploy com Docker + Nginx ficou em `docs/DEPLOY_PRODUCTION.md`.

## Estrutura

- `src/`: aplicacao React
- `docs/`: guias operacionais e status
- `reference/`: material legado para consulta

## Design system

- A fundacao visual atual esta documentada em `docs/VISUAL_DESIGN_SYSTEM.md`.
- Os componentes-base de apresentacao ficam em `src/components/ui`, com destaque para `PageHero` e `MetricTile`.
- Novas telas devem preferir as classes compartilhadas `app-panel`, `app-panel-muted`, `field` e `btn-*` antes de introduzir estilos ad hoc.

## Limites atuais

- O sync remoto e manual; nao ha colaboracao distribuida em tempo real entre dispositivos.
- O Supabase opera sem autenticacao de usuario no fluxo atual, entao os slots remotos devem ser tratados como compartilhados.
- O deploy final ainda depende da escolha de ambiente e pipeline.
