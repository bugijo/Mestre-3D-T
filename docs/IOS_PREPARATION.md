# Preparação iOS — RPG Alpha

## Situação atual

- **Nenhuma build iOS foi gerada** nesta execução (requer macOS/Xcode, ferramentas Apple).
- Usuários iPhone continuam usando a **PWA** em `https://rpg-alpha.onrender.com`.
- A base de código é compartilhada: o mesmo build React/Vite pode ser embutido
  no iOS via Capacitor quando houver um Mac disponível.

## O que já está preparado

- `capacitor.config.ts` existe e é cross-platform (webDir = dist).
- `src/config/env.ts` resolve API/WS por env var — funciona igual no iOS.
- O frontend usa Supabase Auth via backend (sem dependência de plataforma).
- CORS/Origin do backend aceita `https://localhost` — no iOS o WebView
  Capacitor também roda em `https://localhost`, então a mesma configuração serve.

## O que falta para gerar o iOS nativo

| Item | Status |
|------|--------|
| macOS com Xcode | ❌ Necessário (ambiente Apple) |
| `@capacitor/ios` (npm) | ❌ A instalar (sem custo) |
| `npx cap add ios` | ❌ Requer macOS |
| `npx cap open ios` / Xcode build | ❌ Requer macOS |
| Conta Apple Developer (US$ 99/ano) | ❌ Necessária só para publicar na App Store |
| Assinatura/provisioning | ❌ Requer conta Apple |

## Passos quando houver um Mac

```bash
# 1. No projeto (qualquer SO), instalar a plataforma iOS
npm i @capacitor/ios

# 2. No macOS:
npx cap add ios
npm run build:mobile        # gera dist/ com URLs públicas
npx cap sync ios
npx cap open ios            # abre no Xcode
# No Xcode: escolher bundle id com.bugijo.rpgalpha, assinar e rodar
```

## Alternativa imediata (sem custo)

**PWA para iPhone:** o usuário abre `https://rpg-alpha.onrender.com` no Safari,
toca em Compartilhar → *Adicionar à Tela de Início*. O manifesto e service
worker já estão configurados (`display: standalone`), dando experiência de app
sem loja e sem custo.

## Restrições

- Não publicar na App Store (sem custo/conta).
- Ferramentas da Apple não podem ser contornadas (assinatura obrigatória).
- Esta execução preserva PWA como caminho para iPhone.
