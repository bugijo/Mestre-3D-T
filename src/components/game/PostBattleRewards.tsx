import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/AppStore'
import type { Combat, Scene, Character, EquipmentItem, RewardRule, RewardGrant } from '@/domain/models'
import { createId } from '@/lib/id'

type Props = {
  scene: Scene
  combat: Combat | null
}

export function PostBattleRewards({ scene, combat }: Props) {
  const { state, upsertRewardRule, grantRewards } = useAppStore()!
  const rules = state.rewardTables
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || '')
  const [notes, setNotes] = useState('')

  const participants = useMemo(() => {
    if (!combat) return [] as { character: Character | null; isPlayer: boolean; participantName: string; participantId: string }[]
    return combat.participants.map(p => ({
      character: p.characterId ? state.characters.find(c => c.id === p.characterId) || null : null,
      isPlayer: !!p.isPlayer,
      participantName: p.name,
      participantId: p.id,
    }))
  }, [combat, state.characters])

  const [grants, setGrants] = useState<Record<string, { xp: number; gold: number; items: EquipmentItem[] }>>({})

  useEffect(() => {
    const rule = rules.find(r => r.id === selectedRuleId)
    if (!rule) return
    const next: Record<string, { xp: number; gold: number; items: EquipmentItem[] }> = {}
    for (const p of participants) {
      if (!p.character || !p.isPlayer) continue
      next[p.character.id] = { xp: rule.xp, gold: rule.gold, items: [] }
    }
    setGrants(next)
  }, [selectedRuleId, rules, participants])

  const addItem = (characterId: string) => {
    const base: EquipmentItem = {
      id: createId(),
      name: 'Item',
      type: 'ACCESSORY',
      description: '',
      bonusF: 0,
      bonusH: 0,
      bonusR: 0,
      bonusA: 0,
      bonusPdF: 0,
      special: '',
      imageUri: null,
      isEquipped: false,
    }
    setGrants(prev => ({
      ...prev,
      [characterId]: { xp: prev[characterId]?.xp ?? 0, gold: prev[characterId]?.gold ?? 0, items: [...(prev[characterId]?.items ?? []), base] },
    }))
  }

  const updateItem = (characterId: string, idx: number, patch: Partial<EquipmentItem>) => {
    setGrants(prev => {
      const current = prev[characterId] || { xp: 0, gold: 0, items: [] }
      const items = current.items.slice()
      items[idx] = { ...items[idx], ...patch }
      return { ...prev, [characterId]: { ...current, items } }
    })
  }

  const removeItem = (characterId: string, idx: number) => {
    setGrants(prev => {
      const current = prev[characterId] || { xp: 0, gold: 0, items: [] }
      const items = current.items.filter((_, i) => i !== idx)
      return { ...prev, [characterId]: { ...current, items } }
    })
  }

  const submit = () => {
    const list: RewardGrant[] = Object.entries(grants).map(([characterId, g]) => ({ characterId, xp: g.xp, gold: g.gold, items: g.items }))
    grantRewards(scene.id, combat?.id ?? null, list, notes)
    setNotes('')
  }

  const onCreateRule = () => {
    const name = prompt('Nome da Regra de Recompensa:') || ''
    const xp = parseInt(prompt('XP base:') || '0', 10) || 0
    const gold = parseInt(prompt('Ouro base:') || '0', 10) || 0
    if (!name.trim()) return
    const rule: RewardRule = { id: '', name: name.trim(), criteria: 'Personalizada', xp, gold }
    upsertRewardRule(rule)
  }

  const history = useMemo(() => state.rewardEvents.filter(e => e.sceneId === scene.id).sort((a, b) => b.createdAt - a.createdAt), [state.rewardEvents, scene.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-rajdhani font-bold text-white">Recompensas pós-batalha</h3>
        <div className="flex items-center gap-2">
          <select value={selectedRuleId} onChange={(e) => setSelectedRuleId(e.target.value)} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white">
            {rules.map(r => (
              <option key={r.id} value={r.id}>{r.name} — XP {r.xp} / Ouro {r.gold}</option>
            ))}
          </select>
          <button onClick={onCreateRule} className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">Nova Regra</button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3">
          {participants.filter(p => p.isPlayer && p.character).length === 0 ? (
            <div className="text-xs text-text-muted">Nenhum jogador participante.</div>
          ) : (
            participants.filter(p => p.isPlayer && p.character).map(p => {
              const char = p.character!
              const g = grants[char.id] || { xp: 0, gold: 0, items: [] }
              return (
                <div key={char.id} className="p-3 rounded-lg bg-black/30 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{char.name}</span>
                        <span className="text-[10px] text-text-muted">XP atual {char.xp} • Ouro {char.gold}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-text-muted">XP</label>
                      <input type="number" value={g.xp} onChange={(e) => setGrants(prev => ({ ...prev, [char.id]: { ...g, xp: parseInt(e.target.value || '0', 10) || 0 } }))} className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                      <label className="text-xs text-text-muted">Ouro</label>
                      <input type="number" value={g.gold} onChange={(e) => setGrants(prev => ({ ...prev, [char.id]: { ...g, gold: parseInt(e.target.value || '0', 10) || 0 } }))} className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                      <button onClick={() => addItem(char.id)} className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-text-muted hover:text-white">Adicionar Item</button>
                    </div>
                  </div>
                  {g.items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {g.items.map((it, idx) => (
                        <div key={it.id} className="grid grid-cols-6 gap-2 items-center">
                          <input value={it.name} onChange={(e) => updateItem(char.id, idx, { name: e.target.value })} className="col-span-2 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="Nome" />
                          <select value={it.type} onChange={(e) => updateItem(char.id, idx, { type: e.target.value as any })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white">
                            <option value="WEAPON">Arma</option>
                            <option value="ARMOR">Armadura</option>
                            <option value="SHIELD">Escudo</option>
                            <option value="ACCESSORY">Acessório</option>
                            <option value="CONSUMABLE">Consumível</option>
                          </select>
                          <input type="number" value={it.bonusF} onChange={(e) => updateItem(char.id, idx, { bonusF: parseInt(e.target.value || '0', 10) || 0 })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="F" />
                          <input type="number" value={it.bonusH} onChange={(e) => updateItem(char.id, idx, { bonusH: parseInt(e.target.value || '0', 10) || 0 })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="H" />
                          <input type="number" value={it.bonusR} onChange={(e) => updateItem(char.id, idx, { bonusR: parseInt(e.target.value || '0', 10) || 0 })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="R" />
                          <input type="number" value={it.bonusA} onChange={(e) => updateItem(char.id, idx, { bonusA: parseInt(e.target.value || '0', 10) || 0 })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="A" />
                          <input type="number" value={it.bonusPdF} onChange={(e) => updateItem(char.id, idx, { bonusPdF: parseInt(e.target.value || '0', 10) || 0 })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="PdF" />
                          <input value={it.description} onChange={(e) => updateItem(char.id, idx, { description: e.target.value })} className="col-span-3 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="Descrição" />
                          <button onClick={() => removeItem(char.id, idx)} className="px-2 py-1 text-xs rounded bg-red-500/20 border border-red-500/30 text-red-400">Remover</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" />
          <button onClick={submit} className="px-4 py-2 rounded bg-neon-green text-black font-bold border border-neon-green/60">Conceder Recompensas</button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Histórico</h4>
        {history.length === 0 ? (
          <div className="text-xs text-text-muted">Sem registros.</div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map(evt => (
              <div key={evt.id} className="p-2 rounded bg-black/30 border border-white/10 text-xs text-white">
                <div className="flex items-center justify-between">
                  <span>{new Date(evt.createdAt).toLocaleString()}</span>
                  <span className="text-[10px] text-text-muted">{evt.combatId ? 'Combate' : 'Manual'}</span>
                </div>
                <div>
                  {evt.grants.map(g => {
                    const ch = state.characters.find(c => c.id === g.characterId)
                    return (
                      <div key={g.characterId}>
                        {ch?.name || 'Desconhecido'}: +{g.xp} XP, +{g.gold} ouro{g.items?.length ? `, ${g.items.length} item(ns)` : ''}
                      </div>
                    )
                  })}
                </div>
                {evt.notes && <div className="mt-1 text-text-muted">{evt.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
