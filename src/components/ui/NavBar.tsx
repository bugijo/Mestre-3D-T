import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Swords, Map, BookOpenCheck, Users, Play, Compass, Menu, UserRound, ScrollText, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

export function NavBar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8"
      role="navigation"
      aria-label="Principal"
    >
      <div className="mx-auto flex w-full max-w-[88rem] flex-wrap items-center gap-4 rounded-[1.75rem] border border-white/10 bg-surface/70 px-4 py-3 shadow-soft-md backdrop-blur-xl">
        <button
          onClick={() => navigate('/')}
          aria-label="Ir para Dashboard"
          className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white transition-all hover:border-secondary/30 hover:bg-white/[0.08]"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/15 text-secondary shadow-soft-md">
            <Compass size={18} className="transition-transform duration-300 group-hover:rotate-12" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="font-display text-base font-bold tracking-wide">Mestre 3D&T</span>
            <span className="text-[0.68rem] uppercase tracking-[0.28em] text-text-muted">Mesa Tática</span>
          </span>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.2em] text-text-muted lg:flex">
          <Sparkles size={14} className="text-primary" />
          Central de campanha, sessão e governança
        </div>

        <button
          className="ml-auto rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu size={18} />
        </button>

        <nav
          className={[
            'w-full md:ml-auto md:flex md:w-auto md:flex-1 md:items-center md:justify-end md:gap-2',
            open
              ? 'flex flex-col gap-2 border-t border-white/10 pt-3 md:relative md:border-0 md:pt-0'
              : 'hidden md:flex',
          ].join(' ')}
        >
          <NavItem to="/" label="Dashboard" icon={<Map size={14} />} />
          <NavItem to="/campaigns" label="Campanhas" icon={<BookOpenCheck size={14} />} />
          <NavItem to="/characters" label="Bestiario" icon={<Users size={14} />} />
          <NavItem to="/catalog" label="Catalogo" icon={<BookOpenCheck size={14} />} />
          <NavItem to="/session" label="Jogar" icon={<Swords size={14} />} highlight />
          <NavItem to="/reports" label="Relatorios" icon={<ScrollText size={14} />} />
          <NavItem to="/admin" label="Admin" icon={<ShieldCheck size={14} />} />
          <NavItem to="/player" label="Jogador" icon={<UserRound size={14} />} />
          <NavItem to="/playground" label="Dev" icon={<Play size={14} />} />
        </nav>
      </div>
    </header>
  )
}

function NavItem({
  to,
  label,
  icon,
  highlight,
}: {
  to: string
  label: string
  icon?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all',
        isActive
          ? 'border-secondary/35 bg-secondary/15 text-white shadow-soft-md'
          : 'border-white/10 bg-white/[0.03] text-text-muted hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
        highlight && 'font-semibold',
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
