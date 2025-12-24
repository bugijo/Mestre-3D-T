import fs from 'fs'
import path from 'path'

// Shared catalog seeds and sources (mirrors src/data/catalog.ts generation)
const firstNames = ['Aiden','Luna','Kai','Mara','Orion','Selene','Darius','Aria','Riven','Nyx','Kellan','Eira','Thorne','Lyra','Cassian','Elara','Rowan','Zara','Drake','Nia']
const lastNames = ['Blackwood','Stormborn','Silverleaf','Nightfall','Ashenvale','Ironheart','Sunspire','Frostbane','Starcrest','Shadowmere','Dawnhollow','Emberwild','Rivenguard','Moonblade','Skysong','Flameborn','Mistwalker','Oakenshield','Stonehelm','Brightwind']
const roles = ['Guerreiro','Mago','Rogue','Clérigo','Ranger','Bardo','Paladino','Druida','Monge','Feiticeiro','Warlock','Arqueiro','Alquimista','Guardião','Vanguarda']
const itemNames = ['Espada Curta','Arco Composto','Escudo Leve','Armadura de Couro','Cajado Rúnico','Adaga Enfeitiçada','Lança Equilibrada','Elmo da Vigília','Botas Silenciosas','Amuleto do Foco']
const itemTypes = ['WEAPON','ARMOR','SHIELD','ACCESSORY']

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)]
}

function buildParagraph(seed, fragments, fallback) {
  const r = rng(seed)
  const chosen = []
  let wordCount = 0
  let guard = 0
  while (wordCount < 55 && guard < 24) {
    const fragment = pick(fragments, r)
    chosen.push(fragment)
    wordCount += fragment.split(/\s+/).length
    guard++
  }
  if (wordCount < 50) {
    chosen.push(fallback)
    wordCount += fallback.split(/\s+/).length
  }
  while (wordCount > 100 && chosen.length > 1) {
    const removed = chosen.pop()
    wordCount -= removed.split(/\s+/).length
  }
  return chosen.join('. ') + '.'
}

const physicalFragments = [
  'Altura acima da média, músculos definidos e postura de quem passou anos marchando sob armadura',
  'Traços marcados por cicatriz na bochecha e sobrancelha arqueada, somados a olhar sempre atento',
  'Cabelos longos presos em trança lateral, fios prateados indicando vigílias noturnas e batalhas antigas',
  'Veste couro reforçado por placas leves, tingido em tons terrosos, com costuras visíveis de reparos frequentes',
  'Luvas gastas cobrem dedos calejados; mãos carregam cheiros de óleo de arma e resina de arco',
  'Capa curta presa por broche metálico, bordada com runas discretas que brilham ao entardecer',
  'Botas silenciosas com sola de borracha preta, marcadas por lama seca e pó de estrada',
  'Pingente simples de madeira pende do pescoço, contrastando com ombreiras metálicas de desenho angular',
  'Olhos claros refletem luz em tom âmbar, sugerindo percepção aguçada mesmo em ambientes escuros',
  'Silhueta austera, sempre com centro de gravidade baixo, pronta para esquiva ou disparo rápido',
  'Cinto repleto de bainhas pequenas, frascos e ganchos, mantendo ferramentas visíveis para uso imediato',
  'Armadura modular deixa braços livres, revelando tatuagens finas em espiral com símbolos de vento e caça'
]

const personalityFragments = [
  'Fala pouco e observa muito, catalogando rotas de fuga antes mesmo de cumprimentar estranhos',
  'Gosta de testar limites, propondo desafios curtos para aliados e medindo coragem em silêncio',
  'Respeita quem cumpre palavra, evitando líderes que mudam planos sem explicar motivos',
  'Confia mais em mapas do que em promessas, preferindo evidências concretas a discursos longos',
  'Cultiva humor discreto, soltando comentários irônicos apenas quando tensão ameaça quebrar a equipe',
  'Prefere companhias pequenas, acreditando que duas pessoas atentas valem mais que um grupo barulhento',
  'Carrega memória nítida de derrotas e deixa que elas guiem preparação para a próxima emboscada',
  'Demonstra gentileza prática com viajantes feridos, mesmo quando tenta parecer distante',
  'Sente-se mais confortável em floresta fechada do que em salões nobres e iluminados',
  'Tem afinidade por enigmas e trilhas secretas, encarando cada viagem como quebra-cabeça vivo'
]

const backgroundFragments = [
  'Viajou escoltando caravanas por rotas que mudam com chuvas e deslizes de encosta',
  'Sobreviveu a cerco prolongado aprendendo a racionar flechas e ração seca',
  'Desertou de exército derrotado levando apenas arco, botas e um mapa rasgado',
  'Guiou estudiosos por ruínas ancestrais, anotando símbolos para vender a cartógrafos',
  'Protegeu refugiados em travessia montanhosa, marcando o caminho com tochas improvisadas',
  'Recusou medalha de corte real, preferindo anonimato das estradas e portos decadentes',
  'Registrou canções de aldeias costeiras, memorizando lendas sobre monstros marinhos',
  'Caminhou por pântanos e desertos para entregar mensagens que poderiam evitar guerras',
  'Manteve farol abandonado funcionando durante tempestades, salvando navios que jamais souberam seu nome',
  'Vendeu artefato murmuroso para financiar treinamento extra, carregando culpa por não saber seu real poder'
]

const abilityFragments = [
  'Alterna entre arco e lâmina curta sem perder ritmo, mantendo pressão constante em combate',
  'Analisa pegadas e odores sob chuva, identificando emboscadas antes que tomem forma',
  'Desenha runas rápidas em escudos ou pedras, criando barreiras que desviam projéteis',
  'Invoca animais espectrais para distrair criaturas ou carregar mensagens sigilosas',
  'Silencia passos usando pó de ervas, desaparecendo por instantes em corredores estreitos',
  'Mistura frascos elementais às flechas, causando explosões de luz ou rajadas congelantes',
  'Recita cantos breves que mantêm aliados focados e recuperam fôlego entre ataques',
  'Lê padrões de nuvens para prever deslizamentos, enchentes ou ataques de dragões alados',
  'Arma armadilhas dobráveis com disparo sonoro quase inaudível, travando avanço inimigo',
  'Cria ilusões de passos e vozes, confundindo vigias e abrindo brechas para infiltração'
]

const itemVisualFragments = [
  'Lâmina exibe entalhes profundos que brilham em azul quando brandida sob luar',
  'Cabo revestido por couro escurecido, trançado com fios de cobre que vibram com energia',
  'Superfície polida reflete silhuetas distorcidas, como se observada por água agitada',
  'Placas justapostas conectadas por pequenas correntes permitem flexibilidade surpreendente',
  'Nó de cristal no centro pulsa faíscas douradas quando magia se aproxima',
  'Tecidos internos levam aroma de resina e pinho, preservando a peça mesmo em catacumbas úmidas',
  'Metal azulado parece gelo, mas permanece morno ao toque e repele ferrugem',
  'Aljava com penas multicoloridas tremula sem vento, apontando direção de perigo próximo',
  'Runas geométricas percorrem a peça, mudando alinhamento conforme o usuário respira',
  'Bordas reforçadas por fios de prata capturam luz, formando halo discreto em torno do objeto',
  'Ornamentos de vidro fumê criam espiral lembrando olho sempre desperto',
  'Estojo de veludo azul guarda cinzas de dragão prensadas no forro, perfumando o metal'
]

const itemPropertyFragments = [
  'Amplifica golpes contra criaturas sobrenaturais, canalizando impacto extra quando runas se acendem',
  'Armazena um sussurro; ao liberar, distrai inimigos por segundos preciosos',
  'Abafa ruído do portador em ruas estreitas, tornando passos e metal quase inaudíveis',
  'Canaliza energia ígnea que aquece em noites geladas ou incendia projéteis',
  'Projeta campo repulsor que desvia lascas de pedra e projéteis leves',
  'Cria bolha de ar respirável ao ser submerso, protegendo usuário por alguns minutos',
  'Aumenta alcance de ataques à distância quando alinhado a constelações gravadas na empunhadura',
  'Neutraliza venenos simples ao ser pressionado contra ferimento recente',
  'Libera impulso comprimido nas placas, permitindo saltos maiores e movimentos acrobáticos',
  'Regenera arranhões lentamente e denuncia toque de magia corrupta com brilho vermelho',
  'Concede bônus tático para quem entende sinais de batalha gravados na borda',
  'Armazena prece única que, ao ser proferida, cria luz suave e afastadora de sombras'
]

const storyVisualFragments = [
  'Cenas começam em taverna iluminada por brasas, com mapas espalhados e chuva batendo nas janelas',
  'Florestas densas envolvem trilhas estreitas, névoa rasteira e vultos piscando entre troncos',
  'Criptas de pedra apresentam escadarias íngremes, tochas azuladas e ecos de correntes antigas',
  'Portos noturnos exibem navios altos, guindastes enferrujados e figuras encapuzadas observando',
  'Torre de vidro se ergue em penhasco, refletindo relâmpagos e símbolos rúnicos em paredes lisas',
  'Salões de castelo mostram tapeçarias chamuscadas, brasões riscados e tronos vazios sob poeira',
  'Mercados subterrâneos brilham com lanternas de cristal, aromas de especiarias e mercadores atentos',
  'Campos de batalha abandonados têm armas cravadas no solo, bandeiras rasgadas e neblina avermelhada'
]

function buildCharacterEntry(seed, category) {
  const r = rng(seed)
  const name = `${pick(firstNames, r)} ${pick(lastNames, r)}`
  const role = pick(roles, r)
  return {
    name,
    category,
    role,
    visualDescription: buildParagraph(seed * 11, physicalFragments, 'Mantém postura preparada, misturando músculos definidos, cicatrizes sutis e roupas reforçadas que sugerem prontidão constante.'),
    personality: buildParagraph(seed * 13, personalityFragments, 'Equilibra pragmatismo e lealdade silenciosa, guiando decisões com observação cuidadosa e respeito por promessas.'),
    backstory: buildParagraph(seed * 17, backgroundFragments, 'Carrega mapas gastos e lições de viagens perigosas, lembrando perdas e vitórias que moldaram seu senso de dever.'),
    abilities: buildParagraph(seed * 19, abilityFragments, 'Combina técnicas marciais e truques táticos para reagir rápido a emboscadas, mantendo equipe viva em terreno hostil.'),
  }
}

function buildItemEntry(seed) {
  const r = rng(seed)
  const name = itemNames[Math.floor(r() * itemNames.length)]
  const type = itemTypes[Math.floor(r() * itemTypes.length)]
  return {
    name,
    type,
    visualDescription: buildParagraph(seed * 23, itemVisualFragments, 'Peça artesanal de linhas elegantes, metal escuro e detalhes rúnicos pensados para se destacar em retratos e vitrines.'),
    properties: buildParagraph(seed * 29, itemPropertyFragments, 'Funciona como ferramenta versátil, abrindo opções táticas e apoio mágico sem depender de contexto específico.'),
    rarity: ['comum','incomum','raro','lendário','mítico'][seed % 5],
    estimatedValue: `${500 + seed * 15} peças de ouro`,
  }
}

function buildStoryEntry(seed) {
  return {
    name: ['Sussurros na Floresta','As Cinzas do Rei','Eco do Abismo','A Torre de Vidro','Sombras em Blackwood'][seed % 5],
    visualHook: buildParagraph(seed * 31, storyVisualFragments, 'Narrativa alterna entre interiores abafados e exteriores amplos, sempre com contraste forte de luz e sombra para facilitar composição de cenas.'),
  }
}

function buildEntries() {
  const heroes = Array.from({ length: 100 }, (_, i) => buildCharacterEntry(1000 + i + 1, 'HERO'))
  const npcs = Array.from({ length: 100 }, (_, i) => buildCharacterEntry(2000 + i + 1, 'NPC'))
  const villains = Array.from({ length: 100 }, (_, i) => buildCharacterEntry(3000 + i + 1, 'VILLAIN'))
  const items = Array.from({ length: 100 }, (_, i) => buildItemEntry(5000 + i + 1))
  const stories = Array.from({ length: 100 }, (_, i) => buildStoryEntry(4000 + i + 1))
  return { heroes, npcs, villains, items, stories }
}

const payload = {
  generatedAt: new Date().toISOString(),
  notes: 'Descrições de 50 a 100 palavras focadas em aparência e pistas visuais para geração de imagem. Nomes e quantidades refletem exatamente o catálogo em tempo de execução.',
  ...buildEntries(),
}

const outPath = path.join(process.cwd(), 'reference', 'catalog-visuals.json')
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8')
console.log(`Catalog visual dataset exported to ${outPath}`)
