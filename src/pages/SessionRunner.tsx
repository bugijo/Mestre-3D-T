import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/AppStore'
import { Play, Square, Clock, Map as MapIcon, Users, User, MessageSquare, Swords, Shield, Zap, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DiceRoller, type RollResult } from '@/components/game/DiceRoller'
import { CombatTracker } from '@/components/game/CombatTracker'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { SessionChat } from '@/components/game/SessionChat'
import { InteractiveMap } from '@/components/game/InteractiveMap'
import { PostBattleRewards } from '@/components/game/PostBattleRewards'
import { InGameNotifications } from '@/components/ui/InGameNotifications'

export function SessionRunner() {
  const { state, startSession, endSession, setActiveScene, startCombatFromScene, addNote } = useAppStore()!
  const { session, campaigns, scenes, characters, combats } = state

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const [noteInput, setNoteInput] = useState('')
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('session-theme') || 'neon')
  const [recentRolls, setRecentRolls] = useState<RollResult[]>([])

  useEffect(() => {
    if (!session.isActive || !session.startedAt) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startedAt!)
    }, 1000)
    return () => clearInterval(interval)
  }, [session.isActive, session.startedAt])

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('session-theme', theme)
  }, [theme])

  // Select Campaign to Start
  if (!session.isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-purple/50 shadow-[0_0_30px_rgba(189,0,255,0.3)]">
              <Play size={40} className="text-neon-purple ml-1" />
            </div>
            <h1 className="text-4xl font-rajdhani font-bold text-white">Iniciar Sessão</h1>
            <p className="text-text-muted">Selecione uma campanha para começar a mestrar.</p>
          </div>

          <div className="grid gap-4">
            {campaigns.length === 0 ? (
              <div className="p-4 border border-white/10 rounded-lg bg-black/20 text-text-muted">
                Nenhuma campanha encontrada. Crie uma campanha primeiro.
              </div>
            ) : (
              campaigns.map(campaign => (
                <button
                  key={campaign.id}
                  onClick={() => {
                    const campaignScenes = scenes.filter(s => s.campaignId === campaign.id).sort((a,b) => a.orderIndex - b.orderIndex)
                    const firstScene = campaignScenes[0]
                    
                    if (firstScene) {
                       setActiveScene(campaign.id, firstScene.id)
                    }
                    startSession()
                  }}
                  aria-label={`Iniciar sessão com ${campaign.title}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon-purple transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                    {campaign.coverDataUrl ? (
                      <img src={campaign.coverDataUrl} alt={campaign.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20"><MapIcon size={20} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-neon-purple transition-colors">{campaign.title}</h3>
                    <p className="text-xs text-text-muted">{campaign.system}</p>
                  </div>
                  <Play size={20} className="ml-auto text-white/20 group-hover:text-neon-green transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Active Session View
  const activeCampaign = campaigns.find(c => c.id === session.activeCampaignId)
  const activeScene = scenes.find(s => s.id === session.activeSceneId)
  const campaignScenes = scenes
    .filter(s => s.campaignId === session.activeCampaignId)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  
  // Get Characters in Scene
  const npcsInScene = activeScene ? characters.filter(c => activeScene.npcIds.includes(c.id)) : []
  const enemiesInScene = activeScene ? characters.filter(c => activeScene.enemyIds.includes(c.id)) : []

  const activeCombat = combats.find(c => c.id === session.activeCombatId)
  const lastEndedCombat = activeScene ? [...combats.filter(c => !c.isActive && c.sceneId === activeScene.id)].sort((a,b) => (b.endedAt || 0) - (a.endedAt || 0))[0] ?? null : null

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/10 bg-black/40 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <h2 className="font-rajdhani font-bold text-xl text-white">
            {activeCampaign?.title || 'Sessão Ativa'}
          </h2>
          <span className="text-white/20">|</span>
        <div className="flex items-center gap-2 text-neon-cyan font-mono text-lg">
          <Clock size={16} />
          {new Date(elapsed).toISOString().substr(11, 8)}
        </div>
      </div>

        <div className="flex items-center gap-2">
          <label htmlFor="theme-toggle" className="text-xs text-text-muted">Tema</label>
          <select id="theme-toggle" aria-label="Alternar tema" className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="neon">Neon</option>
            <option value="classic">Clássico</option>
          </select>
        </div>

        <button 
          onClick={() => {
            if (confirm('Deseja realmente encerrar a sessão?')) {
              endSession()
              ;(window as any).notifyInGame?.('Sessão encerrada', 'success')
            }
          }}
          aria-label="Encerrar sessão"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
        >
          <Square size={16} fill="currentColor" />
          Encerrar Sessão
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* Left: Scene List (Navigation) */}
        <aside className="col-span-2 border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <MapIcon size={14} /> Cenas
          </h3>
          <div className="space-y-1">
            {campaignScenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setActiveScene(activeCampaign!.id, scene.id)}
                aria-label={`Selecionar cena ${scene.name}`}
                className={cn(
                  "w-full text-left p-3 rounded-lg text-sm transition-all border border-transparent",
                  activeScene?.id === scene.id 
                    ? "bg-neon-purple/20 text-white border-neon-purple/50 shadow-[0_0_10px_rgba(189,0,255,0.1)]" 
                    : "text-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] opacity-50">#{idx + 1}</span>
                  <span className="font-bold truncate">{scene.name}</span>
                </div>
                {scene.isCompleted && <span className="text-[10px] text-neon-green">Concluída</span>}
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Active Scene Details or Combat */}
        <main className="col-span-7 overflow-y-auto custom-scrollbar p-6 relative">
          {activeCombat ? (
            <div className="animate-in fade-in duration-300">
              <CombatTracker combat={activeCombat} />
            </div>
          ) : activeScene ? (
            <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
              {/* Scene Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h1 className="text-3xl font-rajdhani font-bold text-white">{activeScene.name}</h1>
                   <div className="px-3 py-1 rounded-full border border-white/10 text-xs text-text-muted uppercase">
                     {activeScene.mood}
                   </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                  {lastEndedCombat && (
                    <PostBattleRewards scene={activeScene} combat={lastEndedCombat} />
                  )}
                  <InteractiveMap scene={activeScene} />
                  <div>
                    <h4 className="text-xs font-bold text-neon-purple uppercase mb-2">Objetivo</h4>
                    <p className="text-white font-medium">{activeScene.objective || 'Nenhum objetivo definido.'}</p>
                  </div>
                  <div className="w-full h-px bg-white/10" />
                  <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Descrição / Read-aloud</h4>
                    <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{activeScene.description || 'Sem descrição.'}</p>
                  </div>
                   {activeScene.opening && (
                    <div className="bg-black/30 p-4 rounded-lg border-l-2 border-neon-cyan">
                      <h4 className="text-xs font-bold text-neon-cyan uppercase mb-1">Abertura</h4>
                      <p className="text-white/80 italic text-sm">"{activeScene.opening}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Characters in Scene */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-rajdhani font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-neon-green" />
                    Personagens na Cena
                  </h3>
                  <button className="text-xs text-neon-purple hover:underline">
                    Gerenciar NPCs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...npcsInScene, ...enemiesInScene].length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-text-muted bg-white/5 rounded-xl border border-white/5 border-dashed">
                      Nenhum NPC ou Inimigo vinculado a esta cena.
                    </div>
                  ) : (
                    [...npcsInScene, ...enemiesInScene].map(char => (
                      <div key={char.id} className="bg-black/40 border border-white/10 rounded-lg p-3 flex gap-3 hover:border-white/20 transition-all">
                        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
                          {char.imageUri ? (
                             <img src={char.imageUri} className="w-full h-full object-cover" alt={char.name} />
                          ) : (
                             <User size={24} className="m-auto text-white/20 h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-white truncate">{char.name}</h4>
                             <span className={cn(
                               "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                               char.type === 'ENEMY' || char.type === 'BOSS' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                             )}>
                               {char.type}
                             </span>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs">
                             <span className="flex items-center gap-1 text-red-400 font-bold">
                               <Shield size={10} /> {char.currentHp}/{char.resistance * 5 || 1} PV
                             </span>
                             <span className="flex items-center gap-1 text-blue-400 font-bold">
                               <Zap size={10} /> {char.currentMp}/{char.resistance * 5 || 1} PM
                             </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Rolls */}
              {recentRolls.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Jogadas recentes</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentRolls.slice(0,6).map(r => (
                      <div key={r.id} className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs text-white">
                        {r.label || `${r.diceCount}d6`} → {r.total}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-text-muted">
               <MapIcon size={48} className="mb-4 opacity-20" />
               <p>Nenhuma cena selecionada.</p>
             </div>
          )}

           {/* Floating Action Button for Combat */}
           {!activeCombat && activeScene && (
             <div className="absolute bottom-6 right-6">
                <button 
                  onClick={() => startCombatFromScene(activeScene.id)}
                  aria-label="Iniciar combate"
                  className="flex items-center gap-2 px-6 py-4 rounded-full bg-neon-pink text-white font-bold shadow-[0_0_20px_rgba(255,0,85,0.4)] hover:scale-105 transition-all"
                >
                  <Swords size={24} />
                  INICIAR COMBATE
                </button>
             </div>
           )}
        </main>

        {/* Right: Tools & Dice */}
        <aside className="col-span-3 border-l border-white/10 bg-black/20 p-4 space-y-6 flex flex-col">
          <DiceRoller className="flex-shrink-0" onRoll={(roll) => {
            setRecentRolls(prev => [roll, ...prev].slice(0, 20))
            if (roll.diceCount > 1 && roll.results.every(r => r === 6)) {
              ;(window as any).notifyInGame?.('Crítico!', 'success')
            }
            if (roll.diceCount > 1 && roll.results.every(r => r === 1)) {
              ;(window as any).notifyInGame?.('Falha crítica!', 'error')
            }
          }} />
          
          <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 overflow-hidden flex flex-col">
             <h3 className="text-xs font-bold text-text-muted uppercase mb-4 flex items-center gap-2">
               <MessageSquare size={14} /> Notas da Sessão
             </h3>
             
             {/* Notes List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4 pr-2">
               {session.notes.length === 0 ? (
                 <p className="text-xs text-text-muted text-center py-4">Nenhuma nota registrada.</p>
               ) : (
                 session.notes.map(note => (
                   <div key={note.id} className={cn("text-xs p-2 rounded bg-black/20 border border-white/5", note.important && "border-neon-purple/50 bg-neon-purple/10")}>
                     <div className="flex items-center justify-between mb-1 opacity-50">
                       <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                     </div>
                     <p className="text-white whitespace-pre-wrap">{note.text}</p>
                   </div>
                 ))
               )}
             </div>

             {/* Input */}
             <div className="flex gap-2">
               <input
                 type="text"
                 placeholder="Adicionar nota..."
                 className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-neon-purple outline-none"
                 value={noteInput}
                 onChange={(e) => setNoteInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && noteInput.trim()) {
                     addNote(noteInput, false)
                     setNoteInput('')
                   }
                 }}
               />
              <button
                onClick={() => {
                  if (noteInput.trim()) {
                    addNote(noteInput, false)
                    setNoteInput('')
                  }
                }}
                aria-label="Adicionar nota"
                className="p-2 bg-white/5 hover:bg-neon-purple/20 hover:text-neon-purple rounded-lg transition-colors border border-white/10"
              >
                <Send size={16} />
              </button>
             </div>
          </div>

          <SessionChat sessionKey={`${session.activeCampaignId || 'global'}`} />
        </aside>

      </div>
      <AudioPlayer />
      <InGameNotifications />
    </div>
  )
}
