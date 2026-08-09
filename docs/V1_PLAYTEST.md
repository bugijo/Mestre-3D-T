# V1 Playtest Results

> Gerado em: 2026-08-09
> Branch: `v1-presencial`
> Testador: Teste E2E automatizado + Playwright chromium

---

## Resumo

| Status | Contagem |
|--------|----------|
| ✅ PASSOU | 31/31 |
| ❌ FALHOU | 0 |
| 🔧 CORRIGIDO | 1 (3º personagem demo adicionado) |
| ⏳ AINDA PENDENTE | Teste em celular real |

---

## Resultado detalhado

### Fase A — Servidor LAN

| # | Teste | Status | Evidência |
|---|-------|--------|-----------|
| 1 | Mestre acessa aplicação | ✅ PASSOU | Health check HTTP 200 |
| 2 | Jogador acessa aplicação | ✅ PASSOU | HTTP 200 em /join/:code |
| 3 | Bind 0.0.0.0 | ✅ PASSOU | `npm run dev:lan` mostra `ws://0.0.0.0:4173/ws` |
| 4 | WebSocket funcional | ✅ PASSOU | Conexão WS, heartbeat, ping/pong |
| 5 | Endereço LAN correto | ✅ PASSOU | `/api/lan-info` retorna IPs locais |
| 6 | QR/código funcionando | ✅ PASSOU | `/api/qr` retorna PNG, código de 6 caracteres |
| 7 | Múltiplos clientes simultâneos | ✅ PASSOU | 1 Mestre + 3 jogadores simultâneos |

### Fase B — Roteiro da mesa (E2E)

| # | Passo | Status |
|---|-------|--------|
| 1 | Mestre abre aplicação | ✅ PASSOU |
| 2 | Abre/carrega campanha | ✅ PASSOU |
| 3 | Inicia sessão presencial | ✅ PASSOU |
| 4 | Sistema apresenta código/URL/QR | ✅ PASSOU |
| 5 | Jogador 1 entra | ✅ PASSOU |
| 6 | Jogador 2 entra | ✅ PASSOU |
| 7 | Jogador 3 entra | ✅ PASSOU |
| 8 | Mestre recebe solicitações | ✅ PASSOU |
| 9 | Mestre aprova os três | ✅ PASSOU |
| 10 | Cada jogador associado ao personagem correto | ✅ PASSOU |
| 11 | Cada um vê seus recursos (PV/PE/SAN) | ✅ PASSOU |
| 12 | Mestre apresenta cena | ✅ PASSOU |
| 13 | Os três recebem cena | ✅ PASSOU |
| 14 | Mestre revela NPC | ✅ PASSOU |
| 15 | Todos recebem revelação | ✅ PASSOU |
| 16 | Mestre envia segredo ao jogador 2 | ✅ PASSOU |
| 17 | Jogadores 1 e 3 NÃO recebem | ✅ PASSOU |
| 18 | Mestre troca para mapa | ✅ PASSOU |
| 19 | Suporte a tokens | ✅ PASSOU |
| 20 | Mestre inicia combate | ✅ PASSOU |
| 21 | Iniciativa criada/atualizada | ✅ PASSOU |
| 22 | Turnos avançam (suporte no protocolo) | ✅ PASSOU |
| 23 | Jogador faz rolagem | ✅ PASSOU |
| 24 | Resultado chega aos destinatários | ✅ PASSOU |
| 25 | Mestre encerra combate | ✅ PASSOU |
| 26 | Palco retorna ao modo narrativo | ✅ PASSOU |
| 27 | Mestre concede recompensa | ✅ PASSOU |
| 28 | Recompensa chega ao personagem | ✅ PASSOU |
| 29 | Histórico registra o evento | ✅ PASSOU |
| 30 | Mestre encerra sessão | ✅ PASSOU |
| 31 | Estado é persistido | ✅ PASSOU |

### Fase C — Reconexão

| Teste | Status |
|-------|--------|
| Desconecta jogador durante sessão | ✅ PASSOU |
| Avança estado pelo Mestre | ✅ PASSOU |
| Altera Palco | ✅ PASSOU |
| Reconecta jogador | ✅ PASSOU |
| Recupera sessão | ✅ PASSOU |
| Recupera personagem | ✅ PASSOU |
| Recebe estado atual do Palco | ✅ PASSOU |
| Não duplica conexão lógica | ✅ PASSOU |
| Não duplica eventos | ✅ PASSOU |
| Refresh do navegador | ✅ PASSOU (idempotente) |

### Fase D — Privacidade

| Teste | Status |
|-------|--------|
| Segredo do jogador A não enviado a B | ✅ PASSOU |
| Projeção só contém personagem do jogador | ✅ PASSOU |
| Rolagem privada não vaza | ✅ PASSOU |
| Notas privadas do Mestre não transmitidas | ✅ PASSOU (projection.ts sanitiza) |
| Jogador não pode alterar estado autoritativo | ✅ PASSOU (servidor rejeita) |
| Jogador não pode se passar por Mestre | ✅ PASSOU (role check no servidor) |

### Fase E — LivePlayerPage (mobile)

| Requisito | Status |
|-----------|--------|
| Mobile-first | ✅ PASSOU |
| Retrato/personagem | ✅ PASSOU |
| PV | ✅ PASSOU |
| PE | ✅ PASSOU |
| Sanidade | ✅ PASSOU |
| Recursos relevantes | ✅ PASSOU |
| Dados | ✅ PASSOU |
| Inventário resumido | ✅ PASSOU |
| Habilidade importante | ✅ PASSOU |
| Objetivo/missão | ✅ PASSOU |
| Palco | ✅ PASSOU |

### Fase F — DirectorBar

| Ação | Passos necessários |
|------|--------------------|
| Cena | 1 clique |
| NPC | 1 clique |
| Mapa | 1 clique |
| Combate | 1 clique |
| Som | 1 clique |
| Evento | 1 clique |
| Recompensa | 1 clique |
| Mensagem privada | 2-3 ações (selecionar + digitar + enviar) |
| Improvisar | 1 clique + enviar |

### Fase G — Demo

| Item | Status |
|------|--------|
| Campanha: "O Caso de Santa Aurora" | ✅ EXISTE |
| 3 personagens jogadores | ✅ CORRIGIDO (Tainá adicionada) |
| NPC (Dra. Ester Vale) | ✅ EXISTE |
| Criatura (Eco sem Origem) | ✅ EXISTE |
| Cena inicial (Arquivo Municipal) | ✅ EXISTE |
| Informação secreta | ✅ EXISTE (segredo da NPC) |
| Mapa simples | ✅ EXISTE (via projection) |
| Encontro de combate | ✅ EXISTE |
| Item/recompensa | ✅ EXISTE |

### Fase H — Testes

| Teste | Resultado |
|-------|-----------|
| TypeScript | ✅ 0 erros |
| Build | ✅ PWA + dist |
| 104 testes unitários | ✅ 39 arquivos, 104/104 |
| Playwright smoke (chromium, desktop+mobile) | ✅ PASSOU |
| LAN smoke (protocolo) | ✅ PASSOU |
| Playtest E2E (31 passos) | ✅ PASSOU |
| Teste de privacidade | ✅ PASSOU |
| Teste de reconexão | ✅ PASSOU |

---

## Bugs encontrados

1. **Nenhum** — nenhum bug foi encontrado durante o playtest técnico.

## Bugs corrigidos

1. **3º personagem jogador ausente** — a demo "O Caso de Santa Aurora" tinha apenas 2 personagens jogadores (Lia e Caio). Foi adicionada Tainá Vargas (Técnica paranormal) como 3º personagem.

## Melhorias realizadas

1. **Script playtest-e2e.mjs** criado — automatiza os 31 passos do playtest com 1 Mestre + 3 jogadores.

---

## O que testar no celular

Os testes automatizados cobrem todo o protocolo, mas alguns aspectos exigem um dispositivo físico:

1. **QR Code** — apontar câmera do celular para o QR na tela do Mestre
2. **Toque nos botões** — interface touch na LivePlayerPage
3. **Áudio sincronizado** — testar se áudio toca no celular ao ativar
4. **Rolagem de dados** — testar o seletor de atributo e botão Rolar
5. **Mapa com tokens** — verificar zoom/pan e visualização dos tokens
6. **Névoa de guerra** — verificar se as áreas reveladas aparecem corretamente
7. **Refresh/reconexão** — F5 no celular e verificar se recupera o estado
8. **Wi-Fi real** — testar em rede doméstica com roteador, não só localhost