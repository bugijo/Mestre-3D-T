# Implementação do Sistema de Combate

## Resumo
Implementação do sistema de gerenciamento de combate, permitindo ao Mestre controlar iniciativa, turnos e status (PV/PM) dos participantes de forma dinâmica durante a sessão.

## Alterações Realizadas

### 1. Novo Componente: `CombatTracker` (`src/components/game/CombatTracker.tsx`)
- Visualização da lista de participantes ordenada por Iniciativa.
- Destaque para o turno atual.
- Controle de PV (Barra Vermelha) e PM (Barra Azul) em tempo real.
- Botões de ação rápida: Dano (-1 PV), Custo (-1 PM), Derrotar/Reviver.
- Navegação de turnos (Próximo Turno) e Encerramento de Combate.

### 2. Integração no `SessionRunner` (`src/pages/SessionRunner.tsx`)
- Lógica para alternar entre "Visualização de Cena" e "Modo de Combate".
- Botão "INICIAR COMBATE" na tela de cena.
- Integração com a store para iniciar combate carregando todos os NPCs e Inimigos da cena ativa.

### 3. Ajustes na Store (`AppStore.tsx`)
- Verificação das actions de combate (`COMBAT/START`, `NEXT_TURN`, etc.).
- A função `startCombatFromScene` popula automaticamente os participantes baseados nos personagens vinculados à cena.

## Status
- [x] Iniciar combate a partir de uma cena.
- [x] Visualizar ordem de iniciativa.
- [x] Controlar turnos.
- [x] Aplicar dano/gasto de PM temporário (sem afetar a ficha original permanentemente, exceto se desejado - *Nota: Atualmente o combatente é uma cópia, alterações não persistem na ficha original automaticamente, o que é ideal para encontros*).
- [x] Marcar combatentes como derrotados.

## Próximos Passos
- Implementar **Diário de Sessão Automático**:
    - Registrar início/fim de combate e cenas no log.
- Melhorar a criação de NPCs (Geração aleatória?).
