# Catálogo com descrições visuais

O arquivo `reference/catalog-visuals.json` consolida todos os registros disponíveis na página de catálogo (heróis, NPCs, vilões, itens e histórias) com descrições de 50–100 palavras pensadas para geração de imagens. Os nomes e quantidades refletem exatamente o catálogo carregado pelo app, pois usam as mesmas sementes que `src/data/catalog.ts`.

## Campos por tipo

### Personagens (heróis, NPCs, vilões)
- `name`: nome completo exibido no catálogo.
- `category`: `HERO`, `NPC` ou `VILLAIN` (corresponde aos filtros da interface).
- `role`: ocupação ou classe principal.
- `visualDescription`: aparência física para guiar IA generativa (altura, corpo, vestimenta, adereços).
- `personality`: tom e postura social.
- `backstory`: contexto resumido para ambientar ilustrações.
- `abilities`: pistas táticas ou mágicas úteis para compor poses e itens de cena.

### Itens
- `name`: nome exatamente como aparece no catálogo.
- `type`: `WEAPON`, `ARMOR`, `SHIELD` ou `ACCESSORY`.
- `visualDescription`: textura, material, detalhes decorativos e estado de conservação.
- `properties`: efeitos especiais ou usos práticos para direcionar luz, partículas e postura do portador.
- `rarity`: escala narrativa (`comum` a `mítico`).
- `estimatedValue`: valor sugerido em peças de ouro.

### Histórias
- `name`: título igual ao catálogo.
- `visualHook`: clima e elementos visuais recorrentes para key arts de cada história.

## Como regenerar

Execute o script abaixo para atualizar os dados (o resultado é sempre determinístico):

```bash
node scripts/export-catalog-visuals.mjs
```

Isso sobrescreve `reference/catalog-visuals.json` com um payload atualizado em `generatedAt`.
