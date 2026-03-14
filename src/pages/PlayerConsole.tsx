import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Backpack, Heart, MessageSquare, Shield, Sparkles, Sword, Wand2, Zap } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { getCharacterMaxHp, getCharacterMaxMp, type ConditionType, type EquipmentType } from '@/domain/models'
import { useSessionOverview } from '@/hooks/useSessionOverview'
import { DiceRoller } from '@/components/game/DiceRoller'
import { SessionChat } from '@/components/game/SessionChat'
import { TableEventFeed } from '@/components/game/TableEventFeed'
import { PageHero } from '@/components/ui/PageHero'
import { cn } from '@/lib/cn'

const EQUIPMENT_TYPES: EquipmentType[] = ['WEAPON', 'ARMOR', 'SHIELD', 'ACCESSORY', 'CONSUMABLE']
const CONDITION_TYPES: ConditionType[] = ['BURNING', 'POISONED', 'STUNNED', 'BLESSED', 'CURSED', 'CUSTOM']

export function PlayerConsole() {
  const { characterId } = useParams<{ characterId?: string }>()
  const {
    addConditionToCharacter,
    addEquipmentToCharacter,
    adjustCharacterHpMp,
    removeConditionFromCharacter,
    removeEquipmentFromCharacter,
    toggleCharacterEquipment,
  } = useAppStore()
  const { activeCampaign, activeCombat, activeScene, playersInCampaign, session } = useSessionOverview()
  const [itemName, setItemName] = useState('')
  const [itemType, setItemType] = useState<EquipmentType>('WEAPON')
  const [conditionName, setConditionName] = useState('')
  const [conditionType, setConditionType] = useState<ConditionType>('CUSTOM')
  const character = playersInCampaign.find((entry) => entry.id === characterId) ?? playersInCampaign[0] ?? null

  const participant = useMemo(
    () => activeCombat?.participants.find((entry) => entry.characterId === character?.id) ?? null,
    [activeCombat, character?.id],
  )

  if (!session.isActive || !activeCampaign || !activeScene) {
    return (
      <div className="app-panel-muted px-6 py-10 text-center text-white">
        A sessao ainda nao foi iniciada pelo mestre.
      </div>
    )
  }

  if (playersInCampaign.length === 0) {
    return (
      <div className="app-panel-muted px-6 py-10 text-center text-white">
        Nao ha personagens do tipo jogador cadastrados para esta campanha.
      </div>
    )
  }

  if (!character) {
    return (
      <div className="app-panel-muted px-6 py-10 text-center text-white">
        Personagem do jogador nao encontrado.
      </div>
    )
  }

  const maxHp = getCharacterMaxHp(character)
  const maxMp = getCharacterMaxMp(character)

  const handleAddItem = (event: FormEvent) => {
    event.preventDefault()
    const name = itemName.trim()
    if (!name) return
    addEquipmentToCharacter(character.id, {
      name,
      type: itemType,
      description: '',
      bonusF: 0,
      bonusH: 0,
      bonusR: 0,
      bonusA: 0,
      bonusPdF: 0,
      special: '',
      imageUri: null,
      isEquipped: false,
    })
    setItemName('')
  }

  const handleAddCondition = (event: FormEvent) => {
    event.preventDefault()
    const name = conditionName.trim()
    if (!name) return
    addConditionToCharacter(character.id, {
      type: conditionType,
      name,
      description: '',
      duration: 1,
      value: 0,
    })
    setConditionName('')
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHero
        eyebrow="Visao do jogador"
        title={
          <>
            {character.name} <span className="text-gradient-secondary">em jogo</span>
          </>
        }
        description="Acompanhe recursos, inventario, condicoes e comunicacao em um painel responsivo unificado para cada participante."
        actions={
          <div className="flex flex-wrap gap-2">
            {playersInCampaign.map((entry) => (
              <Link
                key={entry.id}
                to={`/player/${entry.id}`}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  entry.id === character.id
                    ? 'border-secondary/35 bg-secondary/15 text-white'
                    : 'border-white/10 bg-black/20 text-text-muted hover:text-white',
                )}
              >
                {entry.name}
              </Link>
            ))}
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="app-panel-strong p-6">
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard label="PV" value={`${character.currentHp}/${maxHp}`} icon={Heart} accent="text-rose-300" onIncrease={() => adjustCharacterHpMp(character.id, 1, 0)} onDecrease={() => adjustCharacterHpMp(character.id, -1, 0)} />
            <StatusCard
              label={character.dnd ? 'CA' : 'PM'}
              value={character.dnd ? `${character.dnd.armorClass}` : `${character.currentMp}/${maxMp}`}
              icon={Zap}
              accent="text-sky-300"
              onIncrease={character.dnd ? undefined : () => adjustCharacterHpMp(character.id, 0, 1)}
              onDecrease={character.dnd ? undefined : () => adjustCharacterHpMp(character.id, 0, -1)}
            />
            <StatusCard label="XP" value={`${character.xp ?? 0}`} icon={Sparkles} accent="text-amber-300" />
            <StatusCard label="Ouro" value={`${character.gold ?? 0}`} icon={Backpack} accent="text-emerald-300" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="app-panel-muted p-4">
              <div className="mb-4 flex items-center gap-2">
                <Shield size={16} className="text-secondary" />
                <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Ficha Rapida</h2>
              </div>
              {character.dnd ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <AttributeTile label="STR" value={character.dnd.abilityScores.STR} />
                  <AttributeTile label="DEX" value={character.dnd.abilityScores.DEX} />
                  <AttributeTile label="CON" value={character.dnd.abilityScores.CON} />
                  <AttributeTile label="INT" value={character.dnd.abilityScores.INT} />
                  <AttributeTile label="WIS" value={character.dnd.abilityScores.WIS} />
                  <AttributeTile label="CHA" value={character.dnd.abilityScores.CHA} />
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 text-center">
                  <AttributeTile label="P" value={character.strength} />
                  <AttributeTile label="H" value={character.skill} />
                  <AttributeTile label="R" value={character.resistance} />
                  <AttributeTile label="A" value={character.armor} />
                  <AttributeTile label="PdF" value={character.firepower} />
                </div>
              )}
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <p><span className="text-white">Vantagens:</span> {character.advantages.length ? character.advantages.join(', ') : 'Nenhuma.'}</p>
                <p><span className="text-white">Desvantagens:</span> {character.disadvantages.length ? character.disadvantages.join(', ') : 'Nenhuma.'}</p>
                <p><span className="text-white">Condicoes:</span> {character.activeConditions.length || participant?.activeConditions.length ? 'Ativas abaixo.' : 'Nenhuma.'}</p>
              </div>
            </section>

            <section className="app-panel-muted p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sword size={16} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Cena Atual</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {activeScene.backgroundImageDataUrl || activeScene.mapImageDataUrl ? (
                    <img
                      src={activeScene.mapImageDataUrl || activeScene.backgroundImageDataUrl || ''}
                      alt={activeScene.name}
                      className="h-full min-h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-48 items-center justify-center text-sm text-text-muted">
                      Cena sem imagem publicada.
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-text-muted">Campanha</div>
                    <div className="text-lg font-semibold text-white">{activeCampaign.title}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-text-muted">Cena</div>
                    <div className="text-lg font-semibold text-white">{activeScene.name}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-text-muted">Objetivo</div>
                    <p className="text-sm text-white">{activeScene.objective || 'Sem objetivo definido.'}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-text-muted">Abertura</div>
                    <p className="text-sm text-text-muted">{activeScene.opening || 'O mestre ainda nao publicou um texto de abertura.'}</p>
                  </div>
                  {participant ? (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-50">
                      Em combate: iniciativa {participant.initiative}, rodada {activeCombat?.round ?? 0}.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-4">
          <DiceRoller />
          <TableEventFeed sessionKey={session.activeCampaignId || 'global'} defaultAuthor={character.name} role="player" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="app-panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Backpack size={16} className="text-amber-300" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Inventario</h2>
          </div>
          <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
            <input
              type="text"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Novo item"
              className="field flex-1"
            />
            <select
              value={itemType}
              onChange={(event) => setItemType(event.target.value as EquipmentType)}
              className="field w-36"
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-3">
              Adicionar
            </button>
          </form>
          <div className="space-y-2">
            {character.equipment.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center text-sm text-text-muted">
                Nenhum item registrado.
              </div>
            ) : (
              character.equipment.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-text-muted">{item.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCharacterEquipment(character.id, item.id)}
                      className={cn(
                        'rounded-lg px-2 py-1 text-xs transition',
                        item.isEquipped ? 'bg-secondary/25 text-white' : 'bg-white/10 text-text-muted',
                      )}
                    >
                      {item.isEquipped ? 'Equipado' : 'Equipar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEquipmentFromCharacter(character.id, item.id)}
                      className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-200 transition hover:bg-rose-500/30"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="app-panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 size={16} className="text-secondary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Poderes e Condicoes</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-text-muted">Poderes</div>
              <div className="space-y-2">
                {character.powers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-sm text-text-muted">
                    Nenhum poder cadastrado.
                  </div>
                ) : (
                  character.powers.map((power) => (
                    <article key={power.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                      <div className="text-sm font-semibold text-white">{power.name}</div>
                      <div className="mt-1 text-xs text-text-muted">{power.description || 'Sem descricao.'}</div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div>
              <form onSubmit={handleAddCondition} className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={conditionName}
                  onChange={(event) => setConditionName(event.target.value)}
                  placeholder="Nova condicao"
                  className="field flex-1"
                />
                <select
                  value={conditionType}
                  onChange={(event) => setConditionType(event.target.value as ConditionType)}
                  className="field w-36"
                >
                  {CONDITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-secondary px-3">
                  Aplicar
                </button>
              </form>
              <div className="space-y-2">
                {character.activeConditions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-sm text-text-muted">
                    Nenhuma condicao ativa.
                  </div>
                ) : (
                  character.activeConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{condition.name}</div>
                        <div className="text-xs text-text-muted">{condition.type}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeConditionFromCharacter(character.id, condition.id)}
                        className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-200 transition hover:bg-rose-500/30"
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Comunicacao</h2>
          </div>
          <SessionChat sessionKey={`${session.activeCampaignId || 'global'}:players`} />
        </div>
      </section>
    </div>
  )
}

function StatusCard({
  label,
  value,
  icon: Icon,
  accent,
  onIncrease,
  onDecrease,
}: {
  label: string
  value: string
  icon: typeof Heart
  accent: string
  onIncrease?: () => void
  onDecrease?: () => void
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</span>
        <Icon size={16} className={accent} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {(onIncrease || onDecrease) ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onDecrease} className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white transition hover:bg-white/10">
            -
          </button>
          <button type="button" onClick={onIncrease} className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white transition hover:bg-white/10">
            +
          </button>
        </div>
      ) : null}
    </article>
  )
}

function AttributeTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold text-white">{value}</div>
    </div>
  )
}
