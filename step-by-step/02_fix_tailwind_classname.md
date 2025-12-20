# Correção Crítica: Erro de Classe Tailwind CSS

**Data:** 16/12/2025
**Arquivo Modificado:** `tailwind.config.js`, `src/index.css`, `src/App.tsx`, `src/components/Dashboard.tsx`

## Descrição do Problema
O build do Vite/PostCSS falhou com o erro:
`The 'bg-surfaceHighlight' class does not exist.`

Isso ocorreu porque a chave de cor `surfaceHighlight` foi definida em camelCase no `tailwind.config.js`. Embora o Tailwind suporte camelCase em algumas configurações, a geração de classes utilitárias e o uso com `@apply` funcionam de forma mais consistente e previsível com `kebab-case` (padrão CSS).

## Solução Aplicada
1.  **Renomeação no Config:**
    *   De: `surfaceHighlight: '#1F2229'`
    *   Para: `'surface-highlight': '#1F2229'`
    
2.  **Atualização de Referências:**
    *   Substituído `bg-surfaceHighlight` por `bg-surface-highlight` em todos os arquivos CSS e componentes React.

## Impacto
O sistema de design agora segue estritamente as convenções de nomenclatura do Tailwind, prevenindo erros futuros de build e garantindo que o IntelliSense e o `@apply` funcionem corretamente.
