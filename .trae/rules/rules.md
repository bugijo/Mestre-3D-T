# 🌍 Regras Globais de Comportamento e Automação (PT-BR)

## 1. Comunicação e Perfil
- **Idioma:** Sempre fale em Português do Brasil (PT-BR).
- **Simplicidade:** Ao explicar algo, seja direto, funcional e extremamente claro. Evite jargões técnicos desnecessários, pois o usuário **não é programador**. Foco no "o que isso faz" e não no "como o código funciona".
- **Concisão:** Fale apenas o estritamente necessário. Tome decisões por conta própria. Pergunte apenas quando houver risco de perda de dados ou ambiguidade crítica no projeto.

## 2. Automação de Fluxo (O Cérebro do Projeto)
Na raiz do projeto, você deve sempre manter e ler dois arquivos vitais:

### A. `ideia.md` (A Visão)
- Contém a descrição geral e os objetivos do projeto.
- Se não existir, crie-o perguntando ao usuário qual é a ideia.

### B. `tarefas.md` (O Plano de Ação)
- É o seu guia mestre. Se não existir, crie um plano completo do início ao fim.
- **Estrutura Obrigatória:**
  1. Visão Geral.
  2. Lista de Tarefas (Checklist).
  3. Status Atual (Ex: 🟢 Concluído, 🟡 Em Progresso, 🔴 Pendente).
- **Execução:** Siga a ordem das tarefas automaticamente. Ao terminar uma, marque como concluída [x], atualize o status e inicie a próxima imediatamente sem esperar ordem.
- **Relatório:** Ao final de cada interação, informe a % de conclusão do projeto.

## 3. Estrutura e Logs
- Mantenha uma pasta chamada `step-by-step`.
- Crie um arquivo de log para cada grande alteração, descrevendo sucintamente o que foi feito (ex: `01_configuracao_inicial.md`).
- Sempre revise o `ideia.md` antes de mudanças arquiteturais para garantir que não está desviando do objetivo.

## 4. Qualidade e Organização de Código (Senior Dev)
- **Atue como um Time Sênior:** Divida tarefas complexas (análise, código, teste) e execute-as com autonomia.
- **Refatoração:** Arquivos > 300 linhas ou Funções > 50 linhas devem ser divididos.
- **DRY (Don't Repeat Yourself):** Evite duplicação. Reutilize componentes e funções.
- **Autocorreção:** Se encontrar um erro, tente corrigir sozinho até 3 vezes antes de pedir ajuda.

## 5. Segurança e Ambientes
- Considere sempre a separação entre dados de teste e produção.
- **Nunca** sobrescreva arquivos de configuração sensíveis (como `.env`) sem fazer um backup ou pedir confirmação.
- **Nunca** exponha senhas ou tokens em prints ou logs.

## 6. Finalização de Tarefas
Após implementar uma funcionalidade:
1. **Teste:** Verifique se funciona (rode o código/servidor).
2. **Documente:** Atualize o `tarefas.md`.
3. **Reflita:** Escreva 1 parágrafo curto sobre o impacto da mudança e qual o próximo passo imediato.

## 7. Modos de Operação
- **Modo Planejador:** Se o usuário pedir uma nova feature complexa, faça 4-6 perguntas, monte o plano no `tarefas.md` e aguarde o "De acordo".
- **Modo Executor:** Para todo o resto, apenas faça.

a porta a ser usada pelo servidor é a 5173 e o preview é a 4173 e isso nao pode ser alterado
tudo o que for criado (personagens, historias, mapas, itens e tudo mais) deve ser pensado sabendo que estamos criadno uma plataforma baseada na plataforma existente chamada masterapprpg e que deve ser pensada em ajudar na interação em mesas de rpg, inicialmente sabendo que as sessoes tem o foco de ser presencial, ou seja, o foco deve ser  principalmente ajudar o mestre a mestrar uma campanha, seguindo a regra do sistema que ele escolheu para dar inicio a campanha, sendo inicialmente o sistema de D&D 5e ou 3DET. 
mais para frente pode ser expandido para incluir outros sistemas de rpg, como o sistema de D&D 3.5, o sistema de Pathfinder, o sistema de Shadowrun, entre outros. mais isso sera para a proxima atualização que sera feita so quando esta estiver totalemtente do meu agrado.
tudo nessa plataforma deve ser feita pensando em ajudar na imersão presencial do jogador na campanha, ou seja, o foco deve ser em ajudar o jogador a se sentir parte da campanha, e não em apenas fazer as coisas que o mestre pedir, mas sempre tendo em mente que quem controla a campanha é o mestre e não o jogador.
quero que a plataforma seja criada com a possibilidade com o mestre poder ter na tela dele uma forma de ele acompanhar a historia que ele esta narrando que de alguma forma que sera desenvolvido deve seguir as regras do sistema de rpg previamente escolhido, tendo uma maneira de ele marcar o que ja foi feito na campanha podendo passar oara o proximo, como se fossem capitulos de uma historia. deve ter na tela tbm uma maneira de ele gerenciar os npcs, monstros, viloes e tudo o mais que aparece. deve ter uma maneira de quando um mosntro morre e se passa toda a batalha, os xps sao passados para os jogadores. 
deve se ter na plataforma uma parte onde apos o mestre ter criado a hsitoria, escolhido os mcps e os viloes que apareceram e o boss, que todos deve ser previamente cadastrados ou criados, o mestre cria a mesa, e os jogadores se juntam a essa mesa, e o mestre começa a narrar a historia, e os jogadores se movem pelo mapa, interagem com os npcs, e batalham contra os monstros.
na tela dos joagadores aparecem imagens que o mestre pode colocar, como um mapa da uma vila, cidade, ou um campo onde se acontecera uma batalha,m onde se tem as grades, assim o mestre coloca os npcs, monstros e viloes onde eles estaram e os jogadores inicialç onde foi determinado e assim se da inicio a batalha, seguindo as regas do sistema previamente escolhido