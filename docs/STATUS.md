# Status do MVP

## O que está implementado
- Projeto Android configurado (Kotlin, Jetpack Compose, Material 3) e navegação por abas entre Dashboard, Sessão, Campanhas, NPCs, Combate e Som.
- Modelos imutáveis e repositório em memória exposto via ViewModel, com dados de exemplo para campanhas/arcos/cenas, NPCs, encontros e painel de som.
- UI funcional para visualizar e manipular estado em memória: ativar cenas na aba Sessão, ajustar PV/estado do encontro, registrar notas rápidas e editar campanhas/arcos/cenas em CRUD básico.
- Tema claro/escuro customizado e ícones adaptativos prontos para build.
- Sincronização manual via Supabase (gratuito) para enviar/baixar snapshots completos de dados diretamente do dashboard.
- Persistência local via Room armazenando snapshots completos (incluindo encontro e índices ativos), com restauração automática na inicialização.
- CRUD de gatilhos de cena e gatilhos de NPC (criar/remover) diretamente nas abas Sessão e NPCs.
- Edição inline de gatilhos de cena e NPC diretamente nas cartas, com persistência local e pronta para sincronização.
- Encontro com múltiplas instâncias, remoção individual, ajuste de PV/PM e persistência do estado em backups.
- Fluxo de sessão com início/encerramento, resumo com horários e cenas visitadas, além de notas importantes e inimigos derrotados.
- Preferências de áudio (volume de trilha/SFX e ducking) aplicadas ao player com salvamento em snapshot local/nuvem.
- CRUD completo de inimigos e poderes com formulários, edições e remoções com confirmação, além de estados vazios nas listas principais.

## O que ainda falta para um app completo
- **Acessibilidade e QA**: validar talkback, contraste e navegabilidade por teclado/controle, além de rodar testes instrumentados.
- **Empacotamento**: configurar assinatura de release, flavors se necessário e checklist de privacidade/armazenamento de mídia antes de publicar ou distribuir APK.

## Próximos passos sugeridos
1. Refinar UX com estados de loading/erro, talkback/labels e confirmações em demais fluxos.
2. Rodar bateria de testes instrumentados, revisar acessibilidade e gerar APK assinada para teste.
