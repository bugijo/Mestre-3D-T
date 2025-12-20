# GM Forge - Design System

Este documento define os padrões visuais e componentes do projeto Mestre 3D&T (GM Forge), baseado na estética "Sci-fi Fantasy" moderna.

## 🎨 Cores

### Palette Principal
- **Background:** `#0B0C10` (Preto Profundo) - Usado no fundo da página.
- **Surface:** `#15171E` (Cinza Azulado Escuro) - Usado em painéis e sidebars.
- **Surface Highlight:** `#1F2229` (Cinza Médio) - Usado em cards e inputs.

### Acentos (Neon)
- **Primary (Green):** `#00FF9D`
  - Uso: Ações principais, progresso, indicadores de sucesso.
  - Glow: `box-shadow: 0 0 10px rgba(0, 255, 157, 0.3)`
- **Secondary (Purple):** `#D000FF`
  - Uso: Botões de destaque (CTA), contadores, elementos mágicos.
  - Glow: `box-shadow: 0 0 10px rgba(208, 0, 255, 0.3)`

### Texto
- **Primary:** `#FFFFFF` (Branco Puro)
- **Secondary:** `#9CA3AF` (Cinza Claro)
- **Muted:** `#6B7280` (Cinza Escuro)

---

## 🔤 Tipografia

### Fontes
- **Body:** `Inter` (Legibilidade e UI)
- **Display:** `Rajdhani` (Títulos, Números, Botões - Estilo Tecnológico)

### Hierarquia
- **H1 (Logo):** Rajdhani Bold, Uppercase.
- **H2 (Page Titles):** Rajdhani Bold, 32px+.
- **H3 (Card Titles):** Rajdhani Bold, 18px-24px.
- **Body:** Inter Regular, 14px-16px.
- **Small/Label:** Inter Medium, 12px, Uppercase Tracking-wide.

---

## 🧩 Componentes

### Botões
```html
<!-- Primary (Verde) -->
<button class="btn-primary">Action</button>

<!-- Secondary (Roxo) -->
<button class="btn-secondary">Hero Action</button>

<!-- Ghost -->
<button class="btn-ghost">Cancel</button>
```

### Cards
```html
<div class="glass-card p-6">
  <!-- Conteúdo -->
</div>
```

### Inputs
```html
<input type="text" class="input-forge" placeholder="Search..." />
```

---

## ✨ Efeitos

### Glassmorphism
Utilize as classes `glass-panel` para fundos translúcidos pesados (sidebars) e `glass-card` para elementos interativos mais leves.

### Glow
Adicione a classe `animate-glow` para elementos que precisam pulsar (ex: status crítico).
A sombra `shadow-neon-green` ou `shadow-neon-purple` adiciona o brilho estático.
