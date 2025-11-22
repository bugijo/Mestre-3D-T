# Mestre 3D&T – Painel do Mestre (Android)

Aplicativo Android para mestres de 3D&T que desejam organizar campanha, NPCs, encontros e som local em poucos toques. A base usa Kotlin + Jetpack Compose + Material 3 e foi pensada para funcionar offline, com mídia local e persistência em banco interno, mas já traz sincronização manual opcional com Supabase (banco PostgreSQL gratuito).

## O que já existe
- Projeto Android configurado (Compose, Material 3, minSdk 26, targetSdk 34).
- Navegação por abas entre Dashboard, Sessão, Campanhas, NPCs, Combate e Som com dados de exemplo.
- Tela inicial (Dashboard) listando os blocos do MVP e próximos passos.
- Aba **Sessão** com painel rápido: cena ativa com gatilhos expandíveis (sucesso/falha), NPCs da cena, encontro com ajustes rápidos de PV/PM, remoção de instâncias e notas rápidas marcadas como importantes.
- Estado compartilhado via ViewModel + fluxo em memória para campanhas, cenas, encontro, notas e painel de som.
- CRUD básico de campanha/arco/cena na aba **Campanhas**, com ativação de cena para uso na Sessão.
- Tema customizado claro/escuro com cores em clima de RPG.
- Plano de execução detalhado em [`docs/PLANO.md`](docs/PLANO.md).
- Status atualizado do MVP em [`docs/STATUS.md`](docs/STATUS.md).
- Sincronização manual com Supabase (backup/restauração em um banco gratuito) a partir do dashboard.

### Atualizações mais recentes
- Persistência local via Room salvando snapshots completos (incluindo encontro, índices ativos e estado do player) e restaurando na inicialização.
- Inclusão/remoção/edição inline de gatilhos rápidos de cena diretamente na aba **Sessão** e gatilhos de NPCs na aba **NPCs**.
- Fluxo de sessão com início/encerramento, registro de cenas visitadas, notas importantes e resumo com horários e inimigos derrubados.
- Painel de som com seleção de trilha/efeitos locais (picker de arquivos + ExoPlayer), botões de disparo rápido e controle de volume/ducking persistente.
- Encontros permitem múltiplas instâncias do mesmo inimigo, ajuste de PV/PM por instância e remoção individual.
- CRUD completo de inimigos/poderes com formulários e confirmações, incluindo estados vazios/guia visual para listas críticas.
- Estado global agora mostra loading/erro, atalhos rápidos na Mesa do Mestre e previews Compose de todas as abas para revisão visual sem build.

## Como rodar e gerar APK
> Requer Android Studio Iguana ou superior, ou Gradle 8.3+ com JDK 17.

1. Sincronize dependências: `./gradlew tasks`
2. Build debug: `./gradlew assembleDebug`
3. Instalar no dispositivo (USB ou emulador): `./gradlew installDebug`
4. Gerar APK de release (assinar com seu keystore local): `./gradlew assembleRelease`

Checklist rápido para release assinada:
- Gere um keystore local (uma vez): `keytool -genkeypair -v -storetype PKCS12 -keystore mestre3dt.keystore -alias mestre -keyalg RSA -keysize 2048 -validity 10000`
- Se quiser automatizar, crie um `keystore.properties` (fora do controle de versão) com `storeFile`, `storePassword`, `keyAlias` e `keyPassword`. O Gradle já usa automaticamente se existir; se não existir, o build continua funcionando com a config padrão.
- Confirme permissões declaradas (leitura de mídia local) e preencha a ficha de privacidade antes de publicar.

### Testes
- Unitários (repositório em memória): `./gradlew test`
- Instrumentados (Compose/UI): `./gradlew connectedAndroidTest`
- Previews estáticos via Paparazzi (gera PNGs das telas principais em `app/src/test/snapshots/images`): `./gradlew app:recordPaparazzi`
- Checklist de QA/acessibilidade para executar em dispositivo real: consulte [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md).
- Guia rápido de build, instalação e testes passo a passo: [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md).

### Previews rápidos (offline)
- Enquanto o ambiente não baixa as dependências do Android Gradle Plugin, consulte os SVGs ilustrativos em `docs/previews/`:
  - `dashboard.svg`, `sessao.svg`, `campanhas.svg`, `npcs.svg`, `combate.svg`, `som.svg`.
- Em um ambiente com acesso às dependências (Google Maven), rode o comando do Paparazzi acima para gerar PNGs reais das telas.

### Habilitar sincronização gratuita com Supabase
1. Crie um projeto gratuito em [Supabase](https://supabase.com) e habilite a REST API padrão.
2. No SQL editor, crie a tabela `mestre_snapshots` com colunas jsonb:
   ```sql
   create table public.mestre_snapshots (
     campaigns jsonb,
     npcs jsonb,
     enemies jsonb,
     soundScenes jsonb,
     sessionNotes jsonb,
     sessionSummaries jsonb,
      activeSession jsonb,
      encounter jsonb,
      activeCampaignIndex int,
      activeArcIndex int,
      activeSceneIndex int,
      activeSoundSceneIndex int,
      isSoundPlaying boolean,
      soundPreferences jsonb,
      createdAt bigint default extract(epoch from now())*1000
   );
   ```
3. Em `local.properties` (não versionado), adicione:
   ```properties
   SUPABASE_URL=https://<sua-instancia>.supabase.co
   SUPABASE_KEY=<chave_anon_publica>
   SUPABASE_TABLE=mestre_snapshots
   ```
4. Rode `./gradlew assembleDebug` normalmente. No dashboard do app, use os botões **Enviar backup** / **Baixar backup**.

## Principais fluxos do MVP
- **Campanhas → Arcos → Cenas**: CRUD completo, com gatilhos de rolagem (sucesso/falha) exibidos, editáveis e removíveis em modo sessão.
- **NPCs**: personalidade (palavras-chave, jeito de falar, trejeitos), segredos por nível, frases prontas e gatilhos próprios editáveis (adição/edição/remoção).
- **Vilões/Inimigos**: atributos F/H/R/A/PdF, PV/PM, poderes e tags; encontros com múltiplas instâncias, ajuste de PV/PM e remoção individual.
- **Sessões e Log**: notas rápidas marcadas como importante/flavor e resumo automático ao encerrar.
- **Som Local**: cenas de som com trilha de fundo e efeitos locais (sem streaming), selecionados do dispositivo e tocados com ExoPlayer.
- **Mesa do Mestre**: cabeçalho com campanha/sessão/cena atual, área da cena, NPCs ativos, encontro atual e painel compacto de som.
- **Backup em nuvem (opcional)**: envia/baixa snapshot de campanhas, NPCs, encontros, cenas de som, notas, resumos e estado ativo via Supabase grátis.

## Arquitetura recomendada
- **Apresentação**: Jetpack Compose + Navigation; telas desacopladas com ViewModels.
- **Domínio**: modelos imutáveis e use cases simples (ex.: `CreateCampaign`, `AddSceneTrigger`).
- **Dados**: Room para persistência local; DataStore/Preferences para settings rápidos; repositórios por agregado.
- **Injeção**: Hilt para provisionar DAOs, repositórios e use cases.
- **Áudio**: ExoPlayer apenas para arquivos locais (trilha e SFX).

## Roadmap e marcos
Veja o plano completo em [`docs/PLANO.md`](docs/PLANO.md). Resumo das próximas entregas:
1. UX aprimorada: estados de loading/erro, talkback/labels e contraste revisado.
2. Empacotar APK de teste (keystore local) e checklist de privacidade/acessibilidade.
3. Testes instrumentados para fluxo de sessão, encontro e painel de som.

Para uma visão resumida do que falta, consulte [`docs/STATUS.md`](docs/STATUS.md).

## Premissas de UX
- Poucos cliques durante a sessão; ações frequentes viram botões grandes ou chips.
- Texto legível em telas pequenas; alto contraste e colapsável para blocos longos (abertura de cena, por exemplo).
- Sem automação de rolagens; o app fornece lembretes, dificuldades e textos de sucesso/falha.

## Licenciamento e segurança
- Conteúdo original (sem material protegido). Áudios e imagens devem ser fornecidos pelo usuário e armazenados localmente.
- O app foi pensado para uso offline; qualquer telemetria deve ser opcional e desativada por padrão.
