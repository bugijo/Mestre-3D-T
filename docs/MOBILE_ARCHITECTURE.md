# Arquitetura Mobile (Capacitor)

## Visão geral

O app Android é o mesmo React/Vite da web, embutido em um WebView nativo via
**Capacitor 8**. Os assets compilados são servidos de dentro do APK; o app
conecta ao backend público por HTTP/WebSocket.

```
┌─────────────────────────────┐
│  Android (Capacitor 8)      │
│  ┌────────────────────────┐ │
│  │ WebView (https://loc.) │ │
│  │  React/Vite build      │ │
│  │  (dist/ embutido)      │ │
│  └──────────┬─────────────┘ │
└─────────────┼───────────────┘
              │ https / wss
              ▼
     https://rpg-alpha.onrender.com
              │
              ├── /api/auth/* (Supabase Auth)
              ├── /ws (WebSocket realtime)
              └── Supabase (persistência)
```

## Configuração

### `capacitor.config.ts`

```ts
appId: 'com.bugijo.rpgalpha',
appName: 'RPG Alpha',
webDir: 'dist',
server: { androidScheme: 'https' }
```

- `webDir = dist` → o `dist/` compilado é copiado para o APK.
- `androidScheme = 'https'` → o WebView local roda em `https://localhost`
  (contexto seguro, necessário para Web Crypto / Service Workers).

### Build do frontend (modo mobile)

`npm run build:mobile` roda o Vite com `--mode mobile`, carregando `.env.mobile`:

| Variável | Valor | Uso |
|----------|-------|-----|
| `VITE_API_URL` | `https://rpg-alpha.onrender.com` | Base das chamadas `/api/*` |
| `VITE_WS_URL` | `wss://rpg-alpha.onrender.com/ws` | URL do WebSocket |
| `VITE_SUPABASE_URL` | URL do projeto | Cliente Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key (pública) | Cliente Supabase |

Helper `src/config/env.ts` resolve a base da API com fallback para same-origin
(web/PWA continuam funcionando sem mudanças).

## Backend (Render)

### CORS

O servidor responde com CORS para origens em `ALLOWED_ORIGINS`. Para o app
Capacitor, o WebView usa o origin `https://localhost`, então:

```
ALLOWED_ORIGINS=https://rpg-alpha.onrender.com,https://localhost
```

Sem wildcard `*`. Preflight `OPTIONS` tratado.

### Validação de Origin (WebSocket)

`server/origin-validator.mjs` aceita `https://localhost` / `http://localhost`
em modo ONLINE (origem do WebView Capacitor) além dos origins configurados.
Nenhum wildcard.

## Toolchain local (Linux)

Tudo em *user space*, sem sudo:

| Componente | Local |
|------------|-------|
| Android SDK | `android-sdk/` (command-line tools + platform 36 + build-tools 34) |
| JDK 17/21 | `jdk17/`, `jdk21/` (Temurin portátil) |
| Gradle | via wrapper do projeto (8.14.3) |

Build do APK:

```bash
export JAVA_HOME="$PWD/jdk21/jdk-21.0.12+8"
export ANDROID_HOME="$PWD/android-sdk"
cd android && ./gradlew assembleDebug
```

## Auth

Mesmo fluxo da web: `POST /api/auth/signup` e `POST /api/auth/login`
(Supabase Auth), token JWT enviado por `auth:login` no WebSocket.
Sem duplicação de sistema de auth.

## Segurança

- Service role nunca é embutida no APK.
- Apenas anon key pública e URLs públicas estão nos assets.
- Permissões Android: somente `INTERNET`.
- Proteção de Origin mantida (sem wildcard).
