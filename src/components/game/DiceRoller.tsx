import { useState } from 'react'
import { Dices, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'

export type RollResult = {
  id: string
  diceCount: number
  results: number[]
  total: number
  timestamp: number
  label?: string
}

export function DiceRoller({ className, onRoll }: { className?: string, onRoll?: (roll: RollResult) => void }) {
  const [history, setHistory] = useState<RollResult[]>([])
  const [isRolling, setIsRolling] = useState(false)

  const roll = (diceCount: number, label?: string) => {
    setIsRolling(true)
    
    // Simulate slight delay for effect
    setTimeout(() => {
      const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)
      const total = results.reduce((a, b) => a + b, 0)
      
      const newRoll: RollResult = {
        id: crypto.randomUUID(),
        diceCount,
        results,
        total,
        timestamp: Date.now(),
        label
      }

      setHistory(prev => [newRoll, ...prev].slice(0, 10)) // Keep last 10
      if (onRoll) onRoll(newRoll)
      setIsRolling(false)
    }, 300)
  }

  const clearHistory = () => setHistory([])

  return (
    <div className={cn("bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="font-rajdhani font-bold text-white flex items-center gap-2">
          <Dices className="text-neon-purple" size={20} />
          Rolador 3D&T
        </h3>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-xs text-text-muted hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        <RollButton count={1} onClick={() => roll(1, 'Teste Simples')} disabled={isRolling} />
        <RollButton count={2} onClick={() => roll(2, 'Normal')} disabled={isRolling} />
        <RollButton count={3} onClick={() => roll(3, 'Difícil')} disabled={isRolling} />
      </div>

      {/* History */}
      <div className="flex-1 min-h-[150px] max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted/50 text-xs italic gap-2">
            <span>Role os dados...</span>
          </div>
        ) : (
          history.map(roll => (
            <div key={roll.id} className="bg-white/5 rounded-lg p-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-text-muted uppercase font-bold">{roll.label || `${roll.diceCount}d6`}</span>
                <span className="text-[10px] text-white/50">
                  {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {roll.results.map((r, i) => (
                    <div key={i} className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-bold border",
                      r === 6 ? "bg-neon-green/20 border-neon-green text-neon-green" :
                      r === 1 ? "bg-red-500/20 border-red-500 text-red-500" :
                      "bg-black/40 border-white/10 text-white"
                    )}>
                      {r}
                    </div>
                  ))}
                </div>
                <div className="text-xl font-bold font-rajdhani text-neon-cyan">
                  {roll.total}
                </div>
              </div>
              {/* Crítico/Falha Crítica Logic for 3D&T? Usually based on Skill check, but pure rolls: 
                  6 is always good, 1 is bad. 
              */}
              {roll.diceCount > 1 && roll.results.every(r => r === 6) && (
                <div className="text-[10px] text-neon-green font-bold mt-1 text-center animate-pulse">CRÍTICO!</div>
              )}
              {roll.diceCount > 1 && roll.results.every(r => r === 1) && (
                <div className="text-[10px] text-red-500 font-bold mt-1 text-center">FALHA CRÍTICA!</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RollButton({ count, onClick, disabled }: { count: number, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple rounded-lg p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-bold font-rajdhani text-white group-hover:text-neon-purple transition-colors">
          {count}d6
        </span>
      </div>
    </button>
  )
}
