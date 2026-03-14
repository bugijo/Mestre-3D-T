import fs from 'fs'
import path from 'path'

function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const firstNames = ['Aiden','Luna','Kai','Mara','Orion','Selene','Darius','Aria','Riven','Nyx','Kellan','Eira','Thorne','Lyra','Cassian','Elara','Rowan','Zara','Drake','Nia']
const lastNames = ['Blackwood','Stormborn','Silverleaf','Nightfall','Ashenvale','Ironheart','Sunspire','Frostbane','Starcrest','Shadowmere','Dawnhollow','Emberwild','Rivenguard','Moonblade','Skysong','Flameborn','Mistwalker','Oakenshield','Stonehelm','Brightwind']
const roles = ['Guerreiro','Mago','Rogue','Clérigo','Ranger','Bardo','Paladino','Druida','Monge','Feiticeiro','Warlock','Arqueiro','Alquimista','Guardião','Vanguarda']
const dndClasses = ['Fighter','Wizard','Rogue','Cleric','Barbarian','Paladin','Ranger','Druid','Bard','Monk','Sorcerer','Warlock']

const itemBaseNames = ['Espada Curta','Arco Composto','Escudo Leve','Armadura de Couro','Cajado Rúnico','Adaga Enfeitiçada','Lança Equilibrada','Elmo da Vigília','Botas Silenciosas','Amuleto do Foco']
const itemTypes = ['WEAPON','ARMOR','SHIELD','ACCESSORY','CONSUMABLE']
const rarityScale = ['comum','incomum','raro','épico','lendário']

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function pick(arr, r) { return arr[Math.floor(r() * arr.length)] }

function makeName(i) {
  if (i === 0) return 'Thorne Rivenguard'
  const f = firstNames[i % firstNames.length]
  const l = lastNames[i % lastNames.length]
  return `${f} ${l}`
}

function words(parts) { return parts.join(' ').replace(/\s+/g, ' ').trim() }

function buildCharacter(i, r) {
  const name = makeName(i)
  const klass = pick(dndClasses, r)
  const role = pick(roles, r)
  const h = 1.65 + Math.floor(r() * 30) / 100
  const phys = words([
    `${name} tem cerca de ${h.toFixed(2)}m de altura, porte atlético e postura alerta.`,
    `Traços marcantes nos olhos e mandíbula firme sugerem disciplina e anos de treino.`,
    `Veste peças de couro reforçado e tecido escuro com detalhes rúnicos discretos,`,
    `mantendo mobilidade sem perder proteção. O cabelo, bem aparado ou preso,`,
    `acompanha um semblante atento, pronto para reagir em instantes.`
  ])
  const personality = words([
    `Reservado, observador e pragmático, evita desperdícios e age com precisão.`,
    `Leal ao grupo, valoriza planejamento e mantém calma sob pressão,`,
    `usando humor contido para aliviar a tensão quando necessário.`
  ])
  const background = words([
    `Cresceu em vilas entre bosques antigos, aprendendo rastreamento e sobrevivência com guardiões locais.`,
    `Após conflitos com saqueadores e criaturas da mata, desenvolveu responsabilidade com as fronteiras,`,
    `aceitando missões que protegem rotas comerciais e aldeias sob risco constante.`
  ])
  const abilities = [
    'Percepção aguçada e leitura de pistas no terreno',
    'Movimentação silenciosa e posicionamento tático',
    'Tiro preciso ou golpe oportuno em pontos vitais',
  ]
  const visualPrompt = words([
    `${role} ${klass} em cenário de castelo iluminado por tochas,`,
    `couro escuro com detalhes metálicos discretos, postura pronta, arco ou lâmina leve,`,
    `estilo neon/arcano, luz fria em contraste com fundo âmbar.`
  ])
  return {
    name,
    class: klass,
    occupation: role,
    physicalDescription: phys,
    personality,
    background,
    specialSkills: abilities,
    visualPrompt,
  }
}

function buildItem(i, r) {
  const base = itemBaseNames[i % itemBaseNames.length]
  const affix = ['da Aurora','do Véu','da Tempestade','do Sussurro','do Crepúsculo','da Vigília'][Math.floor(r() * 6)]
  const name = `${base} ${affix}`
  const type = pick(itemTypes, r)
  const visual = words([
    `Peça de artesanato robusto com acabamento polido e runas tênues próximas às arestas.`,
    `Linhas angulares e proporções equilibradas sugerem manufatura precisa,`,
    `com leve brilho quando exposta à chama, indicando liga especial ou encantamento sutil.`
  ])
  const props = [
    'Bônus moderado a manuseio e precisão',
    'Resistência a intempéries e desgaste',
    'Compatível com alquimia leve para manutenção',
  ]
  const rarity = rarityScale[Math.floor(r() * rarityScale.length)]
  const value = 50 + Math.floor(r() * 450)
  const visualPrompt = words([
    `Item ${type.toLowerCase()} com metal escuro e detalhes luminosos em azul,`,
    `sobre mesa de madeira em salão medieval, iluminação quente,`,
    `estilo neon/arcano, foco no objeto com fundo suavemente desfocado.`
  ])
  return {
    name,
    type,
    visualDescription: visual,
    properties: props,
    rarity,
    estimatedValue: value,
    visualPrompt,
  }
}

function buildAll() {
  const r = rng(777)
  const characters = Array.from({ length: 100 }, (_, i) => buildCharacter(i, r))
  const items = Array.from({ length: 100 }, (_, i) => buildItem(i, r))
  return { characters, items }
}

function toCSV(list, fields) {
  const head = fields.join(',')
  const rows = list.map(o => fields.map(f => {
    const v = Array.isArray(o[f]) ? o[f].join(' | ') : String(o[f] ?? '')
    const s = v.replace(/"/g, '""')
    return `"${s}"`
  }).join(','))
  return [head, ...rows].join('\n')
}

const outDir = path.join(process.cwd(), 'docs', 'catalog')
ensureDir(outDir)
const { characters, items } = buildAll()

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify({ characters, items }, null, 2), 'utf8')
fs.writeFileSync(path.join(outDir, 'characters.json'), JSON.stringify(characters, null, 2), 'utf8')
fs.writeFileSync(path.join(outDir, 'items.json'), JSON.stringify(items, null, 2), 'utf8')

fs.writeFileSync(path.join(outDir, 'characters.csv'), toCSV(characters, ['name','class','occupation','physicalDescription','personality','background','specialSkills','visualPrompt']), 'utf8')
fs.writeFileSync(path.join(outDir, 'items.csv'), toCSV(items, ['name','type','visualDescription','properties','rarity','estimatedValue','visualPrompt']), 'utf8')

console.log('Catalog gerado em docs/catalog')

