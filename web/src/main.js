const app = document.getElementById('app');

// ==================== DATA ====================
const campaigns = [
    { id: 1, title: 'The Shadow War', progress: 45, players: 4, cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', description: 'Uma guerra nas sombras contra forças ocultas' },
    { id: 2, title: 'Dungeon Crawl', progress: 62, players: 5, cover: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400', description: 'Exploração de masmorras perigosas' },
    { id: 3, title: 'Dragon Hunt', progress: 30, players: 3, cover: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400', description: 'Caça ao dragão ancestral' },
    { id: 4, title: 'Quest for Glory', progress: 88, players: 6, cover: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400', description: 'Busca pela glória eterna' }
];

const participants = [
    { id: 1, name: 'Alice', avatar: 'A', hp: 80, maxHp: 100, initiative: 18, strength: 3, skill: 2, resistance: 2, armor: 1, firepower: 0 },
    { id: 2, name: 'Bob', avatar: 'B', hp: 50, maxHp: 100, initiative: 15, strength: 2, skill: 3, resistance: 1, armor: 0, firepower: 2 },
    { id: 3, name: 'Goblin', avatar: 'G', hp: 20, maxHp: 60, initiative: 12, strength: 1, skill: 1, resistance: 1, armor: 0, firepower: 0 }
];

const npcs = [
    { id: 1, name: 'Elara Moonwhisper', type: 'Aliado', level: 5, avatar: '🧙‍♀️', strength: 1, skill: 4, resistance: 2, armor: 0, firepower: 3, description: 'Maga da Ordem Arcana' },
    { id: 2, name: 'Thorin Ironforge', type: 'Aliado', level: 7, avatar: '⚔️', strength: 4, skill: 2, resistance: 3, armor: 2, firepower: 0, description: 'Guerreiro Anão' },
    { id: 3, name: 'Shadow Assassin', type: 'Inimigo', level: 6, avatar: '🗡️', strength: 2, skill: 5, resistance: 1, armor: 1, firepower: 0, description: 'Assassino das Sombras' },
    { id: 4, name: 'Ancient Wyrm', type: 'Boss', level: 10, avatar: '🐉', strength: 5, skill: 3, resistance: 4, armor: 3, firepower: 5, description: 'Dragão Ancestral' }
];

const combatLog = [
    { actor: 'Alice', action: 'hits for 8', color: '#00FF9D' },
    { actor: 'Bob', action: 'casts spell', color: '#BB86FC' },
    { actor: 'Goblin', action: 'misses', color: '#FF5252' }
];

const nextSession = new Date('2025-12-15T19:00:00').getTime();
const diceTypes = [4, 6, 8, 10, 12, 20, 100];

let currentView = 'dashboard';
let selectedCampaign = null;
let diceHistory = [];
let isRolling = false;
let musicPlaying = false;
let waveformBars = Array(60).fill(0).map(() => Math.random());

// ==================== DICE ROLLER ====================
function rollDice(sides, modifier = 0) {
    if (isRolling) return;
    isRolling = true;

    const result = Math.floor(Math.random() * sides) + 1;
    const total = result + modifier;
    const isCritical = result === sides;
    const isFail = result === 1;

    const entry = {
        dice: `d${sides}`,
        result,
        modifier,
        total,
        isCritical,
        isFail,
        timestamp: new Date().toLocaleTimeString()
    };

    diceHistory.unshift(entry);
    if (diceHistory.length > 10) diceHistory.pop();

    // Show animation
    showDiceAnimation(entry);

    setTimeout(() => {
        isRolling = false;
        if (currentView === 'dice') render();
    }, 1500);
}

function showDiceAnimation(entry) {
    const modal = document.createElement('div');
    modal.className = 'dice-animation-modal';
    modal.innerHTML = `
        <div class="dice-result-container ${entry.isCritical ? 'critical' : ''} ${entry.isFail ? 'fail' : ''}">
            <div class="dice-icon">${entry.dice}</div>
            <div class="dice-number">${entry.result}</div>
            ${entry.modifier !== 0 ? `<div class="dice-modifier">${entry.modifier > 0 ? '+' : ''}${entry.modifier}</div>` : ''}
            <div class="dice-total">= ${entry.total}</div>
            ${entry.isCritical ? '<div class="dice-label">🎯 CRITICAL!</div>' : ''}
            ${entry.isFail ? '<div class="dice-label">💥 FAIL!</div>' : ''}
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    setTimeout(() => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }, 1200);
}

// ==================== MEDIA PLAYER ====================
function toggleMusic() {
    musicPlaying = !musicPlaying;
    if (musicPlaying) {
        animateWaveform();
    }
    render();
}

function animateWaveform() {
    if (!musicPlaying) return;

    waveformBars = waveformBars.map(() => Math.random());

    const canvas = document.getElementById('waveformCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / 60;

        ctx.clearRect(0, 0, width, height);

        waveformBars.forEach((height, i) => {
            const barHeight = height * canvas.height * 0.8;
            const x = i * barWidth;
            const y = (canvas.height - barHeight) / 2;

            ctx.fillStyle = '#BB86FC';
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
    }

    setTimeout(animateWaveform, 100);
}

// ==================== COUNTDOWN ====================
function updateCountdown() {
    const now = new Date().getTime();
    const distance = nextSession - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        countdownEl.innerHTML = `
            <div class="countdown-unit">
                <div class="countdown-number">${String(days).padStart(2, '0')}</div>
                <div class="countdown-label">DAYS</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <div class="countdown-number">${String(hours).padStart(2, '0')}</div>
                <div class="countdown-label">HOURS</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <div class="countdown-number">${String(minutes).padStart(2, '0')}</div>
                <div class="countdown-label">MINS</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <div class="countdown-number">${String(seconds).padStart(2, '0')}</div>
                <div class="countdown-label">SECS</div>
            </div>
        `;
    }
}

// ==================== VIEWS ====================
function renderDashboard() {
    const campaignCards = campaigns.map(c => `
        <div class="campaign-card" onclick="selectCampaign(${c.id})">
            <div class="campaign-cover" style="background-image: url('${c.cover}')">
                <div class="campaign-overlay"></div>
            </div>
            <div class="campaign-content">
                <h3 class="campaign-title">${c.title.toUpperCase()}</h3>
                <div class="campaign-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${c.progress}%"></div>
                    </div>
                    <span class="progress-text">${c.progress}%</span>
                </div>
                <div class="campaign-players">
                    <span>👥 ${c.players} players</span>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="dashboard">
            <div class="next-session-banner">
                <h2 class="banner-title">🌑 NEXT SESSION</h2>
                <div id="countdown" class="countdown"></div>
                <p class="session-info">Session: The Siege | Sat 7PM</p>
                <button class="prepare-button" onclick="navigateTo('session')">PREPARE NOW</button>
            </div>
            
            <div class="section">
                <h2 class="section-title">YOUR CAMPAIGNS</h2>
                <div class="campaign-grid">
                    ${campaignCards}
                </div>
            </div>
        </div>
    `;
}

function renderCampaigns() {
    const campaignList = campaigns.map(c => `
        <div class="campaign-list-item glass-panel" onclick="selectCampaign(${c.id})">
            <div class="campaign-list-cover" style="background-image: url('${c.cover}')"></div>
            <div class="campaign-list-content">
                <h3>${c.title.toUpperCase()}</h3>
                <p>${c.description}</p>
                <div class="campaign-list-meta">
                    <span>👥 ${c.players} players</span>
                    <span>📊 ${c.progress}% complete</span>
                </div>
            </div>
            <button class="campaign-action-btn" onclick="event.stopPropagation(); navigateTo('session')">
                ▶ START SESSION
            </button>
        </div>
    `).join('');

    return `
        <div class="campaigns-view">
            <div class="page-header">
                <h2 class="section-title">📁 YOUR CAMPAIGNS</h2>
                <button class="add-button" onclick="alert('Criar nova campanha em breve!')">
                    + NEW CAMPAIGN
                </button>
            </div>
            <div class="campaign-list">
                ${campaignList}
            </div>
        </div>
    `;
}

function renderNPCs() {
    const npcCards = npcs.map(npc => `
        <div class="npc-card glass-panel ${npc.type.toLowerCase()}">
            <div class="npc-avatar">${npc.avatar}</div>
            <div class="npc-header">
                <h3>${npc.name}</h3>
                <span class="npc-level">Nível ${npc.level}</span>
                <span class="npc-type">${npc.type}</span>
            </div>
            <p class="npc-description">${npc.description}</p>
            <div class="npc-attributes">
                <div class="attr-item"><span class="attr-label">F:</span> ${npc.strength}</div>
                <div class="attr-item"><span class="attr-label">H:</span> ${npc.skill}</div>
                <div class="attr-item"><span class="attr-label">R:</span> ${npc.resistance}</div>
                <div class="attr-item"><span class="attr-label">A:</span> ${npc.armor}</div>
                <div class="attr-item"><span class="attr-label">PdF:</span> ${npc.firepower}</div>
            </div>
            <div class="npc-stats">
                <div class="stat">PV: ${5 + npc.resistance * 5}</div>
                <div class="stat">PM: ${5 + npc.firepower * 5}</div>
            </div>
            <button class="npc-action-btn" onclick="addToSession(${npc.id})">
                + ADD TO SESSION
            </button>
        </div>
    `).join('');

    return `
        <div class="npcs-view">
            <div class="page-header">
                <h2 class="section-title">👥 NPCs & ENEMIES</h2>
                <button class="add-button" onclick="alert('Criar novo NPC em breve!')">
                    + NEW NPC
                </button>
            </div>
            <div class="npc-grid">
                ${npcCards}
            </div>
        </div>
    `;
}

function renderDiceRoller() {
    const diceButtons = diceTypes.map(sides => `
        <button class="dice-button" onclick="rollDice(${sides}, 0)">
            <div class="dice-face">d${sides}</div>
        </button>
    `).join('');

    const historyEntries = diceHistory.map(entry => `
        <div class="history-entry ${entry.isCritical ? 'critical' : ''} ${entry.isFail ? 'fail' : ''}">
            <span class="history-dice">${entry.dice}</span>
            <span class="history-result">${entry.result}</span>
            ${entry.modifier !== 0 ? `<span class="history-mod">${entry.modifier > 0 ? '+' : ''}${entry.modifier}</span>` : ''}
            <span class="history-total">= ${entry.total}</span>
            <span class="history-time">${entry.timestamp}</span>
        </div>
    `).join('');

    return `
        <div class="dice-roller-view">
            <div class="dice-section glass-panel">
                <h2 class="section-title">🎲 DICE ROLLER</h2>
                <div class="dice-grid">
                    ${diceButtons}
                </div>
                <div class="modifier-controls">
                    <button class="mod-button" onclick="rollDice(20, -2)">-2</button>
                    <button class="mod-button" onclick="rollDice(20, -1)">-1</button>
                    <button class="mod-button highlight" onclick="rollDice(20, 0)">ROLL</button>
                    <button class="mod-button" onclick="rollDice(20, 1)">+1</button>
                    <button class="mod-button" onclick="rollDice(20, 2)">+2</button>
                </div>
            </div>
            
            <div class="history-section glass-panel">
                <h3>HISTORY</h3>
                <div class="dice-history">
                    ${historyEntries.length > 0 ? historyEntries : '<p class="empty-state">Nenhuma rolagem ainda</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderSession() {
    const participantsList = participants.map(p => `
        <div class="participant">
            <div class="avatar">${p.avatar}</div>
            <div class="info">
                <div class="participant-name">${p.name}</div>
                <div class="participant-initiative">Initiative: ${p.initiative}</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(p.hp / p.maxHp) * 100}%"></div>
                </div>
                <div class="hp-text">${p.hp}/${p.maxHp} HP</div>
            </div>
        </div>
    `).join('');

    const logEntries = combatLog.map(log => `
        <div class="log-entry" style="border-left-color: ${log.color}">
            <strong>${log.actor}</strong> ${log.action}
        </div>
    `).join('');

    return `
        <div class="session-view">
            <div class="session-panel initiative-panel glass-panel">
                <h3>⚔️ INITIATIVE</h3>
                <div class="participants-list">
                    ${participantsList}
                </div>
            </div>
            
            <div class="session-panel map-panel glass-panel">
                <h3>🗺️ MAP VIEW</h3>
                <div class="map-placeholder">
                    <div class="map-grid">
                        ${Array(25).fill(0).map((_, i) => `<div class="grid-cell"></div>`).join('')}
                    </div>
                    <p class="map-hint">Click nos quadrados para interagir</p>
                </div>
            </div>
            
            <div class="session-panel tools-panel glass-panel">
                <h3>📜 COMBAT LOG</h3>
                <div class="combat-log">
                    ${logEntries}
                </div>
                <div class="tools-actions">
                    <button class="roll-button" onclick="navigateTo('dice')">
                        🎲 DICE ROLLER
                    </button>
                    <button class="action-button" onclick="addLogEntry()">
                        ⚡ ADD ACTION
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Media Player Footer -->
        <div class="media-player">
            <button class="play-button" onclick="toggleMusic()">
                ${musicPlaying ? '⏸' : '▶'}
            </button>
            <div class="track-info">
                <div class="track-name">Epic Combat Music</div>
                <div class="track-category">Battle Theme</div>
            </div>
            <canvas id="waveformCanvas" width="400" height="60"></canvas>
            <div class="player-controls">
                <button class="control-btn">🔀</button>
                <button class="control-btn">🔁</button>
                <input type="range" class="volume-slider" min="0" max="100" value="70">
            </div>
        </div>
    `;
}

function renderTimeline() {
    const scenes = [
        { name: 'Taverna', emoji: '🏠', completed: true },
        { name: 'Floresta', emoji: '🌲', completed: true },
        { name: 'Masmorra', emoji: '🏰', completed: false, active: true },
        { name: 'Emboscada', emoji: '⚔️', completed: false },
        { name: 'Dragão', emoji: '🐉', completed: false }
    ];

    const sceneNodes = scenes.map((scene, i) => `
        <div class="timeline-node ${scene.completed ? 'completed' : ''} ${scene.active ? 'active' : ''}"
             onclick="alert('Scene: ${scene.name}')">
            <div class="timeline-icon">${scene.emoji}</div>
            <div class="timeline-label">${scene.name}</div>
            ${scene.completed ? '<div class="timeline-check">✓</div>' : ''}
        </div>
    `).join('');

    return `
        <div class="timeline-view glass-panel">
            <h2 class="section-title">🗺️ CAMPAIGN TIMELINE</h2>
            <div class="timeline-container">
                ${sceneNodes}
            </div>
            <div class="timeline-legend">
                <span class="legend-item"><span class="legend-dot completed"></span> Completado</span>
                <span class="legend-item"><span class="legend-dot active"></span> Ativo</span>
                <span class="legend-item"><span class="legend-dot"></span> Futuro</span>
            </div>
        </div>
    `;
}

// ==================== RENDER ====================
function render() {
    let content = '';
    switch (currentView) {
        case 'dashboard': content = renderDashboard(); break;
        case 'campaigns': content = renderCampaigns(); break;
        case 'npcs': content = renderNPCs(); break;
        case 'session': content = renderSession(); break;
        case 'dice': content = renderDiceRoller(); break;
        case 'timeline': content = renderTimeline(); break;
    }

    app.innerHTML = `
        <nav class="nav-rail">
            <div class="nav-brand">GM FORGE</div>
            <div class="nav-items">
                <a class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" onclick="navigateTo('dashboard')">
                    <span class="nav-icon">📊</span>
                    <span class="nav-label">Dashboard</span>
                </a>
                <a class="nav-item ${currentView === 'campaigns' ? 'active' : ''}" onclick="navigateTo('campaigns')">
                    <span class="nav-icon">📁</span>
                    <span class="nav-label">Campaigns</span>
                </a>
                <a class="nav-item ${currentView === 'npcs' ? 'active' : ''}" onclick="navigateTo('npcs')">
                    <span class="nav-icon">👥</span>
                    <span class="nav-label">NPCs</span>
                </a>
                <a class="nav-item ${currentView === 'session' ? 'active' : ''}" onclick="navigateTo('session')">
                    <span class="nav-icon">⚔️</span>
                    <span class="nav-label">Session</span>
                </a>
                <a class="nav-item ${currentView === 'dice' ? 'active' : ''}" onclick="navigateTo('dice')">
                    <span class="nav-icon">🎲</span>
                    <span class="nav-label">Dice</span>
                </a>
                <a class="nav-item ${currentView === 'timeline' ? 'active' : ''}" onclick="navigateTo('timeline')">
                    <span class="nav-icon">🗺️</span>
                    <span class="nav-label">Timeline</span>
                </a>
            </div>
        </nav>
        
        <main class="main-content">
            ${content}
        </main>
    `;

    if (currentView === 'dashboard') {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    if (currentView === 'session' && musicPlaying) {
        setTimeout(animateWaveform, 100);
    }
}

// ==================== GLOBAL FUNCTIONS ====================
window.navigateTo = function (view) {
    currentView = view;
    render();
};

window.selectCampaign = function (id) {
    selectedCampaign = campaigns.find(c => c.id === id);
    navigateTo('campaigns');
};

window.addToSession = function (npcId) {
    alert(`NPC adicionado à sessão! (em breve será persistido)`);
};

window.addLogEntry = function () {
    const action = prompt('Digite a ação:');
    if (action) {
        combatLog.unshift({ actor: 'GM', action: action, color: '#00FF9D' });
        render();
    }
};

// Initial render
render();

console.log('%c🎲 GM Forge Web - FEATURES PREMIUM! ', 'background: #BB86FC; color: white; font-size: 16px; padding: 8px;');
