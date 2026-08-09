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

---

## 10. PRIMEIRO TESTE REAL — PC + Celulares

> Instrução passo a passo para seu primeiro teste com uma mesa real.

### O que testar

Validar o fluxo completo: Mestre no PC, 1 a 3 jogadores nos celulares, tudo na mesma rede Wi-Fi.

### Pré-requisitos

- Computador (PC ou notebook) com Node.js instalado
- 1 a 3 celulares (Android ou iOS) na **mesma rede Wi-Fi** do PC
- Navegador moderno em todos os dispositivos (Chrome, Edge, Safari)

### Passo a passo

#### 1. Iniciar o servidor no PC

Abra o terminal e execute:

```bash
cd /caminho/para/o/projeto/app
npm run dev:lan
```

O terminal vai mostrar algo como:

```
Mestre: http://localhost:4173/session
LAN: http://192.168.1.100:4173
WebSocket: ws://0.0.0.0:4173/ws
```

**Importante:** Anote o endereço `192.168.X.X:4173` — é ele que os celulares vão usar.

---

#### 2. Abrir o Mestre no PC

Abra o navegador no PC e acesse:

```
http://localhost:4173/session
```

Você verá a tela **"Iniciar Sessão"** com a campanha **"O Caso de Santa Aurora"**.

---

#### 3. Iniciar sessão e abrir LAN

1. Clique no card **"O Caso de Santa Aurora"** para iniciar a sessão
2. No painel **"Mesa presencial LAN"**, clique em **"Abrir mesa na rede"**
3. Aparecerão:
   - Um **QR Code** (canto esquerdo)
   - Um **código de 6 letras/números** (ex: `AB3XYZ`)
   - A **URL de entrada** (ex: `http://192.168.1.100:4173/join/AB3XYZ`)
   - O status **"LAN conectada"** no canto superior direito

---

#### 4. Entrar com os celulares

Em cada celular:

1. Abra o navegador
2. Digite o endereço `http://192.168.1.100:4173` (o número que apareceu no terminal)
3. Você verá a página de entrada da sessão
4. Digite o **nome do jogador**
5. Digite o **código de 6 caracteres** que aparece na tela do Mestre
6. Clique em **"Solicitar entrada"**

**Alternativa:** O Mestre pode mostrar o QR Code — nos celulares, use o app da câmera para escanear (a maioria escaneia QR direto sem app extra).

---

#### 5. Aprovar jogadores no PC

No PC do Mestre:

1. No painel **"Pedidos de entrada"**, você verá cada jogador que pediu para entrar
2. Para cada um:
   - Selecione o **personagem** no menu (Lia, Caio ou Tainá)
   - Clique em **"Aprovar"**
3. Quando aprovados, eles aparecem na lista **"Na mesa"** com um ponto verde se conectados

---

#### 6. O que o jogador vê no celular

Após a aprovação, o celular mostra:

- **Nome do personagem** e seus recursos (PV, PE, SAN)
- **Cena atual** — o que o Mestre apresentar no Palco
- **Rolador de dados** — para fazer testes
- **Botão de dados** com opção de visibilidade (pública ou só Mestre)
- Mensagens do Mestre

---

#### 7. Testar as ações do Mestre

No PC, use a **Barra do Diretor** (acima do conteúdo principal):

| O que fazer | Como | Resultado esperado |
|-------------|------|-------------------|
| **Apresentar cena** | Clique em "Cena" | Todos os celulares mostram a cena |
| **Revelar NPC** | Clique em "NPC" | Todos veem a imagem/texto do NPC |
| **Enviar segredo** | Selecione um jogador no campo "Destinatário" e clique em "Enviar Mensagem" | Só aquele jogador recebe |
| **Rolar dados (Mestre)** | Use o rolador no painel direito | O resultado aparece para todos (público) ou só você (privado) |
| **Iniciar combate** | Clique no botão "INICIAR COMBATE" | O modo combate abre no PC e os celulares recebem a atualização |
| **Conceder recompensa** | Clique em "Recompensa" | Todos recebem a notificação |
| **Encerrar sessão** | Clique em "Encerrar Sessão" no topo | Todos recebem "sessão encerrada" |

---

#### 8. Testar ações do jogador

No celular do jogador:

- **Rolar dados:** Escolha o atributo, ajuste bônus, escolha visibilidade, clique em "Rolar"
- O Mestre vê o resultado no painel de dados (à direita na interface do PC)
- Se a rolagem for **privada** (só Mestre), os outros jogadores NÃO veem

---

#### 9. Testar desconexão e reconexão

1. No celular, feche o navegador (ou desative o Wi-Fi)
2. No PC, o ponto do jogador fica **amarelo** (reconectando)
3. Reabra o navegador e entre novamente com o **mesmo nome e código**
4. O jogador recupera automaticamente:
   - Aprovação
   - Personagem atribuído
   - Cena atual
   - Histórico de eventos da sessão

---

#### 10. Verificações de segurança

Enquanto testa, confirme que:

- [ ] **Jogador NÃO pode ver** os PVs/recursos de outro jogador
- [ ] **Jogador NÃO pode receber** mensagem secreta destinada a outro
- [ ] **Jogador NÃO pode** encerrar a sessão
- [ ] **Jogador NÃO pode** alterar personagem de outro jogador
- [ ] **Após refresh** (F5 no celular), o jogador recupera o estado sem duplicar eventos
- [ ] **Recompensa** concedida aparece apenas uma vez, mesmo após refresh

---

#### 11. Checklists rápidas

##### Checklist do Mestre (antes do teste)

- [ ] Node.js instalado (`node --version`)
- [ ] Projeto na última versão (`git log -1` na branch `v1-presencial`)
- [ ] Celulares na mesma rede Wi-Fi
- [ ] Navegador atualizado no PC
- [ ] `npm run dev:lan` rodando sem erros

##### Checklist durante o teste

- [ ] 1 jogador entra e vê o personagem
- [ ] 3 jogadores entram simultaneamente
- [ ] Mestre apresenta cena → todos recebem
- [ ] Mestre envia segredo → só um jogador recebe
- [ ] Jogador rola dados → Mestre vê resultado
- [ ] Rolagem privada → outros jogadores não veem
- [ ] Combate inicia → todos recebem
- [ ] Jogador desconecta e reconecta → estado preservado
- [ ] Sessão encerra → todos notificados

---

#### 12. Após o teste

1. No terminal do PC, pressione **Ctrl+C** para parar o servidor
2. Os dados da sessão ficam salvos em `.data/lan-sessions.json`
3. Para um novo teste, execute `npm run dev:lan` novamente