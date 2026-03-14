# 02 - Migração para Design System (Tokens Semânticos)

## Contexto
O projeto utilizava muitas referências hardcoded a cores neon (`neon-green`, `neon-purple`) e sombras personalizadas (`shadow-neon-purple`), o que dificultava a manutenção e consistência visual.

## Alterações Realizadas

### 1. Atualização de Tokens CSS (`src/index.css`)
- Substituição de classes utilitárias `shadow-neon-purple` por `shadow-soft-md` e `shadow-glass`.
- Atualização de gradientes (`via-neon-yellow` -> `via-accent`).
- Padronização de botões `.btn-secondary` para usar `shadow-soft-md` em vez de sombras neon hardcoded.

### 2. Refatoração de Componentes
Foram auditados e atualizados os seguintes componentes para utilizar os tokens semânticos (`primary`, `secondary`, `accent`, `surface`):

- **`src/pages/CharacterList.tsx`**: Removido `text-neon-cyan` hardcoded.
- **`src/pages/AdminPortal.tsx`**: Ícones atualizados para usar tokens semânticos.
- **`src/App.tsx`**: Background animation atualizado.
- **`src/store/AppStore.tsx`**: Loading spinner atualizado.
- **`src/pages/NotFound.tsx`**: Botão de voltar atualizado.
- **`src/components/session/SessionHistoryPanel.tsx`**: Links e ícones atualizados.
- **`src/components/ui/ImageUpload.tsx`**: Cores de drag-and-drop e loading atualizados.
- **`src/components/ui/ConfirmDialog.tsx`**: Botões de ação atualizados.
- **`src/components/diagnostics/AppDiagnosticsPanel.tsx`**: Métricas atualizadas.
- **`src/components/backup/SnapshotControlPanel.tsx`**: Status indicators atualizados.
- **`src/components/game/PostBattleRewards.tsx`**: Botões de ação atualizados.
- **`src/components/game/MasterToolkitPanel.tsx`**: Ícones de controle de mesa atualizados.
- **`src/pages/Playground.tsx`**: Títulos e seções de exemplo atualizados.
- **`src/pages/CharacterForm.tsx`**: Inputs e botões de formulário atualizados.
- **`src/components/ui/ImageGenerator.tsx`**: Botões de geração atualizados.
- **`src/components/game/SessionChat.tsx`**: Inputs e botões de chat atualizados.
- **`src/components/game/DiceRoller.tsx`**: Histórico de rolagens e botões atualizados.

### 3. Limpeza de Código Morto
- Identificado que `src/styles/globals.css` não estava sendo importado e continha definições legadas conflitantes. (Mantido arquivo por enquanto, mas ignorado na análise).

## Próximos Passos
- Validar responsividade e acessibilidade (contraste de cores).
- Testar a aplicação em dispositivos móveis (PWA).
