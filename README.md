# 🎮 GM Forge Web - Plataforma de RPG para Game Masters

> **Plataforma web completa para mestres de RPG gerenciarem campanhas, NPCs, sessões e aventuras do sistema 3D&T**

[![Status](https://img.shields.io/badge/status-production--ready-success)](https://github.com/bugijo/Mestre-3D-T)
[![Progress](https://img.shields.io/badge/progress-100%25-brightgreen)](https://github.com/bugijo/Mestre-3D-T)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features Principais

### 🎯 Core Features
- ✅ **Authentication System** - Login/Register completo com Supabase Auth
- ✅ **Campaign Management** - CRUD completo de campanhas com covers
- ✅ **NPCs & Characters** - Biblioteca com stats 3D&T (F/H/R/A/PdF)
- ✅ **Interactive Map** - Grid, Zoom, Fog of War toggleável
- ✅ **Session Manager** - Tokens drag & drop, Initiative tracker, Combat log
- ✅ **Music Player** - HTML5 Audio com playlists temáticas
- ✅ **Dice Roller** - 7 tipos de dados com animações premium
- ✅ **Lore Library** - Organize factions, locations, items, NPCs
- ✅ **Quest Tracker** - Status tracking com checkpoints
- ✅ **Session Notes** - Editor markdown com auto-save
- ✅ **Settings Screen** - Theme toggle, Volume, Preferences

### 🚀 Advanced Features
- 🔍 **Search & Filters** - Busca de NPCs por nome, tipo e level
- 🎨 **Premium UI** - Glassmorphism, animações suaves, design épico
- 📱 **Responsive** - Adaptável para desktop, tablet e mobile
- 💾 **Persistence** - Supabase database ou demo mode local
- 🔒 **Multi-user** - RLS policies para isolamento de dados
- 🎵 **Audio System** - Volume control, shuffle, repeat
- 🗺️ **Map Tools** - Grid overlay, zoom controls, fog system

---

## 🛠️ Stack Tecnológico

### Frontend
- **HTML5** - Estrutura semantic
- **Vanilla CSS** - Glassmorphism design system
- **JavaScript (ES6+)** - Sem frameworks, pure JS
- **Canvas API** - Map rendering e waveform animations

### Backend & Services
- **Supabase** - Auth, PostgreSQL database, RLS
- **HTML5 Audio API** - Music player controls
- **LocalStorage** - Settings persistence

### Design
- **Google Fonts** - Inter typography
- **Color Palette** - Purple (#BB86FC), Green (#00FF9D), Red (#FF5252)
- **Animations** - CSS transitions, keyframes, transforms

---

## 📦 Instalação e Setup

### 1. Clone o Repositório
```bash
git clone https://github.com/bugijo/Mestre-3D-T.git
cd Mestre-3D-T/web
```

### 2. Servidor Local
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Acesse: **http://localhost:8000**

### 3. Configurar Supabase (Opcional)

**Para habilitar persistence real:**

1. Siga o guia completo: `SUPABASE_SETUP.md`
2. Criar projeto no [Supabase Dashboard](https://supabase.com)
3. Executar SQL schema (campaigns + npcs tables)
4. Copiar URL e anon key
5. Atualizar em `web/src/main.js`:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
```

6. Descomentar:
```javascript
supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
isAuthEnabled = true;
```

**Sem Supabase:** App funciona em demo mode com localStorage!

---

## 📁 Estrutura do Projeto

```
web/
├── index.html              # Página principal
├── src/
│   ├── main.js            # Lógica aplicação (2000+ linhas)
│   └── styles/
│       ├── globals.css    # Estilos globais + utilities
│       └── auth.css       # Estilos autenticação
├── SUPABASE_SETUP.md      # Guia configuração Supabase
└── README.md              # Este arquivo
```

---

## 🎮 Como Usar

### Demo Mode (Sem Supabase)
1. Acesse http://localhost:8000
2. Login com **qualquer email/senha**
3. Explore todas features!
4. Dados salvos em localStorage

### Production Mode (Com Supabase)
1. Configure Supabase (veja acima)
2. Register nova conta (email real)
3. Confirme email
4. Login e crie campaigns/npcs
5. Dados persistidos no database!

---

## 🎯 Features Por Categoria

### 📊 Campaign Management
- Create, edit, delete campaigns
- Progress tracking (0-100%)
- Player count management
- Cover images URLs
- Next session countdown

### 👥 NPCs & Characters
- Create NPCs com stats 3D&T
- Tipo: Aliado/Inimigo/Boss
- Atributos: F/H/R/A/PdF (0-5)
- Auto-calc PV (5 + R×5) e PM (5 + PdF×5)
- Filtros: Type, Level (1-5, 6-10, 11-20)
- Search bar real-time

### 🗺️ Session Management
- Interactive map canvas
- Token drag & drop
- Initiative tracker
- Combat log com timestamps
- Grid toggle
- Zoom controls (50%-200%)
- Fog of War layer

### 🎲 Dice Roller
- 7 tipos: d4, d6, d8, d10, d12, d20, d100
- Animação premium de roll
- History log persistido
- Critical/Fail highlights
- Modificadores

### 🎵 Music Player
- 3 playlists: Battle, Exploration, Tavern
- HTML5 Audio controls
- Volume slider (0-100%)
- Shuffle & Repeat toggles
- Waveform animation

### ⚙️ Settings
- Dark/Light theme toggle
- Display name editing
- Music volume control
- Auto-save notes toggle
- Dice animation speed

---

## 🚀 Progresso do Desenvolvimento

### ✅ Completo (100%)
- [x] Fase 1: Fundação UI/UX
- [x] Fase 2: Supabase Integration (guia completo)
- [x] Fase 3: NPCs Library (com filtros)
- [x] Fase 4: Map & Tokens (interactive)
- [x] Fase 5: Media Player (HTML5 Audio)
- [x] Fase 6: Dice Roller
- [x] Fase 7: Lore & Notes
- [x] Fase 8: Settings Screen

### 📈 Estatísticas
- **Total Linhas Código:** ~2,000 JS + ~2,500 CSS
- **Commits:** 60+
- **Development Time:** [Seu tempo]
- **Features:** 25+
- **Screens:** 12

---

## 🎨 Design System

### Cores Principais
```css
--purple-primary: #BB86FC;
--green-success: #00FF9D;
--red-error: #FF5252;
--background: #0f0f1e;
--glass: rgba(255,255,255,0.05);
```

### Glassmorphism
```css
background: rgba(255,255,255,0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(187,134,252,0.2);
box-shadow: 0 8px 32px rgba(0,0,0,0.3);
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

**Bugijo**
- GitHub: [@bugijo](https://github.com/bugijo)
- Projeto: [Mestre-3D-T](https://github.com/bugijo/Mestre-3D-T)

---

## 🙏 Agradecimentos

- Sistema 3D&T pela inspiração
- Comunidade RPG brasileira
- Supabase pelo backend incrível
- Todos os game masters aventureiros! 🎲

---

## 📸 Screenshots

```
[ADD Screenshots aqui quando disponível]
- Dashboard view
- NPCs library com filtros
- Session map com tokens
- Dice roller em ação
- Music player
```

---

**Desenvolvido com ❤️ para Game Masters**  
*"Toda grande aventura começa com um bom mestre"* 🎮✨
