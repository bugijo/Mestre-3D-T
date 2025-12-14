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

type Monster = {
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  strength: number;
  skill: number;
  resistance: number;
  armor: number;
  firepower: number;
  img: string;
  tags: string[];
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

const monsters: Monster[] = [
  {
    name: 'Ancient Dragon',
    type: 'Dragon • Legendary',
    hp: 95,
    maxHp: 120,
    strength: 5,
    skill: 3,
    resistance: 4,
    armor: 3,
    firepower: 5,
    img: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=800&q=60',
    tags: ['fire', 'flight'],
  },
  {
    name: 'Goblin Archer',
    type: 'Goblin • Minion',
    hp: 28,
    maxHp: 40,
    strength: 1,
    skill: 3,
    resistance: 1,
    armor: 1,
    firepower: 2,
    img: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=60',
    tags: ['ranged', 'minion'],
  },
  {
    name: 'Skeleton Warrior',
    type: 'Undead • Soldier',
    hp: 35,
    maxHp: 50,
    strength: 3,
    skill: 2,
    resistance: 2,
    armor: 2,
    firepower: 0,
    img: 'https://images.unsplash.com/photo-1603161394370-9de3220f8bb6?auto=format&fit=crop&w=800&q=60',
    tags: ['undead', 'melee'],
  },
  {
    name: 'Shadow Mage',
    type: 'Caster • Elite',
    hp: 32,
    maxHp: 40,
    strength: 1,
    skill: 4,
    resistance: 1,
    armor: 1,
    firepower: 4,
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
    tags: ['magic', 'control'],
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
  tag: 'Todas',
  activeScene: scenes.find((s) => s.active)?.name ?? scenes[0].name,
};

const uniqueTags = Array.from(new Set(monsters.flatMap((m) => m.tags))).sort();

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

  const allTags = ['Todas', ...uniqueTags];
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
      const tag = (chip as HTMLElement).dataset.tag ?? 'Todas';
      state.tag = tag;
      renderTagFilters();
      renderBestiary();
    });
  });
};

const renderBestiary = () => {
  const grid = document.getElementById('bestiary-grid');
  const featured = document.getElementById('featured-monster');
  const emptyState = document.getElementById('bestiary-empty');
  if (!grid || !featured || !emptyState) return;

  const filtered = monsters.filter((m) => {
    const matchQuery = state.query === '' || m.name.toLowerCase().includes(state.query) || m.tags.some((t) => t.includes(state.query));
    const matchTag = state.tag === 'Todas' || m.tags.includes(state.tag);
    return matchQuery && matchTag;
  });

  const featuredMonster = filtered[0];
  emptyState.classList.toggle('hidden', filtered.length > 0);

  grid.innerHTML = filtered
    .map(
      (m) => `
      <div class="glass-panel p-4 space-y-3">
        <div class="flex gap-3">
          <div class="w-16 h-16 rounded-xl overflow-hidden bg-white/5">
            <img src="${m.img}" class="object-cover w-full h-full" />
          </div>
          <div class="space-y-1">
            <p class="text-xs text-textSecondary uppercase tracking-[0.2em]">${m.type}</p>
            <h4 class="text-lg font-bold text-textPrimary">${m.name}</h4>
            <div class="flex gap-2 text-[11px] text-primaryPurple flex-wrap">
              ${m.tags.map((t) => `<span class="px-2 py-1 rounded-full bg-primaryPurple/10 border border-primaryPurple/40">${t}</span>`).join('')}
            </div>
          </div>
        </div>
        ${attributeBar('Força', m.strength)}
        ${attributeBar('Habilidade', m.skill)}
        ${attributeBar('Resistência', m.resistance)}
        ${attributeBar('Armadura', m.armor)}
        ${attributeBar('PdF', m.firepower)}
        <div class="flex items-center justify-between text-xs text-textSecondary">
          <span>HP</span>
          <span class="text-textPrimary font-semibold">${m.hp}/${m.maxHp}</span>
        </div>
      </div>
    `,
    )
    .join('');

  featured.innerHTML = featuredMonster
    ? `
      <div class="relative h-full min-h-[420px] overflow-hidden rounded-2xl">
        <img src="${featuredMonster.img}" class="object-cover w-full h-full" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-[#0D0815]/90"></div>
        <div class="absolute inset-0 p-6 flex flex-col justify-end space-y-3">
          <div class="flex gap-2 text-xs text-primaryPurple flex-wrap">
            ${featuredMonster.tags.map((t) => `<span class="px-2 py-1 rounded-full bg-primaryPurple/10 border border-primaryPurple/40">${t}</span>`).join('')}
          </div>
          <h3 class="text-2xl font-bold">${featuredMonster.name}</h3>
          <p class="text-sm text-textSecondary">${featuredMonster.type}</p>
          <div class="grid grid-cols-2 gap-2 text-xs text-textSecondary">
            ${attributeBar('Força', featuredMonster.strength)}
            ${attributeBar('Habilidade', featuredMonster.skill)}
            ${attributeBar('Resistência', featuredMonster.resistance)}
            ${attributeBar('Armadura', featuredMonster.armor)}
            ${attributeBar('PdF', featuredMonster.firepower)}
            ${attributeBar('HP', featuredMonster.hp, featuredMonster.maxHp)}
          </div>
        </div>
      </div>
    `
    : '';
};

app.innerHTML = `
  <div class="app-shell">
    <div class="app-surface">
      <aside class="nav-rail">
        <div class="nav-brand">GM FORGE</div>
        <div class="nav-items">
          <div class="nav-item active">
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
          <div class="nav-item">
            <span class="nav-icon">📖</span>
            <span class="nav-label">Bestiário</span>
          </div>
          <div class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Configurações</span>
          </div>
        </div>
      </aside>

      <main class="main-content w-full">
        <section class="dashboard space-y-10">
          <div class="next-session-banner">
            <p class="banner-title tracking-[0.4em]">PRÓXIMA SESSÃO</p>
            <p class="session-info">Campanha: The Shadowed Realm • Sábado • 19:00</p>
            <div class="countdown text-white">
              <div class="countdown-unit">
                <div class="countdown-number" id="cd-days">00</div>
                <div class="countdown-label">DIA</div>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-unit">
                <div class="countdown-number" id="cd-hours">00</div>
                <div class="countdown-label">HORA</div>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-unit">
                <div class="countdown-number" id="cd-mins">00</div>
                <div class="countdown-label">MIN</div>
              </div>
            </div>
            <button class="prepare-button">PREPARAR SESSÃO</button>
          </div>

          <section class="section">
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title">Campanhas ativas</h2>
              <button class="prepare-button px-6 py-3 text-sm">+ Nova Campanha</button>
            </div>
            <div id="campaign-grid" class="campaign-grid"></div>
          </section>

          <section class="section">
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title">Linha do tempo</h2>
              <p class="text-textSecondary text-sm">Clique em uma cena para ativar</p>
            </div>
            <div class="glass-panel">
              <div id="scene-timeline" class="flex items-center gap-6 flex-wrap"></div>
            </div>
          </section>

          <section class="section">
            <div class="flex items-center justify-between mb-6">
              <h2 class="section-title">Bestiário</h2>
              <p class="text-textSecondary text-sm">Busca e destaques no estilo MasterApp</p>
            </div>
            <div class="grid md:grid-cols-[1.2fr_1fr] gap-6">
              <div class="glass-panel space-y-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <input id="bestiary-search" type="text" placeholder="Buscar criatura ou tag" class="w-full md:flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primaryPurple" />
                  <div id="bestiary-tags" class="flex gap-2 flex-wrap"></div>
                </div>
                <div id="bestiary-empty" class="hidden text-sm text-textSecondary">Nenhum resultado para os filtros atuais.</div>
                <div id="bestiary-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-textSecondary"></div>
              </div>
              <div class="glass-panel space-y-4">
                <p class="text-xs text-textSecondary uppercase tracking-[0.3em]">Destaque</p>
                <div id="featured-monster"></div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  </div>
`;

renderCampaigns();
renderSceneTimeline();
renderTagFilters();
renderBestiary();
renderCountdown();
setInterval(renderCountdown, 1000 * 30);

const search = document.getElementById('bestiary-search') as HTMLInputElement;
if (search) {
  search.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    state.query = target.value.trim().toLowerCase();
    renderBestiary();
  });
}
