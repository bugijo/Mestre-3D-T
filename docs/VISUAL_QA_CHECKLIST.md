# Checklist de QA Visual

Use este checklist para validar qualidade estetica, responsividade e acessibilidade apos mudancas de interface.

## Matriz de navegadores

- Chrome (desktop)
- Edge (desktop)
- Firefox (desktop)
- Chrome Android
- Safari iOS

## Matriz de viewport

- `360x800` (mobile pequeno)
- `768x1024` (tablet retrato)
- `1024x768` (tablet paisagem)
- `1366x768` (notebook)
- `1920x1080` (desktop amplo)

## Fluxos obrigatorios

1. Navegar pelo `NavBar` em desktop e mobile.
2. Abrir `Dashboard`, `Campanhas`, `Bestiario`, `Player` e `Admin`.
3. Verificar estados vazios e estados com dados nas listas.
4. Validar foco por teclado em botoes, links e campos.
5. Confirmar contraste de textos secundarios em cards e paineis.
6. Validar consistencia de espacamento e tipografia entre paginas.

## Criterios de aprovacao

- Sem quebra de layout horizontal.
- Sem sobreposicao de elementos em mobile.
- CTA primario e secundario claramente distinguiveis.
- Campos e labels legiveis com zoom de ate `200%`.
- Feedback visual de hover, focus e active presente nos controles interativos.

## Regressao tecnica minima

- `npx vitest run`
- `npm run build`
