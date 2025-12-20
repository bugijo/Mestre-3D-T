import { useMemo, useState } from 'react'
import { catalog, filterCharactersBySystem, filterStoriesBySystem, powerValue } from '@/data/catalog'
import { useAppStore } from '@/store/AppStore'
import { Search, Users, BookOpenCheck, Swords, Plus, Filter, ArrowDownUp } from 'lucide-react'
import type { Character, Mood } from '@/domain/models'
import { cn } from '@/lib/cn'

type SystemKey = 'ALL' | '3DT' | 'DND5E'
type TypeKey = 'ALL' | 'HERO' | 'NPC' | 'VILLAIN' | 'STORY'
type SortKey = 'RECENT' | 'POWER'

export function Catalog() {
  const { state, createCharacter, createCampaign, createArc, createScene } = useAppStore()!
  const [system, setSystem] = useState<SystemKey>('ALL')
  const [type, setType] = useState<TypeKey>('ALL')
  const [sort, setSort] = useState<SortKey>('POWER')
  const [query, setQuery] = useState('')

  const filteredChars = useMemo(() => {
    const pool = [
      ...(type === 'ALL' || type === 'HERO' ? catalog.heroes : []),
      ...(type === 'ALL' || type === 'NPC' ? catalog.npcs : []),
      ...(type === 'ALL' || type === 'VILLAIN' ? catalog.villains : []),
    ]
    const bySystem = filterCharactersBySystem(pool, system === 'ALL' ? 'ALL' : (system as any))
    const byQuery = bySystem.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase()))
    const sorted = byQuery.slice().sort((a, b) => {
      if (sort === 'RECENT') return b.updatedAt - a.updatedAt
      const pa = powerValue(a, system === 'ALL' ? '3DT' : (system as any))
      const pb = powerValue(b, system === 'ALL' ? '3DT' : (system as any))
      return pb - pa
    })
    return sorted
  }, [system, type, sort, query])

  const filteredStories = useMemo(() => {
    const base = catalog.stories
    const bySystem = filterStoriesBySystem(base, system === 'ALL' ? 'ALL' : (system as any))
    const byQuery = bySystem.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.summary.toLowerCase().includes(query.toLowerCase()))
    const sorted = byQuery.slice().sort((a, b) => b.variants[0].difficulty - a.variants[0].difficulty)
    return sorted
  }, [system, query])

  const targetCampaignId = useMemo(() => {
    if (state.session.activeCampaignId) return state.session.activeCampaignId
    if (state.campaigns[0]?.id) return state.campaigns[0].id
    const sysName = system === 'DND5E' ? 'D&D 5e' : '3D&T'
    const c = createCampaign({ title: 'Catálogo', system: sysName, description: 'Conteúdo importado do catálogo' })
    return c.id
  }, [state.session.activeCampaignId, state.campaigns, system])

  const importCharacter = (c: Character) => {
    const base = {
      name: c.name,
      role: c.role,
      type: c.type,
      imageUri: c.imageUri,
      strength: c.strength,
      skill: c.skill,
      resistance: c.resistance,
      armor: c.armor,
      firepower: c.firepower,
      xp: 0,
      gold: 0,
      portraitUri: null,
      tags: [],
      currentHp: Math.max(1, c.resistance * 5),
      currentMp: Math.max(1, c.resistance * 5),
      personality: c.personality,
      speechStyle: c.speechStyle,
      mannerisms: c.mannerisms,
      goal: c.goal,
      secrets: c.secrets,
      quickPhrases: c.quickPhrases,
      advantages: c.advantages,
      disadvantages: c.disadvantages,
      equipment: c.equipment,
      powers: c.powers,
      activeConditions: [],
      campaignId: targetCampaignId,
      isTemplate: false,
    }
    if (system === 'DND5E' && (c as any).dnd) {
      const d = (c as any).dnd
      createCharacter({ ...base, currentHp: d.maxHp, dnd: d })
    } else {
      createCharacter(base)
    }
  }

  const importStory = (name: string, scenes: Array<{ name: string; description: string; objective: string; mood: Mood; opening: string }>) => {
    const arc = createArc(targetCampaignId, name, '')
    scenes.forEach((s) => {
      createScene(targetCampaignId, arc.id, s)
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-rajdhani font-bold text-white mb-2">Catálogo</h1>
          <p className="text-text-muted">Opções prontas para 3D&T e D&D 5e.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-neon-purple outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-muted" />
          <select value={system} onChange={(e) => setSystem(e.target.value as SystemKey)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-3 text-white">
            <option value="ALL">Todos sistemas</option>
            <option value="3DT">3D&T</option>
            <option value="DND5E">D&D 5e</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownUp size={16} className="text-text-muted" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-3 text-white">
            <option value="POWER">Nível/Poder</option>
            <option value="RECENT">Mais recente</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <TabButton active={type === 'ALL'} onClick={() => setType('ALL')} label="Tudo" icon={<Users size={14} />} />
        <TabButton active={type === 'HERO'} onClick={() => setType('HERO')} label={`Heróis (${catalog.heroes.length})`} icon={<Swords size={14} />} />
        <TabButton active={type === 'NPC'} onClick={() => setType('NPC')} label={`NPCs (${catalog.npcs.length})`} icon={<Users size={14} />} />
        <TabButton active={type === 'VILLAIN'} onClick={() => setType('VILLAIN')} label={`Vilões (${catalog.villains.length})`} icon={<Swords size={14} />} />
        <TabButton active={type === 'STORY'} onClick={() => setType('STORY')} label={`Aventuras (${catalog.stories.length})`} icon={<BookOpenCheck size={14} />} />
      </div>

      {type === 'STORY' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStories.map((s) => {
            const variant = system === 'DND5E' ? s.variants.find((v) => v.system === 'DND5E') : system === '3DT' ? s.variants.find((v) => v.system === '3DT') : s.variants[0]
            const scenes = variant?.scenes ?? []
            return (
              <div key={s.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-sm">
                <div className="p-4">
                  <h3 className="font-rajdhani font-bold text-lg text-white mb-1 truncate">{s.name}</h3>
                  <p className="text-xs text-neon-cyan uppercase tracking-wider font-bold mb-2">Dificuldade {variant?.difficulty ?? s.variants[0].difficulty}</p>
                  <p className="text-sm text-text-muted mb-3">{s.summary}</p>
                  <div className="space-y-1 mb-3">
                    {scenes.map((sc) => (
                      <div key={sc.name} className="text-xs text-text-muted">• {sc.name}</div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => importStory(s.name, scenes)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-green text-black font-bold">
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChars.map((c) => (
            <div key={c.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-sm">
              <div className="h-40 w-full bg-black/30" />
              <div className="p-4">
                <h3 className="font-rajdhani font-bold text-lg text-white mb-1 truncate">{c.name}</h3>
                <p className="text-xs text-neon-cyan uppercase tracking-wider font-bold mb-2">{c.role}</p>
                <div className="grid grid-cols-5 gap-1 mb-3">
                  <Attr label="F" value={c.strength} />
                  <Attr label="H" value={c.skill} />
                  <Attr label="R" value={c.resistance} />
                  <Attr label="A" value={c.armor} />
                  <Attr label="PdF" value={c.firepower} />
                </div>
                {system === 'DND5E' && (c as any).dnd ? (
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-white">
                    <div className="bg-white/5 rounded p-2">Nível {(c as any).dnd.level}</div>
                    <div className="bg-white/5 rounded p-2">CA {(c as any).dnd.armorClass}</div>
                    <div className="bg-white/5 rounded p-2">PV {(c as any).dnd.maxHp}</div>
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <button onClick={() => importCharacter(c as any)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-green text-black font-bold">
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border',
        active ? 'bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_10px_rgba(208,0,255,0.2)]' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:text-white'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Attr({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-black/30 rounded border border-white/5 p-1">
      <span className="text-[10px] text-text-muted font-bold">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

