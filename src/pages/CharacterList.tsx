import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { Plus, Search, Users, User, Skull, Crown, Sword, Heart } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Character, CharacterType } from '@/domain/models'

const TYPE_LABELS: Record<CharacterType, string> = {
  PLAYER: 'Jogador',
  NPC: 'NPC',
  ENEMY: 'Inimigo',
  BOSS: 'Chefe',
  COMPANION: 'Aliado'
}

const TYPE_ICONS: Record<CharacterType, React.ElementType> = {
  PLAYER: User,
  NPC: Users,
  ENEMY: Skull,
  BOSS: Crown,
  COMPANION: Heart
}

const TYPE_COLORS: Record<CharacterType, string> = {
  PLAYER: 'text-neon-blue',
  NPC: 'text-neon-purple',
  ENEMY: 'text-red-500',
  BOSS: 'text-yellow-500',
  COMPANION: 'text-neon-green'
}

export function CharacterList() {
  const { state, deleteCharacter } = useAppStore()!
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CharacterType | 'ALL'>('ALL')

  const filteredCharacters = useMemo(() => {
    return state.characters.filter(char => {
      const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase()) || 
                           char.role.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'ALL' || char.type === typeFilter
      return matchesSearch && matchesType
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.characters, search, typeFilter])

  return (
    <div className="h-full overflow-y-auto p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-rajdhani font-bold text-white mb-2">Bestiário & NPCs</h1>
          <p className="text-text-muted">Gerencie todos os personagens, inimigos e criaturas.</p>
        </div>
        
        <Link 
          to="/characters/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple text-white font-rajdhani font-bold hover:bg-neon-purple/80 hover:shadow-[0_0_15px_rgba(208,0,255,0.4)] transition-all"
        >
          <Plus size={20} />
          Novo Personagem
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou função..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-neon-purple outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <FilterButton 
            active={typeFilter === 'ALL'} 
            onClick={() => setTypeFilter('ALL')}
            label="Todos"
          />
          {(Object.keys(TYPE_LABELS) as CharacterType[]).map(type => (
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCharacters.map(char => (
          <CharacterCard key={char.id} character={char} onDelete={() => deleteCharacter(char.id)} />
        ))}
        
        {filteredCharacters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-muted border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum personagem encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou crie um novo personagem.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ElementType }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
        active 
          ? "bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_10px_rgba(208,0,255,0.2)]" 
          : "bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:text-white"
      )}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  )
}

function CharacterCard({ character, onDelete }: { character: Character, onDelete: () => void }) {
  const Icon = TYPE_ICONS[character.type]
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Tem certeza que deseja excluir ${character.name}?`)) {
      onDelete()
    }
  }

  return (
    <Link 
      to={`/characters/${character.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-sm transition-all hover:border-neon-cyan/50 hover:bg-surface/60 hover:-translate-y-1"
    >
      {/* Image / Avatar */}
      <div className="relative h-48 w-full overflow-hidden bg-black/40">
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
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
          <Icon size={12} className={TYPE_COLORS[character.type]} />
          {TYPE_LABELS[character.type]}
        </div>

        {/* Delete Button (Hover) */}
        <button 
          onClick={handleDelete}
          className="absolute top-3 right-3 p-2 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
          title="Excluir"
        >
          <Skull size={14} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col p-4 flex-1">
        <h3 className="font-rajdhani font-bold text-lg text-white mb-1 truncate">{character.name}</h3>
        <p className="text-xs text-neon-cyan mb-3 uppercase tracking-wider font-bold">{character.role || 'Sem função definida'}</p>
        
        {/* Attributes Mini-Grid */}
        <div className="grid grid-cols-5 gap-1 mb-4">
          <AttributeBox label="F" value={character.strength} />
          <AttributeBox label="H" value={character.skill} />
          <AttributeBox label="R" value={character.resistance} />
          <AttributeBox label="A" value={character.armor} />
          <AttributeBox label="PdF" value={character.firepower} />
        </div>

        {/* Stats */}
        <div className="mt-auto flex justify-between items-center text-xs font-bold text-text-muted bg-white/5 rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Heart size={12} className="text-red-500" />
            <span>{character.currentHp}/{Math.max(1, character.resistance * 5)} PV</span>
          </div>
          <div className="flex items-center gap-1">
            <Sword size={12} className="text-blue-500" />
            <span>{character.currentMp}/{Math.max(1, character.resistance * 5)} PM</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function AttributeBox({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center bg-black/30 rounded border border-white/5 p-1">
      <span className="text-[10px] text-text-muted font-bold">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}
