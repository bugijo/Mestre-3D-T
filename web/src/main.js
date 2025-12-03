const app = document.getElementById('app');

// Sample data
const campaigns = [
  { id: 1, title: 'The Shadow War', progress: 45, players: 4, cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400' },
  { id: 2, title: 'Dungeon Crawl', progress: 62, players: 5, cover: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400' },
  { id: 3, title: 'Dragon Hunt', progress: 30, players: 3, cover: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400' },
  { id: 4, title: 'Quest for Glory', progress: 88, players: 6, cover: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400' }
];

const nextSession = new Date('2025-12-15T19:00:00').getTime();

let currentView = 'dashboard';

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
        <div class="campaign-card" onclick="alert('Campaign: ${c.title}')">
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
            <!-- Next Session Banner -->
            <div class="next-session-banner">
                <h2 class="banner-title">🌑 NEXT SESSION</h2>
                <div id="countdown" class="countdown"></div>
                <p class="session-info">Session: The Siege | Sat 7PM</p>
                <button class="prepare-button">PREPARE NOW</button>
            </div>
            
            <!-- Campaigns Section -->
            <div class="section">
                <h2 class="section-title">YOUR CAMPAIGNS</h2>
                <div class="campaign-grid">
                    ${campaignCards}
                </div>
            </div>
        </div>
    `;
}

function renderSession() {
  return `
        <div class="session-view">
            <div class="session-panel initiative-panel glass-panel">
                <h3>INITIATIVE</h3>
                <div class="participant">
                    <div class="avatar">A</div>
                    <div class="info">
                        <span>Alice</span>
                        <div class="hp-bar"><div style="width: 80%" class="hp-fill"></div></div>
                    </div>
                </div>
                <div class="participant">
                    <div class="avatar">B</div>
                    <div class="info">
                        <span>Bob</span>
                        <div class="hp-bar"><div style="width: 50%" class="hp-fill"></div></div>
                    </div>
                </div>
            </div>
            
            <div class="session-panel map-panel glass-panel">
                <h3>MAP VIEW</h3>
                <div style="height: 400px; display: flex; align-items: center; justify-content: center; color: #666;">
                    Isometric Map Coming Soon
                </div>
            </div>
            
            <div class="session-panel tools-panel glass-panel">
                <h3>COMBAT LOG</h3>
                <div style="flex: 1; overflow: auto;">
                    <div class="log-entry">→ Alice hits for 8</div>
                    <div class="log-entry">→ Bob casts spell</div>
                </div>
                <button class="roll-button">🎲 ROLL D20</button>
            </div>
        </div>
    `;
}

function renderTimeline() {
  return `
        <div class="timeline-view glass-panel">
            <h2 class="section-title">CAMPAIGN TIMELINE</h2>
            <canvas id="timelineCanvas" width="800" height="600"></canvas>
        </div>
    `;
}

function render() {
  let content = '';
  switch (currentView) {
    case 'dashboard': content = renderDashboard(); break;
    case 'session': content = renderSession(); break;
    case 'timeline': content = renderTimeline(); break;
  }

  app.innerHTML = `
        <!-- Navigation Rail -->
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
        
        <!-- Main Content -->
        <main class="main-content">
            ${content}
        </main>
    `;

  if (currentView === 'dashboard') {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
}

window.navigateTo = function (view) {
  currentView = view;
  render();
};

// Initial render
render();

console.log('%c🎲 GM Forge Web - REPLICADO! ', 'background: #BB86FC; color: white; font-size: 16px; padding: 8px;');
