import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Map, Play, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { cn } from '@/lib/cn'
import type { Arc, Scene } from '@/domain/models'

export function CampaignDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, deleteCampaign, createArc, updateArc, deleteArc, createScene } = useAppStore()!
  
  const campaign = state.campaigns.find(c => c.id === id)
  const arcs = state.arcs.filter(a => a.campaignId === id).sort((a, b) => a.orderIndex - b.orderIndex)
  
  const [expandedArcs, setExpandedArcs] = useState<Record<string, boolean>>({})
  
  if (!campaign) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-text-muted">
        <h2 className="text-xl">Campaign not found</h2>
        <Link to="/campaigns" className="text-neon-purple hover:underline">Back to Campaigns</Link>
      </div>
    )
  }

  const handleDeleteCampaign = () => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaign(campaign.id)
      navigate('/campaigns')
    }
  }

  const handleCreateArc = () => {
    const name = prompt('Enter Arc Name:')
    if (name) {
      const arc = createArc(campaign.id, name, '')
      setExpandedArcs(prev => ({ ...prev, [arc.id]: true }))
    }
  }

  const handleCreateScene = (arcId: string) => {
    const name = prompt('Enter Scene Name:')
    if (name) {
      const isDnd = campaign.system?.toLowerCase().includes('5e')
      const data = isDnd
        ? {
            description: 'Gancho inicial com pista clara e NPC relevante.',
            objective: 'Explorar a área, obter pistas e decidir próximo passo.',
            mood: 'mysterious' as const,
            opening: 'Um mensageiro exausto chega com um mapa marcado e um pedido urgente.'
          }
        : {
            description: 'Ação direta com foco em desafio e narrativa leve.',
            objective: 'Superar o obstáculo com estilo e improviso.',
            mood: 'epic' as const,
            opening: 'Explosões ecoam à distância; é hora de agir sem hesitar.'
          }
      createScene(campaign.id, arcId, {
        name,
        description: data.description,
        objective: data.objective,
        mood: data.mood,
        opening: data.opening,
      })
    }
  }

  const toggleArc = (arcId: string) => {
    setExpandedArcs(prev => ({ ...prev, [arcId]: !prev[arcId] }))
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* Hero Header */}
      <div className="relative h-64 w-full overflow-hidden">
        {campaign.coverDataUrl ? (
          <img 
            src={campaign.coverDataUrl} 
            alt={campaign.title} 
            className="h-full w-full object-cover opacity-60"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-900 to-black opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="container mx-auto max-w-4xl flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display font-bold text-white mb-2 text-shadow-neon">{campaign.title}</h1>
              <p className="text-text-muted max-w-2xl">{campaign.description}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                title="Edit Campaign"
              >
                <Edit2 size={20} />
              </button>
              <button 
                onClick={handleDeleteCampaign}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                title="Delete Campaign"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-rajdhani font-semibold text-neon-blue">Story Arcs</h2>
          <button 
            onClick={handleCreateArc}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/50 hover:bg-neon-purple/30 transition-all"
          >
            <Plus size={18} />
            New Arc
          </button>
        </div>

        <div className="space-y-4">
          {arcs.map(arc => (
            <ArcItem 
              key={arc.id} 
              arc={arc} 
              isExpanded={!!expandedArcs[arc.id]} 
              onToggle={() => toggleArc(arc.id)}
              onAddScene={() => handleCreateScene(arc.id)}
              onDelete={() => deleteArc(arc.id)}
              onRename={(name) => updateArc(arc.id, { name })}
            />
          ))}
          
          {arcs.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-text-muted mb-4">No arcs created yet.</p>
              <button 
                onClick={handleCreateArc}
                className="text-neon-blue hover:underline"
              >
                Create your first story arc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ArcItem({ 
  arc, 
  isExpanded, 
  onToggle, 
  onAddScene, 
  onDelete,
  onRename
}: { 
  arc: Arc
  isExpanded: boolean
  onToggle: () => void
  onAddScene: () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const { state } = useAppStore()!
  const scenes = state.scenes.filter(s => s.arcId === arc.id).sort((a, b) => a.orderIndex - b.orderIndex)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(arc.name)

  const handleSave = () => {
    if (name.trim()) {
      onRename(name)
      setIsEditing(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface overflow-hidden transition-all hover:border-white/20">
      <div className="flex items-center p-4 gap-4 bg-white/5">
        <button onClick={onToggle} className="text-text-muted hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        <div className="flex-1">
          {isEditing ? (
            <input 
              autoFocus
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="bg-background px-2 py-1 rounded text-white border border-neon-blue w-full max-w-md outline-none"
            />
          ) : (
            <h3 
              className="font-bold text-lg text-white cursor-pointer hover:text-neon-blue transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {arc.name}
            </h3>
          )}
          <span className="text-xs text-text-muted uppercase tracking-wider">{scenes.length} Scenes</span>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-text-muted hover:text-white">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-text-muted hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-black/20 space-y-2 border-t border-white/5">
          {scenes.map(scene => (
            <SceneItem key={scene.id} scene={scene} />
          ))}
          
          <button 
            onClick={onAddScene}
            className="w-full py-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <Plus size={16} />
            Add Scene
          </button>
        </div>
      )}
    </div>
  )
}

function SceneItem({ scene }: { scene: Scene }) {
  const { deleteScene, updateScene } = useAppStore()!
  const [editingMedia, setEditingMedia] = useState(false)
  const [bg, setBg] = useState<string>(scene.backgroundImageDataUrl || '')
  const [mapImg, setMapImg] = useState<string>(scene.mapImageDataUrl || '')
  
  return (
    <div className="group p-3 rounded-lg bg-background hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-surface-highlight flex items-center justify-center text-text-muted">
          <Map size={16} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{scene.name}</h4>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold",
              {
                'bg-blue-500/20 text-blue-400': scene.mood === 'calm',
                'bg-red-500/20 text-red-400': scene.mood === 'tense',
                'bg-purple-500/20 text-purple-400': scene.mood === 'mysterious',
                'bg-yellow-500/20 text-yellow-400': scene.mood === 'epic',
                'bg-gray-500/20 text-gray-400': scene.mood === 'neutral',
              }
            )}>
              {scene.mood}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate max-w-md">{scene.description || 'No description'}</p>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 text-text-muted hover:text-neon-green" title="Play Scene">
            <Play size={16} />
          </button>
          <button onClick={() => setEditingMedia(v => !v)} className="p-2 text-text-muted hover:text-neon-purple" title="Editar Mídia">
            <ImageIcon size={16} />
          </button>
          <button onClick={() => deleteScene(scene.id)} className="p-2 text-text-muted hover:text-red-500" title="Delete Scene">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {editingMedia && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <ImageUpload 
              label="Fundo da Cena" 
              currentImage={bg}
              onImageSelected={(val: string) => { setBg(val); updateScene(scene.id, { backgroundImageDataUrl: val || null }) }}
              config={{ compressionQuality: 0.7, maxSizeInBytes: 3 * 1024 * 1024, maxWidth: 1920, maxHeight: 1080 }}
            />
          </div>
          <div className="space-y-2">
            <ImageUpload 
              label="Mapa da Cena" 
              currentImage={mapImg}
              onImageSelected={(val: string) => { setMapImg(val); updateScene(scene.id, { mapImageDataUrl: val || null }) }}
              config={{ compressionQuality: 0.7, maxSizeInBytes: 3 * 1024 * 1024, maxWidth: 2048, maxHeight: 2048 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
