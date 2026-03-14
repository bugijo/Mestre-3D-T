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
        'group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,27,45,0.72)] shadow-soft-md backdrop-blur-md transition-all hover:-translate-y-1 hover:border-secondary/35 hover:shadow-soft-lg',
        className,
      )}
    >
      <div className="relative h-52 w-full overflow-hidden bg-black/50">
        {campaign.coverDataUrl ? (
          <img
            src={campaign.coverDataUrl}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/20 via-accent/10 to-black">
            <span className="font-display text-4xl text-white/10 transition-colors group-hover:text-secondary/60">3D&T</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-xl font-display font-bold text-white transition-colors group-hover:text-accent">
          {campaign.title}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5">
            {campaign.system}
          </span>
          <span>•</span>
          <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
        </div>

        {campaign.description ? (
          <p className="mt-3 line-clamp-2 text-sm text-text-muted">
            {campaign.description}
          </p>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-transparent transition-colors group-hover:border-secondary/20" />
    </Link>
  )
}
