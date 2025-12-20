import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { Save, ArrowLeft, User, Shield, Zap, Target, Sword, Heart } from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { cn } from '@/lib/cn'
import { calcMaxHp, calcMaxMp, type CharacterType } from '@/domain/models'

const CHARACTER_TYPES: { value: CharacterType, label: string }[] = [
  { value: 'PLAYER', label: 'Jogador' },
  { value: 'NPC', label: 'NPC' },
  { value: 'ENEMY', label: 'Inimigo' },
  { value: 'BOSS', label: 'Chefe' },
  { value: 'COMPANION', label: 'Aliado' },
]

export function CharacterForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, createCharacter, updateCharacter } = useAppStore()!
  const isEditing = !!id
  const activeCampaign = state.campaigns.find(c => c.id === state.session.activeCampaignId)
  const [systemChoice, setSystemChoice] = useState<'3DT' | 'DND5E'>(() => (activeCampaign?.system?.toLowerCase().includes('5e') ? 'DND5E' : '3DT'))

  // Form State
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState<CharacterType>('NPC')
  const [image, setImage] = useState<string>('')
  
  // Attributes
  const [strength, setStrength] = useState(0)
  const [skill, setSkill] = useState(0)
  const [resistance, setResistance] = useState(0)
  const [armor, setArmor] = useState(0)
  const [firepower, setFirepower] = useState(0)
  const [advantages, setAdvantages] = useState<string[]>([])
  const [disadvantages, setDisadvantages] = useState<string[]>([])
  const [advInput, setAdvInput] = useState('')
  const [disadvInput, setDisadvInput] = useState('')

  const DND_CLASSES = ['Fighter','Wizard','Rogue','Cleric','Barbarian','Paladin','Ranger','Druid','Bard','Monk','Sorcerer','Warlock']
  const DND_RACES = ['Human','Elf','Dwarf','Halfling','Half-Orc','Tiefling','Gnome','Dragonborn']
  const DND_BACKGROUNDS = ['Acolyte','Criminal','Folk Hero','Noble','Sage','Soldier','Hermit','Outlander']
  const [dndLevel, setDndLevel] = useState(1)
  const [dndClass, setDndClass] = useState(DND_CLASSES[0])
  const [dndRace, setDndRace] = useState(DND_RACES[0])
  const [dndBackground, setDndBackground] = useState(DND_BACKGROUNDS[0])
  const [scores, setScores] = useState<Record<'STR'|'DEX'|'CON'|'INT'|'WIS'|'CHA', number>>({ STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 })

  // Derived Stats (Display Only)
  const maxHp = calcMaxHp(resistance) || 1
  const maxMp = calcMaxMp(resistance) || 1
  const pointCost = (v: number) => (v===8?0:v===9?1:v===10?2:v===11?3:v===12?4:v===13?5:v===14?7:9)
  const spent = Object.values(scores).reduce((a,b)=>a+pointCost(b),0)
  const remaining = 27 - spent
  const mod = (v: number) => Math.floor((v - 10) / 2)
  const dndProficiency = Math.min(6, 2 + Math.floor((Math.max(1,dndLevel) - 1) / 4))
  const hitDie = (cls: string) => cls==='Barbarian'?12:cls==='Fighter'||cls==='Paladin'||cls==='Ranger'?10:cls==='Sorcerer'||cls==='Wizard'?6:8
  const avgPerLevel = (die: number) => die===12?7:die===10?6:die===8?5:4
  const dndMaxHp = (() => {
    const die = hitDie(dndClass)
    const first = die + mod(scores.CON)
    const rest = Math.max(0, dndLevel - 1) * (avgPerLevel(die) + mod(scores.CON))
    return Math.max(1, first + rest)
  })()
  const dndArmorClass = 10 + mod(scores.DEX)

  useEffect(() => {
    if (id) {
      const char = state.characters.find(c => c.id === id)
      if (char) {
        setName(char.name)
        setRole(char.role)
        setType(char.type)
        setImage(char.imageUri || '')
        setStrength(char.strength)
        setSkill(char.skill)
        setResistance(char.resistance)
        setArmor(char.armor)
        setFirepower(char.firepower)
        setAdvantages(char.advantages || [])
        setDisadvantages(char.disadvantages || [])
        if ((char as any).dnd) {
          setSystemChoice('DND5E')
          const d = (char as any).dnd
          setDndLevel(d.level)
          setDndClass(d.class)
          setDndRace(d.race)
          setDndBackground(d.background)
          setScores(d.abilityScores)
        }
      }
    }
  }, [id, state.characters])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const charData = {
      name,
      role,
      type,
      imageUri: image || null,
      strength,
      skill,
      resistance,
      armor,
      firepower,
    }

    if (isEditing && id) {
      updateCharacter(id, charData)
    } else {
      if (systemChoice === 'DND5E') {
        createCharacter({
          ...charData,
          strength: 0,
          skill: 0,
          resistance: 1,
          armor: 0,
          firepower: 0,
          xp: 0,
          gold: 0,
          portraitUri: null,
          tags: [],
          currentHp: dndMaxHp,
          currentMp: 0,
          personality: '',
          speechStyle: '',
          mannerisms: [],
          goal: '',
          secrets: {},
          quickPhrases: [],
          advantages: [],
          disadvantages: [],
          equipment: [],
          powers: [],
          activeConditions: [],
          campaignId: state.session.activeCampaignId,
          isTemplate: false,
          dnd: {
            level: dndLevel,
            class: dndClass,
            race: dndRace,
            background: dndBackground,
            abilityScores: scores,
            proficiencyBonus: dndProficiency,
            armorClass: dndArmorClass,
            maxHp: dndMaxHp,
          },
        })
      } else {
        createCharacter({
          ...charData,
          xp: 0,
          gold: 0,
          portraitUri: null,
          tags: [],
          currentHp: calcMaxHp(resistance) || 1,
          currentMp: calcMaxMp(resistance) || 1,
          personality: '',
          speechStyle: '',
          mannerisms: [],
          goal: '',
          secrets: {},
          quickPhrases: [],
          advantages,
          disadvantages,
          equipment: [],
          powers: [],
          activeConditions: [],
          campaignId: state.session.activeCampaignId,
          isTemplate: false,
        })
      }
    }
    navigate('/characters')
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="container mx-auto max-w-4xl p-6">
        <button 
          onClick={() => navigate('/characters')}
          className="flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar para Lista
        </button>

        <h1 className="text-3xl font-rajdhani font-bold text-white mb-8">
          {isEditing ? 'Editar Personagem' : 'Novo Personagem'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase">Sistema</label>
              <select value={systemChoice} onChange={(e)=>setSystemChoice(e.target.value as any)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white">
                <option value="3DT">3D&T</option>
                <option value="DND5E">D&D 5e</option>
              </select>
            </div>
          </div>
          {/* Main Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Col: Image */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-text-muted uppercase tracking-wider">Avatar</label>
              <div className="aspect-[3/4] w-full rounded-xl overflow-hidden border border-white/10 bg-black/20 relative group">
                <ImageUpload 
                  currentImage={image} 
                  onImageSelected={setImage} 
                  className="h-full w-full"
                />
                {!image && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-text-muted gap-2">
                    <User size={48} className="opacity-50" />
                    <span className="text-xs">Upload Imagem</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Basic Data & Attributes */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Nome</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-purple outline-none transition-all"
                    placeholder="Ex: Cloud Strife"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Função / Classe</label>
                  <input 
                    type="text" 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-purple outline-none transition-all"
                    placeholder="Ex: Mercenário"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Tipo</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as CharacterType)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-purple outline-none transition-all appearance-none"
                  >
                    {CHARACTER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {systemChoice === '3DT' ? (
                <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                  <h3 className="text-lg font-rajdhani font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-neon-yellow" />
                    Atributos (3D&T)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <AttributeInput label="Força" value={strength} onChange={setStrength} icon={Sword} color="text-red-400" />
                    <AttributeInput label="Habilidade" value={skill} onChange={setSkill} icon={Target} color="text-yellow-400" />
                    <AttributeInput label="Resistência" value={resistance} onChange={setResistance} icon={Shield} color="text-green-400" />
                    <AttributeInput label="Armadura" value={armor} onChange={setArmor} icon={Shield} color="text-blue-400" />
                    <AttributeInput label="Poder de Fogo" value={firepower} onChange={setFirepower} icon={Zap} color="text-purple-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                      <div className="text-xs font-bold text-text-muted uppercase mb-2">Vantagens</div>
                      <div className="flex gap-2 mb-2">
                        <input value={advInput} onChange={(e)=>setAdvInput(e.target.value)} placeholder="Adicionar vantagem" className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={()=>{ const v = advInput.trim(); if (v) { setAdvantages(a=>[v, ...a]); setAdvInput('') } }} className="px-3 py-2 rounded bg-neon-green text-black font-bold">Adicionar</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {advantages.length === 0 ? (
                          <span className="text-xs text-text-muted">Nenhuma vantagem.</span>
                        ) : advantages.map((v,i)=>(
                          <span key={`${v}-${i}`} className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs text-white flex items-center gap-2">
                            {v}
                            <button type="button" onClick={()=> setAdvantages(a=> a.filter((_,idx)=> idx!==i))} className="text-white/60 hover:text-white">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                      <div className="text-xs font-bold text-text-muted uppercase mb-2">Desvantagens</div>
                      <div className="flex gap-2 mb-2">
                        <input value={disadvInput} onChange={(e)=>setDisadvInput(e.target.value)} placeholder="Adicionar desvantagem" className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={()=>{ const v = disadvInput.trim(); if (v) { setDisadvantages(a=>[v, ...a]); setDisadvInput('') } }} className="px-3 py-2 rounded bg-neon-pink text-white font-bold">Adicionar</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {disadvantages.length === 0 ? (
                          <span className="text-xs text-text-muted">Nenhuma desvantagem.</span>
                        ) : disadvantages.map((v,i)=>(
                          <span key={`${v}-${i}`} className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs text-white flex items-center gap-2">
                            {v}
                            <button type="button" onClick={()=> setDisadvantages(a=> a.filter((_,idx)=> idx!==i))} className="text-white/60 hover:text-white">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-4">
                    <div className="flex-1 bg-black/30 rounded-lg p-3 flex items-center justify-between border border-white/5">
                      <span className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                        <Heart size={14} className="text-red-500" /> Pontos de Vida
                      </span>
                      <span className="text-xl font-bold text-white">{maxHp || 1}</span>
                    </div>
                    <div className="flex-1 bg-black/30 rounded-lg p-3 flex items-center justify-between border border-white/5">
                      <span className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                        <Zap size={14} className="text-blue-500" /> Pontos de Magia
                      </span>
                      <span className="text-xl font-bold text-white">{maxMp || 1}</span>
                    </div>
                    <div className="flex-1 bg-black/30 rounded-lg p-3 flex items-center justify-between border border-white/5">
                      <span className="text-xs font-bold text-text-muted uppercase">Total de Pontos</span>
                      <span className="text-white font-bold">{strength + skill + resistance + armor + firepower}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                  <h3 className="text-lg font-rajdhani font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-neon-yellow" />
                    Atributos (D&D 5e – Point Buy)
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {(['STR','DEX','CON','INT','WIS','CHA'] as const).map(key => (
                      <div key={key} className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-[10px] text-text-muted font-bold">{key}</div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button type="button" onClick={()=> setScores(s => ({...s, [key]: Math.max(8, s[key]-1)}))} className="px-2 py-1 rounded bg-white/5 border border-white/10">-</button>
                          <div className="w-10 text-white font-bold">{scores[key]}</div>
                          <button type="button" onClick={()=> setScores(s => ({...s, [key]: Math.min(15, s[key]+1)}))} disabled={remaining <= pointCost(scores[key]+1)} className="px-2 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-50">+</button>
                        </div>
                        <div className="text-[10px] text-text-muted mt-1">mod {mod(scores[key])>=0?`+${mod(scores[key])}`:mod(scores[key])}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-text-muted">Pontos restantes: {Math.max(0, remaining)}</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Nível</label>
                      <input type="number" min={1} max={20} value={dndLevel} onChange={e=>setDndLevel(parseInt(e.target.value||'1',10)||1)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Classe</label>
                      <select value={dndClass} onChange={e=>setDndClass(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white">
                        {DND_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Raça</label>
                      <select value={dndRace} onChange={e=>setDndRace(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white">
                        {DND_RACES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Antecedente</label>
                      <select value={dndBackground} onChange={e=>setDndBackground(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white">
                        {DND_BACKGROUNDS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Bônus de Proficiência</span>
                      <span className="text-white font-bold">+{dndProficiency}</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Classe de Armadura</span>
                      <span className="text-white font-bold">{dndArmorClass}</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Pontos de Vida</span>
                      <span className="text-white font-bold">{dndMaxHp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              type="submit"
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-neon-green text-black font-bold hover:bg-neon-green/90 hover:shadow-[0_0_15px_rgba(0,255,157,0.4)] transition-all"
            >
              <Save size={20} />
              {isEditing ? 'Salvar Alterações' : 'Criar Personagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AttributeInput({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  color 
}: { 
  label: string, 
  value: number, 
  onChange: (v: number) => void,
  icon: React.ElementType,
  color: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={cn("text-[10px] font-bold uppercase flex items-center gap-1.5", color)}>
        <Icon size={12} />
        {label.slice(0, 3)}
      </label>
      <input 
        type="number" 
        min="0"
        max="10"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-3 text-center text-xl font-bold text-white focus:border-neon-purple outline-none transition-all"
      />
    </div>
  )
}
