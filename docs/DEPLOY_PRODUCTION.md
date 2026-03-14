# Deploy de Producao

## Caminho rapido para testes

- URL publica temporaria: gerada por `npm run publish:test`
- Modo resiliente: `powershell -ExecutionPolicy Bypass -File ./.tools/publish-watch.ps1`
- Ultima URL conhecida: `.tools/public-url.txt`

Esse modo depende da maquina local ligada e da conectividade com o provedor de tunel SSH. Ele serve bem para validacao com amigos, mas nao deve ser tratado como deploy final.

## Caminho recomendado para dominio proprio

### Opcao 1: VPS com Docker

1. Copie o projeto para a VPS.
2. Rode:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

3. A aplicacao ficara publicada na porta `8080`.
4. Coloque um proxy reverso na frente com HTTPS.

### Proxy reverso sugerido

- Caddy: mais simples para emissao automatica de certificado.
- Nginx Proxy Manager: mais visual.
- Cloudflare Tunnel: bom para expor a VPS ou a maquina local sem abrir porta no roteador.

## Build em subpasta

Se o site for publicado em subpasta, compile com:

```bash
VITE_APP_BASE_PATH=/sua-subpasta/
npm run build
```

## Recomendacoes para dominio

1. Configure DNS apontando para a VPS ou para o proxy escolhido.
2. Use HTTPS obrigatorio.
3. Mantenha `npm run qa:browser-smoke` na rotina antes de atualizar.
4. Se usar Supabase, configure as URLs finais permitidas no painel do projeto.

## Checklist antes de abrir para publico

- `npm run build`
- `npm run test:regression`
- `npm run qa:browser-smoke`
- Validar `/admin` com 2FA
- Validar criacao de campanha e ficha nos sistemas suportados
