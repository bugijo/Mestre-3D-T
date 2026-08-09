# Guia de Playtest — Dungeon Keeper V1 Presencial

> Para Mestres que vão testar a plataforma com um grupo presencial.

---

## 1. Antes de começar

Você precisa de:

- Um **computador** (Windows, Mac ou Linux) na mesma rede Wi-Fi do grupo
- **Celulares** dos jogadores conectados na mesma rede
- Um **projetor ou TV** (opcional, mas recomendado para o Palco)

---

## 2. Iniciar o servidor

### No computador do Mestre:

1. Abra o terminal (Prompt de Comando no Windows, Terminal no Mac/Linux)
2. Navegue até a pasta do projeto:
   ```
   cd app
   ```
3. Execute:
   ```
   npm run dev:lan
   ```
4. Você verá:
   ```
   Mestre: http://localhost:4173/session
   LAN: http://192.168.X.X:4173
   ```

**Pronto!** O servidor está rodando.

---

## 3. Abrir a aplicação no PC

Abra o navegador no computador do Mestre e acesse:

```
http://localhost:4173
```

Clique em **"Iniciar Sessão"** no menu ou vá direto para:

```
http://localhost:4173/session
```

---

## 4. Abrir no celular dos jogadores

Cada jogador abre o navegador do celular e digita o endereço que aparece no terminal:

```
http://192.168.X.X:4173
```

Substitua `192.168.X.X` pelo número que aparece no terminal.

**Ou:** o Mestre pode mostrar um QR Code na tela — é só apontar a câmera do celular.

---

## 5. Carregar a demonstração

A aplicação já vem com uma campanha de demonstração:

**"O Caso de Santa Aurora"**

- 3 personagens prontos (Lia, Caio e Tainá)
- 2 cenas (Arquivo Municipal, Subsolo da Estação Aurora)
- 1 NPC (Dra. Ester Vale)
- 1 criatura (Eco sem Origem)

Para começar:

1. Clique em **"Iniciar Sessão"** na página inicial
2. Selecione **"O Caso de Santa Aurora"**
3. A sessão será iniciada automaticamente com a primeira cena

---

## 6. Fluxo da sessão

### Mestre:

1. Na página da sessão, clique em **"Abrir mesa na rede"**
2. Um código de 6 letras/números aparece na tela
3. Os jogadores entram com o código ou escaneiam o QR
4. Quando os pedidos aparecerem, escolha o personagem e clique em **"Aprovar"**
5. Use a **Barra do Diretor** para apresentar conteúdo:

| Botão | O que faz |
|-------|-----------|
| Cena | Mostra a cena atual para os jogadores |
| NPC | Revela um NPC |
| Mapa | Exibe o mapa da cena |
| Combate | Ativa o modo de combate |
| Som | Notifica mudança de áudio |
| Recompensa | Concede recompensa ao grupo |
| Mensagem | Envia texto (público ou privado) |

### Para enviar mensagem secreta:

1. No campo "Destinatário", selecione o jogador
2. Digite a mensagem
3. Clique em **"Enviar"**
4. Apenas o jogador selecionado recebe

### Para iniciar combate:

1. Clique no botão **"INICIAR COMBATE"** (canto inferior direito)
2. O CombatTracker abre no centro da tela
3. Avance turnos e gerencie participantes

### Para encerrar a sessão:

1. Clique em **"Encerrar Sessão"** (topo da página)
2. Confirme — o estado é salvo automaticamente

### Jogadores:

1. Abra o navegador no celular
2. Digite o endereço mostrado pelo Mestre
3. Digite seu nome e clique em **"Solicitar entrada"**
4. Aguarde a aprovação do Mestre
5. Pronto! Você vê:
   - Seus pontos de vida (PV), esforço (PE) e sanidade (SAN)
   - A cena atual (Palco)
   - Seu inventário e habilidades
   - Rolador de dados
   - Mensagens do Mestre

### Rolando dados:

1. Selecione o atributo (Agilidade, Intelecto, etc.)
2. Adicione bônus se necessário
3. Escolha visibilidade (Pública ou Só Mestre)
4. Clique em **"Rolar"**
5. O resultado aparece na tela

---

## 7. Problemas comuns

| Problema | Solução |
|----------|---------|
| "Servidor LAN indisponível" | Execute `npm run dev:lan` no terminal |
| Celular não conecta | Verifique se está na mesma rede Wi-Fi |
| Personagem não aparece | Peça ao Mestre para aprovar novamente |
| Áudio não toca | Clique em "Ativar som" no celular |
| Tela travou | Atualize a página (F5) — a reconexão é automática |
| Código não funciona | Gere um novo clicando em "Abrir mesa na rede" novamente |

---

## 8. Encerrando

Para encerrar o servidor no computador:

1. No terminal, pressione **Ctrl+C**
2. Confirme com **S** se perguntar

---

## 9. Teste rápido (para desenvolvedores)

```bash
# Servidor LAN + Vite dev (recomendado)
npm run dev:lan

# Testes automatizados
npm test

# Teste de protocolo LAN
node server/lan-smoke.mjs

# Playtest completo (1 Mestre + 3 jogadores, automático)
node server/playtest-e2e.mjs

# Browser smoke (precisa de build)
npm run build && node .tools/qa-browser-smoke.mjs
```