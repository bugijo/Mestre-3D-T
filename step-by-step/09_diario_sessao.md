# Implementação do Diário de Sessão

## Resumo
Implementação de logs automáticos e manuais para o Diário de Sessão, permitindo ao Mestre manter um histórico dos eventos importantes e anotações rápidas.

## Alterações Realizadas

### 1. Store (`AppStore.tsx`)
- Modificação das actions `SESSION/SET_ACTIVE_SCENE`, `COMBAT/START`, `COMBAT/END` para inserir automaticamente uma nota no histórico.
- Action `SESSION/ADD_NOTE` agora recebe um parâmetro `important` para destacar notas críticas (como início de combate).

### 2. Interface (`SessionRunner.tsx`)
- Substituição do `textarea` simples por uma lista de notas com timestamp.
- Diferenciação visual entre notas comuns e importantes (bordas coloridas).
- Input de texto para adição rápida de notas manuais pelo Mestre.

## Status
- [x] Logs automáticos de troca de cena.
- [x] Logs automáticos de início/fim de combate.
- [x] Adição manual de notas.
- [x] Visualização cronológica (mais recentes no topo).

## Próximos Passos
- Implementar **Player de Áudio** (Fase 4).
