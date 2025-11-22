# Checklist de QA e Acessibilidade

Use este roteiro para validar o app em dispositivo ou emulador real antes de compartilhar o APK. Ele combina verificações rápidas de acessibilidade, privacidade e fluxo funcional.

## Preparação
- Build debug: `./gradlew assembleDebug` e instale com `./gradlew installDebug`.
- Habilite talkback/lector de tela no dispositivo para validar leitura sem visão.
- Certifique-se de ter alguns áudios locais disponíveis para testar o painel de som.

## Acessibilidade
- **Heading e leitura**: Talkback deve anunciar títulos de seção como cabeçalhos (Dashboard, Sessão, NPCs, Combate, Som, resumo de sessão).
- **Botões e chips**: todos os ícones precisam de rótulo; valide que ações como Iniciar/Encerrar sessão, Resetar encontro, Enviar/baixar backup e play/pause do som são lidas com nome e estado.
- **Erro e loading**: o banner de erro deve ser anunciado automaticamente quando aparece; barras de progresso devem ser visíveis e com contraste.
- **Foco**: percorrer toda a tela apenas com navegação por acessibilidade (sem toques diretos) deve funcionar sem loops ou itens invisíveis.
- **Contraste**: verifique texto primário/labels sobre fundos coloridos (chips, cards de erro e botões) em tema claro/escuro.

## Fluxos funcionais principais
- **Campanhas/Arcos/Cenas**: criar campanha, arco e cena; ativar a cena e validar que aparece na aba Sessão.
- **Gatilhos**: adicionar, editar e remover gatilho na cena ativa; repetir com um NPC.
- **NPCs**: cadastrar novo NPC com personalidade e gatilhos; abrir na aba Sessão e usar os botões de gatilho.
- **Combate**: criar inimigo com poderes, adicionar múltiplas instâncias ao encontro e ajustar PV/PM; marcar como derrubado e remover instância.
- **Sessão**: iniciar sessão, registrar notas (com e sem flag de importante), encerrar e checar resumo listado; iniciar nova sessão retomando a anterior.
- **Som local**: escolher trilha e SFX do armazenamento local, tocar/pausar, disparar efeitos e validar controle de volume/ducking.
- **Backup**: configurar Supabase local, enviar snapshot e baixar em dispositivo limpo para garantir restauração.

## Privacidade e armazenamento
- Conferir que apenas a permissão de leitura de mídia é solicitada quando o usuário escolhe arquivo de áudio.
- Revisar a ficha de privacidade do Google Play informando armazenamento local de mídia e sincronização opcional com Supabase.

## Empacotamento
- Gerar `app-release.apk` com keystore local (`./gradlew assembleRelease`).
- Fazer smoke test no APK assinado: abrir todas as abas, tocar ações críticas e confirmar que não há crashes.
- Capturar capturas de tela (ou regravar Paparazzi) para a loja, se aplicável.
