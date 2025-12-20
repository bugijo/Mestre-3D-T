import { Link } from 'react-router-dom'
import type { Campaign } from '@/domain/models'
import { cn } from '@/lib/cn'

type CampaignCardProps = {
  campaign: Campaign
  className?: string
}

export function CampaignCard({ campaign, className }: CampaignCardProps) {
  return (
    <Link 
      to={`/campaigns/${campaign.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-sm transition-all hover:border-neon-purple/50 hover:bg-surface/60",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-black/50">
        {campaign.coverDataUrl ? (
          <img 
            src={campaign.coverDataUrl} 
            alt={campaign.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-black">
            <span className="text-4xl font-rajdhani text-white/10 group-hover:text-neon-purple/50 transition-colors">3D&T</span>
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-rajdhani text-xl font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
          {campaign.title}
        </h3>
        
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
            {campaign.system}
          </span>
          <span>•</span>
          <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
        </div>

        {campaign.description && (
          <p className="mt-3 text-sm text-gray-400 line-clamp-2">
            {campaign.description}
          </p>
        )}
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-neon-purple/20 pointer-events-none transition-colors" />
    </Link>
  )
}
