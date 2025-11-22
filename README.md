# Mestre 3D&T – Painel do Mestre (Android)

Aplicativo Android para mestres de 3D&T que desejam organizar campanha, NPCs, encontros e som local em poucos toques. A base usa
 Kotlin + Jetpack Compose + Material 3 e foi pensada para funcionar offline, com mídia local e persistência em banco interno.

## O que já existe
- Projeto Android configurado (Compose, Material 3, minSdk 26, targetSdk 34).
- Navegação por abas entre Dashboard, Sessão, Campanhas, NPCs, Combate e Som com dados de exemplo.
- Tela inicial (Dashboard) listando os blocos do MVP e próximos passos.
- Aba **Sessão** com painel rápido: cena ativa com gatilhos expandíveis (sucesso/falha), NPCs da cena, encontro com ajustes rápidos de PV e estado derrubado, além de notas rápidas marcadas como importantes.
- Estado compartilhado via ViewModel + fluxo em memória para campanhas, cenas, encontro, notas e painel de som.
- CRUD básico de campanha/arco/cena na aba **Campanhas**, com ativação de cena para uso na Sessão.
- Tema customizado claro/escuro com cores em clima de RPG.
- Plano de execução detalhado em [`docs/PLANO.md`](docs/PLANO.md).
- Status atualizado do MVP em [`docs/STATUS.md`](docs/STATUS.md).

## Como rodar e gerar APK
> Requer Android Studio Iguana ou superior, ou Gradle 8.3+ com JDK 17.

1. Sincronize dependências: `./gradlew tasks`
2. Build debug: `./gradlew assembleDebug`
3. Instalar no dispositivo (USB ou emulador): `./gradlew installDebug`
4. Gerar APK de release (assinar com seu keystore local): `./gradlew assembleRelease`

## Principais fluxos do MVP
- **Campanhas → Arcos → Cenas**: CRUD completo, com gatilhos de rolagem (sucesso/falha) exibidos em modo sessão.
- **NPCs**: personalidade (palavras-chave, jeito de falar, trejeitos), segredos por nível, frases prontas e gatilhos próprios.
- **Vilões/Inimigos**: atributos F/H/R/A/PdF, PV/PM, poderes e tags; encontros com múltiplas instâncias e controles rápidos de PV.
- **Sessões e Log**: notas rápidas marcadas como importante/flavor e resumo automático ao encerrar.
- **Som Local**: cenas de som com trilha de fundo e efeitos locais (sem streaming).
- **Mesa do Mestre**: cabeçalho com campanha/sessão/cena atual, área da cena, NPCs ativos, encontro atual e painel compacto de som.

## Arquitetura recomendada
- **Apresentação**: Jetpack Compose + Navigation; telas desacopladas com ViewModels.
- **Domínio**: modelos imutáveis e use cases simples (ex.: `CreateCampaign`, `AddSceneTrigger`).
- **Dados**: Room para persistência local; DataStore/Preferences para settings rápidos; repositórios por agregado.
- **Injeção**: Hilt para provisionar DAOs, repositórios e use cases.
- **Áudio**: ExoPlayer apenas para arquivos locais (trilha e SFX).

## Roadmap e marcos
Veja o plano completo em [`docs/PLANO.md`](docs/PLANO.md). Resumo das próximas entregas:
1. Persistir dados com Room (campanhas/arcos/cenas/NPCs) mantendo seed em memória para pré-visualização.
2. CRUD completo de gatilhos de cena e NPCs, conectando com Sessão.
3. Ajustar encontros para permitir múltiplas instâncias e PM por inimigo.
4. Painel de som local com ExoPlayer e seleção de arquivos do dispositivo.
5. Empacotar APK de teste e checklist de acessibilidade.

Para uma visão resumida do que falta, consulte [`docs/STATUS.md`](docs/STATUS.md).

## Premissas de UX
- Poucos cliques durante a sessão; ações frequentes viram botões grandes ou chips.
- Texto legível em telas pequenas; alto contraste e colapsável para blocos longos (abertura de cena, por exemplo).
- Sem automação de rolagens; o app fornece lembretes, dificuldades e textos de sucesso/falha.

## Licenciamento e segurança
- Conteúdo original (sem material protegido). Áudios e imagens devem ser fornecidos pelo usuário e armazenados localmente.
- O app foi pensado para uso offline; qualquer telemetria deve ser opcional e desativada por padrão.
