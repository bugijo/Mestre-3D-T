import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, User, Skull, Crown, Sword, Heart } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { cn } from '@/lib/cn'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHero } from '@/components/ui/PageHero'
import { MetricTile } from '@/components/ui/MetricTile'
import { getCharacterMaxHp, getCharacterMaxMp, type Character, type CharacterType } from '@/domain/models'

const TYPE_LABELS: Record<CharacterType, string> = {
  PLAYER: 'Jogador',
  NPC: 'NPC',
  ENEMY: 'Inimigo',
  BOSS: 'Chefe',
  COMPANION: 'Aliado',
}

const TYPE_ICONS: Record<CharacterType, React.ElementType> = {
  PLAYER: User,
  NPC: Users,
  ENEMY: Skull,
  BOSS: Crown,
  COMPANION: Heart,
}

const TYPE_COLORS: Record<CharacterType, string> = {
  PLAYER: 'text-accent',
  NPC: 'text-secondary',
  ENEMY: 'text-red-500',
  BOSS: 'text-yellow-500',
  COMPANION: 'text-primary',
}

export function CharacterList() {
  const { state, deleteCharacter } = useAppStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CharacterType | 'ALL'>('ALL')
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null)

  const filteredCharacters = useMemo(() => {
    return state.characters
      .filter((character) => {
        const normalizedSearch = search.toLowerCase()
        const matchesSearch =
          character.name.toLowerCase().includes(normalizedSearch) ||
          character.role.toLowerCase().includes(normalizedSearch)
        const matchesType = typeFilter === 'ALL' || character.type === typeFilter
        return matchesSearch && matchesType
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.characters, search, typeFilter])

  const playerCount = state.characters.filter((entry) => entry.type === 'PLAYER').length
  const npcCount = state.characters.filter((entry) => entry.type === 'NPC').length
  const hostileCount = state.characters.filter((entry) => entry.type === 'ENEMY' || entry.type === 'BOSS').length

  return (
    <div className="space-y-8 pb-20">
      <PageHero
        eyebrow="Gestao de entidades"
        title={
          <>
            Bestiario e <span className="text-gradient-secondary">personagens</span>
          </>
        }
        description="Controle jogadores, NPCs, aliados e ameacas com filtros rapidos, visualizacao clara de atributos e acesso direto ao editor."
        actions={
          <Link to="/characters/new" className="btn-primary">
            <Plus size={18} />
            Novo Personagem
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile icon={Users} label="Jogadores" value={`${playerCount}`} detail="Personagens de participante" tone="success" />
        <MetricTile icon={User} label="NPCs" value={`${npcCount}`} detail="Atores de narrativa e suporte" tone="secondary" />
        <MetricTile icon={Skull} label="Ameacas" value={`${hostileCount}`} detail="Inimigos e chefes cadastrados" tone="primary" />
      </section>

      <div className="app-panel p-4 md:p-5">
        <div className="mb-4 text-sm text-text-muted">
          Filtre por tipo e busque por nome ou funcao para localizar rapidamente qualquer ficha da campanha.
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou funcao..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <FilterButton active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} label="Todos" />
            {(Object.keys(TYPE_LABELS) as CharacterType[]).map((type) => (
              <FilterButton
                key={type}
                active={typeFilter === type}
                onClick={() => setTypeFilter(type)}
                label={TYPE_LABELS[type]}
                icon={TYPE_ICONS[type]}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filteredCharacters.map((character) => (
          <CharacterCard key={character.id} character={character} onDelete={() => setPendingDelete(character)} />
        ))}

        {filteredCharacters.length === 0 ? (
          <div className="app-panel-muted col-span-full flex flex-col items-center justify-center py-20 text-text-muted">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum personagem encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou crie um novo personagem.</p>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir personagem"
        description={
          pendingDelete
            ? `O personagem ${pendingDelete.name} sera removido e desvinculado de cenas e combates relacionados.`
            : ''
        }
        confirmLabel="Excluir personagem"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteCharacter(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ElementType
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-secondary/35 bg-secondary/15 text-white shadow-neon-purple'
          : 'border-white/10 bg-white/[0.03] text-text-muted hover:bg-white/[0.08] hover:text-white',
      )}
    >
      {Icon ? <Icon size={14} /> : null}
      {label}
    </button>
  )
}

function CharacterCard({ character, onDelete }: { character: Character; onDelete: () => void }) {
  const Icon = TYPE_ICONS[character.type]

  return (
    <Link
      to={`/characters/${character.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,27,45,0.72)] shadow-soft-md backdrop-blur-md transition-all hover:-translate-y-1 hover:border-secondary/30"
    >
      <div className="relative h-52 w-full overflow-hidden bg-black/40">
        {character.imageUri ? (
          <img
            src={character.imageUri}
            alt={character.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User size={48} className="text-white/10" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur">
          <Icon size={12} className={TYPE_COLORS[character.type]} />
          {TYPE_LABELS[character.type]}
        </div>

        <button
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onDelete()
          }}
          className="absolute right-3 top-3 rounded-xl bg-black/60 p-2 text-white opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100"
          title="Excluir"
        >
          <Skull size={14} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 truncate font-rajdhani text-lg font-bold text-white">{character.name}</h3>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {character.role || 'Sem funcao definida'}
        </p>

        {character.dnd ? <DndAttributeGrid character={character} /> : <ThreeDetAttributeGrid character={character} />}

        <div className="mt-auto flex items-center justify-between rounded-xl bg-white/[0.06] p-2 text-xs font-bold text-text-muted">
          <div className="flex items-center gap-1">
            <Heart size={12} className="text-red-500" />
            <span>
              {character.currentHp}/{getCharacterMaxHp(character)} PV
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sword size={12} className="text-blue-500" />
            <span>
              {character.dnd ? `CA ${character.dnd.armorClass}` : `${character.currentMp}/${getCharacterMaxMp(character)} PM`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function AttributeBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-white/10 bg-black/30 p-1">
      <span className="text-[10px] font-bold text-text-muted">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function ThreeDetAttributeGrid({ character }: { character: Character }) {
  return (
    <div className="mb-4 grid grid-cols-5 gap-1">
      <AttributeBox label="P" value={character.strength} />
      <AttributeBox label="H" value={character.skill} />
      <AttributeBox label="R" value={character.resistance} />
      <AttributeBox label="A" value={character.armor} />
      <AttributeBox label="PdF" value={character.firepower} />
    </div>
  )
}

function DndAttributeGrid({ character }: { character: Character }) {
  if (!character.dnd) return null
  return (
    <div className="mb-4 grid grid-cols-3 gap-1">
      <AttributeBox label="STR" value={character.dnd.abilityScores.STR} />
      <AttributeBox label="DEX" value={character.dnd.abilityScores.DEX} />
      <AttributeBox label="CON" value={character.dnd.abilityScores.CON} />
      <AttributeBox label="INT" value={character.dnd.abilityScores.INT} />
      <AttributeBox label="WIS" value={character.dnd.abilityScores.WIS} />
      <AttributeBox label="CHA" value={character.dnd.abilityScores.CHA} />
    </div>
  )
}
