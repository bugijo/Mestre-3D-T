# Status do MVP

## O que está implementado
- Projeto Android configurado (Kotlin, Jetpack Compose, Material 3) e navegação por abas entre Dashboard, Sessão, Campanhas, NPCs, Combate e Som.
- Modelos imutáveis e repositório em memória exposto via ViewModel, com dados de exemplo para campanhas/arcos/cenas, NPCs, encontros e painel de som.
- UI funcional para visualizar e manipular estado em memória: ativar cenas na aba Sessão, ajustar PV/estado do encontro, registrar notas rápidas e editar campanhas/arcos/cenas em CRUD básico.
- Tema claro/escuro customizado e ícones adaptativos prontos para build.

## O que ainda falta para um app completo
- **Persistência local**: substituir o repositório em memória por Room (campanhas, arcos, cenas, gatilhos, NPCs, encontros, notas, configurações rápidas via DataStore).
- **CRUD completo**: incluir criação/edição/exclusão de gatilhos de cena e gatilhos específicos de NPC; gestão de poderes e instâncias múltiplas de inimigos por encontro (PV/PM separados por instância).
- **Áudio local**: integrar ExoPlayer para trilha de fundo e efeitos sonoros, com seletor de arquivos locais, controle de volume e tratamento de foco de áudio.
- **Sessões**: fluxo de criação/encerramento de sessão com resumo automático (cenas usadas, NPCs relevantes, inimigos derrotados, notas importantes) e log persistido.
- **UX refinada**: estados de loading/erro, empty states, confirmações destrutivas, acessibilidade (talkback, contraste), e atalhos de uso frequente na Mesa do Mestre.
- **Empacotamento**: configurar assinatura de release, flavors se necessário e checklist de privacidade/armazenamento de mídia antes de publicar ou distribuir APK.

## Próximos passos sugeridos
1. Introduzir Room + Hilt para persistência e injeção de dependências, mantendo seed em memória para pré-visualização.
2. Conectar telas existentes às operações de CRUD completas (gatilhos, NPCs, poderes, instâncias de inimigos) e estados de sessão.
3. Integrar ExoPlayer para trilha/SFX locais com picker de arquivos e permissões adequadas.
4. Implementar fluxo de sessões e resumo final, salvando log e entidades relacionadas.
5. Rodar bateria de testes instrumentados, revisar acessibilidade e gerar APK assinada para teste.
