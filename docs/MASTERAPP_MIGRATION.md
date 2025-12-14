# Convergência com o modelo MasterApp

Backlog focado em aproximar o painel web do Mestre 3D&T do bestiário e fluxo de campanhas vistos no MasterApp (board.masterapprpg.com), trazendo mais organização visual e recursos extras.

## Diagnóstico atual
- **Disponível**: bestiário web com hero, tabs de categoria, filtros, ordenação e paginação em estilo MasterApp.
- **Removido**: toda a base Android/Compose para focar apenas na versão web.
- **Falta**: backend/API real, dashboards de campanhas, convite de jogadores e fluxo de sessão/combate.

## Backlog sugerido (versão web)
1. **Dados reais do bestiário**: integrar com API (ou mock server) e suportar cache/paginação server-side.
2. **Campanhas e sessões**: criar dashboard com countdown da próxima sessão, cards de campanhas e linha do tempo de cenas.
3. **Convites e autenticação**: fluxo de login/signup, geração de links de convite e permissões por papel (mestre/jogador).
4. **Combate e iniciativa**: painel de combate com ordem de turnos, rolagens rápidas e distribuição de XP automatizada.
5. **Estados e feedback**: loaders, vazios, erros e toasts alinhados ao tema do MasterApp.
6. **Responsividade**: otimizar layout para mobile/tablet mantendo a estética do board MasterApp.

## Próxima iteração recomendada
- Conectar o catálogo do bestiário ao backend e preparar camada de serviços reutilizável para campanhas e sessões.
- Implementar placeholders de sessão (countdown e timeline) com dados mockados para alinhar UI antes da API.
