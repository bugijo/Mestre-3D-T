# Suíte de Testes Abrangente — 19/12/2025

## Escopo
- Componentes visuais: AudioPlayer, CombatTracker, Dashboard, NavBar, ImageUpload, SessionRunner.
- Funcional: AppStore (Provider + reducer + ações), Attachments (validação/compressão) e Supabase (health check).

## Correções Aplicadas
- Ajuste de seleção de botão no CombatTracker.test para não depender de nome ambíguo.
- AudioPlayer: tratamento seguro de `play()` sem `catch` em ambiente JSDOM.
- Dashboard.test: uso de `MemoryRouter` para `useNavigate` funcionar.
- SessionRunner.test: queries robustas para campo de notas e botão com `aria-label`.
- Attachments: `getImageSize` com timeout e fallback para evitar flakiness.

## Cobertura
- Configurado `coverage` no Vitest com `text`, `lcov` e `html`. Workflow CI criado em `.github/workflows/test.yml`.

## Próximos Passos
- Expandir cenários de erro do AppStore (deleção em cascata, edge cases de combate).
- Integração opcional com reporter de cobertura no CI (Codecov).

