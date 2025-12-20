import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/AppStore'
import { CampaignCard } from '@/components/campaign/CampaignCard'

export function CampaignList() {
  const { state } = useAppStore()
  const campaigns = state.campaigns.sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-rajdhani font-bold text-white">Minhas Campanhas</h1>
          <p className="text-gray-400">Gerencie suas aventuras e mundos</p>
        </div>
        
        <Link 
          to="/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-neon-purple/20 px-4 py-2 font-rajdhani font-semibold text-neon-purple border border-neon-purple/50 hover:bg-neon-purple/30 transition-all hover:shadow-[0_0_15px_rgba(208,0,255,0.3)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Campanha
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-surface/20 py-20 text-center">
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12 2l9 4.9V17L12 22l-9-4.9V6.9L12 2z"></path></svg>
          </div>
          <h3 className="text-xl font-rajdhani font-bold text-white">Nenhuma campanha encontrada</h3>
          <p className="mt-2 max-w-sm text-gray-400">Comece sua jornada criando uma nova campanha para suas aventuras de RPG.</p>
          <Link 
            to="/campaigns/new"
            className="mt-6 text-neon-cyan hover:underline underline-offset-4"
          >
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
