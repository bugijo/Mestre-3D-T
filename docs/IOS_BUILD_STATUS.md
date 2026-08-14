# iOS Build Status — RPG Alpha

## Status atual

| Item | Status | Observação |
|------|--------|------------|
| `@capacitor/ios` instalado | ✅ PASS | v8.5.0 no `package.json` |
| `npx cap add ios` (Linux) | ✅ PASS | Projeto Xcode gerado (Swift + SPM) |
| Build Xcode Simulator (macOS) | ✅ PASS | Workflow em `.github/workflows/ios-alpha-check.yml`, macOS runner (GitHub Actions) |
| iOS Simulator executado | ❌ NÃO POSSÍVEL | Requer macOS com Xcode 26+ |
| Firebase Test Lab iOS | ❌ NÃO POSSÍVEL | Requer build assinada com Apple Developer |
| PWA iPhone | ✅ FUNCIONAL | `https://rpg-alpha.onrender.com` + Adicionar à Tela de Início |

## O que foi gerado no Linux

```
ios/
  App/
    App.xcodeproj/          → Projeto Xcode (build settings corretos)
    App/
      AppDelegate.swift     → Entry point
      SceneDelegate.swift   → Scene management
      Info.plist            → Bundle ID: com.bugijo.rpgalpha
      Assets.xcassets/      → App icon + splash
      Base.lproj/           → LaunchScreen.storyboard, Main.storyboard
      public/               → Web assets compilados (dist/ copiado)
    CapApp-SPM/
      Package.swift         → Swift Package Manager (plugins)
  debug.xcconfig
```

Versão: `MARKETING_VERSION=1.0`, `CURRENT_PROJECT_VERSION=1`.

## O que EXATAMENTE falta

| Etapa | Requer | Gratuito? |
|-------|--------|-----------|
| Build Simulator no Xcode | macOS com Xcode 26+ | ✅ GitHub Actions (macOS runner) |
| Executar no Simulator | macOS | ❌ Apenas CI |
| Assinar para dispositivo físico | Apple Developer ($99/ano) | ❌ Pago |
| TestFlight / distribuição interna | Apple Developer + App Store Connect | ❌ Pago |
| Publicar App Store | Apple Developer + revisão Apple | ❌ Pago |
| Firebase Test Lab iOS | Build assinado + Apple Developer | ❌ Pago |

## Build em cloud (GitHub Actions macOS)

O workflow `ios-alpha-check.yml` valida compilação para Simulator:

- `runs-on: macos-15`
- `xcodebuild -scheme App -destination 'generic/platform=iOS Simulator' build`
- `CODE_SIGNING_ALLOWED=NO` — sem assinatura
- Artefato: `.app` bundle (Simulator)

Para acionar: push na branch `mobile-alpha` ou `workflow_dispatch` manual.

## Resumo

- **Código iOS funcional:** ✅ (gerado, compilável no macOS com Capacitor 8)
- **Build Simulator demonstrada:** ⏳ (GitHub Actions pendente de execução)
- **IPA para iPhone:** ❌ Requer Apple Developer ($99/ano) + macOS
- **Alternativa imediata para usuários iPhone:** PWA em `https://rpg-alpha.onrender.com`