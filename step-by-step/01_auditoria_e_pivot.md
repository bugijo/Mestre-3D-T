# Auditoria e Pivot para Web (16/12/2025)

## Auditoria
- **Análise do Projeto:** Foi realizada uma auditoria completa na estrutura de arquivos.
- **Descoberta:** O código fonte Android (Kotlin/Compose), embora extensivamente documentado como "Concluído", não está presente no diretório.
- **Estado Web:** A pasta `/web` contém um projeto Vite/TypeScript funcional, porém com dados mockados e sem lógica de negócio profunda.

## Ações Tomadas
1.  **Atualização do Plano (`tarefas.md`):** O plano foi reescrito para refletir a realidade. As tarefas de manutenção Android foram removidas/arquivadas e substituídas por tarefas de implementação na Web.
2.  **Atualização da Visão (`ideia.md`):** O documento de visão foi ajustado para "Mestre 3D&T (Web/PWA)" para guiar desenvolvimentos futuros.
3.  **Definição de Estratégia:** A estratégia adotada é "Web First / PWA" para garantir entrega de valor imediata sobre o código existente.

## Próximos Passos
- Migrar a arquitetura Web para React (ou consolidar componentes TS) para suportar a complexidade do app.
- Implementar persistência real (IndexedDB) para substituir os mocks atuais.
