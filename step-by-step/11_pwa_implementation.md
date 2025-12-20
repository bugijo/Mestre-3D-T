# Implementação PWA Completa

## 1. Vite Plugin PWA
- Instalado `vite-plugin-pwa` para gerenciar Service Workers e Manifesto automaticamente.
- Configurado `vite.config.ts` com:
  - `registerType: 'autoUpdate'`: O app se atualiza automaticamente quando há nova versão.
  - `devOptions: { enabled: true }`: Permite testar PWA em ambiente de desenvolvimento.
  - `manifest`: Configuração completa de cores, ícones e comportamento (Standalone).

## 2. Limpeza
- Removido `public/manifest.json` manual (agora gerado dinamicamente pelo build).
- Removido link manual no `index.html` (injetado automaticamente).

## 3. Status
- O app agora é totalmente instalável (Add to Home Screen).
- Funciona offline (cache de assets CSS/JS/HTML).
- Dados persistidos no IndexedDB (implementado anteriormente).

## Próximos Passos
- Testar instalação em dispositivo real.
- Futuro: Configurar backend (Supabase) se necessário sync entre dispositivos.
