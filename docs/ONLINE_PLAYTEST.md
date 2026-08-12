# ONLINE_PLAYTEST.md — Mesa Virtual Online

## Data: 2026-08-12
## URL: https://rpg-alpha.onrender.com

## Resultados da Mesa Virtual (1 Mestre + 4 Jogadores)

| Etapa | Status |
|-------|--------|
| Sessão criada (HA5U66TJ) | ✅ |
| 4 jogadores conectam (Lia, Caio, Tainá, Marco) | ✅ |
| Mestre aprova 4 jogadores | ✅ |
| Cena apresentada (Arquivo Municipal) | ✅ |
| NPC revelado (Dra. Ester) | ✅ |
| Mensagem pública enviada | ✅ |
| **Segredo enviado só ao Player 2** | ✅ |
| Combate iniciado (Eco sem Origem) | ✅ |
| Dado rolado pelo Player 1 | ✅ |
| Recompensa concedida (XP 20, Fragmento) | ✅ |
| **Player 3 desconecta e reconecta** | ✅ (3 eventos restaurados) |
| **4 dados simultâneos (concorrência)** | ✅ |
| Sessão encerrada pelo Mestre | ✅ |

## Reconexão

- Player 3 (Tainá) desconectou e reconectou com reconnectToken
- `session:resume` retornou status `active` com 3 eventos
- Sem duplicação de eventos

## Concorrência

- 4 jogadores enviaram dados quase simultaneamente
- Todos os actionIds foram únicos
- Servidor processou sem erros

## Observações

- WebSocket online (WSS) funcionou de forma idêntica ao LAN
- Tempo de resposta comparável ao LAN
- Código de sessão de 8 chars gerado
- Tokens de reconexão funcionaram

## Próximos Passos

1. Configurar `SUPABASE_SERVICE_ROLE_KEY` para persistência real
2. Testar com navegadores reais (desktop + mobile)
3. Testar PWA instalável no Android
4. Testar QR code com celular real