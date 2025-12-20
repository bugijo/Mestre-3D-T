# Implementação do CRUD de Campanhas (Fase 2)

## Resumo
Implementação completa da interface e lógica para criação e listagem de Campanhas, integrando o componente de upload de imagens (`ImageUpload`) com o store global (`AppStore`).

## Alterações Realizadas

### 1. Store Global (`AppStore.tsx`)
- Adicionado suporte a `coverDataUrl` na criação de campanhas.
- Implementada função `updateCampaign` com suporte a atualizações parciais (`Partial<Campaign>`).
- Melhoria na tipagem das actions do reducer.

### 2. UI de Campanhas
- **`src/pages/CampaignList.tsx`**: Página de listagem com grid responsivo e ordenação.
- **`src/components/campaign/CampaignCard.tsx`**: Card reutilizável com efeitos de hover e exibição de imagem de capa.
- **`src/pages/CampaignForm.tsx`**: Formulário de criação com validação e integração do `ImageUpload`.

### 3. Integração de Rotas (`App.tsx`)
- Adicionadas rotas `/campaigns` e `/campaigns/new`.
- Atualizada navegação temporária para incluir acesso rápido às campanhas.

### 4. Correções de Build
- Remoção de imports não utilizados.
- Ajustes de tipagem (`import type`) para conformidade com `verbatimModuleSyntax`.
- Correção na exportação do `Dashboard` e inclusão da função auxiliar `compressImage` em `attachments.ts`.

## Próximos Passos
- Implementar estrutura de Arcos e Cenas dentro das campanhas.
- Iniciar módulo de Bestiário e NPCs.
