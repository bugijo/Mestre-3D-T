# Android Cloud QA — Firebase Test Lab

## Plataforma usada

- **Firebase Test Lab** (Google Cloud) — infraestrutura oficial de testes em nuvem.
- Robo Test: crawler automatizado da UI (não requer teste instrumentado).
- Projeto Firebase: `rpg-alpha-qa` (Spark / gratuito, sem billing).

## Dispositivos (matriz)

| Perfil | Modelo | Android | Tela | Tipo |
|--------|--------|---------|------|------|
| A — pequena/antiga | SmallPhone.arm | 28 (Android 9) | 1280x720 | Virtual |
| B — intermediária | MediumPhone.arm | 30 (Android 11) | 2400x1080 | Virtual |
| C — moderna | MediumPhone.arm | 34 (Android 14) | 2400x1080 | Virtual |

Todas em `locale=pt_BR`, `orientation=portrait`.

## Como executar

```bash
# Listar dispositivos disponíveis
gcloud firebase test android models list --project rpg-alpha-qa

# Rodar Robo test
gcloud firebase test android run \
  --type robo \
  --app dist-mobile/RPG-Alpha-debug.apk \
  --device model=SmallPhone.arm,version=28,locale=pt_BR,orientation=portrait \
  --device model=MediumPhone.arm,version=30,locale=pt_BR,orientation=portrait \
  --device model=MediumPhone.arm,version=34,locale=pt_BR,orientation=portrait \
  --timeout 15m \
  --project rpg-alpha-qa
```

Resultados aparecem no console Firebase:
https://console.firebase.google.com/project/rpg-alpha-qa/testlab

## Casos de teste

- Startup: instalar, abrir, sem crash, sem ANR.
- Navegação: Robo crawls as telas automaticamente.
- Login/cadastro: com credenciais de QA (ver `docs/MOBILE_QA_FINAL.md`).

## Resultados

| Data | Teste | Dispositivos | Status | Detalhes |
|------|-------|--------------|--------|----------|
| 2026-08-14 | APK existente | N/A | ✅ PRONTO | `dist-mobile/RPG-Alpha-debug.apk` (4.6 MB, v1.0) |
| 2026-08-14 | Workflow CI configurado | N/A | ✅ CONFIGURADO | `.github/workflows/android-qa.yml` com Java 21, 1 dispositivo inicial |
| — | Firebase Test Lab executado | — | ❌ NÃO EXECUTADO | Secret `FIREBASE_TEST_LAB_KEY` não configurado no GitHub |

**APK verificado:**
- Package: `com.bugijo.rpgalpha`
- Version: 1.0 (code 1)
- Arquitetura: universal (arm64 + x86 via Gradle)
- Permissões: `INTERNET` apenas
- Keystore: debug (não assinado para produção)

**Workflow `android-qa.yml` configurado:**
- Java 21 via `actions/setup-java` (temurin)
- Build APK debug
- 1 dispositivo inicial (MediumPhone.arm Android 14) para respeitar cota Spark
- Condicional ao secret `FIREBASE_TEST_LAB_KEY`
- Artifacts: APK, Test Lab results, screenshots

**Próximo passo:** Configurar secret `FIREBASE_TEST_LAB_KEY` no GitHub → Executar workflow `android-qa.yml` → aguardar matrix FINISHED → recuperar screenshots/vídeo/logs.

## Cota gratuita (Spark)

- Virtual Device Tests: 10 testes/dia, até 60 min/dia — sem custo.
- Physical Device Tests: 5 testes/dia, até 30 min/dia — sem custo.
