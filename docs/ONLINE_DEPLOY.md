# ONLINE_DEPLOY.md — Deploy da Alpha Online

## Serviço Render

- **Nome:** rpg-alpha
- **URL:** https://rpg-alpha.onrender.com
- **Tipo:** Web Service (Node.js)
- **Plano:** Free
- **Branch:** alpha-online
- **Repositório:** https://github.com/bugijo/Mestre-3D-T

## Configuração

### Build Command
```bash
npm install --omit=dev
```

### Start Command
```bash
npm start
```
(Executa `node server/lan-server.mjs --production` com `NODE_ENV=production APP_MODE=online`)

### Health Check
`/api/health`

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV=production` | Modo produção |
| `APP_MODE=online` | Modo online (vs lan) |
| `PORT=10000` | Porta do Render |
| `PUBLIC_APP_URL` | URL pública |
| `ALLOWED_ORIGINS` | Origens permitidas (CORS) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Chave service role (necessário configurar)** |
| `VITE_SUPABASE_URL` | URL para o frontend |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima para o frontend |
| `VITE_WS_URL` | URL do WebSocket |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` | Evita download do Playwright no build |

## Deploy

O deploy é automático via `autoDeploy: yes`. Cada push para `alpha-online` dispara um novo deploy.

### Manual
```bash
# Via API Render
curl -X POST https://api.render.com/v1/services/{service_id}/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

## Verificação Pós-Deploy

```bash
# Health check
curl https://rpg-alpha.onrender.com/api/health

# Config
curl https://rpg-alpha.onrender.com/api/config

# WebSocket (via Node.js)
node -e "new (require('ws'))('wss://rpg-alpha.onrender.com/ws')"
```

## Rollback

No dashboard do Render, selecione o deploy anterior e clique em "Rollback".

## Limitações do Plano Free

- 512 MB RAM
- CPU compartilhado
- Suspensão por inatividade (15 min sem tráfego)
- 1 instância
- 100 GB largura de banda/mês

## SUPABASE_SERVICE_ROLE_KEY

Esta variável **não está configurada** na Alpha atual. Para ativar a persistência online:
1. Acesse o dashboard do Supabase: https://supabase.com
2. Projeto: `mlhrloxhbrscvcclcxxh`
3. Settings → API → Project API keys → `service_role` key
4. Render Dashboard → rpg-alpha → Environment → Add SUPABASE_SERVICE_ROLE_KEY
5. Faça deploy manual

**NUNCA exponha a service_role_key no frontend ou no GitHub.**