# 📱 Como Gerar e Instalar o APK

## Método 1: Via Android Studio (Recomendado)

### Passo 1: Abrir o Projeto
1. Execute o arquivo `COMPILAR_APK.bat` na raiz do projeto
2. Ou abra o Android Studio manualmente e selecione esta pasta

### Passo 2: Sincronizar o Projeto
- Aguarde o Android Studio baixar as dependências
- Isso pode levar alguns minutos na primeira vez

### Passo 3: Compilar o APK
1. No menu superior: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Aguarde a compilação
3. Clique em "locate" quando aparecer a notificação de sucesso

### Passo 4: Localizar o APK
O arquivo estará em:
```
app/build/outputs/apk/debug/app-debug.apk
```

### Passo 5: Instalar no Celular
1. Transfira o APK para seu celular (via USB, nuvem, etc)
2. No celular, ative "Fontes Desconhecidas" nas configurações
3. Abra o arquivo APK e clique em Instalar

---

## Método 2: Download Direto do Gradle (Se você tiver Gradle)

Se você tiver o Gradle instalado globalmente, execute:

```bash
gradle wrapper --gradle-version 8.2
./gradlew assembleDebug
```

O APK será gerado em `app/build/outputs/apk/debug/app-debug.apk`

---

## Solução de Problemas

### "Fontes Desconhecidas" bloqueadas
**Solução:** Vá em Configurações → Segurança → Permitir instalação de apps desconhecidos

### Erro de compilação no Android Studio
**Solução:** 
1. File → Invalidate Caches / Restart
2. Build → Clean Project
3. Build → Rebuild Project

### SDK não encontrado
**Solução:**
1. Tools → SDK Manager
2. Instale Android 13 (API 34) ou superior

---

## Recursos Necessários

- ✅ Android Studio (Baixe em: https://developer.android.com/studio)
- ✅ Android SDK configurado
- ✅ JDK 17 ou superior (incluído no Android Studio)
- ✅ Espaço em disco: ~500MB para build

---

## Após Instalar

1. Abra o app "Mestre 3D&T" no celular
2. Conceda as permissões solicitadas
3. Comece criando sua primeira campanha!
4. Teste todas as funcionalidades conforme o checklist no `walkthrough.md`

---

**Dica:** Para instalar em outros dispositivos, basta transferir o mesmo arquivo APK.
