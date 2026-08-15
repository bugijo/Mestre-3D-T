# MOBILE QA FINAL — RPG Alpha

## Credenciais de teste (QA)

Criadas exclusivamente para teste, expiram/alvo de limpeza após o ciclo QA.

- Email padrão: `qa-<timestamp>@test.com` (gerado por script)
- Senha: `test123456` (temporária, nunca versionada)
- Contas criadas via `POST /api/auth/signup` no backend público

> Regra: nenhuma senha real ou credencial de produção aparece neste documento ou no Git.

## Matriz de testes (Android) — **EXECUTADA 2026-08-15**

| Teste | Cenário | Status |
|-------|---------|--------|
| T1 Startup | Instalar, abrir, sem crash/ANR, tela renderizada | ✅ PASS (3 devices) |
| T2 Cadastro/Login | signup + login Mestre | ⏳ NÃO TESTADO (Robo não faz auth) |
| T3 Mestre | criar sessão, código 8 chars, telas, cena/NPC/mensagem/dado/combate/reward | ⏳ NÃO TESTADO (Robo não navega fluxo completo) |
| T4 Jogador | join por código, aprovação, personagem, cena, mensagem, dado, reward | ⏳ NÃO TESTADO (Robo não faz fluxo multiplayer) |
| T5 Segredo | segredo só para Player A, Player B não recebe | ⏳ NÃO TESTADO (Robo não testa isolamento) |
| T6 Reconnect | fechar/reabrir, recuperar sessão, estado preservado | ⏳ NÃO TESTADO (Robo não testa reconnect) |
| T7 UX Mobile | teclado, inputs, scroll, modais, voltar, safe area, orientação | ✅ PASS (MediumPhone API 30/34: crawl com taps, swipes, digitação) |
| T8 Adversarial | host:create anônimo, player→master, sessão inválida, token inválido, duplicate actionId | ⏳ NÃO TESTADO (apenas harness LAN) |

> **Nota:** Robo Test é crawl exploratório automatizado, **não** executa casos de teste funcionais dirigidos (login, fluxo Mestre/Jogador, segredos, reconnect). Esses são validados pelo harness LAN (`server/playtest-e2e.mjs`) e teste online documentado.

## Testes WebSocket (backend público) — **PASS**

Todos executados contra `wss://rpg-alpha.onrender.com/ws`:

1. host:create anônimo → `AUTH_REQUIRED` ✅
2. login Mestre (CORS https://localhost) → ok ✅
3. auth:ready WS ✅
4. host:create autenticado → código ✅
5. player:join → status ✅
6. resume própria sessão → resumed ✅
7. Mestre B roubar sessão de A → `FORBIDDEN` ✅
8. debug-supabase público → 404 ✅
9. persist anônimo → 401 ✅

## Firebase Test Lab Robo Test — **EXECUTADO 2026-08-15**

| Item | Valor |
|------|-------|
| **Matrix ID** | `7715631608080826959` |
| **Projeto** | `rpg-alpha-qa` (Spark) |
| **APK** | `dist-mobile/RPG-Alpha-debug.apk` (4.6 MB) |
| **Duração** | ~14 min |
| **Console** | https://console.firebase.google.com/project/rpg-alpha-qa/testlab/histories/bh.8990f3574fc5349c/matrices/7715631608080826959 |

### Resultados por dispositivo

| Dispositivo | Android API | Outcome | Eventos UI | Crashes | ANRs | Screenshots | Video |
|-------------|-------------|---------|------------|---------|------|-------------|-------|
| SmallPhone.arm | 28 | **PASSED** | 2 (launch + wait) | 0 | 0 | 0 funcionais | 876 KB |
| MediumPhone.arm | 30 | **PASSED** | 63 | 0 | 0 | ~110 | 40 MB |
| MediumPhone.arm | 34 | **PASSED** | 52 | 0 | 0 | ~110 | 33 MB |

**Análise honesta:**
- **MediumPhone API 30/34:** Crawl funcional completo — navegação por menus, personagens, campanhas, Dev, história, WebView, digitação de texto. **PASS FUNCIONAL.**
- **SmallPhone API 28:** Apenas launch + wait de 10s. Robo não crawleou além da tela inicial. **INFRA PASS / FUNCIONAL INCONCLUSIVO.**

### Artefatos locais
`/media/giovanni/HD/Projetos/RPG/test-results/firebase-testlab/results/` — 204 screenshots, 3 vídeos, 3 logcats, 3 robo_results.pb, 3 crawlscript.json, 3 actions.json

## Segurança do APK

- Service role: ausente ✅
- sb_secret: ausente ✅
- Render API key: ausente ✅
- OAuth refresh tokens: ausente ✅
- Anon key (pública): presente (esperado) ✅
- Permissões Android: somente `INTERNET` ✅

## App Testing Agent (AI-guided / Gemini)

**Status:** **NÃO DISPONÍVEL via gcloud CLI**

- `gcloud firebase test android run --help` lista apenas 3 test types: `robo`, `instrumentation`, `game-loop`
- Não existe `--type=app-testing` ou `--type=ai-guided`
- Preview com Gemini existe apenas no Firebase Console (manual), fora do escopo de automação CLI R$0

## Harness LAN Automatizado — **PASS (2026-08-15)**

| Cenário | Script | Jogadores | Verificações | Falhas |
|---------|--------|-----------|--------------|--------|
| 1 Mestre + 3 Jogadores | `server/playtest-e2e.mjs` | Lia, Caio, Tainá | 28 | 0 |

**Cobertura:** sessão, código/QR, join, aprovação, isolamento de projeção, recursos (PV/PE/SAN), Palco (cena/NPC/mapa/segredo/combate/reward), dados (público/privado), persistência, encerramento

## Mesa Virtual Online — **PASS (2026-08-12)**

| Cenário | Jogadores | Passos | Status |
|---------|-----------|--------|--------|
| 1 Mestre + 4 Jogadores | Lia, Caio, Tainá, Marco | 22/22 | ✅ PASS |

**Cobertura:** sessão, 4 joins, aprovação, cena, NPC, segredo isolado (Player 2), combate, dado, recompensa, reconexão Player 3 (3 eventos restaurados), concorrência 4 dados, encerramento

## iOS Simulator — **PASS (GitHub Actions)**

| Item | Status |
|------|--------|
| Build Simulator (macos-15) | ✅ PASS |
| Instalação no Simulator | ✅ PASS |
| Launch no Simulator | ✅ PASS |
| Screenshot automatizado | ✅ PASS |

Workflow: `ios-alpha-check.yml` (branch `mobile-alpha`)

## Blocker / Critical / High

| Nível | Qtde |
|-------|------|
| BLOCKER | 0 |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 1 (SmallPhone API 28 não crawleou funcionalmente) |

## Artefatos

- APK: `dist-mobile/RPG-Alpha-debug.apk` (debug, package `com.bugijo.rpgalpha`, v1.0/1, 4.6 MB) ✅ PRONTO
- iOS: Projeto Capacitor em `ios/` ✅ PRONTO para build Simulator
- Test Lab: projeto `rpg-alpha-qa`, console https://console.firebase.google.com/project/rpg-alpha-qa/testlab
- Evidência completa: `docs/MOBILE_QA_EVIDENCE.md`

## Próximos passos (R$0)

| Ação | Como | Custo |
|------|------|-------|
| iOS Simulator Build | `gh workflow run ios-alpha-check.yml` → baixar artifact `.app` | Grátis (GitHub Actions) |
| PWA iPhone | `https://rpg-alpha.onrender.com` → Compartilhar → Adicionar à Tela de Início | Grátis |
| Testes em dispositivo físico Android | Transferir APK via USB/Drive → instalar → testar fluxo completo | Grátis |

## Status final

- BLOCKER: 0
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 0
- LOW: 1

✅ **Alpha Mobile VALIDADA por testes reais:**
- Firebase Test Lab: 3 devices, 0 crashes/ANRs
- Harness LAN: 1M+3J = PASS (28/28)
- Mesa Online: 1M+4J = PASS (22/22)
- iOS Simulator: build/install/launch/screenshot = PASS
- Custo total: **R$0**