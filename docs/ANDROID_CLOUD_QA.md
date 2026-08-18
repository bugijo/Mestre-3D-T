# Android Cloud QA — Firebase Test Lab

## Plataforma usada

- **Firebase Test Lab** (Google Cloud) — infraestrutura oficial de testes em nuvem.
- Robo Test: crawler automatizado da UI (não requer teste instrumentado).
- **App Testing Agent (AI-guided / Gemini)**: disponível via `firebase apptesting:execute` (Firebase CLI 15.27.0).
- Projeto Firebase: `rpg-alpha-qa` (Spark / gratuito, sem billing).

## Dispositivos (matriz Robo Test) — EXECUTADOS 2026-08-15

| Perfil | Modelo | Android | Tela | Tipo | Outcome |
|--------|--------|---------|------|------|---------|
| A — pequena/antiga | SmallPhone.arm | 28 (Android 9) | 1280x720 | Virtual | **PASSED** (infra apenas) |
| B — intermediária | MediumPhone.arm | 30 (Android 11) | 2400x1080 | Virtual | **PASSED** (funcional) |
| C — moderna | MediumPhone.arm | 34 (Android 14) | 2400x1080 | Virtual | **PASSED** (funcional) |

Todas em `locale=pt_BR`, `orientation=portrait`.

## Execução Real Robo Test (CLI local)

```bash
# Autenticação prévia
gcloud auth login
gcloud config set project rpg-alpha-qa

# Rodar Robo test (3 devices)
gcloud firebase test android run \
  --type robo \
  --app dist-mobile/RPG-Alpha-debug.apk \
  --device model=SmallPhone.arm,version=28,locale=pt_BR,orientation=portrait \
  --device model=MediumPhone.arm,version=30,locale=pt_BR,orientation=portrait \
  --device model=MediumPhone.arm,version=34,locale=pt_BR,orientation=portrait \
  --timeout 15m \
  --project rpg-alpha-qa
```

**Matrix ID:** `7715631608080826959`  
**Console:** https://console.firebase.google.com/project/rpg-alpha-qa/testlab/histories/bh.8990f3574fc5349c/matrices/7715631608080826959  
**Duração:** ~14 minutos  
**Bucket resultados:** `gs://test-lab-17dxtvawpd236-yd2hh1m4a2w8c/2026-08-15_08:53:27.612330_vjZi/`

## Resultados Detalhados (Robo Test)

| Dispositivo | API | Outcome | Eventos UI | Crashes | ANRs | Screenshots | Video |
|-------------|-----|---------|------------|---------|------|-------------|-------|
| SmallPhone.arm | 28 | **PASSED** | 2 (launch + wait) | 0 | 0 | 0 funcionais | 876 KB |
| MediumPhone.arm | 30 | **PASSED** | 63 | 0 | 0 | ~110 | 40 MB |
| MediumPhone.arm | 34 | **PASSED** | 52 | 0 | 0 | ~110 | 33 MB |

### Análise por dispositivo

**MediumPhone.arm API 30 — PASS FUNCIONAL COMPLETO**
- 63 eventos: taps, swipes, digitação em EditText, navegação WebView
- Telas visitadas: menu, personagens, campanhas, Dev, jogar, história, admin
- Zero crashes, zero ANRs

**MediumPhone.arm API 34 — PASS FUNCIONAL COMPLETO**
- 52 eventos: padrão similar ao API 30
- Zero crashes, zero ANRs

**SmallPhone.arm API 28 — INFRA PASS / FUNCIONAL INCONCLUSIVO**
- Apenas 2 eventos: `launch` + `wait` (10s)
- Robo não crawleou além da tela inicial
- Video mostra tela estática
- **Conclusão:** App instala e abre sem crash/ANR, mas exploração funcional não ocorreu

## Artefatos Baixados (Robo Test)

Local: `/media/giovanni/HD/Projetos/RPG/test-results/firebase-testlab/results/`

```
results/
├── SmallPhone.arm-28-pt_BR-portrait/
│   ├── actions.json, crawlscript.json, logcat, robo_results.pb, video.mp4
│   └── artifacts/ (vazio — sem screenshots funcionais)
├── MediumPhone.arm-30-pt_BR-portrait/
│   ├── actions.json, crawlscript.json, logcat, robo_results.pb, video.mp4
│   └── artifacts/ (~110 PNGs)
└── MediumPhone.arm-34-pt_BR-portrait/
    ├── actions.json, crawlscript.json, logcat, robo_results.pb, video.mp4
    └── artifacts/ (~110 PNGs)
```

**Totais:** 204 screenshots, 3 vídeos (~74 MB), 3 logcats, 3 robo_results.pb, 3 crawlscript.json

## Casos de teste cobertos pelo Robo Test

- ✅ Startup: instalar, abrir, sem crash, sem ANR (3/3 devices)
- ✅ Navegação básica: Robo crawls telas automaticamente (2/3 devices — MediumPhone)
- ❌ Login/cadastro: **NÃO TESTADO** (Robo não preenche forms de auth)
- ❌ Fluxo Mestre/Jogador: **NÃO TESTADO** (requer harness LAN ou instrumentação)

> Para fluxo completo (login, sessão, segredos, reconnect, combate, recompensa), ver `server/playtest-e2e.mjs` (harness LAN) e `docs/ONLINE_PLAYTEST.md` (mesa online).

## App Testing Agent (AI-guided / Gemini) — **EXECUTADO VIA FIREBASE CLI**

### Disponibilidade
- **Comando:** `firebase apptesting:execute` (Firebase CLI 15.27.0)
- **Não** requer `gcloud` — usa o CLI `firebase` diretamente
- Tier Spark permite execução
- Documentação anterior de "NÃO DISPONÍVEL via CLI" estava **desatualizada**

### Execuções realizadas (múltiplas):

| Execução | Cenário | Resultado |
|----------|---------|-----------|
| 1 | Launch app + verify main dashboard | ✅ PASS |
| 2 | Dashboard Mestre + "PREPARAR AGORA" | ✅ PASS |
| 3 | Seleção "O Caso de Santa Aurora" | ✅ PASS |
| 4 | Sessão local ativa + "Abrir mesa na rede" | ✅ PASS |
| 5 | Fluxo ONLINE completo (login → auth → host:ready → código 8 chars) | 🟡 INCONCLUSIVO — FAILED_AI_STEP |

### Análise honesta
- O **FAILED_AI_STEP** indica que o agente de IA (Gemini) não completou a navegação guiada até o final
- **Não prova falha funcional do backend/app** — backend WebSocket validado separadamente (22/22 online, 28/28 harness LAN)
- App Testing Agent **não executou fluxo completo E2E** com jogadores reais
- **Não serão executados mais App Testing Agent neste ciclo**

## APK Verificado

- Package: `com.bugijo.rpgalpha`
- Version: 1.0 (code 1)
- Arquitetura: universal (arm64 + x86 via Gradle)
- Permissões: `INTERNET` apenas
- Keystore: debug (não assinado para produção)
- Tamanho: 4.6 MB

## Workflow CI (`android-qa.yml`) — Configurado

- Java 21 via `actions/setup-java` (temurin)
- Build APK debug
- 1 dispositivo inicial (MediumPhone.arm Android 14) para respeitar cota Spark
- Condicional ao secret `FIREBASE_TEST_LAB_KEY`
- Artifacts: APK, Test Lab results, screenshots

**Próximo passo para CI:** Configurar secret `FIREBASE_TEST_LAB_KEY` no GitHub → Executar workflow `android-qa.yml` → aguardar matrix FINISHED → recuperar screenshots/vídeo/logs.

## Cota gratuita (Spark) — Consumo Real

| Etapa | Dispositivos | Tempo | Tipo |
|-------|--------------|-------|------|
| Robo Test (2026-08-15) | 3 | ~14 min | Virtual |
| App Testing Agent (múltiplas execuções posteriores) | N/A | N/A | AI-guided |

**Billing não foi ativado durante o ciclo.** Projeto permanece no tier Spark.
**Não há contagem de "quota restante" medida** — execuções de App Testing Agent não consomem a mesma cota de device-minutos do Robo Test.

## Classificação de Severidade

| Nível | Qtde | Detalhes |
|-------|------|----------|
| BLOCKER | 0 | — |
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 1 | SmallPhone API 28 não crawleou funcionalmente |

## Evidência Completa

Ver `docs/MOBILE_QA_EVIDENCE.md` para:
- Matrix ID, timestamps, localização de todos os artefatos
- Análise honesta por dispositivo
- App Testing Agent resultados detalhados
- Comparação com harness LAN e mesa online
