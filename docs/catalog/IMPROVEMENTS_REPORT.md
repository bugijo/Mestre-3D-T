# Relatório de Melhorias e Recomendações

## Revisão de Código
- `src/lib/imageGen.ts`: adicionado cache leve para evitar recomputações com os mesmos parâmetros (seed, tema, dimensões). Impacto: redução de custo de geração e repetição em cenários de UI/teste.
- `src/data/gameCatalog.ts`: missões e segredos detalhados para IA generativa; mantém ligação com mapas, NPCs, itens e vilões.

## Oportunidades de Otimização
- Memoização em seleção/filtragem do catálogo na página `Catalog` ao trocar sistema/ordenação.
- Debounce na busca por nome/tag para evitar renders extras.
- Virtualização de listas no catálogo (200+ cards) para melhor desempenho.
- Carregamento preguiçoso (lazy) de imagens e placeholders diferenciados.

## Padrões Modernos
- Padronizar hooks e stores com separação clara de domínio (`src/domain`) e dados (`src/data`).
- Adotar `useMemo`/`useCallback` de forma criteriosa em grids extensos.
- Estabelecer utilitário único para prompts visuais e geração de descrições.

## Organização
- Criar pasta `docs/catalog` para exportações (`JSON/CSV`) e guias.
- Automatizar export com `npm run catalog:build`.

## Próximos Passos
- Adicionar botão “Exportar Catálogo” na página `Catalog` disparando download dos arquivos JSON/CSV.
- Integrar pipeline de geração de imagens consumindo `visualPrompt` por entrada.
- Adicionar testes de performance básica na renderização de 100–300 cards.

