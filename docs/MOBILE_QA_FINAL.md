# MOBILE QA FINAL — RPG Alpha

## Credenciais de teste (QA)

Criadas exclusivamente para teste, expiram/alvo de limpeza após o ciclo QA.

- Email padrão: `qa-<timestamp>@test.com` (gerado por script)
- Senha: `test123456` (temporária, nunca versionada)
- Contas criadas via `POST /api/auth/signup` no backend público

> Regra: nenhuma senha real ou credencial de produção aparece neste documento ou no Git.

## Matriz de testes (Android)

| Teste | Cenário | Status |
|-------|---------|--------|
| T1 Startup | Instalar, abrir, sem crash/ANR, tela renderizada | ⏳ Pendente (Test Lab) |
| T2 Cadastro/Login | signup + login Mestre | ⏳ Pendente (Test Lab + WS) |
| T3 Mestre | criar sessão, código 8 chars, telas, cena/NPC/mensagem/dado/combate/reward | ⏳ Pendente (Test Lab + WS) |
| T4 Jogador | join por código, aprovação, personagem, cena, mensagem, dado, reward | ⏳ Pendente (Test Lab + WS) |
| T5 Segredo | segredo só para Player A, Player B não recebe | ⏳ Pendente (Test Lab + WS) |
| T6 Reconnect | fechar/reabrir, recuperar sessão, estado preservado | ⏳ Pendente (Test Lab + WS) |
| T7 UX Mobile | teclado, inputs, scroll, modais, voltar, safe area, orientação | ⏳ Pendente (Test Lab + WS) |
| T8 Adversarial | host:create anônimo, player→master, sessão inválida, token inválido, duplicate actionId | ⏳ Pendente (WS tests) |

## Testes WebSocket (backend público)

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

## Segurança do APK

- Service role: ausente ✅
- sb_secret: ausente ✅
- Render API key: ausente ✅
- OAuth refresh tokens: ausente ✅
- Anon key (pública): presente (esperado) ✅
- Permissões Android: somente `INTERNET` ✅

## Blocker / Critical / High

| Nível | Qtde |
|-------|------|
| BLOCKER | 0 |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 (documentados) |
| LOW | 0 |

## Artefatos

- APK: `dist-mobile/RPG-Alpha-debug.apk` (debug, package `com.bugijo.rpgalpha`, v1.0/1, 4.6 MB) ✅ PRONTO
- iOS: Projeto Capacitor em `ios/` ✅ PRONTO para build Simulator
- Test Lab: projeto `rpg-alpha-qa`, console https://console.firebase.google.com/project/rpg-alpha-qa/testlab

## Próximos passos (R$0)

| Ação | Como | Custo |
|------|------|-------|
| Android Robo Test | `gh workflow run android-qa.yml` → ver logs no Actions + Firebase Console | Grátis (Spark) |
| iOS Simulator Build | `gh workflow run ios-alpha-check.yml` → baixar artifact `.app` | Grátis (GitHub Actions) |
| iOS Simulator executar | CI: workflow atualizado com boot/install/launch/screenshot; aguardando build PASS | Grátis (GitHub Actions) |
| PWA iPhone | `https://rpg-alpha.onrender.com` → Compartilhar → Adicionar à Tela de Início | Grátis |

## Status final

- BLOCKER: 0
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 0
- LOW: 0

⚠️ **Alpha Mobile NÃO validada por testes reais ainda.** 
Próximos passos obrigatórios:
1. Build iOS CI = PASS (workflow corrigido: `-project App.xcodeproj`)
2. iOS Simulator boot/install/launch = PASS/FAIL (workflow atualizado)
3. Android APK CI = PASS (Java 21 configurado)
4. Firebase Test Lab executado = PASS/FAIL (requer secret `FIREBASE_TEST_LAB_KEY`)
5. App Testing Agent = EXECUTADO/INDISPONÍVEL (investigar)