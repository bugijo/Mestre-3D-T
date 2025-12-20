# Implementação da Hierarquia de Campanha (Arcos e Cenas)

## Resumo
Implementação da estrutura hierárquica `Campanha -> Arcos -> Cenas`, permitindo o gerenciamento completo da narrativa do jogo.

## Alterações Realizadas

### 1. Store Global (`AppStore.tsx`)
- Atualizadas funções `updateArc` e `updateScene` para suportar atualizações parciais (padrão `(id, data)`).
- Corrigida a tipagem da interface `AppStoreApi` para refletir as mudanças.

### 2. UI de Detalhes da Campanha (`CampaignDetails.tsx`)
- Criada nova página que exibe a estrutura da campanha.
- **Hero Header:** Exibição da capa da campanha com título e descrição.
- **Lista de Arcos:** Accordion expansível para organizar cenas.
- **Gestão de Arcos:** Criar, renomear e excluir arcos.
- **Gestão de Cenas:** Criar e excluir cenas dentro de cada arco.
- Navegação para edição da campanha.

### 3. Formulário de Campanha (`CampaignForm.tsx`)
- Atualizado para suportar **Edição**:
    - Detecção automática de modo (Criação vs Edição) via URL params.
    - Preenchimento dos campos com dados existentes.
    - Chamada correta para `updateCampaign` ou `createCampaign`.

### 4. Rotas (`App.tsx`)
- Adicionadas rotas:
    - `/campaigns/:id` (Detalhes)
    - `/campaigns/:id/edit` (Edição)

## Status
- [x] Criação de Arcos e Cenas funcional.
- [x] Navegação entre lista, detalhes e edição.
- [x] Persistência de dados garantida pelo `AppStore`.

## Próximos Passos
- Implementar módulo de **Bestiário e NPCs** (Lista e Ficha de Personagem).
