# Referencia de regras para criacao de personagens

Este documento registra as fontes oficiais usadas para o motor de validacao atualmente suportado no projeto.

## 3DeT Victory

Fontes oficiais consultadas:

- Demo oficial: `https://site.jamboeditora.com.br/3det/wp-content/uploads/2024/07/3det_victory_demo_vTDC_150724.pdf`
- Manual playtest: `https://blog.jamboeditora.com.br/o-manual-3det-victory-playtest/`
- Visao geral oficial: `https://site.jamboeditora.com.br/3det/o-que-e-3det-victory/`

Subset implementado nesta versao:

- criacao padrao com `10 pontos`
- limite de `2 pontos` vindos de desvantagens
- atributos base `Poder`, `Habilidade` e `Resistencia`
- derivacao oficial suportada para recursos:
  - `PV = Resistencia x 5`, com minimo 1
  - `PM = Habilidade x 5`, com minimo 1
- arquetipos suportados:
  - Humano
  - Elfo
  - Kemono
  - Osteon
- pericias suportadas:
  - Artes, Esporte, Influencia, Luta, Manha, Mistica, Percepcao, Saber, Sustento
- vantagens/desvantagens suportadas:
  - Agil, Artefato, Ataque Especial, Carismatico, Forte, Genio, Ilusao, Magia, Resoluto, Sentido, Vigoroso
  - Antipatico, Atrapalhado, Diferente, Fracote, Fragil, Indeciso, Tapado

Observacao tecnica:

- o projeto legado ainda usa a estrutura interna classica de cinco campos (`strength`, `skill`, `resistance`, `armor`, `firepower`);
- para compatibilidade, a ficha oficial de 3DeT Victory e persistida com `Poder -> strength`, `Habilidade -> skill`, `Resistencia -> resistance`, enquanto `armor` e `firepower` ficam em `0`;
- os dados oficiais de criacao ficam preservados em `character.threeDet`.

## D&D 5e

Fontes oficiais consultadas:

- Basic Rules 2014 - Step by Step Characters: `https://www.dndbeyond.com/sources/dnd/basic-rules-2014/step-by-step-characters`
- Basic Rules 2014 - Races: `https://www.dndbeyond.com/sources/dnd/basic-rules-2014/races`
- Basic Rules 2014 - Classes: `https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes`
- SRD 5.1 PDF oficial: `https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf`

Subset implementado nesta versao:

- criacao guiada para `nivel 1`
- `point buy 27` com atributos base entre `8` e `15`
- XP inicial travado em `0`
- racas suportadas:
  - Human
  - Hill Dwarf
  - High Elf
  - Lightfoot Halfling
- classes suportadas:
  - Fighter
  - Cleric
  - Rogue
  - Wizard
- antecedentes suportados:
  - Acolyte
  - Criminal
  - Sage
  - Soldier
- pacotes iniciais oficiais suportados por classe, sem combinacao livre invalida

## Fora do escopo atual

- todas as opcoes expandidas de suplementos
- dominios, especializacoes, subclasses e talentos avancados
- migracao completa de toda a plataforma para a modelagem nativa de 3DeT Victory

Esses itens exigem expansao controlada do motor de regras e migracao de dados existentes.
