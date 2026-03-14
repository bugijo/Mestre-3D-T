# Plano de QA - Plataforma Mestre 3D&T

Data de referencia: 2026-03-04

## Objetivo

Validar qualidade funcional, estabilidade, seguranca e desempenho da plataforma antes de release, com criterio objetivo de aprovacao e rastreabilidade de defeitos.

## Escopo

- Fluxos criticos do mestre (dashboard, sessao, combate, relatorios, backup).
- Fluxos criticos do jogador (console, recursos, inventario, condicoes).
- Fluxo administrativo privilegiado (bootstrap CEO, login 2FA, auditoria, gestao de usuarios).
- API wrappers (Supabase), persistencia local (IndexedDB), sincronizacao entre abas e import/export de snapshot.
- Build de producao e comportamento PWA.

## Tipos de teste

1. Funcional
- Valida regras de negocio e fluxos ponta a ponta nos modulos principais.

2. Regressao
- Reexecuta a bateria principal sempre apos alteracoes de codigo/dependencias.

3. Performance
- Mede operacoes criticas com SLA maximo de 2s.

4. Seguranca
- Valida autenticacao 2FA, autorizacao por role, criptografia local, integridade de codigo e cadeia de dependencias.

5. Usabilidade
- Checklist manual de navegacao, feedback visual e consistencia de UX.

6. Compatibilidade
- Validacoes de responsividade e smoke por rotas/componentes em viewport mobile/tablet/desktop.

## Ferramentas e comandos

- Regressao: `npm run test:regression`
- Cobertura: `npm run test:coverage`
- Performance: `npm run test:performance`
- Seguranca: `npm run test:security`
- Suite completa: `npm run test:qa`
- Build de release: `npm run build`
- Auditoria dependencias (producao): `npm audit --omit=dev --json`
- Compatibilidade cross-browser (smoke): `npm run qa:browser-smoke`

## Metricas e quality gates

- Cobertura minima (modulos criticos): 80% em lines/statements/functions.
- Branch coverage minima (modulos criticos): 65%.
- Performance: operacoes criticas < 2s.
- Densidade de defeitos criticos: maximo 5 por release.
- Auditoria de producao: 0 vulnerabilidades criticas.

## Criterio de saida (Go/No-Go)

Release aprovado quando:

- Suite `test:qa` passa sem falhas.
- Build de producao passa.
- Cobertura e SLA acima dos limites definidos.
- Defeitos criticos abertos = 0.
- Defeitos altos com mitigacao aprovada e registrada.
