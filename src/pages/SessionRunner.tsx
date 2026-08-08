import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Square, Clock, Map as MapIcon, Users, User, MessageSquare, Swords, Shield, Zap, Send, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { cn } from '@/lib/cn'
import { DiceRoller, type RollResult } from '@/components/game/DiceRoller'
import { CombatTracker } from '@/components/game/CombatTracker'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { SessionChat } from '@/components/game/SessionChat'
import { InteractiveMap } from '@/components/game/InteractiveMap'
import { PostBattleRewards } from '@/components/game/PostBattleRewards'
import { InGameNotifications } from '@/components/ui/InGameNotifications'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MasterToolkitPanel } from '@/components/game/MasterToolkitPanel'
import { useSessionOverview } from '@/hooks/useSessionOverview'
import { getCharacterMaxHp, getCharacterMaxMp } from '@/domain/models'
import { LiveSessionHostPanel } from '@/components/live/LiveSessionHostPanel'
import { DirectorBar } from '@/components/live/DirectorBar'
import { useOptionalLiveSession } from '@/realtime/LiveSessionContext'

export function SessionRunner() {
  const { state, startSession, endSession, setActiveScene, startCombatFromScene, addNote, deleteNote, toggleNoteImportant } = useAppStore()
  const { campaigns, scenes } = state
  const live = useOptionalLiveSession()
  const {
    activeCampaign,
    activeCombat,
    activeScene,
    campaignScenes,
    enemiesInScene,
    lastEndedCombat,
    npcsInScene,
    playersInCampaign,
    session,
  } = useSessionOverview()

  const [elapsed, setElapsed] = useState(0)
  const [noteInput, setNoteInput] = useState('')
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('session-theme') || 'paranormal')
  const [isImmersive, setIsImmersive] = useState<boolean>(() => localStorage.getItem('session-immersive') === '1')
  const [showOpsPanel, setShowOpsPanel] = useState<boolean>(true)
  const [recentRolls, setRecentRolls] = useState<RollResult[]>([])
  const [confirmEndSession, setConfirmEndSession] = useState(false)
  const noteInputRef = useRef<HTMLInputElement | null>(null)

  const activeSceneId = activeScene?.id ?? null
  const canStartCombat = !activeCombat && !!activeSceneId

  useEffect(() => {
    const startedAt = session.startedAt
    if (!session.isActive || !startedAt) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, 1000)
    return () => clearInterval(interval)
  }, [session.isActive, session.startedAt])

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('session-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('session-immersive', isImmersive ? '1' : '0')
    if (!isImmersive) {
      setShowOpsPanel(true)
    }
  }, [isImmersive])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isTypingContext =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        !!target?.isContentEditable

      if (!isTypingContext && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'i') {
        event.preventDefault()
        setIsImmersive((current) => !current)
        return
      }

      if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'c') {
        if (activeSceneId && !activeCombat) {
          event.preventDefault()
          startCombatFromScene(activeSceneId)
        }
        return
      }

      if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        setConfirmEndSession(true)
        return
      }

      if (!isTypingContext && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        noteInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeCombat, activeSceneId, startCombatFromScene])

  const submitNote = () => {
    const trimmed = noteInput.trim()
    if (!trimmed) return
    addNote(trimmed, false)
    setNoteInput('')
  }

  if (!session.isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-secondary/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/40 shadow-soft-lg">
              <Play size={40} className="text-secondary ml-1" />
            </div>
            <h1 className="text-4xl font-display font-bold text-white">Iniciar Sessão</h1>
            <p className="text-text-muted">Selecione uma campanha para começar a mestrar.</p>
          </div>

          <div className="grid gap-4">
            {campaigns.length === 0 ? (
              <div className="p-4 border border-white/10 rounded-lg bg-black/20 text-text-muted">
                Nenhuma campanha encontrada. Crie uma campanha primeiro.
              </div>
            ) : (
              campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => {
                    const campaignScenesList = scenes
                      .filter((scene) => scene.campaignId === campaign.id)
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                    const firstScene = campaignScenesList[0]

                    if (firstScene) {
                      setActiveScene(campaign.id, firstScene.id)
                    }
                    startSession()
                  }}
                  aria-label={`Iniciar sessao com ${campaign.title}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-secondary/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                    {campaign.coverDataUrl ? (
                      <img src={campaign.coverDataUrl} alt={campaign.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <MapIcon size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-secondary transition-colors">{campaign.title}</h3>
                    <p className="text-xs text-text-muted">{campaign.system}</p>
                  </div>
                  <Play size={20} className="ml-auto text-white/20 group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const sessionKey = session.activeCampaignId || 'global'

  return (
      <div className="min-h-[calc(100vh-7rem)] flex flex-col bg-background overflow-hidden rounded-3xl border border-white/10">
      <header className="min-h-16 border-b border-white/10 bg-background/70 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="font-display font-bold text-xl text-white">{activeCampaign?.title || 'Sessão Ativa'}</h2>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2 text-accent font-mono text-lg">
            <Clock size={16} />
            {new Date(elapsed).toISOString().slice(11, 19)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImmersive((current) => !current)}
            aria-label={isImmersive ? 'Desativar modo imersivo' : 'Ativar modo imersivo'}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
          >
            {isImmersive ? 'Sair da imersao' : 'Modo imersivo'}
          </button>
          {isImmersive ? (
            <button
              type="button"
              onClick={() => setShowOpsPanel((current) => !current)}
              aria-label={showOpsPanel ? 'Ocultar ferramentas' : 'Mostrar ferramentas'}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
            >
              {showOpsPanel ? 'Ocultar painel' : 'Ferramentas'}
            </button>
          ) : null}
          <label htmlFor="theme-toggle" className="text-xs text-text-muted">
            Tema
          </label>
          <select
            id="theme-toggle"
            aria-label="Alternar tema"
            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="paranormal">Paranormal</option>
            <option value="classic">Clássico</option>
          </select>
        </div>

        <button
          onClick={() => setConfirmEndSession(true)}
          aria-label="Encerrar sessao"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-200 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
        >
          <Square size={16} fill="currentColor" />
          Encerrar Sessão
        </button>
      </header>

      {isImmersive ? (
        <div className="border-b border-white/5 bg-black/25 px-6 py-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
          Atalhos: I (imersao) | Shift+C (combate) | Shift+E (encerrar) | N (nota)
        </div>
      ) : null}

      <div className="space-y-3 border-b border-white/10 bg-black/15 p-3">
        <LiveSessionHostPanel />
        <DirectorBar
          scene={activeScene}
          npcs={npcsInScene}
          combatActive={Boolean(activeCombat)}
          audioUrl={state.audio.currentTrackUrl}
          lastReward={state.rewardEvents[0] ?? null}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-y-auto xl:overflow-hidden">
        <aside className={cn('border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar p-4 space-y-4', isImmersive ? 'hidden' : 'col-span-1 xl:col-span-2')}>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <MapIcon size={14} /> Cenas
          </h3>
          <div className="space-y-1">
            {campaignScenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => activeCampaign && setActiveScene(activeCampaign.id, scene.id)}
                aria-label={`Selecionar cena ${scene.name}`}
                className={cn(
                  'w-full text-left p-3 rounded-lg text-sm transition-all border border-transparent',
                  activeScene?.id === scene.id
                    ? 'bg-secondary/15 text-white border-secondary/50 shadow-soft-md'
                    : 'text-text-muted hover:text-white hover:bg-white/5',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] opacity-50">#{idx + 1}</span>
                  <span className="font-bold truncate">{scene.name}</span>
                </div>
                {scene.isCompleted && <span className="text-[10px] text-primary">Concluída</span>}
              </button>
            ))}
          </div>
        </aside>

        <main
          className={cn(
            'overflow-y-auto custom-scrollbar p-6 relative',
            isImmersive ? (showOpsPanel ? 'col-span-1 xl:col-span-8' : 'col-span-1 xl:col-span-12') : 'col-span-1 xl:col-span-7',
          )}
        >
          {activeCombat ? (
            <div className="animate-in fade-in duration-300">
              <CombatTracker combat={activeCombat} />
            </div>
          ) : activeScene ? (
            <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-rajdhani font-bold text-white">{activeScene.name}</h1>
                  <div className="px-3 py-1 rounded-full border border-white/10 text-xs text-text-muted uppercase">
                    {activeScene.mood}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                  {lastEndedCombat && <PostBattleRewards scene={activeScene} combat={lastEndedCombat} />}
                  <InteractiveMap scene={activeScene} />
                  <div>
                    <h4 className="text-xs font-bold text-secondary uppercase mb-2">Objetivo</h4>
                    <p className="text-white font-medium">{activeScene.objective || 'Nenhum objetivo definido.'}</p>
                  </div>
                  <div className="w-full h-px bg-white/10" />
                  <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Descricao / Read-aloud</h4>
                    <p className="text-text-muted leading-relaxed whitespace-pre-wrap">
                      {activeScene.description || 'Sem descricao.'}
                    </p>
                  </div>
                  {activeScene.opening && (
                    <div className="bg-black/30 p-4 rounded-lg border-l-2 border-accent/60">
                      <h4 className="text-xs font-bold text-accent uppercase mb-1">Abertura</h4>
                      <p className="text-white/80 italic text-sm">"{activeScene.opening}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-rajdhani font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-secondary" />
                    Jogadores da Mesa
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playersInCampaign.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-text-muted bg-white/5 rounded-xl border border-white/5 border-dashed">
                      Nenhum personagem do tipo jogador esta vinculado a campanha ativa.
                    </div>
                  ) : (
                    playersInCampaign.map((char) => (
                      <div
                        key={char.id}
                        className="bg-black/40 border border-white/10 rounded-lg p-3 flex gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
                          {char.imageUri ? (
                            <img src={char.imageUri} className="w-full h-full object-cover" alt={char.name} />
                          ) : (
                            <User size={24} className="m-auto text-white/20 h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-white truncate">{char.name}</h4>
                              <p className="text-[11px] text-text-muted">{char.role || 'Sem funcao'}</p>
                            </div>
                            <Link
                              to={`/player/${char.id}`}
                              className="text-[10px] px-2 py-1 rounded uppercase font-bold bg-secondary/20 text-white"
                            >
                              Visao
                            </Link>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-red-400 font-bold">
                              <Shield size={10} /> {char.currentHp}/{getCharacterMaxHp(char)} PV
                            </span>
                            <span className="flex items-center gap-1 text-blue-400 font-bold">
                              <Zap size={10} /> {char.dnd ? `CA ${char.dnd.armorClass}` : `${char.currentMp}/${getCharacterMaxMp(char)} PM`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-rajdhani font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    Personagens na Cena
                  </h3>
                  <button className="text-xs text-secondary hover:underline">Gerenciar NPCs</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...npcsInScene, ...enemiesInScene].length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-text-muted bg-white/5 rounded-xl border border-white/5 border-dashed">
                      Nenhum NPC ou inimigo vinculado a esta cena.
                    </div>
                  ) : (
                    [...npcsInScene, ...enemiesInScene].map((char) => (
                      <div
                        key={char.id}
                        className="bg-black/40 border border-white/10 rounded-lg p-3 flex gap-3 hover:border-white/20 transition-all"
                      >
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
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded uppercase font-bold',
                                char.type === 'ENEMY' || char.type === 'BOSS'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-blue-500/20 text-blue-400',
                              )}
                            >
                              {char.type}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-red-400 font-bold">
                              <Shield size={10} /> {char.currentHp}/{getCharacterMaxHp(char)} PV
                            </span>
                            <span className="flex items-center gap-1 text-blue-400 font-bold">
                              <Zap size={10} /> {char.dnd ? `CA ${char.dnd.armorClass}` : `${char.currentMp}/${getCharacterMaxMp(char)} PM`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {recentRolls.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Jogadas recentes</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentRolls.slice(0, 6).map((roll) => (
                      <div key={roll.id} className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs text-white">
                        {roll.label || `${roll.diceCount}d6`} - {roll.total}
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

          {canStartCombat && (
            <div className="absolute bottom-6 right-6">
              <button
                onClick={() => activeSceneId && startCombatFromScene(activeSceneId)}
                aria-label="Iniciar combate"
                className="flex items-center gap-2 px-6 py-4 rounded-full bg-primary text-slate-950 font-bold shadow-soft-lg hover:scale-105 transition-all"
              >
                <Swords size={24} />
                INICIAR COMBATE
              </button>
            </div>
          )}
        </main>

        <aside
          className={cn(
            'border-l border-white/10 bg-black/20 p-4 space-y-6 overflow-y-auto custom-scrollbar',
            isImmersive ? (showOpsPanel ? 'col-span-1 xl:col-span-4' : 'hidden') : 'col-span-1 xl:col-span-3',
          )}
        >
          <DiceRoller
            className="flex-shrink-0"
            onRoll={(roll) => {
              setRecentRolls((previous) => [roll, ...previous].slice(0, 20))
              live?.sendEvent(
                'dice',
                { expression: roll.label || `${roll.diceCount}d6`, rolls: roll.results, total: roll.total, context: activeScene?.name || '' },
                { kind: 'all' },
              )
              if (roll.diceCount > 1 && roll.results.every((result) => result === 6)) {
                ;(window as any).notifyInGame?.('Critico!', 'success')
              }
              if (roll.diceCount > 1 && roll.results.every((result) => result === 1)) {
                ;(window as any).notifyInGame?.('Falha critica!', 'error')
              }
            }}
          />

          <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-4 flex items-center gap-2">
              <MessageSquare size={14} /> Notas da Sessao
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4 pr-2">
              {session.notes.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Nenhuma nota registrada.</p>
              ) : (
                session.notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      'text-xs p-2 rounded bg-black/20 border border-white/5',
                      note.important && 'border-secondary/50 bg-secondary/10',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1 opacity-50 gap-2">
                      <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                      <div className="flex items-center gap-1 opacity-100">
                        <button
                          type="button"
                          aria-label={note.important ? 'Desmarcar nota importante' : 'Marcar nota importante'}
                          onClick={() => toggleNoteImportant(note.id)}
                          className={cn(
                            'rounded-md border px-1.5 py-1 transition',
                            note.important
                              ? 'border-amber-400/30 bg-amber-400/15 text-amber-200'
                              : 'border-white/10 bg-black/20 text-text-muted hover:text-white',
                          )}
                        >
                          <Star size={12} fill={note.important ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir nota"
                          onClick={() => deleteNote(note.id)}
                          className="rounded-md border border-white/10 bg-black/20 px-1.5 py-1 text-text-muted transition hover:text-red-200 hover:border-red-400/30 hover:bg-red-500/10"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-white whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar nota..."
                className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-secondary outline-none"
                value={noteInput}
                ref={noteInputRef}
                onChange={(event) => setNoteInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && noteInput.trim()) {
                    submitNote()
                  }
                }}
              />
              <button
                onClick={submitNote}
                aria-label="Adicionar nota"
                className="p-2 bg-white/5 hover:bg-secondary/20 hover:text-secondary rounded-lg transition-colors border border-white/10"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <SessionChat sessionKey={`${sessionKey}:gm-chat`} />
          <MasterToolkitPanel sessionKey={sessionKey} activeScene={activeScene} players={playersInCampaign} />
        </aside>
      </div>

      <AudioPlayer />
      <InGameNotifications />
      <ConfirmDialog
        open={confirmEndSession}
        title="Encerrar sessao"
        description="A sessao ativa sera finalizada e um resumo persistido sera adicionado ao historico da mesa."
        confirmLabel="Encerrar sessao"
        onCancel={() => setConfirmEndSession(false)}
        onConfirm={() => {
          live?.endSession()
          endSession()
          setConfirmEndSession(false)
          ;(window as any).notifyInGame?.('Sessao encerrada', 'success')
        }}
      />
    </div>
  )
}
