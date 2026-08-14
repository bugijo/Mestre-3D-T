# RPG Alpha — APK Android (Alpha)

## Onde está o APK

```
dist-mobile/RPG-Alpha-debug.apk
```

Cópia canônica (build do Gradle):

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Como instalar

1. Copie `RPG-Alpha-debug.apk` para o celular (cabo USB, WhatsApp, Drive, etc.).
2. No Android, abra o arquivo `.apk` pelo gerenciador de arquivos.
3. O sistema pode pedir permissão para instalar "apps de fontes desconhecidas" — ative para o app do gerenciador de arquivos.
4. Confirme a instalação.
5. Abra o app **RPG Alpha**.

> Requer Android 7+ (API 24+). O APK de debug é assinado com a chave de debug do Android SDK.

## Versão

| Campo | Valor |
|-------|-------|
| versionName | 1.0 |
| versionCode | 1 |
| package id | `com.bugijo.rpgalpha` |
| Nome exibido | RPG Alpha |
| minSdk | 24 (Android 7) |
| targetSdk | 36 |
| Tamanho | ~4,6 MB |

## Backend

O app embute os assets web compilados localmente e conecta ao backend público:

| Serviço | URL |
|---------|-----|
| API | `https://rpg-alpha.onrender.com` |
| WebSocket | `wss://rpg-alpha.onrender.com/ws` |
| Supabase | projeto `mlhrloxhbrscvcclcxxh` |

- Autenticação: **Supabase Auth** via backend (mesmo fluxo da web).
- Sessões online, persistência e realtime: idênticos à versão web.

## Como atualizar

1. Altere o código em `mobile-alpha`.
2. `npm run build:mobile` (gera `dist/` apontando para o backend público).
3. `npx cap sync android`.
4. `cd android && ./gradlew assembleDebug` (com `JAVA_HOME` no JDK 21 e `ANDROID_HOME` no SDK local).
5. Copie `android/app/build/outputs/apk/debug/app-debug.apk` → `dist-mobile/RPG-Alpha-debug.apk`.
6. Distribua o novo APK.

## Limitações (Alpha)

- APK **debug** (não assinado para loja; instalação direta apenas).
- Sem auto-atualização — atualização manual por novo APK.
- Sessões online dependem do backend Render (plano free: pode suspender por inatividade; um acesso reativa).
- Notificações push não implementadas.
- Ícone: splash padrão do Capacitor (a arte final será substituída depois).
- Sem suporte a mapa/upload intensivo ainda validado em celular real.

## Segurança

- Nenhuma chave privada embutida (sem `service_role`, sem secrets).
- Apenas a anon key pública do Supabase e URLs públicas estão no APK.
- Permissões Android: somente `INTERNET`.
