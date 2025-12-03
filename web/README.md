# Mestre 3D&T - Versão Web 🌐

Versão web do Mestre 3D&T, **idêntica** ao app Android.

## ✅ Status

- **App Android:** Compilando com sucesso (todas correções aplicadas)
- **Versão Web:** Funcionando com Tailwind CDN
- **Tema:** Arcane Dark idêntico (glassmorphism, neon purple/blue)

## 🚀 Como Rodar

### Opção 1: Live Server (VS Code)
1. Instale extensão "Live Server" no VS Code
2. Abra `web/index.html`
3. Clique direito → "Open with Live Server"
4. Acesse: `http://localhost:5500`

### Opção 2: Python Server
```bash
cd web
python -m http.server 8000
```
Acesse: `http://localhost:8000`

### Opção 3: Abrir Diretamente
Abra `web/index.html` no navegador (funciona, mas sem hot reload)

## 📁 Estrutura

```
web/
├─ index.html          # Entry point (Tailwind CDN)
├─ src/
│  ├─ main.ts          # Welcome screen
│  ├─ styles/
│  │  └─ globals.css   # Glassmorphism utilities
│  └─ components/      # (futuro) React components
└─ README.md
```

## 🎨 Tema

Mesmas cores do app Android:
- **Surface:** #1E1E2E (dark background)
- **Primary Purple:** #9D4EDD (neon highlight)
- **Primary Blue:** #5E60CE
- **Glassmorphism:** backdrop-blur + border white/10

## 🔄 Próximos Passos

1. Migrar para Vite + React (quando npm funcionar)
2. Criar componentes reutilizáveis
3. Integrar Supabase
4. Implementar rotas (Dashboard, NPCs, Enemies)

## ⚡ Vantagens

- ✅ Sem instalação npm (Tailwind CDN)
- ✅ Roda direto no navegador
- ✅ Hot reload com Live Server
- ✅ Tema idêntico ao app
- ✅ Pronto para desenvolvimento
