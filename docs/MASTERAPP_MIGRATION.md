# Migração para modelo MasterApp

Plano único para aproximar a versão Android e Web do Mestre 3D&T das funcionalidades e UX do MasterApp (campanhas centralizadas, bestiário, sessão/combate automatizados e convite de jogadores).

## Diagnóstico rápido
- Android já cobre: campanhas/arcos/cenas com gatilhos, NPCs com gatilhos, bestiário básico de inimigos, encontro com múltiplas instâncias, painel de som local, backups (local + Supabase), tema escuro com layout GM Forge.
- Web: landing estática com tema compatível, mas sem telas funcionais (campanhas, bestiário, combate) nem consumo do mesmo estado do app.
- Lacunas vs. MasterApp: ausência de UX de bestiário rico, linha do tempo de cenas no estilo cards conectados, destaque de próxima sessão (countdown), painel visual de combate/iniciativa e onboarding/convite de jogadores.

## Backlog unificado (Android + Web)
- [x] Dashboard MasterApp: banner da próxima sessão com countdown + cards de campanhas com progresso e CTA de preparar sessão.
- [x] Linha do tempo de cenas: nós conectados por arco, com ícones de tipo de cena (taverna/floresta/ruínas/boss) e ação para ativar cena na sessão.
- [x] Bestiário avançado: featured monster, cards com atributos 3D&T (F/H/R/A/PdF), barras de progresso, tags e poderes; busca por nome/tags.
- [ ] Painel de combate/VTT: mapa da cena com tokens posicionados, log de combate e participantes ordenados por iniciativa (rolagem automática/manual).
- [ ] Convite de jogadores: geração de link/token compartilhável para entrar na campanha (placeholder na Web, fluxo real no Android depois de autenticação).
- [ ] Sincronização Web/Android: reuso do snapshot (Supabase) para carregar campanhas, NPCs, inimigos e sessões na Web.
- [ ] Experiência mobile-first: responsividade no Web para tablets/celulares e ajustes de densidade de informação no Android (GM Forge + layout clássico).
- [ ] Acessibilidade e estados: loaders/erros/empty states, confirmações destrutivas e feedback visual coerente com o tema.

## Primeira iteração (o que será executado agora)
1) Criar tela de Bestiário/Lore no layout GM Forge do Android, consumindo os inimigos já cadastrados e exibindo atributos no estilo MasterApp.
2) Atualizar a versão Web para um dashboard estático no estilo MasterApp: countdown da próxima sessão, cards de campanhas, linha do tempo de cenas e bestiário com destaque.
3) Validar builds: `./gradlew :app:testDebugUnitTest` e `npm run build` em `web`.
