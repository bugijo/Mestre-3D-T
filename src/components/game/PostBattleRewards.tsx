import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/AppStore'
import type { Combat, Scene, Character, EquipmentItem, RewardRule, RewardGrant } from '@/domain/models'
import { createId } from '@/lib/id'

type Props = {
  scene: Scene
  combat: Combat | null
}

type RewardDraft = {
  name: string
  criteria: string
  xp: string
  gold: string
}

const emptyDraft: RewardDraft = {
  name: '',
  criteria: 'Personalizada',
  xp: '0',
  gold: '0',
}

export function PostBattleRewards({ scene, combat }: Props) {
  const { state, upsertRewardRule, grantRewards } = useAppStore()!
  const rules = state.rewardTables
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || '')
  const [notes, setNotes] = useState('')
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleDraft, setRuleDraft] = useState<RewardDraft>(emptyDraft)
  const [ruleFeedback, setRuleFeedback] = useState('')

  const participants = useMemo(() => {
    if (!combat) return [] as { character: Character | null; isPlayer: boolean; participantName: string; participantId: string }[]
    return combat.participants.map((p) => ({
      character: p.characterId ? state.characters.find((c) => c.id === p.characterId) || null : null,
      isPlayer: !!p.isPlayer,
      participantName: p.name,
      participantId: p.id,
    }))
  }, [combat, state.characters])

  const [grants, setGrants] = useState<Record<string, { xp: number; gold: number; items: EquipmentItem[] }>>({})

  useEffect(() => {
    if (!selectedRuleId && rules[0]?.id) {
      setSelectedRuleId(rules[0].id)
    }
  }, [rules, selectedRuleId])

  useEffect(() => {
    const rule = rules.find((r) => r.id === selectedRuleId)
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
    setGrants((prev) => ({
      ...prev,
      [characterId]: {
        xp: prev[characterId]?.xp ?? 0,
        gold: prev[characterId]?.gold ?? 0,
        items: [...(prev[characterId]?.items ?? []), base],
      },
    }))
  }

  const updateItem = (characterId: string, idx: number, patch: Partial<EquipmentItem>) => {
    setGrants((prev) => {
      const current = prev[characterId] || { xp: 0, gold: 0, items: [] }
      const items = current.items.slice()
      items[idx] = { ...items[idx], ...patch }
      return { ...prev, [characterId]: { ...current, items } }
    })
  }

  const removeItem = (characterId: string, idx: number) => {
    setGrants((prev) => {
      const current = prev[characterId] || { xp: 0, gold: 0, items: [] }
      const items = current.items.filter((_, i) => i !== idx)
      return { ...prev, [characterId]: { ...current, items } }
    })
  }

  const submit = () => {
    const list: RewardGrant[] = Object.entries(grants).map(([characterId, g]) => ({
      characterId,
      xp: g.xp,
      gold: g.gold,
      items: g.items,
    }))
    grantRewards(scene.id, combat?.id ?? null, list, notes)
    setNotes('')
  }

  const saveRule = () => {
    const name = ruleDraft.name.trim()
    if (!name) {
      setRuleFeedback('Informe um nome para a regra.')
      return
    }
    const ruleId = createId()
    const nextRule: RewardRule = {
      id: ruleId,
      name,
      criteria: ruleDraft.criteria.trim() || 'Personalizada',
      xp: parseInt(ruleDraft.xp || '0', 10) || 0,
      gold: parseInt(ruleDraft.gold || '0', 10) || 0,
    }
    upsertRewardRule(nextRule)
    setSelectedRuleId(ruleId)
    setShowRuleForm(false)
    setRuleDraft(emptyDraft)
    setRuleFeedback('Regra criada.')
  }

  const history = useMemo(
    () => state.rewardEvents.filter((e) => e.sceneId === scene.id).sort((a, b) => b.createdAt - a.createdAt),
    [state.rewardEvents, scene.id],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-rajdhani font-bold text-white">Recompensas pos-batalha</h3>
          <p className="mt-1 text-xs text-text-muted">Aplique XP, ouro e itens aos jogadores que participaram do combate.</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex items-center gap-2">
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
            >
              {rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - XP {r.xp} / Ouro {r.gold}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setShowRuleForm((prev) => !prev)
                setRuleFeedback('')
              }}
              className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-text-muted hover:text-white"
            >
              {showRuleForm ? 'Fechar regra' : 'Nova regra'}
            </button>
          </div>
          {ruleFeedback && <span className="text-[11px] text-accent">{ruleFeedback}</span>}
        </div>
      </div>

      {showRuleForm && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={ruleDraft.name}
              onChange={(e) => setRuleDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da regra"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              value={ruleDraft.criteria}
              onChange={(e) => setRuleDraft((prev) => ({ ...prev, criteria: e.target.value }))}
              placeholder="Criterio"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              value={ruleDraft.xp}
              onChange={(e) => setRuleDraft((prev) => ({ ...prev, xp: e.target.value }))}
              placeholder="XP base"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              value={ruleDraft.gold}
              onChange={(e) => setRuleDraft((prev) => ({ ...prev, gold: e.target.value }))}
              placeholder="Ouro base"
              className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={saveRule} className="rounded border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-white">
              Salvar regra
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3">
          {participants.filter((p) => p.isPlayer && p.character).length === 0 ? (
            <div className="text-xs text-text-muted">Nenhum jogador participante.</div>
          ) : (
            participants
              .filter((p) => p.isPlayer && p.character)
              .map((p) => {
                const char = p.character!
                const g = grants[char.id] || { xp: 0, gold: 0, items: [] }
                return (
                  <div key={char.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-white">{char.name}</span>
                          <span className="text-[10px] text-text-muted">XP atual {char.xp} - Ouro {char.gold}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">XP</label>
                        <input
                          type="number"
                          value={g.xp}
                          onChange={(e) => setGrants((prev) => ({ ...prev, [char.id]: { ...g, xp: parseInt(e.target.value || '0', 10) || 0 } }))}
                          className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                        />
                        <label className="text-xs text-text-muted">Ouro</label>
                        <input
                          type="number"
                          value={g.gold}
                          onChange={(e) => setGrants((prev) => ({ ...prev, [char.id]: { ...g, gold: parseInt(e.target.value || '0', 10) || 0 } }))}
                          className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => addItem(char.id)}
                          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-text-muted hover:text-white"
                        >
                          Adicionar item
                        </button>
                      </div>
                    </div>
                    {g.items.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {g.items.map((it, idx) => (
                          <div key={it.id} className="grid grid-cols-6 items-center gap-2">
                            <input
                              value={it.name}
                              onChange={(e) => updateItem(char.id, idx, { name: e.target.value })}
                              className="col-span-2 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="Nome"
                            />
                            <select
                              value={it.type}
                              onChange={(e) => updateItem(char.id, idx, { type: e.target.value as EquipmentItem['type'] })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                            >
                              <option value="WEAPON">Arma</option>
                              <option value="ARMOR">Armadura</option>
                              <option value="SHIELD">Escudo</option>
                              <option value="ACCESSORY">Acessorio</option>
                              <option value="CONSUMABLE">Consumivel</option>
                            </select>
                            <input
                              type="number"
                              value={it.bonusF}
                              onChange={(e) => updateItem(char.id, idx, { bonusF: parseInt(e.target.value || '0', 10) || 0 })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="F"
                            />
                            <input
                              type="number"
                              value={it.bonusH}
                              onChange={(e) => updateItem(char.id, idx, { bonusH: parseInt(e.target.value || '0', 10) || 0 })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="H"
                            />
                            <input
                              type="number"
                              value={it.bonusR}
                              onChange={(e) => updateItem(char.id, idx, { bonusR: parseInt(e.target.value || '0', 10) || 0 })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="R"
                            />
                            <input
                              type="number"
                              value={it.bonusA}
                              onChange={(e) => updateItem(char.id, idx, { bonusA: parseInt(e.target.value || '0', 10) || 0 })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="A"
                            />
                            <input
                              type="number"
                              value={it.bonusPdF}
                              onChange={(e) => updateItem(char.id, idx, { bonusPdF: parseInt(e.target.value || '0', 10) || 0 })}
                              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="PdF"
                            />
                            <input
                              value={it.description}
                              onChange={(e) => updateItem(char.id, idx, { description: e.target.value })}
                              className="col-span-3 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              placeholder="Descricao"
                            />
                            <button
                              onClick={() => removeItem(char.id, idx)}
                              className="rounded border border-red-500/30 bg-red-500/20 px-2 py-1 text-xs text-red-400"
                            >
                              Remover
                            </button>
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
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observacoes"
            className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <button onClick={submit} className="rounded border border-primary/60 bg-primary px-4 py-2 font-bold text-black">
            Conceder recompensas
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="mb-2 text-xs font-bold uppercase text-text-muted">Historico</h4>
        {history.length === 0 ? (
          <div className="text-xs text-text-muted">Sem registros.</div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((evt) => (
              <div key={evt.id} className="rounded border border-white/10 bg-black/30 p-2 text-xs text-white">
                <div className="flex items-center justify-between">
                  <span>{new Date(evt.createdAt).toLocaleString()}</span>
                  <span className="text-[10px] text-text-muted">{evt.combatId ? 'Combate' : 'Manual'}</span>
                </div>
                <div>
                  {evt.grants.map((g) => {
                    const ch = state.characters.find((c) => c.id === g.characterId)
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
