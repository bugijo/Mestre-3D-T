# Guia rápido de testes e build

Este passo a passo mostra como você pode testar o app localmente, gerar o APK e validar as telas, já que o ambiente remoto não consegue baixar o toolchain Android.

## Requisitos
- Android Studio Iguana ou superior **ou** CLI com JDK 17 e Android SDK configurado.
- Emulador API 26+ ou dispositivo físico com modo desenvolvedor/USB debugging.
- Conexão à internet para baixar dependências do Gradle/Android.

## 1) Sincronizar e compilar
1. Na raiz do projeto, rode:
   ```bash
   ./gradlew tasks
   ```
   Isso força o download do Android Gradle Plugin e das dependências.
2. Build debug:
   ```bash
   ./gradlew assembleDebug
   ```
3. Instalar no emulador/dispositivo conectado:
   ```bash
   ./gradlew installDebug
   ```

## 2) Gerar APK de release assinada
1. Crie um keystore (uma vez):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore mestre3dt.keystore -alias mestre -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Crie um `keystore.properties` (fora do controle de versão) com:
   ```properties
   storeFile=/caminho/para/mestre3dt.keystore
   storePassword=<sua-senha>
   keyAlias=mestre
   keyPassword=<sua-senha>
   ```
3. Gere a release:
   ```bash
   ./gradlew assembleRelease
   ```
   O APK ficará em `app/build/outputs/apk/release/app-release.apk`.

## 3) Testes automatizados
- Unitários (repositório e lógica de estado):
  ```bash
  ./gradlew test
  ```
- Instrumentados (Compose/UI) – requer emulador/dispositivo ligado:
  ```bash
  ./gradlew connectedAndroidTest
  ```
- Snapshots estáticos das telas (Paparazzi):
  ```bash
  ./gradlew app:recordPaparazzi --console=plain
  ```
  As imagens geradas ficam em `app/src/test/snapshots/images`. Se preferir uma referência rápida, há SVGs em `docs/previews/`.

## 4) Configurar e testar backup na nuvem (Supabase)
1. Crie um projeto gratuito no Supabase e a tabela `mestre_snapshots` (SQL no README).
2. Em `local.properties`, adicione `SUPABASE_URL`, `SUPABASE_KEY` e `SUPABASE_TABLE`.
3. Rode o app, abra a aba Dashboard e use **Enviar backup** / **Baixar backup** para validar.

## 5) Checklist rápido em dispositivo real
Use `docs/QA_CHECKLIST.md` como roteiro. Principais pontos:
- Navegação por abas, abertura da aba Sessão e edição de gatilhos.
- CRUD de campanhas, NPCs, inimigos e poderes.
- Ajuste de PV/PM e remoção de instâncias no encontro.
- Painel de som: seleção de trilha/SFX local, play/pause e volumes.
- Fluxo de sessão: iniciar, registrar notas importantes, encerrar e ver o resumo.
- TalkBack: headers anunciados, banner de erro como região viva, botões com rótulos.

## 6) Dicas de troubleshooting
- Se o Gradle não baixar dependências, verifique proxies/firewall e tente `./gradlew --refresh-dependencies`.
- Erro de licença do SDK: abra o Android Studio uma vez e aceite as licenças, ou rode `sdkmanager --licenses`.
- Em emulador lento, desative animações no Developer Options para agilizar os testes de UI.
