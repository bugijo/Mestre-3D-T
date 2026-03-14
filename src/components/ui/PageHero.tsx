import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('page-hero relative overflow-hidden px-6 py-7 md:px-8 md:py-9', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_24%)]" />
      <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
        <div className="space-y-4">
          <div className="eyebrow">{eyebrow}</div>
          <div className="max-w-4xl space-y-3">
            <h1>{title}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="xl:justify-self-end">{aside}</div> : null}
      </div>
    </section>
  )
}
