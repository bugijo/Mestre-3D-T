const app = document.getElementById('app');

// ==================== SUPABASE CLIENT ====================
// IMPORTANTE: Substituir com suas credenciais reais do Supabase
const SUPABASE_URL = 'https://fyixcsfrcfukblqyadsq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aXhjc2ZyY2Z1a2JscXlhZHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDI4MzQsImV4cCI6MjA4MDk3ODgzNH0.wV1BeB5qG_73xIp6sv9xFWmuLJw4q-yFto411afpSRI';

// Initialize Supabase client
let supabase = null;
let currentUser = null;
let isAuthEnabled = false;

// Initialize if creating client is possible
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isAuthEnabled = true;
    console.log('✅ Supabase initialized with real credentials');
} else {
    console.warn('⚠️ Supabase SDK not loaded');
}

// ==================== DATA ====================
const campaigns = [
    { id: 1, title: 'The Shadow War', progress: 45, players: 4, cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', description: 'Uma guerra nas sombras contra forças ocultas' },
    { id: 2, title: 'Dungeon Crawl', progress: 62, players: 5, cover: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400', description: 'Exploração de masmorras perigosas' },
    { id: 3, title: 'Dragon Hunt', progress: 30, players: 3, cover: 'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400', description: 'Caça ao dragão ancestral' },
    { id: 4, title: 'Quest for Glory', progress: 88, players: 6, cover: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400', description: 'Busca pela glória eterna' }
];

const participants = [
    { id: 1, name: 'Alice', avatar: 'A', hp: 80, maxHp: 100, initiative: 18, strength: 3, skill: 2, resistance: 2, armor: 1, firepower: 0, x: 2, y: 1 },
    { id: 2, name: 'Bob', avatar: 'B', hp: 50, maxHp: 100, initiative: 15, strength: 2, skill: 3, resistance: 1, armor: 0, firepower: 2, x: 3, y: 1 },
    { id: 3, name: 'Goblin', avatar: 'G', hp: 20, maxHp: 60, initiative: 12, strength: 1, skill: 1, resistance: 1, armor: 0, firepower: 0, x: 2, y: 3 }
];

const npcs = [
    { id: 1, name: 'Elara Moonwhisper', type: 'Aliado', level: 5, avatar: '🧙‍♀️', strength: 1, skill: 4, resistance: 2, armor: 0, firepower: 3, description: 'Maga da Ordem Arcana' },
    { id: 2, name: 'Thorin Ironforge', type: 'Aliado', level: 7, avatar: '⚔️', strength: 4, skill: 2, resistance: 3, armor: 2, firepower: 0, description: 'Guerreiro Anão' },
    { id: 3, name: 'Shadow Assassin', type: 'Inimigo', level: 6, avatar: '🗡️', strength: 2, skill: 5, resistance: 1, armor: 1, firepower: 0, description: 'Assassino das Sombras' },
    { id: 4, name: 'Ancient Wyrm', type: 'Boss', level: 10, avatar: '🐉', strength: 5, skill: 3, resistance: 4, armor: 3, firepower: 5, description: 'Dragão Ancestral' }
];

const loreEntries = [
    { id: 1, title: 'A Ordem Arcana', category: 'Faction', icon: '🔮', content: 'Antiga organização de magos dedicada a proteger o equilíbrio mágico do reino.' },
    { id: 2, title: 'Espada de Thorin', category: 'Item', icon: '⚔️', content: 'Lendária espada forjada nas profundezas das montanhas anãs. +3 Força quando empunhada.' },
    { id: 3, title: 'Torre Negra', category: 'Location', icon: '🏰', content: 'Fortaleza abandonada onde dizem habitar criaturas das sombras. Entrada pelo norte está bloqueada.' },
    { id: 4, title: 'Lorde das Sombras', category: 'NPC', icon: '👤', content: 'Misterioso comandante das forças inimigas. Pouco se sabe sobre suas verdadeiras intenções.' }
];

const quests = [
    {
        id: 1, title: 'Recuperar o Artefato', status: 'In Progress', xp: 500, checkpoints: [
            { text: 'Falar com o sábio', completed: true },
            { text: 'Explorar as ruínas', completed: true },
            { text: 'Derrotar o guardião', completed: false },
            { text: 'Recuperar o artefato', completed: false }
        ]
    },
    {
        id: 2, title: 'Defesa da Vila', status: 'Completed', xp: 300, checkpoints: [
            { text: 'Alertar os aldeões', completed: true },
            { text: 'Construir barricadas', completed: true },
            { text: 'Repelir o ataque', completed: true }
        ]
    },
    {
        id: 3, title: 'O Dragão Ancestral', status: 'Not Started', xp: 1000, checkpoints: [
            { text: 'Reunir informações', completed: false },
            { text: 'Formar grupo', completed: false },
            { text: 'Localizar covil', completed: false },
            { text: 'Confrontar o dragão', completed: false }
        ]
    }
];

const combatLog = [
    { actor: 'Alice', action: 'hits for 8', color: '#00FF9D', timestamp: new Date().toLocaleTimeString() },
    { actor: 'Bob', action: 'casts spell', color: '#BB86FC', timestamp: new Date().toLocaleTimeString() },
    { actor: 'Goblin', action: 'misses', color: '#FF5252', timestamp: new Date().toLocaleTimeString() }
];

const nextSession = new Date('2025-12-15T19:00:00').getTime();
const diceTypes = [4, 6, 8, 10, 12, 20, 100];

let currentView = currentUser ? 'dashboard' : 'login'; // Mostrar login se não tiver user
let selectedCampaign = null;
let selectedCharacter = null;
let selectedLoreCategory = 'All';
let diceHistory = [];
let isRolling = false;
let musicPlaying = false;
let waveformBars = Array(60).fill(0).map(() => Math.random());
let draggedToken = null;
let sessionNotes = '';

// Map interactive state
let mapZoom = 1.0;
let mapPanX = 0;
let mapPanY = 0;
let mapGridVisible = true;
let fogOfWarEnabled = false;
let revealedAreas = [];
let mapBackground = null;

// Music player state
let audioElement = null;
let currentTrackIndex = 0;
let isShuffleEnabled = false;
let isRepeatEnabled = false;

const musicPlaylists = {
    battle: [
        { name: "Epic Combat", category: "Battle Theme" },
        { name: "Dragon's Fury", category: "Boss Fight" },
        { name: "Steel and Magic", category: "Battle Theme" }
    ],
    exploration: [
        { name: "Mystical Forest", category: "Exploration" },
        { name: "Ancient Ruins", category: "Adventure" },
        { name: "Mountain Pass", category: "Exploration" }
    ],
    tavern: [
        { name: "Merry Inn", category: "Tavern Music" },
        { name: "Peaceful Rest", category: "Town Theme" },
        { name: "Bardic Tales", category: "Tavern Music" }
    ]
};

let currentPlaylist = musicPlaylists.battle;

// NPC filter state
let npcSearchQuery = '';
let npcFilterType = 'All';
let npcFilterLevel = 'All';

// Initialize Audio Element
function initAudioPlayer() {
    if (!audioElement) {
        audioElement = new Audio();
        audioElement.volume = parseFloat(localStorage.getItem('musicVolume') || '75') / 100;

        audioElement.addEventListener('ended', () => {
            if (isRepeatEnabled) {
                audioElement.currentTime = 0;
                audioElement.play();
            } else {
                nextTrack();
            }
        });
    }
}

// ==================== AUTH FUNCTIONS ====================
async function checkAuth() {
    if (!isAuthEnabled || !supabase) return false;

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        return true;
    }
    return false;
}

async function signUp(email, password, displayName) {
    if (!isAuthEnabled) {
        showToast('Auth not configured yet', 'error');
        return null;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) {
        showToast(error.message, 'error');
        return null;
    }

    showToast('Account created! Please log in.', 'success');
    return data;
}

async function signIn(email, password) {
    if (!isAuthEnabled) {
        // Modo demo: apenas ir para dashboard
        currentUser = { email: email, demo: true };
        showToast('Welcome! (Demo Mode)', 'success');
        navigateTo('dashboard');
        return { demo: true };
    }

    // Show loading state (opcional - could add spinner)
    showToast('Authenticating...', 'info');

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Login Error:', error);

        let message = error.message;
        if (message.includes('Invalid login credentials')) {
            message = 'Incorrect email or password.';
        } else if (message.includes('Email not confirmed')) {
            message = 'Please confirm your email address first.';
        }

        showToast('❌ ' + message, 'error');
        return null;
    }

    currentUser = data.user;
    showToast('✨ Welcome back, Master!', 'success');
    navigateTo('dashboard');
    return data;
}

async function signOut() {
    if (!isAuthEnabled) {
        currentUser = null;
        showToast('Logged out (Demo Mode)', 'info');
        navigateTo('login');
        return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
        showToast(error.message, 'error');
        return;
    }

    currentUser = null;
    showToast('Logged out', 'info');
    navigateTo('login');
}

window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;

// ==================== CAMPAIGN CRUD ====================
function showCampaignModal(campaignId = null) {
    const campaign = campaignId ? campaigns.find(c => c.id === campaignId) : null;
    const isEdit = !!campaign;

    const modal = document.createElement('div');
    modal.className = 'campaign-modal';
    modal.innerHTML = `
        <div class="campaign-form glass-panel">
            <button class="close-btn" onclick="closeCampaignModal()">✕</button>
            
            <h2>${isEdit ? '✏️ EDIT CAMPAIGN' : '✨ NEW CAMPAIGN'}</h2>
            
            <form class="form-group-container" onsubmit="event.preventDefault(); saveCampaign(${campaignId});">
                <div class="form-group">
                    <label>Campaign Title *</label>
                    <input type="text" id="campaignTitle" value="${campaign?.title || ''}" required 
                           placeholder="Ex: The Shadow War" class="form-input">
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="campaignDescription" rows="3" class="form-input" 
                              placeholder="Uma guerra nas sombras...">${campaign?.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Cover Image URL</label>
                    <input type="url" id="campaignCover" value="${campaign?.cover || ''}" 
                           placeholder="https://images.unsplash.com/..." class="form-input">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Players</label>
                        <input type="number" id="campaignPlayers" value="${campaign?.players || 4}" 
                               min="1" max="10" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Progress (%)</label>
                        <input type="number" id="campaignProgress" value="${campaign?.progress || 0}" 
                               min="0" max="100" class="form-input">
                    </div>
                </div>
                
                <div class="form-actions">
                    ${isEdit ? `
                        <button type="button" class="btn-delete" onclick="deleteCampaign(${campaignId})">
                            🗑️ DELETE
                        </button>
                    ` : ''}
                    <button type="submit" class="btn-save">
                        💾 ${isEdit ? 'UPDATE' : 'CREATE'}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    document.getElementById('campaignTitle')?.focus();
}

function saveCampaign(campaignId = null) {
    const title = document.getElementById('campaignTitle').value;
    const description = document.getElementById('campaignDescription').value;
    const cover = document.getElementById('campaignCover').value || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400';
    const players = parseInt(document.getElementById('campaignPlayers').value);
    const progress = parseInt(document.getElementById('campaignProgress').value);

    if (!title.trim()) {
        showToast('Title is required!', 'error');
        return;
    }

    if (campaignId) {
        // UPDATE
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) {
            campaign.title = title;
            campaign.description = description;
            campaign.cover = cover;
            campaign.players = players;
            campaign.progress = progress;
            showToast('Campaign updated!', 'success');
        }
    } else {
        // CREATE
        const newCampaign = {
            id: campaigns.length + 1,
            title,
            description,
            cover,
            players,
            progress
        };
        campaigns.push(newCampaign);
        showToast('Campaign created!', 'success');
    }

    closeCampaignModal();
    render();
}

function deleteCampaign(campaignId) {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
        return;
    }

    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
        const campaignTitle = campaigns[index].title;
        campaigns.splice(index, 1);
        showToast(`"${campaignTitle}" deleted`, 'info');
        closeCampaignModal();
        render();
    }
}

window.closeCampaignModal = function () {
    const modal = document.querySelector('.campaign-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
};

window.showCampaignModal = showCampaignModal;
window.saveCampaign = saveCampaign;
window.deleteCampaign = deleteCampaign;

// ==================== NPC/CHARACTER CRUD ====================
function showNPCModal(npcId = null) {
    const npc = npcId ? npcs.find(n => n.id === npcId) : null;
    const isEdit = !!npc;

    const modal = document.createElement('div');
    modal.className = 'npc-modal';
    modal.innerHTML = `
        <div class="npc-form glass-panel">
            <button class="close-btn" onclick="closeNPCModal()">✕</button>
            
            <h2>${isEdit ? '✏️ EDIT CHARACTER' : '✨ NEW CHARACTER'}</h2>
            
            <form class="form-group-container" onsubmit="event.preventDefault(); saveNPC(${npcId});">
                <div class="form-row">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" id="npcName" value="${npc?.name || ''}" required 
                               placeholder="Ex: Elara Moonwhisper" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Avatar Emoji</label>
                        <input type="text" id="npcAvatar" value="${npc?.avatar || '🧙'}" 
                               placeholder="🧙" class="form-input" maxlength="2">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="npcType" class="form-input">
                            <option value="Aliado" ${npc?.type === 'Aliado' ? 'selected' : ''}>Aliado</option>
                            <option value="Inimigo" ${npc?.type === 'Inimigo' ? 'selected' : ''}>Inimigo</option>
                            <option value="Boss" ${npc?.type === 'Boss' ? 'selected' : ''}>Boss</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Level</label>
                        <input type="number" id="npcLevel" value="${npc?.level || 1}" 
                               min="1" max="20" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="npcDescription" rows="2" class="form-input" 
                              placeholder="Ex: Maga da Ordem Arcana">${npc?.description || ''}</textarea>
                </div>
                
                <div class="attributes-section">
                    <h3>⚔️ Atributos 3D&T</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Força (F)</label>
                            <input type="number" id="npcStrength" value="${npc?.strength || 0}" 
                                   min="0" max="5" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Habilidade (H)</label>
                            <input type="number" id="npcSkill" value="${npc?.skill || 0}" 
                                   min="0" max="5" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Resistência (R)</label>
                            <input type="number" id="npcResistance" value="${npc?.resistance || 0}" 
                                   min="0" max="5" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Armadura (A)</label>
                            <input type="number" id="npcArmor" value="${npc?.armor || 0}" 
                                   min="0" max="5" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>PdF</label>
                            <input type="number" id="npcFirepower" value="${npc?.firepower || 0}" 
                                   min="0" max="5" class="form-input">
                        </div>
                    </div>
                </div>
                
                <div class="stats-preview">
                    <span>PV: <strong id="pvPreview">${5 + (npc?.resistance || 0) * 5}</strong></span>
                    <span>PM: <strong id="pmPreview">${5 + (npc?.firepower || 0) * 5}</strong></span>
                </div>
                
                <div class="form-actions">
                    ${isEdit ? `
                        <button type="button" class="btn-delete" onclick="deleteNPC(${npcId})">
                            🗑️ DELETE
                        </button>
                    ` : ''}
                    <button type="submit" class="btn-save">
                        💾 ${isEdit ? 'UPDATE' : 'CREATE'}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Update PV/PM preview on resistance/firepower change
    const updatePreview = () => {
        const r = parseInt(document.getElementById('npcResistance').value) || 0;
        const f = parseInt(document.getElementById('npcFirepower').value) || 0;
        document.getElementById('pvPreview').textContent = 5 + r * 5;
        document.getElementById('pmPreview').textContent = 5 + f * 5;
    };

    document.getElementById('npcResistance')?.addEventListener('input', updatePreview);
    document.getElementById('npcFirepower')?.addEventListener('input', updatePreview);
    document.getElementById('npcName')?.focus();
}

function saveNPC(npcId = null) {
    const name = document.getElementById('npcName').value;
    const avatar = document.getElementById('npcAvatar').value || '🧙';
    const type = document.getElementById('npcType').value;
    const level = parseInt(document.getElementById('npcLevel').value);
    const description = document.getElementById('npcDescription').value;
    const strength = parseInt(document.getElementById('npcStrength').value);
    const skill = parseInt(document.getElementById('npcSkill').value);
    const resistance = parseInt(document.getElementById('npcResistance').value);
    const armor = parseInt(document.getElementById('npcArmor').value);
    const firepower = parseInt(document.getElementById('npcFirepower').value);

    if (!name.trim()) {
        showToast('Name is required!', 'error');
        return;
    }

    if (npcId) {
        // UPDATE
        const npc = npcs.find(n => n.id === npcId);
        if (npc) {
            npc.name = name;
            npc.avatar = avatar;
            npc.type = type;
            npc.level = level;
            npc.description = description;
            npc.strength = strength;
            npc.skill = skill;
            npc.resistance = resistance;
            npc.armor = armor;
            npc.firepower = firepower;
            showToast('Character updated!', 'success');
        }
    } else {
        // CREATE
        const newNPC = {
            id: npcs.length + 1,
            name,
            avatar,
            type,
            level,
            description,
            strength,
            skill,
            resistance,
            armor,
            firepower
        };
        npcs.push(newNPC);
        showToast('Character created!', 'success');
    }

    closeNPCModal();
    render();
}

function deleteNPC(npcId) {
    if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
        return;
    }

    const index = npcs.findIndex(n => n.id === npcId);
    if (index !== -1) {
        const npcName = npcs[index].name;
        npcs.splice(index, 1);
        showToast(`"${npcName}" deleted`, 'info');
        closeNPCModal();
        render();
    }
}

window.closeNPCModal = function () {
    const modal = document.querySelector('.npc-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
};

window.showNPCModal = showNPCModal;
window.saveNPC = saveNPC;
window.deleteNPC = deleteNPC;

// ==================== SETTINGS FUNCTIONS ====================
window.saveProfile = function () {
    const displayName = document.getElementById('displayNameInput').value;
    if (displayName.trim()) {
        localStorage.setItem('displayName', displayName);
        showToast('Profile updated!', 'success');
        // Update nav-rail display if needed
        render();
    } else {
        showToast('Display name cannot be empty', 'error');
    }
};

window.toggleTheme = function () {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('theme', newTheme);
    document.body.classList.toggle('light-theme', newTheme === 'light');

    showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'success');
    render(); // Re-render to update toggle state
};

window.updateVolumePreview = function (value) {
    document.getElementById('volumeValue').textContent = value + '%';
    localStorage.setItem('musicVolume', value);
    // In future, update actual audio volume if playing
};

window.toggleAutoSave = function () {
    const current = localStorage.getItem('autoSave') === 'true';
    const newValue = !current;

    localStorage.setItem('autoSave', newValue.toString());
    showToast(`Auto-save ${newValue ? 'enabled' : 'disabled'}`, newValue ? 'success' : 'info');
    render();
};

window.saveDiceSpeed = function (speed) {
    localStorage.setItem('diceSpeed', speed);
    showToast(`Dice speed set to ${speed}`, 'success');
};

// Initialize theme on load
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
}

// ==================== MAP CONTROLS ====================
window.toggleGrid = function () {
    mapGridVisible = !mapGridVisible;
    showToast(`Grid ${mapGridVisible ? 'visible' : 'hidden'}`, 'info');
    render();
};

window.toggleFogOfWar = function () {
    fogOfWarEnabled = !fogOfWarEnabled;
    showToast(`Fog of War ${fogOfWarEnabled ? 'enabled' : 'disabled'}`, fogOfWarEnabled ? 'success' : 'info');
    render();
};

window.zoomIn = function () {
    mapZoom = Math.min(mapZoom + 0.1, 2.0);
    showToast(`Zoom: ${(mapZoom * 100).toFixed(0)}%`, 'info');
    render();
};

window.zoomOut = function () {
    mapZoom = Math.max(mapZoom - 0.1, 0.5);
    showToast(`Zoom: ${(mapZoom * 100).toFixed(0)}%`, 'info');
    render();
};

window.resetMapView = function () {
    mapZoom = 1.0;
    mapGridVisible = true;
    fogOfWarEnabled = false;
    showToast('Map view reset', 'success');
    render();
};

// ==================== MUSIC PLAYER CONTROLS ====================
window.toggleMusic = function () {
    initAudioPlayer();

    if (musicPlaying) {
        audioElement.pause();
        musicPlaying = false;
        showToast('Music paused', 'info');
    } else {
        if (!audioElement.src) {
            audioElement.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        }

        audioElement.play().catch(err => {
            showToast('Unable to play audio', 'error');
        });

        musicPlaying = true;
        showToast('Music playing', 'success');
    }

    render();
};

window.setMusicVolume = function (value) {
    initAudioPlayer();
    audioElement.volume = parseFloat(value) / 100;
    localStorage.setItem('musicVolume', value);
};

window.toggleShuffle = function () {
    isShuffleEnabled = !isShuffleEnabled;
    showToast(`Shuffle ${isShuffleEnabled ? 'ON' : 'OFF'}`, 'info');
    render();
};

window.toggleRepeat = function () {
    isRepeatEnabled = !isRepeatEnabled;
    showToast(`Repeat ${isRepeatEnabled ? 'ON' : 'OFF'}`, 'info');
    render();
};

// ==================== NPC FILTERS ====================
window.updateNPCSearch = function (value) {
    npcSearchQuery = value;
    render();
};

window.updateNPCTypeFilter = function (value) {
    npcFilterType = value;
    render();
};

window.updateNPCLevelFilter = function (value) {
    npcFilterLevel = value;
    render();
};

window.resetNPCFilters = function () {
    npcSearchQuery = '';
    npcFilterType = 'All';
    npcFilterLevel = 'All';
    showToast('Filters reset', 'info');
    render();
};

// ==================== TOAST SYSTEM ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== QUEST MODAL ====================
function showQuestDetails(quest) {
    const completedCount = quest.checkpoints.filter(c => c.completed).length;
    const progressPercent = (completedCount / quest.checkpoints.length) * 100;

    const modal = document.createElement('div');
    modal.className = 'quest-modal';
    modal.innerHTML = `
        <div class="quest-details glass-panel">
            <button class="close-btn" onclick="closeQuestModal()">✕</button>
            
            <div class="quest-header">
                <h2>${quest.title}</h2>
                <span class="quest-status-badge ${quest.status.toLowerCase().replace(' ', '-')}">${quest.status}</span>
            </div>
            
            <div class="quest-progress-section">
                <div class="progress-label">Progress: ${completedCount}/${quest.checkpoints.length}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            
            <div class="checkpoints-section">
                <h3>📋 Checkpoints</h3>
                ${quest.checkpoints.map((checkpoint, i) => `
                    <div class="checkpoint ${checkpoint.completed ? 'completed' : ''}">
                        <div class="checkpoint-icon">${checkpoint.completed ? '✓' : '○'}</div>
                        <div class="checkpoint-text">${checkpoint.text}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="quest-reward">
                <span class="reward-label">🏆 XP Reward:</span>
                <span class="reward-value">${quest.xp} XP</span>
            </div>
            
            ${quest.status !== 'Completed' ? `
                <button class="quest-action-btn" onclick="completeQuest(${quest.id})">
                    ✓ MARK AS COMPLETE
                </button>
            ` : ''}
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

window.closeQuestModal = function () {
    const modal = document.querySelector('.quest-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
};

window.completeQuest = function (questId) {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        quest.status = 'Completed';
        quest.checkpoints.forEach(c => c.completed = true);
        showToast(`Quest completed! +${quest.xp} XP`, 'success');
        closeQuestModal();
        render();
    }
};

// ==================== LORE MODAL ====================
function showLoreDetails(entry) {
    const modal = document.createElement('div');
    modal.className = 'lore-modal';
    modal.innerHTML = `
        <div class="lore-details glass-panel">
            <button class="close-btn" onclick="closeLoreModal()">✕</button>
            
            <div class="lore-header">
                <div class="lore-icon-large">${entry.icon}</div>
                <div>
                    <h2>${entry.title}</h2>
                    <span class="lore-category-badge">${entry.category}</span>
                </div>
            </div>
            
            <div class="lore-content-section">
                <p>${entry.content}</p>
            </div>
            
            <div class="lore-actions">
                <button class="lore-action-btn" onclick="showToast('Edit feature coming soon!', 'info')">
                    ✏️ EDIT
                </button>
                <button class="lore-action-btn danger" onclick="deleteLoreEntry(${entry.id})">
                    🗑️ DELETE
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

window.closeLoreModal = function () {
    const modal = document.querySelector('.lore-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
};

window.deleteLoreEntry = function (entryId) {
    if (confirm('Delete this lore entry?')) {
        const index = loreEntries.findIndex(e => e.id === entryId);
        if (index !== -1) {
            loreEntries.splice(index, 1);
            showToast('Lore entry deleted', 'error');
            closeLoreModal();
            render();
        }
    }
};

// ==================== CHARACTER SHEET MODAL ====================
function showCharacterSheet(character) {
    selectedCharacter = character;
    const pv = 5 + character.resistance * 5;
    const pm = 5 + character.firepower * 5;

    const modal = document.createElement('div');
    modal.className = 'character-modal';
    modal.innerHTML = `
        <div class="character-sheet glass-panel">
            <button class="close-btn" onclick="closeCharacterSheet()">✕</button>
            
            <div class="sheet-header">
                <div class="char-avatar-large">${character.avatar}</div>
                <div class="char-info">
                    <h2>${character.name}</h2>
                    <p class="char-subtitle">Nível ${character.level || 1} | Initiative: ${character.initiative}</p>
                </div>
            </div>
            
            <div class="hp-section">
                <div class="hp-display">
                    <span class="hp-current">${character.hp}</span>
                    <span class="hp-separator">/</span>
                    <span class="hp-max">${character.maxHp}</span>
                    <span class="hp-label">HP</span>
                </div>
                <div class="hp-controls">
                    <button onclick="modifyHP(${character.id}, -5)" class="hp-btn damage">-5</button>
                    <button onclick="modifyHP(${character.id}, -1)" class="hp-btn damage">-1</button>
                    <button onclick="modifyHP(${character.id}, 1)" class="hp-btn heal">+1</button>
                    <button onclick="modifyHP(${character.id}, 5)" class="hp-btn heal">+5</button>
                </div>
            </div>
            
            <div class="attributes-section">
                <h3>Atributos 3D&T</h3>
                <div class="attributes-grid">
                    <div class="attr-box">
                        <div class="attr-icon">💪</div>
                        <div class="attr-value">${character.strength}</div>
                        <div class="attr-name">Força</div>
                    </div>
                    <div class="attr-box">
                        <div class="attr-icon">🎯</div>
                        <div class="attr-value">${character.skill}</div>
                        <div class="attr-name">Habilidade</div>
                    </div>
                    <div class="attr-box">
                        <div class="attr-icon">🛡️</div>
                        <div class="attr-value">${character.resistance}</div>
                        <div class="attr-name">Resistência</div>
                    </div>
                    <div class="attr-box">
                        <div class="attr-icon">⚔️</div>
                        <div class="attr-value">${character.armor}</div>
                        <div class="attr-name">Armadura</div>
                    </div>
                    <div class="attr-box">
                        <div class="attr-icon">🔥</div>
                        <div class="attr-value">${character.firepower}</div>
                        <div class="attr-name">Poder de Fogo</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <div class="stat-item">
                    <span class="stat-label">PV (Pontos de Vida):</span>
                    <span class="stat-value">${pv}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">PM (Pontos de Magia):</span>
                    <span class="stat-value">${pm}</span>
                </div>
            </div>
            
            <div class="actions-section">
                <button class="action-btn-modal" onclick="rollAttack(${character.id})">
                    ⚔️ ATTACK ROLL
                </button>
                <button class="action-btn-modal" onclick="rollDefense(${character.id})">
                    🛡️ DEFENSE ROLL
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

window.closeCharacterSheet = function () {
    const modal = document.querySelector('.character-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
};

window.modifyHP = function (charId, amount) {
    const char = participants.find(p => p.id === charId);
    if (char) {
        char.hp = Math.min(Math.max(char.hp + amount, 0), char.maxHp);
        const action = amount > 0 ? `healed ${amount} HP` : `took ${Math.abs(amount)} damage`;
        combatLog.unshift({
            actor: char.name,
            action: action,
            color: amount > 0 ? '#00FF9D' : '#FF5252',
            timestamp: new Date().toLocaleTimeString()
        });
        showToast(`${char.name} ${action}`, amount > 0 ? 'success' : 'error');
        closeCharacterSheet();
        render();
    }
};

window.rollAttack = function (charId) {
    const char = participants.find(p => p.id === charId);
    if (char) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + char.strength;
        combatLog.unshift({
            actor: char.name,
            action: `attacks (${roll} + ${char.strength} = ${total})`,
            color: roll === 20 ? '#00FF9D' : '#BB86FC',
            timestamp: new Date().toLocaleTimeString()
        });
        showToast(`${char.name} rolled ${total} to attack!`, roll === 20 ? 'success' : 'info');
        closeCharacterSheet();
        render();
    }
};

window.rollDefense = function (charId) {
    const char = participants.find(p => p.id === charId);
    if (char) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + char.resistance;
        combatLog.unshift({
            actor: char.name,
            action: `defends (${roll} + ${char.resistance} = ${total})`,
            color: '#BB86FC',
            timestamp: new Date().toLocaleTimeString()
        });
        showToast(`${char.name} rolled ${total} to defend!`, 'info');
        closeCharacterSheet();
        render();
    }
};

// ==================== MAP TOKENS ====================
function onTokenDragStart(event, charId) {
    draggedToken = charId;
    event.target.style.opacity = '0.5';
}

function onTokenDragEnd(event) {
    event.target.style.opacity = '1';
    draggedToken = null;
}

function onCellDragOver(event) {
    event.preventDefault();
}

function onCellDrop(event, x, y) {
    event.preventDefault();
    if (draggedToken !== null) {
        const char = participants.find(p => p.id === draggedToken);
        if (char) {
            char.x = x;
            char.y = y;
            showToast(`${char.name} moved to (${x}, ${y})`, 'info');
            render();
        }
    }
}

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
    setTimeout(() => modal.classList.add('show'), 10);

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
        showToast('Music playing: Epic Combat Music', 'info');
    } else {
        showToast('Music paused', 'info');
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

        waveformBars.forEach((barHeight, i) => {
            const h = barHeight * canvas.height * 0.8;
            const x = i * barWidth;
            const y = (canvas.height - h) / 2;

            ctx.fillStyle = '#BB86FC';
            ctx.fillRect(x, y, barWidth - 2, h);
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
                <button class="campaign-edit-btn" onclick="event.stopPropagation(); showCampaignModal(${c.id})" title="Edit Campaign">
                    ✏️
                </button>
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
                <button class="add-button" onclick="showCampaignModal()">
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
    // Filter NPCs based on search and filters
    const filteredNPCs = npcs.filter(npc => {
        // Search filter
        const matchesSearch = npc.name.toLowerCase().includes(npcSearchQuery.toLowerCase());

        // Type filter
        const matchesType = npcFilterType === 'All' || npc.type === npcFilterType;

        // Level filter  
        const matchesLevel = npcFilterLevel === 'All' || (
            npcFilterLevel === '1-5' && npc.level >= 1 && npc.level <= 5 ||
            npcFilterLevel === '6-10' && npc.level >= 6 && npc.level <= 10 ||
            npcFilterLevel === '11-20' && npc.level >= 11 && npc.level <= 20
        );

        return matchesSearch && matchesType && matchesLevel;
    });

    const npcCards = filteredNPCs.map(npc => `
        <div class="npc-card glass-panel ${npc.type.toLowerCase()}" onclick="showCharacterSheet(${JSON.stringify(npc).replace(/"/g, '&quot;')})">
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
            <button class="npc-action-btn" onclick="event.stopPropagation(); addToSession(${npc.id})">
                + ADD TO SESSION
            </button>
        </div>
    `).join('');

    return `
        <div class="npcs-view">
            <div class="page-header">
                <h2 class="section-title">👥 NPCs & ENEMIES</h2>
                <button class="add-button" onclick="showNPCModal()">
                    + NEW NPC
                </button>
            </div>
            
            <!-- Filters Toolbar -->
            <div class="filters-toolbar">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" 
                           placeholder="Search NPCs..." 
                           value="${npcSearchQuery}"
                           oninput="updateNPCSearch(this.value)"
                           class="search-input">
                </div>
                
                <select class="filter-select" onchange="updateNPCTypeFilter(this.value)">
                    <option value="All" ${npcFilterType === 'All' ? 'selected' : ''}>All Types</option>
                    <option value="Aliado" ${npcFilterType === 'Aliado' ? 'selected' : ''}>Aliado</option>
                    <option value="Inimigo" ${npcFilterType === 'Inimigo' ? 'selected' : ''}>Inimigo</option>
                    <option value="Boss" ${npcFilterType === 'Boss' ? 'selected' : ''}>Boss</option>
                </select>
                
                <select class="filter-select" onchange="updateNPCLevelFilter(this.value)">
                    <option value="All" ${npcFilterLevel === 'All' ? 'selected' : ''}>All Levels</option>
                    <option value="1-5" ${npcFilterLevel === '1-5' ? 'selected' : ''}>Level 1-5</option>
                    <option value="6-10" ${npcFilterLevel === '6-10' ? 'selected' : ''}>Level 6-10</option>
                    <option value="11-20" ${npcFilterLevel === '11-20' ? 'selected' : ''}>Level 11-20</option>
                </select>
                
                <button class="filter-reset-btn" onclick="resetNPCFilters()">
                    ↺ Reset
                </button>
                
                <div class="filter-results">
                    ${filteredNPCs.length} of ${npcs.length} NPCs
                </div>
            </div>
            
            ${filteredNPCs.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No NPCs found</h3>
                    <p>Try adjusting your filters or search query</p>
                </div>
            ` : `
                <div class="npc-grid">
                    ${npcCards}
                </div>
            `}
        </div>
    `;
}

function renderLore() {
    const categories = ['All', 'NPC', 'Location', 'Item', 'Faction'];
    const filteredEntries = selectedLoreCategory === 'All'
        ? loreEntries
        : loreEntries.filter(e => e.category === selectedLoreCategory);

    const categoryButtons = categories.map(cat => `
        <button class="category-btn ${selectedLoreCategory === cat ? 'active' : ''}" 
                onclick="filterLore('${cat}')">
            ${cat}
        </button>
    `).join('');

    const loreCards = filteredEntries.map(entry => `
        <div class="lore-card glass-panel" onclick="showLoreDetails(${JSON.stringify(entry).replace(/"/g, '&quot;')})">
            <div class="lore-card-icon">${entry.icon}</div>
            <h3>${entry.title}</h3>
            <span class="lore-card-category">${entry.category}</span>
            <p>${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</p>
        </div>
    `).join('');

    return `
        <div class="lore-view">
            <div class="page-header">
                <h2 class="section-title">📚 LORE LIBRARY</h2>
                <button class="add-button" onclick="showToast('Feature coming soon!', 'info')">
                    + NEW ENTRY
                </button>
            </div>
            
            <div class="category-filters">
                ${categoryButtons}
            </div>
            
            <div class="lore-grid">
                ${loreCards.length > 0 ? loreCards : '<p class="empty-state">No lore entries found</p>'}
            </div>
        </div>
    `;
}

function renderQuests() {
    const questCards = quests.map(quest => {
        const completedCount = quest.checkpoints.filter(c => c.completed).length;
        const progressPercent = (completedCount / quest.checkpoints.length) * 100;

        return `
            <div class="quest-card glass-panel" onclick="showQuestDetails(${JSON.stringify(quest).replace(/"/g, '&quot;')})">
                <div class="quest-card-header">
                    <h3>${quest.title}</h3>
                    <span class="quest-status-badge ${quest.status.toLowerCase().replace(' ', '-')}">${quest.status}</span>
                </div>
                
                <div class="quest-progress">
                    <div class="progress-label">${completedCount}/${quest.checkpoints.length} checkpoints</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                
                <div class="quest-xp">
                    🏆 ${quest.xp} XP
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="quests-view">
            <div class="page-header">
                <h2 class="section-title">📜 QUEST TRACKER</h2>
                <button class="add-button" onclick="showToast('Feature coming soon!', 'info')">
                    + NEW QUEST
                </button>
            </div>
            
            <div class="quest-grid">
                ${questCards}
            </div>
        </div>
    `;
}

function renderNotes() {
    return `
        <div class="notes-view glass-panel">
            <div class="page-header">
                <h2 class="section-title">📝 SESSION NOTES</h2>
                <button class="add-button" onclick="saveNotes()">
                    💾 SAVE
                </button>
            </div>
            
            <textarea id="notesEditor" 
                      class="notes-editor" 
                      placeholder="Write your session notes here...

# Session Summary
- Key events
- Important NPCs
- Plot developments

# Next Steps
- Follow up on leads
- Prepare for next encounter">${sessionNotes}</textarea>
            
            <div class="notes-stats">
                <span>Characters: ${sessionNotes.length}</span>
                <span>Last saved: Never</span>
            </div>
        </div>
    `;
}

function renderDiceRoller() {
    const diceButtons = diceTypes.map(sides => `
        <button class="dice-button" onclick="rollDice(${sides}, 0)" title="Roll d${sides}">
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
                    <button class="mod-button" onclick="rollDice(20, -2)" title="Roll d20 with -2 modifier">-2</button>
                    <button class="mod-button" onclick="rollDice(20, -1)" title="Roll d20 with -1 modifier">-1</button>
                    <button class="mod-button highlight" onclick="rollDice(20, 0)" title="Roll d20">ROLL</button>
                    <button class="mod-button" onclick="rollDice(20, 1)" title="Roll d20 with +1 modifier">+1</button>
                    <button class="mod-button" onclick="rollDice(20, 2)" title="Roll d20 with +2 modifier">+2</button>
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
        <div class="participant" onclick="showCharacterSheet(${JSON.stringify(p).replace(/"/g, '&quot;')})">
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

    const grid = [];
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const token = participants.find(p => p.x === x && p.y === y);
            grid.push(`
                <div class="grid-cell" 
                     ondragover="onCellDragOver(event)" 
                     ondrop="onCellDrop(event, ${x}, ${y})"
                     title="(${x}, ${y})">
                    ${token ? `
                        <div class="map-token" 
                             draggable="true"
                             ondragstart="onTokenDragStart(event, ${token.id})"
                             ondragend="onTokenDragEnd(event)">
                            ${token.avatar}
                        </div>
                    ` : ''}
                </div>
            `);
        }
    }

    const logEntries = combatLog.slice(0, 10).map(log => `
        <div class="log-entry" style="border-left-color: ${log.color}">
            <div class="log-content">
                <strong>${log.actor}</strong> ${log.action}
            </div>
            <div class="log-time">${log.timestamp}</div>
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
                
                <!-- Map Toolbar -->
                <div class="map-toolbar">
                    <button onclick="toggleGrid()" class="map-btn ${mapGridVisible ? 'active' : ''}" title="Toggle Grid">
                        <span>⊞</span> Grid
                    </button>
                    <button onclick="toggleFogOfWar()" class="map-btn ${fogOfWarEnabled ? 'active' : ''}" title="Toggle Fog of War">
                        <span>👁️</span> Fog
                    </button>
                    <button onclick="zoomIn()" class="map-btn" title="Zoom In">
                        <span>+</span> Zoom In
                    </button>
                    <button onclick="zoomOut()" class="map-btn" title="Zoom Out">
                        <span>-</span> Zoom Out
                    </button>
                    <button onclick="resetMapView()" class="map-btn" title="Reset View">
                        <span>↺</span> Reset
                    </button>
                    <div class="zoom-indicator">
                        ${(mapZoom * 100).toFixed(0)}%
                    </div>
                </div>
                
                <div class="map-container" style="transform: scale(${mapZoom}); opacity: ${fogOfWarEnabled ? 0.5 : 1};">
                    <div class="map-grid" style="display: ${mapGridVisible ? 'grid' : 'none'};">
                        ${grid.join('')}
                    </div>
                    <p class="map-hint">Arraste os tokens para mover</p>
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
        
        <div class="media-player">
            <button class="play-button" onclick="toggleMusic()">
                ${musicPlaying ? '⏸' : '▶'}
            </button>
            <div class="track-info">
                <div class="track-name">${currentPlaylist[currentTrackIndex].name}</div>
                <div class="track-category">${currentPlaylist[currentTrackIndex].category}</div>
            </div>
            <canvas id="waveformCanvas" width="400" height="60"></canvas>
            <div class="player-controls">
                <button class="control-btn ${isShuffleEnabled ? 'active' : ''}" onclick="toggleShuffle()" title="Shuffle">🔀</button>
                <button class="control-btn ${isRepeatEnabled ? 'active' : ''}" onclick="toggleRepeat()" title="Repeat">🔁</button>
                <input type="range" class="volume-slider" min="0" max="100" 
                       value="${localStorage.getItem('musicVolume') || '75'}" 
                       oninput="setMusicVolume(this.value)" 
                       title="Volume">
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
             onclick="showToast('Scene: ${scene.name}', 'info')">
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

function renderSettings() {
    // Get current settings from localStorage
    const userDisplayName = localStorage.getItem('displayName') || currentUser?.email || 'Game Master';
    const theme = localStorage.getItem('theme') || 'dark';
    const volume = localStorage.getItem('musicVolume') || '75';
    const autoSave = localStorage.getItem('autoSave') === 'true';

    return `
        <div class="settings-view">
            <h2 class="section-title">⚙️ SETTINGS</h2>
            
            <!-- Profile Section -->
            <div class="settings-section glass-panel">
                <h3>👤 Profile</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Display Name</strong>
                        <small>How others see you</small>
                    </div>
                    <input type="text" id="displayNameInput" value="${userDisplayName}" class="settings-input" placeholder="Game Master">
                </div>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Email</strong>
                        <small>Your account email</small>
                    </div>
                    <div class="setting-value">${currentUser?.email || 'demo@gmforge.com'}</div>
                </div>
                <button onclick="saveProfile()" class="settings-save-btn">💾 SAVE PROFILE</button>
            </div>
            
            <!-- Theme Section -->
            <div class="settings-section glass-panel">
                <h3>🎨 Theme</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Dark Mode</strong>
                        <small>Switch between dark and light theme</small>
                    </div>
                    <div class="toggle-switch ${theme === 'dark' ? 'active' : ''}" onclick="toggleTheme()"></div>
                </div>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Color Accent</strong>
                        <small>Primary color scheme</small>
                    </div>
                    <div class="setting-value">Purple (Default)</div>
                </div>
            </div>
            
            <!-- Preferences Section -->
            <div class="settings-section glass-panel">
                <h3>🔧 Preferences</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Music Volume</strong>
                        <small>Background music volume level</small>
                    </div>
                    <div class="volume-control">
                        <input type="range" id="volumeSlider" min="0" max="100" value="${volume}" 
                               oninput="updateVolumePreview(this.value)" class="volume-slider-input">
                        <span class="volume-value" id="volumeValue">${volume}%</span>
                    </div>
                </div>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Auto-save Notes</strong>
                        <small>Automatically save session notes</small>
                    </div>
                    <div class="toggle-switch ${autoSave ? 'active' : ''}" onclick="toggleAutoSave()"></div>
                </div>
                <div class="setting-item">
                    <div class="setting-label">
                        <strong>Dice Animation Speed</strong>
                        <small>Speed of dice roll animations</small>
                    </div>
                    <select class="settings-input" onchange="saveDiceSpeed(this.value)">
                        <option value="slow">Slow</option>
                        <option value="normal" selected>Normal</option>
                        <option value="fast">Fast</option>
                    </select>
                </div>
            </div>
            
            <!-- About Section -->
            <div class="settings-section glass-panel">
                <h3>ℹ️ About</h3>
                <div class="setting-item">
                    <div class="setting-label"><strong>Version</strong></div>
                    <div class="setting-value">v0.60.0</div>
                </div>
                <div class="setting-item">
                    <div class="setting-label"><strong>Platform</strong></div>
                    <div class="setting-value">GM Forge Web</div>
                </div>
                <div class="setting-item">
                    <div class="setting-label"><strong>GitHub</strong></div>
                    <a href="https://github.com/bugijo/Mestre-3D-T" target="_blank" class="setting-link">
                        View Repository →
                    </a>
                </div>
                <div class="setting-item">
                    <div class="setting-label"><strong>Support</strong></div>
                    <div class="setting-value">support@gmforge.com</div>
                </div>
                <div class="about-footer">
                    <p>Developed with ❤️ for RPG Game Masters</p>
                    <p><small>© 2025 GM Forge. All rights reserved.</small></p>
                </div>
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
        case 'lore': content = renderLore(); break;
        case 'quests': content = renderQuests(); break;
        case 'notes': content = renderNotes(); break;
        case 'session': content = renderSession(); break;
        case 'dice': content = renderDiceRoller(); break;
        case 'timeline': content = renderTimeline(); break;
        case 'settings': content = renderSettings(); break;
        case 'login': content = renderLogin(); break;
        case 'register': content = renderRegister(); break;
    }

    // Auth views não têm nav-rail
    const isAuthView = currentView === 'login' || currentView === 'register';
    document.body.classList.toggle('auth-page', isAuthView);

    app.innerHTML = isAuthView ? content : `
        <div class="app-shell">
            <div class="app-surface">
                <nav class="nav-rail">
                    <div class="nav-brand">GM FORGE</div>
                    <div class="nav-items">
                        <a class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" onclick="navigateTo('dashboard')" title="Dashboard">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Dashboard</span>
                        </a>
                        <a class="nav-item ${currentView === 'campaigns' ? 'active' : ''}" onclick="navigateTo('campaigns')" title="Campaigns">
                            <span class="nav-icon">📁</span>
                            <span class="nav-label">Campaigns</span>
                        </a>
                        <a class="nav-item ${currentView === 'npcs' ? 'active' : ''}" onclick="navigateTo('npcs')" title="NPCs & Enemies">
                            <span class="nav-icon">👥</span>
                            <span class="nav-label">NPCs</span>
                        </a>
                        <a class="nav-item ${currentView === 'lore' ? 'active' : ''}" onclick="navigateTo('lore')" title="Lore Library">
                            <span class="nav-icon">📚</span>
                            <span class="nav-label">Lore</span>
                        </a>
                        <a class="nav-item ${currentView === 'quests' ? 'active' : ''}" onclick="navigateTo('quests')" title="Quest Tracker">
                            <span class="nav-icon">📜</span>
                            <span class="nav-label">Quests</span>
                        </a>
                        <a class="nav-item ${currentView === 'notes' ? 'active' : ''}" onclick="navigateTo('notes')" title="Session Notes">
                            <span class="nav-icon">📝</span>
                            <span class="nav-label">Notes</span>
                        </a>
                        <a class="nav-item ${currentView === 'session' ? 'active' : ''}" onclick="navigateTo('session')" title="Session">
                            <span class="nav-icon">⚔️</span>
                            <span class="nav-label">Session</span>
                        </a>
                        <a class="nav-item ${currentView === 'dice' ? 'active' : ''}" onclick="navigateTo('dice')" title="Dice Roller">
                            <span class="nav-icon">🎲</span>
                            <span class="nav-label">Dice</span>
                        </a>
                        <a class="nav-item ${currentView === 'timeline' ? 'active' : ''}" onclick="navigateTo('timeline')" title="Timeline">
                            <span class="nav-icon">🗺️</span>
                            <span class="nav-label">Timeline</span>
                        </a>
                        <a class="nav-item ${currentView === 'settings' ? 'active' : ''}" onclick="navigateTo('settings')" title="Settings">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-label">Settings</span>
                        </a>
                    </div>

                    ${currentUser ? `
                        <div class="nav-user">
                            <div class="nav-user-email">${currentUser.email || 'Demo User'}</div>
                            <button class="nav-logout-btn" onclick="signOut()" title="Logout">
                                🚪 Sair
                            </button>
                        </div>
                    ` : ''}
                </nav>

                <main class="main-content">
                    ${content}
                </main>
            </div>
        </div>
    `;

    if (currentView === 'dashboard') {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    if (currentView === 'session' && musicPlaying) {
        setTimeout(animateWaveform, 100);
    }
}

// ==================== AUTH VIEWS ====================
function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>GM FORGE</h1>
                    <p>WELCOME BACK, GAME MASTER</p>
                </div>
                
                <form class="auth-form" onsubmit="event.preventDefault(); handleLogin();">
                    <div class="form-group">
                        <input 
                            type="email" 
                            id="email" 
                            class="auth-input" 
                            placeholder="✉️  Email Address" 
                            required 
                            autocomplete="email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <div class="password-wrapper">
                            <input 
                                type="password" 
                                id="password" 
                                class="auth-input" 
                                placeholder="🔒  Password" 
                                required 
                                autocomplete="current-password"
                            >
                            <button type="button" class="password-toggle" onclick="togglePassword('password')" title="Show Password">
                                👁️
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="auth-button">
                        LOGIN
                    </button>
                </form>
                
                <div class="auth-footer">
                    <p>Don't have an account?</p>
                    <button onclick="navigateTo('register')" class="link-button">
                        Create Account
                    </button>
                </div>
                
                ${!isAuthEnabled ? `
                    <div class="demo-notice">
                        <p>🔓 DEMO MODE ACTIVE</p>
                        <small>Data stored locally only</small>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>GM FORGE</h1>
                    <p>CREATE MASTER ACCOUNT</p>
                </div>
                
                <form class="auth-form" onsubmit="event.preventDefault(); handleRegister();">
                    <div class="form-group">
                        <input 
                            type="text" 
                            id="displayName" 
                            class="auth-input" 
                            placeholder="👤  Display Name" 
                            required 
                            autocomplete="username"
                        >
                    </div>

                    <div class="form-group">
                        <input 
                            type="email" 
                            id="email" 
                            class="auth-input" 
                            placeholder="✉️  Email Address" 
                            required 
                            autocomplete="email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <input 
                            type="password" 
                            id="password" 
                            class="auth-input" 
                            placeholder="🔒  Password" 
                            required 
                            autocomplete="new-password"
                        >
                    </div>

                    <button type="submit" class="auth-button">
                        CREATE ACCOUNT
                    </button>
                </form>
                
                <div class="auth-footer">
                    <p>Already have an account?</p>
                    <button onclick="navigateTo('login')" class="link-button">
                        Back to Login
                    </button>
                </div>
                
                ${!isAuthEnabled ? `
                    <div class="demo-notice">
                        <p>🔓 DEMO MODE ACTIVE</p>
                        <small>Data stored locally only</small>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Auth form handlers
window.handleLogin = async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await signIn(email, password);
};

window.togglePassword = function (inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
};

window.handleRegister = async function () {
    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    showToast('Creating account...', 'info');

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) {
        showToast('❌ ' + error.message, 'error');
        return;
    }

    // 2. Auto Login (if Confirm Email is disabled, you get a session immediately)
    if (data.session) {
        currentUser = data.session.user;
        showToast('✨ Account created! Welcome, Master.', 'success');
        navigateTo('dashboard');
    } else {
        // 3. Fallback (if Confirm Email is enabled)
        showToast('✅ Account created! Please check your email.', 'success');
        navigateTo('login');
    }
};

// ==================== GLOBAL FUNCTIONS ====================
window.navigateTo = function (view) {
    currentView = view;
    render();
};

window.selectCampaign = function (id) {
    selectedCampaign = campaigns.find(c => c.id === id);
    showToast(`Selected: ${selectedCampaign.title}`, 'info');
    navigateTo('campaigns');
};

window.addToSession = function (npcId) {
    showToast('NPC adicionado à sessão!', 'success');
};

window.addLogEntry = function () {
    const action = prompt('Digite a ação:');
    if (action) {
        combatLog.unshift({
            actor: 'GM',
            action: action,
            color: '#00FF9D',
            timestamp: new Date().toLocaleTimeString()
        });
        showToast('Action added to combat log', 'success');
        render();
    }
};

window.filterLore = function (category) {
    selectedLoreCategory = category;
    render();
};

window.saveNotes = function () {
    const editor = document.getElementById('notesEditor');
    if (editor) {
        sessionNotes = editor.value;
        showToast('Notes saved!', 'success');
    }
};

// Global drag handlers
window.onTokenDragStart = onTokenDragStart;
window.onTokenDragEnd = onTokenDragEnd;
window.onCellDragOver = onCellDragOver;
window.onCellDrop = onCellDrop;

// Initial render
render();

console.log('%c📚 GM Forge Web - LORE & QUESTS! ', 'background: #00FF9D; color: #121212; font-size: 16px; padding: 8px; font-weight: bold;');
