# Status do MVP

## O que está implementado
- Projeto Android configurado (Kotlin, Jetpack Compose, Material 3) e navegação por abas entre Dashboard, Sessão, Campanhas, NPCs, Combate e Som.
- Modelos imutáveis e repositório em memória exposto via ViewModel, com dados de exemplo para campanhas/arcos/cenas, NPCs, encontros e painel de som.
- UI funcional para visualizar e manipular estado em memória: ativar cenas na aba Sessão, ajustar PV/estado do encontro, registrar notas rápidas e editar campanhas/arcos/cenas em CRUD básico.
- Tema claro/escuro customizado e ícones adaptativos prontos para build.
- Sincronização manual via Supabase (gratuito) para enviar/baixar snapshots completos de dados diretamente do dashboard.
- Persistência local via Room armazenando snapshots completos (incluindo encontro e índices ativos), com restauração automática na inicialização.
- CRUD de gatilhos de cena e gatilhos de NPC (criar/remover) diretamente nas abas Sessão e NPCs.
- Encontro com múltiplas instâncias, remoção individual, ajuste de PV/PM e persistência do estado em backups.

## O que ainda falta para um app completo
- **CRUD refinado**: permitir edição completa (não só adição/remoção) de gatilhos de cena e NPC, além de edição de poderes/inimigos.
- **Áudio local**: já há picker e reprodução com ExoPlayer/MediaPlayer; falta tela dedicada de volume, tratamento de foco de áudio e persistência das escolhas.
- **Sessões**: fluxo de criação/encerramento de sessão com resumo automático (cenas usadas, NPCs relevantes, inimigos derrotados, notas importantes) e log persistido além do histórico simples.
- **UX refinada**: estados de loading/erro, empty states, confirmações destrutivas, acessibilidade (talkback, contraste), e atalhos de uso frequente na Mesa do Mestre.
- **Empacotamento**: configurar assinatura de release, flavors se necessário e checklist de privacidade/armazenamento de mídia antes de publicar ou distribuir APK.

## Próximos passos sugeridos
1. Conectar telas existentes às operações de CRUD completas (edição além de adição/remoção) e estados de sessão.
2. Implementar tela de volume/foco para o player local com preferências persistidas.
3. Finalizar fluxo de sessões persistentes (criar, encerrar, reabrir) e enriquecer o resumo.
4. Rodar bateria de testes instrumentados, revisar acessibilidade e gerar APK assinada para teste.
