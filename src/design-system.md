# Mestre 3D&T - Design System

Este documento define os padrões visuais e componentes do projeto Mestre 3D&T, com foco em clareza, profundidade visual e legibilidade em mesas presenciais.

## 🎨 Cores

### Palette Principal
- **Background:** `#07111F` para fundo principal.
- **Surface:** `#0F1B2D` para painéis e containers.
- **Surface Highlight:** `#16243A` para cards e áreas focadas.
- **Surface Strong:** `#21324B` para estados ativos e áreas críticas.

### Acentos
- **Primary (âmbar):** `#F59E0B` para ações principais e progresso.
- **Secondary (ciano):** `#38BDF8` para destaques e CTAs.
- **Accent (azul):** `#7DD3FC` para links, tags e foco.

### Texto
- **Primary:** `#F8FAFC`
- **Secondary:** `#CBD5F5`
- **Muted:** `#94A3B8`

---

## 🔤 Tipografia

### Fontes
- **Body:** `Space Grotesk` para texto e UI.
- **Display:** `Sora` para títulos e métricas.
- **Mono:** `JetBrains Mono` para timers e dados técnicos.

### Hierarquia
- **H1:** Sora 40-48px, tracking-tight.
- **H2:** Sora 32-40px.
- **H3:** Sora 24-32px.
- **Body:** Space Grotesk 14-16px.
- **Labels:** Space Grotesk 12px, uppercase, tracking-wide.

---

## 🧩 Componentes

### Botões
```html
<button class="btn-primary">Action</button>
<button class="btn-secondary">Hero Action</button>
<button class="btn-ghost">Cancel</button>
```

### Cards
```html
<div class="card card-hover p-6"></div>
```

### Inputs
```html
<input type="text" class="input-forge" placeholder="Search..." />
```

---

## ✨ Efeitos e Movimento

### Profundidade
- Use `shadow-soft-md` para cards e `shadow-soft-lg` em destaques.
- Prefira bordas sutis com `border-white/10` para separação.

### Animações
- `animate-fade-up` para entradas suaves.
- `animate-float` para destaques leves.

## ♿ Acessibilidade
- Contraste mínimo de texto com fundo escuro.
- Estados de foco sempre visíveis em botões e inputs.
- Tamanhos mínimos de fonte 14px.

## 📱 Responsividade
- Grids adaptam para 1 coluna em mobile.
- Botões e campos ocupam largura total em telas estreitas.
