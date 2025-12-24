import fs from 'fs'
import path from 'path'

const characterFirstNames = ['Thorne','Lyra','Cassian','Elara','Rowan','Zara','Drake','Nia','Cael','Isolde','Bram','Sorrel','Mira','Jarek','Anwen','Fen','Lucan','Selene','Riven','Kiera','Dain','Aveline','Torin','Yara','Malric','Seren','Eamon','Vale','Nyssa','Orin']
const characterLastNames = ['Rivenguard','Nightfall','Starcrest','Dawnhollow','Blackwood','Stormborn','Silverleaf','Ashenvale','Ironheart','Sunspire','Frostbane','Shadowmere','Emberwild','Moonblade','Skysong','Flameborn','Mistwalker','Oakenshield','Stonehelm','Brightwind','Hollowmere','Stormglen','Briarshade','Thornfield','Glareshield','Wolfsong','Ambervale','Runecrest','Gloomfen','Sunreach']
const classes = ['Ranger','Guardião','Arqueiro','Tecnomante','Guerreiro Arcano','Batedor','Oráculo','Domador','Bardo de Guerra','Alquimista','Caçador de Relíquias','Bruxa das Brumas','Cavaleiro Solar','Heraldo Sombrio','Médico de Campanha','Corsária','Patrulheiro do Véu','Arquiteto de Runas','Exilado Arcano','Vanguarda Celeste']

const itemAdjectives = ['Antigo','Brilhante','Cintilante','Dracônico','Ébano','Fulgurante','Glacial','Harmonioso','Ígneo','Jade','Lunar','Mistico','Nacarado','Obsidiano','Prismático','Quieto','Rúnico','Sibilante','Tempestuoso','Umbrático','Vigilante','Whispering','Xamânico','Ysar','Zephir']
const itemNouns = ['Espada','Lança','Machado','Chicote','Arco','Adaga','Cajado','Martelo','Orbe','Livro','Broquel','Cota','Elmo','Luvas','Botas','Amuleto','Anel','Bracelete','Manto','Capa','Símbolo','Lanterna','Frasco','Totem']
const itemTypes = ['arma','armadura','escudo','acessório','consumível','ferramenta arcana']

const physicalFragments = [
  'Figura atlética com postura vigilante e olhar que mede distâncias antes de avançar',
  'Cicatriz discreta na sobrancelha e tatuagens finas que seguem o contorno dos braços',
  'Cabelos presos de forma prática, poucos fios soltos balançando quando se move com leveza',
  'Veste camadas de couro gasto, reforçado por placas leves e bordados de runas protetoras',
  'Altura mediana, ombros largos e ares de alguém acostumado a marchas longas sob clima hostil',
  'Olhos de cor incomum que refletem chamas ou estrelas dependendo da iluminação do salão',
  'Luvas com nós de metal e botas silenciosas, ajustadas para deslocamento rápido em terreno irregular',
  'Escudo pequeno preso às costas, junto a cordas, ganchos e frascos que chacoalham suavemente',
  'Pele marcada por sol e chuva, demonstrando anos guiando caravanas e patrulhando rotas esquecidas',
  'Pingentes de ossos e vidro colorido balançam no pescoço, servindo como talismãs de viagem',
  'Capa curta forrada de tecido impermeável, tingida em tons que se misturam à floresta noturna',
  'Postura alerta, peso sempre distribuído como se estivesse pronto para saltar ou disparar uma flecha',
]

const personalityFragments = [
  'Planeja antes de falar e prefere ouvir as histórias dos outros para aprender atalhos emocionais',
  'Confia em círculos pequenos, mas protege estranhos vulneráveis mesmo que não admita em voz alta',
  'Humor seco que surge em comentários curtos durante momentos de tensão',
  'Avalia riscos com frieza, embora tenha queda por desafios que testam inteligência e coragem',
  'Mantém promessas antigas como se fossem juramentos sagrados, mesmo quando ninguém está olhando',
  'Valoriza silêncio compartilhado, acreditando que companhia sincera dispensa palavras',
  'Instinto curioso por ruínas e mapas, fascinado por símbolos que contam histórias esquecidas',
  'Busca redenção por falhas passadas, transformando culpa em disciplina rigorosa',
  'Tolera pouco arrogância, mas respeita habilidade verdadeira independentemente da origem',
  'Combina pragmatismo de viajante com compaixão inesperada por crianças e animais feridos',
  'Sussurra conselhos táticos durante conflitos, incentivando aliados a ocuparem terreno elevado',
  'Quando relaxa, revela gosto por música suave e enigmas de taberna',
]

const backgroundFragments = [
  'Cresceu em fronteira disputada, guiando caravanas por vales que mudam com enchentes súbitas',
  'Serviu como batedor de um exército derrotado, aprendendo rotas secretas e códigos de fumaça',
  'Perdeu mentor durante emboscada, carregando o mapa rasgado que ambos traçaram ao explorar ruínas',
  'Já protegeu estudiosos em expedições, convertendo notas de campo em rotas seguras através de selvas',
  'Recusou convite para permanecer em corte nobre, preferindo liberdade das estradas e mercados livres',
  'Conduziu refugiados por desfiladeiros nevados, jurando nunca deixar outro grupo perdido na névoa',
  'Descobriu artefato que sussurra estrelas cadentes, vendendo-o para financiar treino e armas',
  'Passou anos como cartógrafo clandestino, copiando mapas proibidos e vendendo versões codificadas',
  'Perambulou por faróis costeiros abandonados, recolhendo sinais de luz usados por contrabandistas',
  'Reuniu canções de aldeias isoladas, guardando versos que descrevem monstros marinhos e meteoros',
  'Ganhou título informal de guardião das trilhas quando derrotou bando de saqueadores em ravina',
  'Participou de missão diplomática que falhou, compreendendo que ouvir dialetos salva mais vidas que espadas',
]

const abilityFragments = [
  'Atira enquanto se move, combinando respiração ritmada com leitura de vento e terreno',
  'Consegue rastrear odores específicos mesmo sob chuva, usando pó de ervas para marcar trilhas invisíveis',
  'Ergue barreiras de runas que desviam setas e amortecem impacto de explosões',
  'Conjura animais espectrais para distrair inimigos ou carregar equipamentos delicados',
  'Domina técnica de passo velado, sumindo da linha de visão por alguns batimentos',
  'Mistura flechas com frascos elementais, alternando entre fogo que ilumina e gelo que aprisiona',
  'Conhece canções breves que inspiram aliados cansados, restaurando fôlego durante longas caçadas',
  'Troca de armas sem perder ritmo, combinando lâmina curta e arco longo em sequência fluida',
  'Interpreta padrões de nuvens para prever emboscadas ou rachaduras de gelo em penhascos',
  'Usa redes com pesos de prata para conter criaturas etéreas e espíritos furiosos',
  'Pode invocar visões de antigas batalhas, assustando adversários supersticiosos com ecos de tambores',
  'Mantém estoque de armadilhas dobráveis que se ativam com disparo sonoro quase inaudível',
]

const itemVisualFragments = [
  'Lâmina com gravuras profundas que brilham em azul quando a arma é empunhada à noite',
  'Cabo envolto em couro escurecido, adornado por fios de cobre que conduzem energia estática',
  'Superfície polida como espelho quebrado, refletindo silhuetas distorcidas do portador',
  'Pequenas correntes conectam placas justapostas, permitindo flexibilidade sem perder proteção',
  'Nó de cristal no centro vibra quando feitiços se aproximam, emitindo faíscas douradas',
  'Tecidos internos perfumados com resina de pinho, repelindo mofo de cofres subterrâneos',
  'Metal azulado aparenta gelo sólido, mas permanece morno ao toque e não cria ferrugem',
  'Aljava com penas multicoloridas que tremulam mesmo sem vento, indicando direção de perigo',
  'Runas geométricas percorrem a peça, alinhando-se em padrões diferentes conforme o usuário respira',
  'Ornamentos de vidro fumê formam espiral, lembrando olho que nunca se fecha durante a vigília',
  'As bordas são reforçadas por fios de prata que capturam luz e criam halo discreto',
  'A peça é guardada em estojo de veludo azul, com cinzas de dragão prensadas no forro',
]

const itemPropertyFragments = [
  'Amplifica golpes contra criaturas sobrenaturais, aplicando impacto extra quando runas se acendem',
  'Permite armazenar um sussurro; ao liberar, distrai inimigos próximos por alguns segundos',
  'Reduz ruído do portador em terreno urbano, abafando passos e choque de metal',
  'Canaliza energia ígnea que aquece o usuário em noites de geada ou incendeia flechas',
  'Projeta campo repulsor que diminui dano de projéteis leves e desvia lascas de pedra',
  'Quando submerso, cria bolha de ar respirável ao redor do rosto por minutos',
  'Aumenta alcance de ataques à distância quando alinhado com constelações marcadas na empunhadura',
  'Neutraliza venenos simples ao ser pressionado contra ferimento recente',
  'Permite que o usuário salte distâncias maiores ao liberar impulso comprimido nas placas',
  'Regenera lentamente pequenos arranhões na superfície, sinalizando se foi tocado por magia corrupta',
  'Concede bônus tático quando usado por quem conhece sinais de batalha gravados na borda',
  'Armazena uma única prece; quando proferida, cria luz suave e afastadora de sombras',
]

function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pick(list, r) {
  return list[Math.floor(r() * list.length)]
}

function buildParagraph(seed, fragments, extra) {
  const r = makeRng(seed)
  const chosen = []
  let wordCount = 0
  let guard = 0
  while (wordCount < 55 && guard < 20) {
    const fragment = pick(fragments, r)
    chosen.push(fragment)
    wordCount += fragment.split(/\s+/).length
    guard++
  }
  if (wordCount < 50) {
    chosen.push(extra)
    wordCount += extra.split(/\s+/).length
  }
  while (wordCount > 100 && chosen.length > 1) {
    const removed = chosen.pop()
    wordCount -= removed.split(/\s+/).length
  }
  return chosen.join('. ') + '.'
}

function createCharacterEntry(index) {
  const r = makeRng(7000 + index)
  const first = characterFirstNames[index % characterFirstNames.length]
  const last = characterLastNames[Math.floor(index / characterFirstNames.length) % characterLastNames.length]
  const name = `${first} ${last}`
  const role = pick(classes, r)
  return {
    name,
    class: role,
    physicalDescription: buildParagraph(index * 13, physicalFragments, 'A figura mantém equilíbrio controlado, mesclando traços austeros com marcas de estrada e uso constante.'),
    personality: buildParagraph(index * 17, personalityFragments, 'Combina disciplina com empatia prática, demonstrando firmeza quando a missão exige e gentileza quando alguém está vulnerável.'),
    background: buildParagraph(index * 19, backgroundFragments, 'Sobreviveu a cercos e tempestades, reunindo lições de rotas antigas para guiar novos aliados.'),
    specialAbilities: buildParagraph(index * 23, abilityFragments, 'Flexiona talento marcial e místico para resolver emboscadas rapidamente, mantendo pressão contínua sobre adversários.'),
  }
}

function createItemName(index) {
  const adj = itemAdjectives[index % itemAdjectives.length]
  const noun = itemNouns[Math.floor(index / itemAdjectives.length) % itemNouns.length]
  const variant = (index % 5) + 1
  return `${adj} ${noun} ${variant}`
}

function createItemEntry(index) {
  const name = createItemName(index)
  const r = makeRng(9000 + index)
  const type = pick(itemTypes, r)
  return {
    name,
    type,
    visualDescription: buildParagraph(index * 29, itemVisualFragments, 'O objeto apresenta acabamento artesanal e brilho discreto, revelando função prática e aura lendária ao mesmo tempo.'),
    properties: buildParagraph(index * 31, itemPropertyFragments, 'Responde ao toque do usuário escolhido, ampliando proezas e permitindo abordagens criativas durante encontros perigosos.'),
    rarity: ['comum','incomum','raro','lendário','mítico'][index % 5],
    estimatedValue: `${500 + index * 15} peças de ouro`,
  }
}

const characters = Array.from({ length: 100 }, (_, i) => createCharacterEntry(i))
const items = Array.from({ length: 100 }, (_, i) => createItemEntry(i))

const payload = {
  generatedAt: new Date().toISOString(),
  notes: 'Cada descrição possui entre 50 e 100 palavras, cobrindo aparência, personalidade, histórico e habilidades ou propriedades.',
  characters,
  items,
}

const outPath = path.join(process.cwd(), 'reference', 'catalog-descriptions.json')
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8')
console.log(`Catalog data generated at ${outPath}`)
