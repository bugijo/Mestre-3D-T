# ⚡ Setup Supabase - 3 Passos Rápidos

## ⏱️ Tempo: 5 minutos

---

## 📝 PASSO 1: Criar Projeto (2 min)

1. Acesse: https://supabase.com/dashboard
2. Click **"New Project"**
3. Preencha:
   ```
   Name: GM-Forge-Web
   Password: [criar senha forte - GUARDAR]
   Region: South America (São Paulo)
   ```
4. Click **"Create"** e aguarde ~2 minutos

---

## 💾 PASSO 2: Executar SQL (1 min)

1. No projeto criado, vá em **SQL Editor** (menu lateral)
2. Click **"New Query"**
3. Abra o arquivo **`QUICK_SETUP.sql`** (mesma pasta)
4. **COPIAR TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. **COLAR** no SQL Editor
6. Click **"RUN"** (ou F5)
7. ✅ Verificar mensagem: "Success. No rows returned"

**PRONTO! Database criado!** 🎉

---

## 🔑 PASSO 3: Configurar Credentials (2 min)

### 3.1 - Obter Credentials

1. No projeto, vá em **Settings → API**
2. **COPIAR**:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   ```

### 3.2 - Atualizar Código

Abra: **`web/src/main.js`**

Encontre (linhas 5-6):
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

**SUBSTITUIR** por suas credentials:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Cole aqui
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Cole aqui
```

### 3.3 - Ativar Supabase

Encontre (linhas 13-15):
```javascript
// Descomentar quando tiver credentials:
// supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// isAuthEnabled = true;
```

**DESCOMENTAR** (remover `//`):
```javascript
// Descomentar quando tiver credentials:
supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
isAuthEnabled = true;
```

**SALVAR arquivo!** 💾

---

## ✅ TESTAR

1. **Reload** da aplicação (F5)
2. Click **"Register"**
3. Criar conta com **email REAL**
4. **Confirmar email** (check inbox)
5. **Login**
6. **Criar campaign**
7. Ir no **Supabase Dashboard → Table Editor → campaigns**
8. ✅ **Ver sua campaign salva!**

---

## 🎉 PRONTO!

**Agora você tem:**
- ✅ Auth real funcionando
- ✅ Database persistence
- ✅ Multi-user isolado
- ✅ Production-ready!

**Enjoy!** 🚀
