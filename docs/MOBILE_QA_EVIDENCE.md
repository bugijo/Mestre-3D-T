# MOBILE_QA_EVIDENCE — RPG Alpha

**Data/hora da execução Firebase:** 2026-08-15 08:53–09:07 UTC (≈14 min)

---

## Firebase Test Lab — Matrix Real

| Item | Valor |
|------|-------|
| **Matrix ID** | `7715631608080826959` |
| **Projeto Firebase** | `rpg-alpha-qa` (Spark / gratuito) |
| **Test type** | Robo Test (crawl automatizado) |
| **APK testado** | `dist-mobile/RPG-Alpha-debug.apk` (4.6 MB, package `com.bugijo.rpgalpha`, v1.0/1) |
| **Bucket resultados** | `gs://test-lab-17dxtvawpd236-yd2hh1m4a2w8c/2026-08-15_08:53:27.612330_vjZi/` |
| **Console** | https://console.firebase.google.com/project/rpg-alpha-qa/testlab/histories/bh.8990f3574fc5349c/matrices/7715631608080826959 |

---

## Dispositivos e Outcomes

| Dispositivo (model_id) | Formato | Android API | Locale | Orientação | Outcome | Observação |
|------------------------|---------|-------------|--------|------------|---------|------------|
| `SmallPhone.arm` | Virtual | 28 (Android 9) | pt_BR | portrait | **PASSED** | Apenas launch + wait (ver abaixo) |
| `MediumPhone.arm` | Virtual | 30 (Android 11) | pt_BR | portrait | **PASSED** | Crawl extenso (~115 screenshots) |
| `MediumPhone.arm` | Virtual | 34 (Android 14) | pt_BR | portrait | **PASSED** | Crawl extenso (~115 screenshots) |

---

## Crashes e ANRs

| Dispositivo | Crashes | ANRs | Detalhes |
|-------------|---------|------|----------|
| SmallPhone.arm (API 28) | 0 | 0 | `actions.json`: apenas 2 eventos (launch + wait) |
| MediumPhone.arm (API 30) | 0 | 0 | `actions.json`: 63 eventos, todos `executionResult: SUCCESS` |
| MediumPhone.arm (API 34) | 0 | 0 | `actions.json`: 52 eventos, todos `executionResult: SUCCESS` |

**Total crashes:** 0  
**Total ANRs:** 0

---

## Artefatos Baixados Localmente

**Diretório base:** `/media/giovanni/HD/Projetos/RPG/test-results/firebase-testlab/results/`

```
results/
├── SmallPhone.arm-28-pt_BR-portrait/
│   ├── actions.json          (2 eventos: launch + wait)
│   ├── artifacts/            (0 screenshots funcionais)
│   ├── crawlscript.json
│   ├── logcat                (2.2 MB)
│   ├── robo_results.pb       (61 KB)
│   └── video.mp4             (876 KB)
├── MediumPhone.arm-30-pt_BR-portrait/
│   ├── actions.json          (63 eventos)
│   ├── artifacts/            (~110 screenshots PNG)
│   ├── crawlscript.json
│   ├── logcat
│   ├── robo_results.pb
│   └── video.mp4             (40 MB)
└── MediumPhone.arm-34-pt_BR-portrait/
    ├── actions.json          (52 eventos)
    ├── artifacts/            (~110 screenshots PNG)
    ├── crawlscript.json
    ├── logcat
    ├── robo_results.pb
    └── video.mp4             (33 MB)
```

**Totais:**
- Screenshots (PNG): **204** (todas em `artifacts/`)
- Vídeos (MP4): **3** (~74 MB total)
- Logs: **3 logcats** + **3 robo_results.pb** + **3 crawlscript.json**

---

## Análise por Dispositivo

### MediumPhone.arm API 30 — **PASS FUNCIONAL COMPLETO**
- 63 eventos de UI registrados
- Navegação por múltiplas telas (menu, personagens, campanhas, Dev, jogar, história, etc.)
- Interações: taps, swipes, digitação de texto, navegação por WebView
- Zero crashes, zero ANRs

### MediumPhone.arm API 34 — **PASS FUNCIONAL COMPLETO**
- 52 eventos de UI registrados
- Crawl similar ao API 30
- Zero crashes, zero ANRs

### SmallPhone.arm API 28 — **INFRAESTRUCTURE PASS / FUNCIONAL INCONCLUSIVO**
- `actions.json` contém apenas 2 eventos:
  1. `launch` (app iniciou)
  2. `wait` (10 segundos de espera, sem ações de crawl)
- **Sem screenshots funcionais** (apenas launch frame)
- **Sem exploração de UI** — Robo não crawleou além da tela inicial
- Video de 876 KB mostra apenas tela inicial estática
- **Conclusão honesta:** App instala e abre sem crash/ANR (infraestrutura OK), mas exploração funcional não ocorreu neste dispositivo/API

---

## App Testing Agent (AI-guided / Gemini)

**Status:** **NÃO DISPONÍVEL via gcloud CLI**

### Verificação realizada:
- `gcloud firebase test android run --help` lista apenas 3 test types:
  - `robo` (usado acima)
  - `instrumentation`
  - `game-loop`
- Não existe flag `--type=app-testing` ou `--type=ai-guided`
- Documentação oficial (Firebase console) menciona "App Testing Agent" como preview com Gemini para casos em linguagem natural, mas **não está exposto no gcloud CLI** nem na API pública usada pelo CLI
- Tier Spark não altera disponibilidade de tipos de teste — o tipo simplesmente não existe no CLI

**Conclusão:** Não é possível executar App Testing Agent via automação CLI. Se disponível, seria apenas no Firebase Console (manual), fora do escopo desta automação R$0.

---

## Testes de Integração (Harness LAN)

### ONLINE — Mesa Virtual (documentado anteriormente)
- **Data:** 2026-08-12
- **Cenário:** 1 Mestre + 4 Jogadores (Lia, Caio, Tainá, Marco)
- **URL:** https://rpg-alpha.onrender.com
- **Resultado:** **PASS** — 22/22 passos validados
  - Sessão criada, 4 jogadores conectam, aprovação, cena, NPC, segredo (isolado), combate, dado, recompensa, reconexão Player 3, concorrência 4 dados, encerramento

### HARNESS LAN AUTOMATIZADO (executado agora)
- **Script:** `server/playtest-e2e.mjs`
- **Data:** 2026-08-15
- **Cenário:** 1 Mestre + 3 Jogadores (Lia, Caio, Tainá)
- **Resultado:** **PASS** — 25 passos / 28 verificações, **0 falhas**
  - Sessão, código/QR, join, aprovação, isolamento de projeção, recursos (PV/PE/SAN), Palco (cena/NPC/mapa/segredo/combate/reward), dados (público/privado), persistência, encerramento

---

## iOS Simulator (confirmado anteriormente)

| Item | Status |
|------|--------|
| Build Simulator (GitHub Actions macos-15) | ✅ PASS |
| Instalação no Simulator | ✅ PASS |
| Launch no Simulator | ✅ PASS |
| Screenshot automatizado | ✅ PASS |
| Workflow | `ios-alpha-check.yml` |

---

## Cota Firebase Spark (Gratuita)

| Recurso | Limite Diário | Usado Hoje | Restante |
|---------|---------------|------------|----------|
| Virtual Device Tests | 10 | 3 | 7 |
| Tempo Virtual Device | 60 min | ~14 min | ~46 min |
| Physical Device Tests | 5 | 0 | 5 |
| Physical Device Tempo | 30 min | 0 | 30 min |

**Nenhum billing ativado.** Projeto permanece no tier Spark.

---

## Classificação de Severidade

| Nível | Qtde | Detalhes |
|-------|------|----------|
| **BLOCKER** | 0 | — |
| **CRITICAL** | 0 | — |
| **HIGH** | 0 | — |
| **MEDIUM** | 0 | — |
| **LOW** | 1 | SmallPhone API 28 não crawleou funcionalmente (apenas launch) |

---

## Commit Final

**Branch:** `mobile-alpha`  
**Arquivos versionados (documentação):**
- `docs/MOBILE_QA_EVIDENCE.md` (este arquivo)
- `docs/MOBILE_QA_FINAL.md` (atualizado com resultados reais)
- `docs/ANDROID_CLOUD_QA.md` (atualizado com resultados reais)

**NÃO versionados (conforme política):**
- Vídeos (`*.mp4` — ~74 MB)
- Screenshots em massa (204 PNGs)
- Logcats brutos
- APK duplicado
- Credenciais/tokens

---

## Resumo Final (formato solicitado)

```
Android build: PASS (GitHub Actions)
Firebase matrix: 7715631608080826959 — 3 devices, ~14 min
Medium API30: PASS (crawl extenso, 63 eventos, 0 crash/ANR)
Medium API34: PASS (crawl extenso, 52 eventos, 0 crash/ANR)
Small API28: INFRA PASS / FUNCIONAL INCONCLUSIVO (apenas launch + wait)
App Testing Agent: NÃO DISPONÍVEL via CLI (apenas 3 types: robo/instrumentation/game-loop)
1M+4J online: PASS (2026-08-12, 22/22 passos)
1M+3J harness: PASS (2026-08-15, 28/28 verificações)
iOS Simulator: PASS (build/install/launch/screenshot)
BLOCKER: 0
CRITICAL: 0
HIGH: 0
Custo: R$0
Commit final: mobile-alpha (docs only)
```