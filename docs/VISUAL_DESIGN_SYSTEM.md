# Sistema Visual

## Diagnostico

O projeto tinha uma base funcional, mas com sinais claros de inconsistência visual:

- mistura de estilos antigos em CSS global legado com componentes mais novos em Tailwind;
- hierarquia visual irregular entre dashboard, admin e fluxos de sessao;
- paleta com excesso de roxo como cor dominante, reduzindo contraste semantico entre estados;
- campos, botoes e superficies sem um contrato visual centralizado;
- responsividade dependente de ajustes locais em vez de primitives reutilizaveis.

## Direcao de design

O tema foi reposicionado para uma linguagem de "central tática arcana":

- fundo profundo em azul-petróleo para reduzir fadiga visual;
- acento quente em âmbar para foco e chamadas primarias;
- acento frio em ciano para navegacao, destaque e elementos de status;
- superficies com vidro fosco, profundidade suave e gradientes discretos;
- tipografia com `Sora` para display e `Space Grotesk` para leitura corrida.

## Fundacao implementada

Arquivos principais:

- `tailwind.config.js`
- `src/index.css`
- `src/components/ui/PageHero.tsx`
- `src/components/ui/MetricTile.tsx`

Camadas consolidadas:

- tokens de cor, sombra e radius;
- classes reutilizaveis para shell, paineis, campos e botoes;
- `PageHero` para cabecalhos de pagina com contexto e CTA;
- `MetricTile` para metricas e cards de valor rapido.

## Telas reformuladas

- `Dashboard`: nova hierarquia, countdown integrado, metricas operacionais, acoes rapidas e grid de campanhas mais legivel.
- `AdminPortal`: layout executivo com hero, metricas, seguranca, governanca e auditoria em blocos consistentes.
- `NavBar`: navegacao com identidade mais forte, melhor leitura em desktop e menu mobile mais coeso.
- `CampaignList`, `CampaignForm`, `CharacterList` e `PlayerConsole`: migradas para o mesmo design system com melhor consistencia entre visoes de mestre e jogador.
- `App` e `AppShellFallback`: shell com profundidade, grades de fundo, spots de luz e carregamento mais refinado.

## Acessibilidade

Melhorias aplicadas:

- estados de foco visiveis e consistentes;
- contraste reforcado entre texto, superficie e acoes;
- campos com tamanhos mais confortaveis para leitura e toque;
- CTA principais com hierarquia visual mais clara;
- manutencao de labels e `aria-label` existentes nos fluxos criticos.

## Responsividade

Padroes adotados:

- heros com quebra de grade para `xl`;
- cards e metricas em grids fluidos com colunas progressivas;
- navegacao compacta com expansao mobile;
- espacamento maior em telas grandes sem prejudicar densidade em tablets.

## Microinteracoes

- hover com elevacao curta e controlada;
- glow discreto em elementos de acao e destaque;
- spots de fundo com animacao lenta para evitar interface estatica;
- fallbacks e paineis com transicoes suaves, sem excesso de motion.

## Regras de manutencao

- use `PageHero` para cabecalhos de paginas principais;
- use `MetricTile` para KPIs e cards de resumo;
- priorize classes do design system (`app-panel`, `app-panel-muted`, `field`, `btn-*`) antes de criar novos estilos;
- evite adicionar CSS global legado fora de `src/index.css`;
- novos componentes devem seguir a mesma escala de radius, sombra e contraste.

## Validacao

Validacao tecnica recomendada a cada ajuste visual relevante:

- `npx vitest run`
- `npm run build`

Validacao manual recomendada:

- desktop amplo;
- tablet em orientacao retrato;
- mobile com menu expandido;
- verificacao de foco por teclado nos fluxos de dashboard e admin.
- checklist detalhado em `docs/VISUAL_QA_CHECKLIST.md`.
