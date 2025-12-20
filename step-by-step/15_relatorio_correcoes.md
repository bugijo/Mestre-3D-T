# Relatório de Correções — Envio para @Testes

## Erros Identificados
- Falha em `AudioPlayer.test`: seleção de elementos por role e crash em `play().catch`.
- Falha em `CombatTracker.test`: query ambígua por nome do botão derrotado.
- Falha em `Dashboard.test`: `useNavigate` fora de `<Router>`.
- Flakiness em `attachments.test`: `Image.onload/onerror` assíncrono sem fallback.
- Interação em `SessionRunner.test`: seleção de input e botão por `aria-label`.

## Soluções Implementadas
- AudioPlayer: refatorada chamada `play()` para uso defensivo do retorno Promise; ajustes nos testes para usar `within`.
- CombatTracker: testes agora usam busca por `aria-label`; asserts adicionados para chamadas às ações do store.
- Dashboard: teste embrulhado com `createMemoryRouter` + `RouterProvider`.
- Attachments: `getImageSize` com timeout/fallback não bloqueante; mantém sem compressão para GIF.
- SessionRunner: testes usam `within(container)` e import dinâmico após mocks.

## Novos Testes
- `src/store/AppStore.test.tsx`: cobre iniciar/encerrar sessão, notas, cena ativa, combate, turnos, ajuste de PV/PM e encerramento com nota.

## Integração CI
- Workflow `CI - Testes e Cobertura` adicionando passos de `npm ci`, execução de testes com cobertura e publicação de `lcov`.

## Regressões Prevenidas
- Assertivas explícitas de chamadas às ações do store em componentes de UI.
- Fallbacks em leitura/decodificação de imagens nos utilitários de anexos.

