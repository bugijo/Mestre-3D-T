# Navegação Interativa e Correções de Console

## Alterações
- Refatorado roteamento para `RouterProvider` com flags `future` para remover avisos.
- Criado `NavBar` com `NavLink`, estados ativos e acessibilidade.
- Dashboard agora navega para Sessão, Campanhas e Novo Cadastro.
- Filtros funcionais nas campanhas (All/Active/Archived).
- Feedback visual em cliques (`active:scale-95`, estados ativos).

## Arquivos
- `src/router.tsx`: rotas centrais.
- `src/main.tsx`: troca para `RouterProvider` com `future` flags.
- `src/App.tsx`: layout com `NavBar` + `Outlet`.
- `src/components/ui/NavBar.tsx`: barra de navegação completa.
- `src/components/Dashboard.tsx`: interações e filtros.

## Testes de Usabilidade
- Navegar por todos os itens da `NavBar`.
- Clicar em "Prepare Now" e validar abertura da Sessão.
- Alterar filtros e observar mudança nos cards.
- Abrir Bestiário e testar busca/filtros.

## Observações
- Build de produção sem erros.
- Dev server mostra nenhum erro no console.
