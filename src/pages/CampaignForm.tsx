import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { ImageUpload } from '@/components/ui/ImageUpload'

export function CampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { state, createCampaign, updateCampaign } = useAppStore()!
  
  const [title, setTitle] = useState('')
  const [system, setSystem] = useState('3D&T Alpha')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<string>('')
  
  const isEditing = !!id

  useEffect(() => {
    if (id) {
      const campaign = state.campaigns.find(c => c.id === id)
      if (campaign) {
        setTitle(campaign.title)
        setSystem(campaign.system)
        setDescription(campaign.description)
        setCover(campaign.coverDataUrl || '')
      }
    }
  }, [id, state.campaigns])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (isEditing && id) {
      updateCampaign(id, {
        title,
        system,
        description,
        coverDataUrl: cover || null,
      })
    } else {
      createCampaign({
        title,
        system,
        description,
        coverDataUrl: cover,
      })
    }
    
    navigate(isEditing ? `/campaigns/${id}` : '/campaigns')
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-surface/50 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-rajdhani font-bold text-white">{isEditing ? 'Editar Campanha' : 'Nova Campanha'}</h1>
          <p className="text-gray-400">{isEditing ? 'Atualize os detalhes da sua aventura' : 'Prepare o cenário para sua próxima aventura'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neon-cyan font-rajdhani">Título da Campanha</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: A Lenda de Arton"
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all placeholder:text-gray-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neon-cyan font-rajdhani">Sistema de Regras</label>
              <select 
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-neon-purple outline-none appearance-none"
              >
                <option value="3D&T Alpha">3D&T Alpha</option>
                <option value="3D&T Victory">3D&T Victory</option>
                <option value="Tormenta20">Tormenta20</option>
                <option value="D&D 5e">D&D 5e</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neon-cyan font-rajdhani">Descrição / Sinopse</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o enredo principal..."
              rows={4}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-neon-purple outline-none transition-all placeholder:text-gray-600 resize-none"
            />
          </div>

          <div className="space-y-2">
            <ImageUpload 
              label="Capa da Campanha"
              currentImage={cover}
              onImageSelected={setCover}
              config={{ compressionQuality: 0.7, maxSizeInBytes: 3 * 1024 * 1024 }}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/campaigns')}
              className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-rajdhani font-bold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 rounded-lg bg-neon-purple text-white font-rajdhani font-bold hover:bg-neon-purple/80 hover:shadow-[0_0_20px_rgba(208,0,255,0.4)] transition-all"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
