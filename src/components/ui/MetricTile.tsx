import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'secondary',
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  tone?: 'secondary' | 'primary' | 'success'
  className?: string
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary/20 bg-primary/10 text-primary'
      : tone === 'success'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
        : 'border-secondary/20 bg-secondary/10 text-secondary'

  return (
    <article className={cn('metric-tile', className)}>
      <div className="flex items-center justify-between gap-4">
        <span className="eyebrow !tracking-[0.22em]">{label}</span>
        <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border', toneClass)}>
          <Icon size={18} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      {detail ? <p className="mt-2 text-sm text-text-muted">{detail}</p> : null}
    </article>
  )
}
