# Plano de execução — Mestre 3D&T

Este plano descreve como sair do protótipo para um APK instalável, incluindo arquitetura, backlog e marcos semanais. O foco é Jetpack Compose, dados locais e exportação de APK com `./gradlew assembleRelease`.

## Macro-fases
1. **Fundação e setup**
   - Estrutura do projeto Android (Compose + Material 3, minSdk 26).
   - Definição de modelos compartilhados e contratos de dados.
   - Tela guia (dashboard) com os blocos do MVP.
2. **Núcleo narrativo**
   - CRUD de Campanhas → Arcos → Cenas.
   - Gatilhos de rolagem (sucesso/falha) vinculados à cena.
   - Visualização em “modo sessão” com leitura rápida.
3. **NPCs e suporte de interpretação**
   - Cadastro de personalidade, objetivos e segredos por nível.
   - Frases prontas e gatilhos próprios do NPC.
   - Associação rápida de NPCs à cena ativa.
4. **Combate e encontros**
   - Cadastro de vilões/inimigos com atributos 3D&T.
   - Encontros com múltiplas instâncias e controle de PV/PM.
   - Tela de encontro com ajustes rápidos (+/- PV, status derrubado).
5. **Sessões, log e resumo**
   - Criação de sessões, notas rápidas e marcação de importância.
   - Resumo automático ao encerrar (cenas usadas, NPCs, inimigos derrotados).
6. **Áudio local**
   - Cadastro de “cenas de som” (trilha + efeitos).
   - Player simples (play/pause) e botões grandes para SFX locais.
7. **Acabamento e distribuição**
   - Polimento visual, acessibilidade, ícones e splash.
   - Telemetria opcional (somente se configurada localmente; manter offline por padrão).
   - Geração de APK e smoke test em dispositivo real.

## Backlog enxuto do MVP (prioridade alta)
- **Fundação**: tema Material 3, navegação, estado centralizado (ViewModel + StateFlow), persistência local (Room) e injeção com Hilt.
- **Narrativa**: CRUD completo de campanhas/arcos/cenas; gatilhos com textos de sucesso/falha; leitura em sessão.
- **NPCs**: modelo com papéis, personalidade, segredos em níveis, frases prontas; gatilhos; seleção por cena.
- **Combate**: inimigos com atributos F/H/R/A/PdF, PV/PM, poderes; encontros com quantidades e controles rápidos de PV.
- **Sessões/Log**: criação de sessão ativa, notas rápidas com tag "importante", resumo de encerramento.
- **Som**: cenas de som com arquivo local de trilha + lista de SFX; play/pause e botões rápidos.

## Roadmap sugerido (semanas)
- **Semana 1**: fundação do app, tema, navegação, modelos, Room + Hilt configurados.
- **Semana 2**: CRUD de campanha/arco/cena e tela de sessão com leitura de gatilhos.
- **Semana 3**: módulo de NPCs e integração na tela de sessão.
- **Semana 4**: encontros e combate; controles de PV/PM e poderes.
- **Semana 5**: sessões/log, resumo automático e painel de áudio local.
- **Semana 6**: polimento, acessibilidade, testes manuais e geração do APK.

## Arquitetura proposta
- **Camada de dados**: Room para persistência; repositórios para cada agregado (Campanha, NPC, Inimigo, Som, Sessão).
- **Domínio**: modelos imutáveis + use cases simples (ex.: `CreateCampaign`, `AddSceneTrigger`).
- **Apresentação**: Jetpack Compose, navegação por destinos principais (Dashboard, Campanhas, Sessão, NPCs, Combate, Som, Configurações).
- **Estado**: ViewModels com StateFlow, UI somente observa estados e envia intents.
- **Módulos futuros**: separar `core` (modelos + utilidades) e `feature-*` quando o MVP estiver estável.

## Entregáveis e build
- **APK**: gerar com `./gradlew assembleRelease` (após configurar o keystore localmente).
- **Debug rápido**: `./gradlew installDebug` para instalar no dispositivo conectado.
- **Smoke manual**: abrir Dashboard → navegar por Campanhas → criar cena → abrir sessão → rodar gatilho.

## Próximos passos imediatos
1. Consolidar navegação Compose (destinos: Dashboard, Campanhas, Sessão, NPCs, Encontros, Áudio).
2. Definir schema inicial do Room para campanhas/arcos/cenas e NPCs.
3. Criar telas CRUD básicas para Campanhas e Cenas.
4. Adicionar módulo de dados fake (em memória) para iterar na UI antes do Room.
5. Automatizar build debug (`assembleDebug`) em CI local simples.

## Notas
- Todo áudio deve ser local; evite dependências de streaming.
- Não automatizar rolagens de dado; apenas lembretes de testes e textos de sucesso/falha.
- Manter UX de poucos toques e textos legíveis em telas pequenas.
