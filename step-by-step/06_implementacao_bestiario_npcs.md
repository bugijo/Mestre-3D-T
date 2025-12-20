# Implementação do Módulo de Bestiário e NPCs

## Resumo
Implementação completa da gestão de personagens, NPCs e monstros, incluindo listagem com filtros e formulário de edição com atributos do sistema 3D&T Alpha.

## Alterações Realizadas

### 1. Lista de Personagens (`CharacterList.tsx`)
- Visualização em Grid de Cards com avatar, nome, função e tipo.
- **Filtros:** Busca por texto (nome/função) e filtro rápido por tipo (Jogador, NPC, Inimigo, Chefe, Aliado).
- Indicadores visuais de PV/PM nos cards.
- Ações rápidas de exclusão.

### 2. Formulário de Personagem (`CharacterForm.tsx`)
- **Atributos 3D&T:** Entradas numéricas para F, H, R, A, PdF.
- **Cálculo Automático:** PV e PM calculados automaticamente com base na Resistência (Rx5).
- **Avatar:** Integração com `ImageUpload` para foto do personagem.
- **Edição/Criação:** Suporte completo a criar novos ou editar existentes via URL params.

### 3. Store Global (`AppStore.tsx`)
- Atualizada função `updateCharacter` para suportar atualizações parciais (`Partial<Character>`).
- Lógica de persistência e recálculo de status garantida.

### 4. Navegação (`App.tsx`)
- Adicionadas rotas `/characters`, `/characters/new`, `/characters/:id`.
- Adicionado link na navbar temporária.

## Status
- [x] Listagem e Filtros funcionais.
- [x] Criação e Edição de atributos 3D&T funcional.
- [x] Build de produção aprovado.

## Próximos Passos
- Implementar **Sessão de Jogo (Game Runner)**:
    - Controle de Cenas.
    - Rolagem de Dados.
    - Combate básico.
