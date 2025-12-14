const nextSession = Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 2;

type Campaign = {
  title: string;
  subtitle: string;
  progress: number;
  cover: string;
};

type Scene = {
  name: string;
  type: string;
  description: string;
  active: boolean;
};

type BestiaryEntry = {
  name: string;
  category: 'Monstro' | 'Personagem';
  archetype: string;
  danger: string;
  hp: number;
  maxHp: number;
  strength: number;
  skill: number;
  resistance: number;
  armor: number;
  firepower: number;
  speed: number;
  image: string;
  tags: string[];
  habitat: string;
  actions: string[];
  reward: string;
};

const campaigns: Campaign[] = [
  {
    title: 'The Shadowed Realm',
    subtitle: 'Sessão em Blackwood | sábado, 19h',
    progress: 72,
    cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=60',
  },
  {
    title: 'Rise of the Tiamat',
    subtitle: '3 jogadores | high fantasy',
    progress: 45,
    cover: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1000&q=60',
  },
  {
    title: 'Curse of Strahd',
    subtitle: 'gótico | 2 sessões restantes',
    progress: 58,
    cover: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1000&q=60',
  },
  {
    title: 'Lost Mine of Phandelver',
    subtitle: 'sandbox inicial',
    progress: 25,
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=60',
  },
];

const scenes: Scene[] = [
  { name: 'Tavern Start', type: 'Taverna', description: 'Briefing e ganchos iniciais', active: false },
  { name: 'Dark Forest Path', type: 'Floresta', description: 'Emboscada de bandidos', active: false },
  { name: 'Ancient Ruins', type: 'Ruínas', description: 'Artefato e armadilhas', active: false },
  { name: 'Goblin Ambush', type: 'Emboscada', description: 'Combate rápido', active: true },
  { name: 'Dragon Lair Boss', type: 'Boss', description: 'Clímax da sessão', active: false },
];

const bestiaryEntries: BestiaryEntry[] = [
  {
    name: 'Dragão Ancestral',
    category: 'Monstro',
    archetype: 'Dragão — Lendário',
    danger: 'Destruição em massa, voo e sopro flamejante',
    hp: 118,
    maxHp: 140,
    strength: 5,
    skill: 3,
    resistance: 4,
    armor: 4,
    firepower: 5,
    speed: 4,
    image: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=1200&q=80',
    tags: ['lendário', 'fogo', 'voador'],
    habitat: 'Cordilheiras vulcânicas e templos em ruínas',
    actions: ['Sopro Flamejante (Recarga 5-6)', 'Garras Despedaçadoras', 'Voo Rasante'],
    reward: 'Relíquia dracônica, 2400 XP, gema do fogo primordial',
  },
  {
    name: 'Arqueiro Goblin',
    category: 'Monstro',
    archetype: 'Goblin — Batedor',
    danger: 'Emboscador furtivo com envenenamento',
    hp: 32,
    maxHp: 40,
    strength: 1,
    skill: 3,
    resistance: 1,
    armor: 1,
    firepower: 3,
    speed: 4,
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    tags: ['atirador', 'emboscada', 'veneno'],
    habitat: 'Desfiladeiros e florestas densas',
    actions: ['Tiro Envenenado', 'Bola de Fumaça', 'Fuga Ágil'],
    reward: 'Bolsa de moedas, 120 XP, mapa para um covil',
  },
  {
    name: 'Guardiã Espectral',
    category: 'Monstro',
    archetype: 'Mortos-vivos — Elite',
    danger: 'Ataques drenam vitalidade e enfraquecem armaduras',
    hp: 46,
    maxHp: 60,
    strength: 3,
    skill: 3,
    resistance: 3,
    armor: 2,
    firepower: 2,
    speed: 2,
    image: 'https://images.unsplash.com/photo-1603161394370-9de3220f8bb6?auto=format&fit=crop&w=1200&q=80',
    tags: ['morto-vivo', 'maldição', 'guardião'],
    habitat: 'Criptas ancestrais e corredores de ossos',
    actions: ['Toque Espectral', 'Correntes Etéreas', 'Grito de Medo'],
    reward: 'Essência fúnebre, 480 XP, chave da cripta',
  },
  {
    name: 'Mago das Sombras',
    category: 'Personagem',
    archetype: 'Conjurador — Controle',
    danger: 'Teleporta aliados e sufoca com escuridão',
    hp: 38,
    maxHp: 44,
    strength: 1,
    skill: 4,
    resistance: 1,
    armor: 1,
    firepower: 4,
    speed: 3,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    tags: ['magia', 'controle', 'teleporte'],
    habitat: 'Torre arcana ou conclave subterrâneo',
    actions: ['Explosão Sombria', 'Portal Relâmpago', 'Véu de Trevas'],
    reward: 'Grimório sombrio, 520 XP, pergaminho de teleporte',
  },
  {
    name: 'Bárbaro do Norte',
    category: 'Personagem',
    archetype: 'Guerreiro — Ofensivo',
    danger: 'Dano brutal e fúria que ignora medo',
    hp: 64,
    maxHp: 72,
    strength: 4,
    skill: 3,
    resistance: 3,
    armor: 2,
    firepower: 2,
    speed: 3,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    tags: ['corpo a corpo', 'líder', 'furioso'],
    habitat: 'Planícies congeladas e arenas bárbaras',
    actions: ['Fúria Indomável', 'Cabeçada', 'Golpe Giratório'],
    reward: 'Troféu tribal, 430 XP, hacha runica',
  },
  {
    name: 'Matriarca Aranha',
    category: 'Monstro',
    archetype: 'Aracnídeo — Rainha',
    danger: 'Cria filhotes, envenena e tece túneis',
    hp: 55,
    maxHp: 70,
    strength: 3,
    skill: 3,
    resistance: 2,
    armor: 2,
    firepower: 3,
    speed: 4,
    image: 'https://images.unsplash.com/photo-1510277962320-4c1f4462e9c0?auto=format&fit=crop&w=1200&q=80',
    tags: ['veneno', 'túnel', 'invocação'],
    habitat: 'Cavernas profundas e estruturas abandonadas',
    actions: ['Rajada de Teia', 'Mordida Venenosa', 'Ninhada Frenética'],
    reward: 'Seda reforçada, 360 XP, glândula de veneno raro',
  },
  {
    name: 'Clériga da Aurora',
    category: 'Personagem',
    archetype: 'Suporte — Cura e Luz',
    danger: 'Abençoa aliados, bane mortos-vivos e sela portais',
    hp: 44,
    maxHp: 52,
    strength: 2,
    skill: 2,
    resistance: 3,
    armor: 2,
    firepower: 2,
    speed: 2,
    image: 'https://images.unsplash.com/photo-1529900748603-9d7c0fdff6ec?auto=format&fit=crop&w=1200&q=80',
    tags: ['luz', 'cura', 'anti-morto-vivo'],
    habitat: 'Catedrais douradas ou enfermarias de guerra',
    actions: ['Onda Radiante', 'Canalizar Vida', 'Selo Sagrado'],
    reward: 'Símbolo solar, 410 XP, água benta superior',
  },
];

const app = document.getElementById('app')!;

const attributeBar = (label: string, value: number, max = 6) => {
  const pct = Math.min(1, value / max);
  return `
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between text-xs text-textSecondary">
        <span>${label}</span>
        <span class="text-textPrimary font-semibold">${value}</span>
      </div>
      <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div class="h-full bg-primaryPurple" style="width:${pct * 100}%"></div>
      </div>
    </div>
  `;
};

const state = {
  query: '',
  tag: 'Todos',
  category: 'Monstro' as BestiaryEntry['category'],
  sort: 'perigo',
  perPage: 6,
  page: 1,
  activeScene: scenes.find((s) => s.active)?.name ?? scenes[0].name,
};

const uniqueTags = Array.from(new Set(bestiaryEntries.flatMap((m) => m.tags))).sort();

const renderCountdown = () => {
  const now = Date.now();
  const diff = Math.max(0, nextSession - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const setText = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('cd-days', days.toString().padStart(2, '0'));
  setText('cd-hours', hours.toString().padStart(2, '0'));
  setText('cd-mins', minutes.toString().padStart(2, '0'));
};

const renderCampaigns = () => {
  const grid = document.getElementById('campaign-grid');
  if (!grid) return;

  grid.innerHTML = campaigns
    .map(
      (c) => `
      <div class="glass-panel p-4 space-y-3 campaign-card">
        <div class="h-32 w-full rounded-xl overflow-hidden relative">
          <img src="${c.cover}" class="object-cover w-full h-full"/>
          <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70"></div>
        </div>
        <div class="space-y-1">
          <p class="text-textSecondary text-xs tracking-[0.2em] uppercase">Campanha</p>
          <h3 class="text-lg font-bold">${c.title}</h3>
          <p class="text-sm text-textSecondary">${c.subtitle}</p>
        </div>
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-primaryPurple" style="width:${c.progress}%"></div>
        </div>
        <div class="flex justify-between text-xs text-textSecondary">
          <span>Progresso</span>
          <span class="text-textPrimary font-semibold">${c.progress}%</span>
        </div>
      </div>
    `,
    )
    .join('');
};

const renderSceneTimeline = () => {
  const container = document.getElementById('scene-timeline');
  if (!container) return;

  container.innerHTML = scenes
    .map((scene, index) => {
      const isActive = state.activeScene === scene.name;
      const connector = index < scenes.length - 1 ? '<div class="flex-1 h-[2px] bg-gradient-to-r from-white/10 via-primaryPurple/50 to-white/10"></div>' : '';
      return `
        <div class="flex flex-col items-center gap-2 cursor-pointer scene-node ${isActive ? 'active' : ''}" data-scene="${scene.name}">
          <div class="w-16 h-16 rounded-full border-2 ${isActive ? 'border-primaryPurple shadow-[0_0_20px_rgba(157,78,221,0.4)]' : 'border-white/15'} flex items-center justify-center bg-white/5">
            <span class="text-sm text-textPrimary font-semibold text-center px-2">${scene.type}</span>
          </div>
          <div class="text-center space-y-1">
            <p class="text-xs text-textSecondary">${scene.name}</p>
            <p class="text-[11px] text-textSecondary/70">${scene.description}</p>
          </div>
        </div>
        ${connector}
      `;
    })
    .join('');

  document.querySelectorAll('.scene-node').forEach((node) => {
    node.addEventListener('click', () => {
      const selected = (node as HTMLElement).dataset.scene;
      if (selected) {
        state.activeScene = selected;
        renderSceneTimeline();
      }
    });
  });
};

const renderTagFilters = () => {
  const container = document.getElementById('bestiary-tags');
  if (!container) return;

  const allTags = ['Todos', ...uniqueTags];
  container.innerHTML = allTags
    .map(
      (tag) => `
        <button class="filter-chip ${state.tag === tag ? 'active' : ''}" data-tag="${tag}">
          ${tag}
        </button>
      `,
    )
    .join('');

  container.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const tag = (chip as HTMLElement).dataset.tag ?? 'Todos';
      state.tag = tag;
      state.page = 1;
      renderTagFilters();
      renderBestiary();
    });
  });
};

const renderCategoryTabs = () => {
  const container = document.getElementById('bestiary-categories');
  if (!container) return;

  const tabs: BestiaryEntry['category'][] = ['Monstro', 'Personagem'];
  container.innerHTML = tabs
    .map(
      (tab) => `
      <button class="tab ${state.category === tab ? 'active' : ''}" data-category="${tab}">${tab}s</button>
    `,
    )
    .join('');

  container.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = (tab as HTMLElement).dataset.category as BestiaryEntry['category'];
      state.category = category;
      state.page = 1;
      renderCategoryTabs();
      renderBestiary();
    });
  });
};

const renderSortControl = () => {
  const select = document.getElementById('bestiary-sort') as HTMLSelectElement | null;
  if (!select) return;

  select.value = state.sort;
  select.onchange = (event) => {
    const value = (event.target as HTMLSelectElement).value;
    state.sort = value;
    renderBestiary();
  };
};

const renderPagination = (pages: number) => {
  const container = document.getElementById('bestiary-pagination');
  if (!container) return;

  container.innerHTML = `
    <div class="pagination">
      <button class="page-btn" data-move="-1" ${state.page === 1 ? 'disabled' : ''}>Anterior</button>
      <span class="page-indicator">Página ${state.page} de ${pages}</span>
      <button class="page-btn" data-move="1" ${state.page === pages ? 'disabled' : ''}>Próxima</button>
    </div>
  `;

  container.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const move = Number((btn as HTMLElement).dataset.move ?? 0);
      state.page = Math.min(Math.max(1, state.page + move), pages);
      renderBestiary();
    });
  });
};

const renderBestiary = () => {
  const grid = document.getElementById('bestiary-grid');
  const featured = document.getElementById('featured-monster');
  const emptyState = document.getElementById('bestiary-empty');
  if (!grid || !featured || !emptyState) return;

  const filtered = bestiaryEntries
    .filter((m) => m.category === state.category)
    .filter((m) => {
      const matchQuery =
        state.query === '' ||
        m.name.toLowerCase().includes(state.query) ||
        m.tags.some((t) => t.toLowerCase().includes(state.query)) ||
        m.archetype.toLowerCase().includes(state.query);
      const matchTag = state.tag === 'Todos' || m.tags.includes(state.tag);
      return matchQuery && matchTag;
    })
    .sort((a, b) => {
      if (state.sort === 'nome') return a.name.localeCompare(b.name);
      if (state.sort === 'perigo') return b.hp - a.hp;
      if (state.sort === 'poder') return b.firepower - a.firepower;
      return 0;
    });

  const pages = Math.max(1, Math.ceil(filtered.length / state.perPage));
  state.page = Math.min(state.page, pages);

  const start = (state.page - 1) * state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);
  const featuredMonster = filtered[0];
  emptyState.classList.toggle('hidden', filtered.length > 0);

  grid.innerHTML = pageItems
    .map(
      (m) => `
      <div class="glass-panel p-4 space-y-4 bestiary-card">
        <div class="card-banner">
          <img src="${m.image}" class="card-banner-img" />
          <div class="card-banner-overlay"></div>
          <div class="card-banner-meta">
            <span class="badge">${m.archetype}</span>
            <span class="badge subtle">${m.habitat}</span>
          </div>
        </div>
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <h4 class="text-lg font-bold text-textPrimary">${m.name}</h4>
            <p class="text-sm text-textSecondary">${m.danger}</p>
            <div class="flex gap-2 text-[11px] text-primaryPurple flex-wrap">
              ${m.tags
                .map((t) => `<span class="chip">${t}</span>`)
                .join('')}
            </div>
          </div>
          <div class="text-right text-xs text-textSecondary">
            <p>HP</p>
            <p class="text-textPrimary font-semibold">${m.hp}/${m.maxHp}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs text-textSecondary">
          ${attributeBar('Força', m.strength)}
          ${attributeBar('Habilidade', m.skill)}
          ${attributeBar('Resistência', m.resistance)}
          ${attributeBar('Armadura', m.armor)}
          ${attributeBar('PdF', m.firepower)}
          ${attributeBar('Desloc.', m.speed)}
        </div>
        <div class="space-y-2">
          <p class="text-[11px] text-textSecondary">Ações rápidas</p>
          <div class="flex gap-2 flex-wrap">
            ${m.actions.map((action) => `<span class="pill">${action}</span>`).join('')}
          </div>
          <p class="text-[11px] text-textSecondary">Recompensa</p>
          <div class="pill highlight">${m.reward}</div>
        </div>
      </div>
    `,
    )
    .join('');

  featured.innerHTML = featuredMonster
    ? `
      <div class="relative h-full min-h-[480px] overflow-hidden rounded-2xl featured-card">
        <img src="${featuredMonster.image}" class="object-cover w-full h-full" />
        <div class="absolute inset-0 featured-gradient"></div>
        <div class="absolute inset-0 p-6 flex flex-col justify-end space-y-3">
          <div class="flex gap-2 text-xs text-primaryPurple flex-wrap">
            ${featuredMonster.tags.map((t) => `<span class="chip">${t}</span>`).join('')}
          </div>
          <h3 class="text-3xl font-bold">${featuredMonster.name}</h3>
          <p class="text-sm text-textSecondary">${featuredMonster.archetype}</p>
          <p class="text-sm text-textSecondary">${featuredMonster.danger}</p>
          <div class="grid grid-cols-2 gap-2 text-xs text-textSecondary">
            ${attributeBar('Força', featuredMonster.strength)}
            ${attributeBar('Habilidade', featuredMonster.skill)}
            ${attributeBar('Resistência', featuredMonster.resistance)}
            ${attributeBar('Armadura', featuredMonster.armor)}
            ${attributeBar('PdF', featuredMonster.firepower)}
            ${attributeBar('HP', featuredMonster.hp, featuredMonster.maxHp)}
          </div>
          <div class="flex gap-2 flex-wrap text-[12px]">
            ${featuredMonster.actions.map((a) => `<span class="pill">${a}</span>`).join('')}
          </div>
        </div>
      </div>
    `
    : '';

  renderPagination(pages);
};

app.innerHTML = `
  <div class="min-h-screen bg-[#0D0815] text-textPrimary">
    <div class="flex">
      <aside class="nav-rail hidden md:flex">
        <div class="nav-brand">GM FORGE</div>
        <div class="nav-items">
          <div class="nav-item">
            <span class="nav-icon">🏰</span>
            <span class="nav-label">Dashboard</span>
          </div>
          <div class="nav-item">
            <span class="nav-icon">📚</span>
            <span class="nav-label">Campanhas</span>
          </div>
          <div class="nav-item">
            <span class="nav-icon">🧙</span>
            <span class="nav-label">NPCs</span>
          </div>
          <div class="nav-item">
            <span class="nav-icon">⚔️</span>
            <span class="nav-label">Combate</span>
          </div>
          <div class="nav-item active">
            <span class="nav-icon">📖</span>
            <span class="nav-label">Bestiário</span>
          </div>
          <div class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Configurações</span>
          </div>
        </div>
      </aside>

      <main class="main-content w-full space-y-8">
        <header class="bestiary-hero">
          <div class="bestiary-hero__bg"></div>
          <div class="bestiary-hero__content">
            <div>
              <p class="eyebrow">Bestiário</p>
              <h1 class="hero-title">Organize monstros e personagens como no MasterApp</h1>
              <p class="hero-subtitle">Filtros, destaque visual e painéis de ficha que combinam com a referência do board.masterapprpg.com.</p>
            </div>
            <div class="hero-actions">
              <div id="bestiary-categories" class="tab-group"></div>
              <div class="hero-cta">
                <button class="primary-btn">Criar Monstro</button>
                <button class="ghost-btn">Criar Personagem</button>
              </div>
            </div>
            <div class="hero-meta">
              <div class="meta-item">
                <span class="meta-label">Próxima sessão</span>
                <div class="meta-value"><span id="cd-days">00</span>d <span id="cd-hours">00</span>h <span id="cd-mins">00</span>m</div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Biblioteca</span>
                <div class="meta-value">${bestiaryEntries.length} entradas curadas</div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Atalhos</span>
                <div class="meta-value">Filtros rápidos, ordenação e destaque</div>
              </div>
            </div>
          </div>
        </header>

        <section class="section">
          <div class="glass-panel bestiary-toolbar">
            <div class="toolbar-left">
              <div class="search-wrapper">
                <span class="search-icon">🔎</span>
                <input id="bestiary-search" type="text" placeholder="Buscar por nome, tag ou arquétipo" class="search-input" />
              </div>
              <div id="bestiary-tags" class="flex gap-2 flex-wrap"></div>
            </div>
            <div class="toolbar-right">
              <label class="toolbar-control">
                Ordenar por
                <select id="bestiary-sort" class="select">
                  <option value="perigo">Perigo (HP)</option>
                  <option value="nome">Nome</option>
                  <option value="poder">Poder</option>
                </select>
              </label>
              <label class="toolbar-control">
                Itens por página
                <select id="bestiary-per-page" class="select">
                  <option value="3">3</option>
                  <option value="6" selected>6</option>
                  <option value="9">9</option>
                </select>
              </label>
            </div>
          </div>

          <div class="grid md:grid-cols-[1.2fr_1fr] gap-6">
            <div class="glass-panel space-y-4">
              <div id="bestiary-empty" class="hidden text-sm text-textSecondary">Nenhum resultado para os filtros atuais.</div>
              <div id="bestiary-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-textSecondary"></div>
            </div>
            <div class="glass-panel space-y-4">
              <p class="text-xs text-textSecondary uppercase tracking-[0.3em]">Destaque</p>
              <div id="featured-monster"></div>
            </div>
          </div>

          <div id="bestiary-pagination"></div>
        </section>
      </main>
    </div>
  </div>
`;

renderCampaigns();
renderSceneTimeline();
renderCategoryTabs();
renderTagFilters();
renderSortControl();
renderBestiary();
renderCountdown();
setInterval(renderCountdown, 1000 * 30);

const search = document.getElementById('bestiary-search') as HTMLInputElement;
if (search) {
  search.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    state.query = target.value.trim().toLowerCase();
    state.page = 1;
    renderBestiary();
  });
}

const perPage = document.getElementById('bestiary-per-page') as HTMLSelectElement | null;
if (perPage) {
  perPage.addEventListener('change', (event) => {
    const value = Number((event.target as HTMLSelectElement).value);
    state.perPage = value;
    state.page = 1;
    renderBestiary();
  });
}
