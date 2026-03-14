# Plano de Ação - Mestre 3D&T (Web/PWA)

## 1. Visão Geral
Migração e evolução do "Mestre 3D&T" para uma plataforma **Web/PWA** moderna, substituindo o app Android original. O foco é manter a identidade visual (Glassmorphism) e as funcionalidades de gestão de RPG, garantindo acessibilidade e performance em navegadores.

**Status Atual:** 🟡 Em Migração (Fase 5)
- Código Android original recuperado parcialmente em `/reference` para consulta de lógica.
- Estrutura Web (Vite/React) inicializada na raiz.

## 2. Lista de Tarefas

### 🚀 Fase 1: Fundação Web e Arquitetura (Prioridade Alta)
- [x] Configuração Inicial (Vite + TypeScript + Tailwind)
- [x] Recuperação de Lógica Legada (Android -> `/reference`)
- [x] Definição de Stack (React 18 + Zustand/Context)
- [x] **Portar Lógica de Negócio (Kotlin -> TS)**
    - [x] Traduzir Modelos (Campanha, NPC, Inimigo) de `CoreModels.kt` (em `src/domain/models.ts`).
    - [x] Criar Stores (Context/Reducer) para gerenciar estado global (em `src/store/AppStore.tsx`).
- [x] **Configuração de Roteamento (React Router)**
    - [x] Criar rotas básicas (`App.tsx`).
    - [x] Layout Shell e Navegação.
- [x] **Infraestrutura de Arquivos**
    - [x] Regra de Anexos Automatizados (Validação e Compressão).
    - [x] Componente UI de Upload (`ImageUpload`).
    - [x] Documentação de Anexos (`docs/regras-de-anexos.md`).

### 📜 Fase 2: Gestão Narrativa (CRUDs)
- [x] **Campanhas e Arcos**
    - [x] UI: Cards de Campanha (Grid responsivo).
    - [x] Form: Criar/Editar Campanha (Integrar `ImageUpload`).
    - [x] Hierarquia: Campanha -> Arcos -> Cenas.
- [x] **Bestiário e NPCs**
    - [x] UI: Lista de NPCs com filtros (Tipo, Nível).
    - [x] Form: Ficha de NPC com atributos 3D&T (Cálculo auto de PV/PM).
    - [x] Importação de dados legados (Skipped - Sem dados fonte).

### ⚔️ Fase 3: Sessão e Combate
- [x] **Sessão de Jogo (Game Runner)**
    - [x] Painel do Mestre (Session Runner): Visão da Cena Ativa.
    - [x] Rolador de Dados (Dice Roller) integrado.
    - [x] Controle de Combate (Iniciativa, Turnos, PV/PM dinâmico).
    - [x] Diário de Sessão (Logs automáticos).

### 🎵 Fase 4: Áudio e Imersão
- [x] **Player de Áudio Web**
    - [x] Componente Player (Play/Pause, Volume, Loop).
    - [x] Gerenciamento de Assets (Arquivos locais via File API ou URLs).
    - [x] Soundboard para efeitos rápidos (Integrado ao Player básico por enquanto).

### ☁️ Fase 5: Nuvem e Polimento (PWA)
- [x] **Persistência**
    - [x] Implementar IndexedDB (Nativo) para dados offline (URGENTE para imagens).
    - [ ] Sync opcional com Supabase (Requer credenciais/setup futuro).
- [x] **Polimento do Dashboard**
    - [x] Dados reais de campanhas e progresso.
    - [x] Controle de data da próxima sessão.
- [x] **Design System e Identidade Visual**
    - [x] Definir tokens semânticos (Primary, Secondary, Accent).
    - [x] Remover referências hardcoded a cores neon.
    - [x] Padronizar componentes de UI (Botões, Cards, Inputs).
- [x] **PWA Features**
    - [x] Manifesto (`manifest.json`) e Ícones (Gerado via Plugin).
    - [x] Service Worker para cache de assets e funcionamento offline (vite-plugin-pwa).

## 3. Marcos de Entrega
- **MVP Web:** Navegação funcional, Criação de NPCs e Campanhas (Concluído).
- **Beta PWA:** Persistência local (IndexedDB), Player de Áudio, Instalação no Celular (Concluído).
- **Release 1.0:** Sync na nuvem, Polimento visual, Testes E2E.
