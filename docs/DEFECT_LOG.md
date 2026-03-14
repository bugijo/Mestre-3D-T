# Registro de Defeitos (QA)

Janela de QA: 2026-03-04

## Escala de severidade

- Critica: quebra total, perda de dados, violacao de seguranca grave.
- Alta: funcionalidade essencial comprometida ou risco de seguranca relevante.
- Media: degradacao importante com workaround.
- Baixa: impacto cosmetico ou de baixa frequencia.

## Defeitos identificados

| ID | Categoria | Severidade | Descricao | Status | Resolucao |
|---|---|---|---|---|---|
| QA-SEC-001 | Supply chain | Alta | `npm audit` bloqueado por registry em `http://registry.npmjs.org/` | Resolvido | Criado `.npmrc` com `registry=https://registry.npmjs.org/` e `strict-ssl=true` |
| QA-SEC-002 | Dependencias | Alta | Vulnerabilidade GHSA-2w69-qvjg-hvjx em `react-router-dom` | Resolvido | Upgrade para `react-router-dom@^6.30.3` |
| QA-TEST-001 | Estabilidade de testes | Media | Flake por timeout em suite `AdminAccessContext` | Resolvido | Timeout da suite ajustado para 20s |
| QA-DATA-001 | Integridade de dado | Media | Sanitizacao de slot podia gerar valor invalido (`-`) | Resolvido | Ajuste em `sanitizeSyncSlot` com fallback seguro |
| QA-UX-001 | Observabilidade de testes | Baixa | Warnings de future flags do React Router nos testes | Aberto | Planejar migracao de flags v7 para reduzir ruido |
| QA-PERF-001 | Performance frontend | Baixa | Asset `login-bg.png` com ~1MB no bundle | Resolvido | Migracao para `login-bg.webp` (~54KB no build) |
| QA-COMP-001 | Compatibilidade | Baixa | Script de smoke cross-browser travava no encerramento no Windows | Resolvido | Ajuste de shutdown via `taskkill` e parametros de execucao por navegador |

## Densidade de defeitos por release

- Defeitos criticos encontrados: 0
- Limite definido: maximo 5 criticos/release
- Resultado: Aprovado
