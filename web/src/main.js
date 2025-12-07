const nextSession = Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 2;

const campaigns = [
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

const scenes = [
  { name: 'Tavern Start', type: 'Taverna', description: 'Briefing e ganchos iniciais', active: false },
  { name: 'Dark Forest Path', type: 'Floresta', description: 'Emboscada de bandidos', active: false },
  { name: 'Ancient Ruins', type: 'Ruínas', description: 'Artefato e armadilhas', active: false },
  { name: 'Goblin Ambush', type: 'Ambush', description: 'Combate rápido', active: true },
  { name: 'Dragon Lair Boss', type: 'Boss', description: 'Clímax da sessão', active: false },
];

const monsters = [
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

const app = document.getElementById('app');

const attributeBar = (label, value) => {
  const pct = Math.min(1, value / 6);
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

const campaignCards = campaigns
  .map(
    (c) => `
    <div class="glass-panel p-4 space-y-3">
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

const sceneNodes = scenes
  .map(
    (s) => `
      <div class="flex flex-col items-center gap-2">
        <div class="w-16 h-16 rounded-full border-2 ${s.active ? 'border-primaryPurple shadow-[0_0_20px_rgba(157,78,221,0.4)]' : 'border-white/15'} flex items-center justify-center bg-white/5">
          <span class="text-sm text-textPrimary font-semibold text-center px-2">${s.type}</span>
        </div>
        <div class="text-center space-y-1">
          <p class="text-xs text-textSecondary">${s.name}</p>
          <p class="text-[11px] text-textSecondary/70">${s.description}</p>
        </div>
      </div>
    `,
  )
  .join('<div class="flex-1 h-[2px] bg-gradient-to-r from-white/10 via-primaryPurple/50 to-white/10"></div>');

const bestiaryGrid = monsters
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
          <div class="flex gap-2 text-[11px] text-primaryPurple">
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

app.innerHTML = `
  <div class="min-h-screen bg-[#0D0815] text-textPrimary">
    <div class="flex">
      <aside class="nav-rail hidden md:flex">
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
            <span class="nav-icon">🐉</span>
            <span class="nav-label">Bestiário</span>
          </div>
        </div>
      </aside>

      <main class="main-content space-y-8">
        <section class="dashboard">
          <div class="next-session-banner">
            <div class="banner-title">PRÓXIMA SESSÃO</div>
            <div class="countdown" id="countdown"></div>
            <div class="session-info">Session Title: The Siege of Blackwood | Date: sábado, 19h</div>
            <button class="prepare-button">PREPARAR AGORA</button>
          </div>

          <div class="section">
            <div class="section-title">SUAS CAMPANHAS</div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">${campaignCards}</div>
          </div>

          <div class="section">
            <div class="section-title">LINHA DO TEMPO</div>
            <div class="glass-panel p-6 flex items-center gap-6 overflow-x-auto">${sceneNodes}</div>
          </div>

          <div class="section">
            <div class="section-title">BESTIÁRIO</div>
            <div class="glass-panel p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-1 glass-panel p-0 overflow-hidden relative">
                <img src="${monsters[0].img}" class="w-full h-full object-cover absolute inset-0 opacity-50" />
                <div class="relative p-6 space-y-3 bg-gradient-to-b from-black/40 to-black/80">
                  <p class="text-xs text-primaryPurple uppercase tracking-[0.3em]">Featured Monster</p>
                  <h3 class="text-2xl font-extrabold">${monsters[0].name}</h3>
                  <p class="text-sm text-textSecondary">CR épico, ataques flamejantes e voo.</p>
                  <div class="flex gap-2 text-[11px] text-primaryPurple">
                    ${monsters[0].tags.map((t) => `<span class="px-2 py-1 rounded-full bg-primaryPurple/20 border border-primaryPurple/40">${t}</span>`).join('')}
                  </div>
                  <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-primaryPurple" style="width:${(monsters[0].hp / monsters[0].maxHp) * 100}%"></div>
                  </div>
                  <p class="text-xs text-textSecondary">HP ${monsters[0].hp}/${monsters[0].maxHp}</p>
                </div>
              </div>
              <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">${bestiaryGrid}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
`;

function renderCountdown(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const update = () => {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    el.innerHTML = `
      <div class="countdown-unit">
        <div class="countdown-number">${days.toString().padStart(2, '0')}</div>
        <div class="countdown-label">DAYS</div>
      </div>
      <div class="countdown-separator">:</div>
      <div class="countdown-unit">
        <div class="countdown-number">${hours.toString().padStart(2, '0')}</div>
        <div class="countdown-label">HOURS</div>
      </div>
      <div class="countdown-separator">:</div>
      <div class="countdown-unit">
        <div class="countdown-number">${minutes.toString().padStart(2, '0')}</div>
        <div class="countdown-label">MINS</div>
      </div>
      <div class="countdown-separator">:</div>
      <div class="countdown-unit">
        <div class="countdown-number">${seconds.toString().padStart(2, '0')}</div>
        <div class="countdown-label">SECS</div>
      </div>
    `;
  };

  update();
  setInterval(update, 1000);
}

renderCountdown('countdown', nextSession);

console.log('%c🎲 Mestre 3D&T Web dashboard pronto!', 'background: #9D4EDD; color: white; font-size: 16px; padding: 8px; border-radius: 4px;');
