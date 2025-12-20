import { Swords, Heart, Zap, SkipForward, XCircle, Skull, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/AppStore'
import type { Combat } from '@/domain/models'

interface CombatTrackerProps {
  combat: Combat
}

export function CombatTracker({ combat }: CombatTrackerProps) {
  const { nextCombatTurn, endCombat, adjustCombatParticipant, toggleCombatDefeated } = useAppStore()!

  return (
    <div className="flex flex-col h-full bg-surface-900/50 rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
            <Swords size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">Combate em Andamento</h3>
            <p className="text-sm text-text-muted mt-1">
              Rodada {combat.round} • Turno {combat.currentTurnIndex + 1}/{combat.participants.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => nextCombatTurn(combat.id)}
            aria-label="Próximo turno"
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <SkipForward size={16} />
            Próximo Turno
          </button>
          <button
            onClick={() => endCombat(combat.id)}
            aria-label="Encerrar combate"
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
          >
            <XCircle size={16} />
            Encerrar
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {combat.participants.map((participant, index) => {
          const isActive = index === combat.currentTurnIndex
          const isDead = participant.isDefeated

          return (
            <div
              key={participant.id}
              className={cn(
                "relative group flex items-center gap-4 p-3 rounded-xl border transition-all",
                isActive 
                  ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]" 
                  : "bg-surface-800/50 border-white/5 hover:border-white/10",
                isDead && "opacity-50 grayscale"
              )}
            >
              {/* Initiative Badge */}
              <div className="flex flex-col items-center justify-center min-w-[2.5rem] h-10 rounded-lg bg-surface-950 border border-white/10">
                <span className="text-xs text-text-muted uppercase tracking-wider">Ini</span>
                <span className="font-mono font-bold text-lg leading-none">{participant.initiative}</span>
              </div>

              {/* Avatar */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-surface-900 shrink-0">
                {participant.imageUri ? (
                  <img src={participant.imageUri} alt={participant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <User size={24} />
                  </div>
                )}
                {isDead && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500">
                    <Skull size={24} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn("font-medium truncate", isActive ? "text-brand-400" : "text-text-primary")}>
                    {participant.name}
                  </h4>
                  {participant.isPlayer && (
                    <span className="text-[10px] uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                      Player
                    </span>
                  )}
                </div>

                {/* HP/MP Bars */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative h-2 bg-surface-950 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-red-500 transition-all duration-300"
                      style={{ width: `${(participant.currentHp / participant.maxHp) * 100}%` }}
                    />
                  </div>
                  <div className="relative h-2 bg-surface-950 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300"
                      style={{ width: `${((participant.currentMp ?? 0) / (participant.maxMp || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => adjustCombatParticipant(combat.id, participant.id, -1, 0)}
                    aria-label="Remover 1 PV"
                    className="p-1 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded focus:outline-none focus:ring-2 focus:ring-red-400/40"
                    title="-1 PV"
                  >
                    <Heart size={14} className="fill-current" />
                  </button>
                  <button 
                    onClick={() => adjustCombatParticipant(combat.id, participant.id, 0, -1)}
                    aria-label="Remover 1 PM"
                    className="p-1 hover:bg-blue-500/20 text-text-muted hover:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    title="-1 PM"
                  >
                    <Zap size={14} className="fill-current" />
                  </button>
                </div>
                <button
                  onClick={() => toggleCombatDefeated(combat.id, participant.id)}
                  aria-label={isDead ? "Reviver" : "Marcar como derrotado"}
                  aria-pressed={isDead}
                  className={cn(
                    "p-2 rounded-lg transition-colors ml-1",
                    isDead ? "bg-red-500/20 text-red-400" : "hover:bg-surface-700 text-text-muted"
                  )}
                  title={isDead ? "Reviver" : "Marcar como Derrotado"}
                >
                  <Skull size={18} />
                </button>
              </div>

              {/* Stats Values (Visible always) */}
              <div className="flex flex-col items-end gap-0.5 text-xs font-mono">
                <span className="text-red-400">{participant.currentHp}/{participant.maxHp} PV</span>
                <span className="text-blue-400">{participant.currentMp ?? 0}/{participant.maxMp ?? 0} PM</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
