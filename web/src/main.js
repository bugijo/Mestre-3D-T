const app = document.getElementById('app');

app.innerHTML = `
  <div class="min-h-screen p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="glass-panel p-8 mb-8">
        <h1 class="text-5xl font-bold gradient-text">
          Mestre 3D&T
        </h1>
        <p class="text-textSecondary mt-2 text-lg">
          GM Companion - Versão Web 🌐
        </p>
      </header>

      <!-- Welcome Card -->
      <div class="glass-panel p-12 text-center">
        <div class="space-y-6">
          <div class="flex items-center justify-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primaryPurple to-primaryBlue flex items-center justify-center neon-glow">
              <span class="text-3xl">🎲</span>
            </div>
          </div>

          <h2 class="text-4xl font-bold text-textPrimary">
            Bem-vindo ao Mestre 3D&T
          </h2>

          <p class="text-xl text-textSecondary max-w-2xl mx-auto">
            Versão web idêntica ao app Android.<br />
            🎨 Tema Arcane Dark com glassmorphism<br />
            💜 Neon highlights purple/blue<br />
            ✨ Tailwind CSS funcionando!
          </p>

          <div class="flex gap-4 justify-center mt-8 flex-wrap">
            <button class="glass-button neon-glow" onclick="alert('Dashboard em breve!')">
              <span class="text-lg font-semibold text-primaryPurple">
                📊 Dashboard
              </span>
            </button>

            <button class="glass-button" onclick="alert('Campanhas em breve!')">
              <span class="text-lg font-semibold text-textPrimary">
                📚 Campanhas
              </span>
            </button>

            <button class="glass-button" onclick="alert('NPCs em breve!')">
              <span class="text-lg font-semibold text-textPrimary">
                🧙 NPCs
              </span>
            </button>

            <button class="glass-button" onclick="alert('Inimigos em breve!')">
              <span class="text-lg font-semibold text-textPrimary">
                ⚔️ Inimigos
              </span>
            </button>
          </div>

          <!-- Status Grid -->
          <div class="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
            <div class="glass-panel p-4">
              <div class="text-3xl font-bold text-healthGreen">✓</div>
              <div class="text-sm text-textSecondary mt-2">Theme OK</div>
            </div>

            <div class="glass-panel p-4">
              <div class="text-3xl font-bold text-manaBlue">✓</div>
              <div class="text-sm text-textSecondary mt-2">Tailwind OK</div>
            </div>

            <div class="glass-panel p-4">
              <div class="text-3xl font-bold text-xpGold">✓</div>
              <div class="text-sm text-textSecondary mt-2">JavaScript OK</div>
            </div>
          </div>

          <!-- App Status -->
          <div class="glass-panel p-6 mt-8 text-left">
            <h3 class="text-xl font-bold text-textPrimary mb-4">📱 Status do Projeto:</h3>
            <div class="space-y-3 text-textSecondary">
              <div class="flex items-center gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <span class="text-healthGreen font-semibold">App Android:</span> Build corrigido, todas APIs atualizadas
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <span class="text-manaBlue font-semibold">Versão Web:</span> Rodando com JavaScript puro + Tailwind CDN
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <span class="text-xpGold font-semibold">Tema:</span> Arcane Dark idêntico em ambas versões
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-2xl">🔄</span>
                <div>
                  <span class="text-primaryPurple font-semibold">Database:</span> Supabase compartilhado (app ↔ web)
                </div>
              </div>
            </div>
          </div>

          <!-- Color Showcase -->
          <div class="glass-panel p-6 mt-8">
            <h3 class="text-xl font-bold text-textPrimary mb-4">🎨 Paleta de Cores 3D&T:</h3>
            <div class="grid grid-cols-5 gap-3">
              <div class="text-center">
                <div class="w-12 h-12 rounded-lg bg-strengthRed mx-auto mb-2 shadow-lg shadow-strengthRed/30"></div>
                <div class="text-xs text-textSecondary">Força</div>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-lg bg-skillBlue mx-auto mb-2 shadow-lg shadow-skillBlue/30"></div>
                <div class="text-xs text-textSecondary">Habilidade</div>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-lg bg-resistanceGreen mx-auto mb-2 shadow-lg shadow-resistanceGreen/30"></div>
                <div class="text-xs text-textSecondary">Resistência</div>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-lg bg-armorOrange mx-auto mb-2 shadow-lg shadow-armorOrange/30"></div>
                <div class="text-xs text-textSecondary">Armadura</div>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-lg bg-firepowerPurple mx-auto mb-2 shadow-lg shadow-firepowerPurple/30"></div>
                <div class="text-xs text-textSecondary">PdF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

console.log('%c🎲 Mestre 3D&T Web loaded! ', 'background: #9D4EDD; color: white; font-size: 16px; padding: 8px; border-radius: 4px;');
