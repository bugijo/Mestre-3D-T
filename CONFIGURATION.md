# CONFIGURATION

## Portas Padrão
- Servidor de desenvolvimento (`npm run dev`): 5173
- Servidor de preview (`npm run preview`): 4173
- Serviços externos: Supabase (URL/Key via `VITE_SUPABASE_*`), sem porta customizada

## Variáveis de Ambiente
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_TABLE` (opcional)

## Observações
- Nenhuma porta é sobrescrita em `vite.config.ts`.
- Ajustes de portas devem ser feitos via CLI (`vite --port <n>`) ou scripts, e documentados aqui.
