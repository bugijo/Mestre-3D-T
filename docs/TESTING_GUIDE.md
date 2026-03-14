# Guia rapido de testes e build

Este guia cobre o fluxo atual da versao Web/PWA.

## Requisitos

- Node.js 20 ou superior
- npm
- Navegador moderno com suporte a Service Worker

## 1) Instalar dependencias

```bash
npm install
```

## 2) Rodar em desenvolvimento

```bash
npm run dev
```

Valide principalmente:

- Dashboard do mestre
- Painel admin com bootstrap, login 2FA e auditoria
- Navegacao responsiva, hero sections e metricas visuais do novo design system
- Relatorios de sessao e exportacao
- CRUD de campanhas, arcos e cenas
- Session Runner e combate
- Console do jogador
- Backup local e import/export de snapshot

## 3) Testes automatizados

```bash
npm test -- --run
```

Os testes cobrem store, roteamento e componentes principais do fluxo Web.

Para validacao completa de QA:

```bash
npm run test:qa
```

Isso executa regressao, cobertura, performance e seguranca.

A simulacao automatizada de mesa (1 mestre + 5 jogadores) esta incluida na regressao:

- `src/qa/tabletop.simulation.test.tsx`

## 3.3) Carga multi-mesa (10 mestres x 10 mesas x 5 jogadores)

```bash
npm run test:load
```

Executa a simulacao paralela de 10 mesas com 50 jogadores no total e imprime metricas de latencia por etapa.

## 3.4) Cenarios degradados (CPU/rede limitadas)

```bash
npm run build
npm run test:degraded
```

Executa um fluxo ponta a ponta em ambiente degradado para desktop e mobile, incluindo:

- carregamento inicial
- inicio/encerramento de sessao
- notas
- combate e troca de turno

## 3.1) Auditoria de dependencias de producao

```bash
npm audit --omit=dev --json
```

Resultado esperado para release: 0 vulnerabilidades criticas em producao.

## 3.2) Smoke cross-browser

```bash
npm run build
npx playwright install chromium firefox webkit
npm run qa:browser-smoke
```

Executa navegacao de rotas criticas em Chromium, Firefox e WebKit nos viewports desktop e mobile.

## 4) Build de producao

```bash
npm run build
```

O resultado sera gerado em `dist/`.

## 5) Configurar e testar backup remoto no Supabase

1. Crie um projeto gratuito no Supabase.
2. Execute `QUICK_SETUP.sql` no SQL Editor.
3. Defina `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_SUPABASE_TABLE`.
4. Rode `npm run dev`.
5. Abra o dashboard e use:
   - `Validar cloud`
   - `Enviar para nuvem`
   - `Baixar da nuvem`

Observacao: no fluxo atual nao existe login Supabase. O backup remoto e baseado em slot compartilhado.

## 6) Checklist rapido manual

- Abrir uma campanha existente e editar arco/cena sem usar prompts.
- Iniciar sessao, trocar cena ativa e abrir combate.
- Encerrar sessao pela confirmacao visual e validar o historico persistido.
- Abrir a pagina de relatorios, filtrar sessoes e copiar um resumo.
- Abrir `/admin`, criar o CEO inicial, validar senha + TOTP e revisar auditoria.
- Validar dashboard, admin e navbar em mobile, tablet e desktop com navegacao por teclado.
- Abrir a visao do jogador e alterar PV, PM, inventario e condicoes.
- Abrir duas abas do app e confirmar sincronizacao local em tempo real.
- Exportar um snapshot, importar de volta e validar restauracao.
- Testar upload/download por slot no painel de backup.
- Testar upload de imagem por clique e por arrastar/soltar.
- Rodar o roteiro de QA visual em `docs/VISUAL_QA_CHECKLIST.md`.

## 7) Troubleshooting

- Se o build falhar por variaveis ausentes do Supabase, remova as variaveis ou use o painel apenas no modo local.
- Se o PWA nao atualizar, limpe o cache do Service Worker no navegador.
- Se houver conflito de dados entre abas, recarregue a aba atrasada para reidratar o snapshot persistido.

## 8) Documentacao de QA

- Plano: `docs/QA_TEST_PLAN.md`
- Casos de teste: `docs/QA_TEST_CASES.md`
- Registro de defeitos: `docs/DEFECT_LOG.md`
- Relatorio consolidado (rodada atual): `docs/QA_REPORT_2026-03-06.md`
- Relatorio anterior: `docs/QA_REPORT_2026-03-04.md`
