const app = document.getElementById('app');

// Sample data
const campaigns = [
    { id: 1, title: 'The Shadow War', progress: 45, players: 4, cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', description: 'Uma guerra nas sombras contra forças ocultas' },
    { id: 2, title: 'Dungeon Crawl', progress: 62, players: 5, cover: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400', description: 'Exploração de masmorras perigosas' },
    { id: 3, title: 'Dragon Hunt', progress: 30, players: 3, cover: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400', description: 'Caça ao dragão ancestral' },
    { id: 4, title: 'Quest for Glory', progress: 88, players: 6, cover: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400', description: 'Busca pela glória eterna' }
];

const participants = [
    { id: 1, name: 'Alice', avatar: 'A', hp: 80, maxHp: 100, initiative: 18 },
    { id: 2, name: 'Bob', avatar: 'B', hp: 50, maxHp: 100, initiative: 15 },
    { id: 3, name: 'Goblin', avatar: 'G', hp: 20, maxHp: 60, initiative: 12 }
];

const combatLog = [
    { actor: 'Alice', action: 'hits for 8', color: '#00FF9D' },
    { actor: 'Bob', action: 'casts spell', color: '#BB86FC' },
    { actor: 'Goblin', action: 'misses', color: '#FF5252' }
];

const nextSession = new Date('2025-12-15T19:00:00').getTime();
let currentView = 'dashboard';
let selectedCampaign = null;

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
                    <p class="map-hint">Mapa interativo em desenvolvimento</p>
                </div>
            </div>
            
            <div class="session-panel tools-panel glass-panel">
                <h3>📜 COMBAT LOG</h3>
                <div class="combat-log">
                    ${logEntries}
                </div>
                <div class="tools-actions">
                    <button class="roll-button" onclick="rollDice()">
                        🎲 ROLL D20
                    </button>
                    <button class="action-button" onclick="addLogEntry()">
                        ⚡ ADD ACTION
                    </button>
                </div>
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

function render() {
    let content = '';
    switch (currentView) {
        case 'dashboard': content = renderDashboard(); break;
        case 'campaigns': content = renderCampaigns(); break;
        case 'session': content = renderSession(); break;
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
                <a class="nav-item ${currentView === 'session' ? 'active' : ''}" onclick="navigateTo('session')">
                    <span class="nav-icon">⚔️</span>
                    <span class="nav-label">Session</span>
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
}

// Global functions
window.navigateTo = function (view) {
    currentView = view;
    render();
};

window.selectCampaign = function (id) {
    selectedCampaign = campaigns.find(c => c.id === id);
    navigateTo('campaigns');
};

window.rollDice = function () {
    const result = Math.floor(Math.random() * 20) + 1;
    const critical = result === 20 ? ' 🎯 CRITICAL!' : result === 1 ? ' 💥 FAIL!' : '';
    alert(`🎲 D20 Roll: ${result}${critical}`);
    combatLog.unshift({ actor: 'System', action: `rolled ${result}`, color: '#BB86FC' });
    render();
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

console.log('%c🎲 GM Forge Web - FUNCIONALIDADES ATIVAS! ', 'background: #BB86FC; color: white; font-size: 16px; padding: 8px;');
