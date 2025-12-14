# Mestre 3D&T – Painel Web

Portal web inspirado no MasterApp (board.masterapprpg.com), focado em campanhas, bestiário rico e visão de sessões. A base atual está concentrada no front-end web, com componentes e estilos alinhados ao bestiário do MasterApp, mas com espaço para adicionar funcionalidades extras.

## O que existe no momento
- Página de bestiário com hero, abas de categorias, filtros, ordenação e paginação.
- Cards detalhados para monstros/personagens com arquétipo, habitat, ações rápidas e recompensas.
- Estilos dedicados para chips, destaque de criatura e toolbar de filtros.

## Próximos passos sugeridos
- Conectar a página a uma fonte de dados real (API/backend) para carregar criaturas e campanhas.
- Adicionar autenticação e convite de jogadores para sessões/campanhas.
- Criar dashboards e timelines de campanhas no mesmo padrão visual.
- Implementar estados de carregamento/erro para listas, busca e paginação.

## Como rodar
1. Instale as dependências no diretório `web/` (use `npm ci` para seguir o lockfile):
   ```bash
   cd web
   npm ci
   ```
2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Para gerar build de produção:
   ```bash
   npm run build
   ```

## Estrutura
- `web/`: código-fonte do painel web (Vite + Tailwind CSS).
- `docs/MASTERAPP_MIGRATION.md`: backlog de convergência visual/funcional com o MasterApp.

> Toda a base Android foi removida para manter o foco na versão web.
