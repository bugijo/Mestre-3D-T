import { Link } from 'react-router-dom'
import { FolderKanban, PlusCircle, Sparkles, Users } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { CampaignCard } from '@/components/campaign/CampaignCard'
import { PageHero } from '@/components/ui/PageHero'
import { MetricTile } from '@/components/ui/MetricTile'

export function CampaignList() {
  const { state } = useAppStore()
  const campaigns = [...state.campaigns].sort((a, b) => b.updatedAt - a.updatedAt)
  const totalScenes = state.scenes.length
  const totalCharacters = state.characters.length

  return (
    <div className="space-y-8 pb-10">
      <PageHero
        eyebrow="Orquestracao narrativa"
        title={
          <>
            Biblioteca de <span className="text-gradient-secondary">campanhas</span>
          </>
        }
        description="Crie, acompanhe e evolua suas frentes de jogo com uma grade visual consistente e foco em leitura rapida."
        actions={
          <Link to="/campaigns/new" className="btn-primary">
            <PlusCircle size={18} />
            Nova Campanha
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile icon={FolderKanban} label="Campanhas" value={`${campaigns.length}`} detail="Arcos e jornadas em andamento" tone="secondary" />
        <MetricTile icon={Sparkles} label="Cenas" value={`${totalScenes}`} detail="Contextos narrativos cadastrados" tone="primary" />
        <MetricTile icon={Users} label="Personagens" value={`${totalCharacters}`} detail="Entidades ativas na mesa" tone="success" />
      </section>

      {campaigns.length === 0 ? (
        <div className="app-panel-muted flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <FolderKanban size={48} className="text-text-muted" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">Nenhuma campanha encontrada</h3>
          <p className="mt-2 max-w-sm text-text-muted">Comece sua jornada criando uma nova campanha para suas aventuras de RPG.</p>
          <Link to="/campaigns/new" className="btn-secondary mt-6">
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
