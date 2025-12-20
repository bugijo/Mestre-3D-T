import { NavLink, useNavigate } from 'react-router-dom'
import { Swords, Map, BookOpenCheck, Users, Play, Compass, Menu } from 'lucide-react'
import { useState } from 'react'

export function NavBar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-black/40 backdrop-blur border-b border-white/10" role="navigation" aria-label="Principal">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <button onClick={() => navigate('/')} aria-label="Ir para Dashboard" className="flex items-center gap-2 text-white hover:text-neon-purple transition-colors focus:outline-none focus:ring-2 focus:ring-neon-purple rounded">
          <Compass size={18} />
          <span className="font-rajdhani font-bold">Mestre 3D&T</span>
        </button>

        <button
          className="ml-auto md:hidden p-2 text-white/80 hover:text-white"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Menu size={18} />
        </button>

        <nav className={[
          'md:flex md:items-center md:gap-2 md:flex-1',
          open ? 'absolute top-14 left-0 right-0 bg-black/80 backdrop-blur p-3 border-t border-white/10 flex flex-col gap-2 md:relative md:p-0 md:bg-transparent' : 'hidden md:flex'
        ].join(' ')}>
          <NavItem to="/" label="Dashboard" icon={<Map size={14} />} />
          <NavItem to="/campaigns" label="Campanhas" icon={<BookOpenCheck size={14} />} />
          <NavItem to="/characters" label="Bestiário" icon={<Users size={14} />} />
          <NavItem to="/catalog" label="Catálogo" icon={<BookOpenCheck size={14} />} />
          <NavItem to="/session" label="Jogar" icon={<Swords size={14} />} highlight />
          <NavItem to="/playground" label="Dev" icon={<Play size={14} />} />
        </nav>
      </div>
    </header>
  )
}

function NavItem({ to, label, icon, highlight }: { to: string; label: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-1.5 rounded-lg text-sm font-rajdhani flex items-center gap-2 transition-all border',
          isActive ? 'text-white border-neon-purple bg-neon-purple/20 shadow-[0_0_10px_rgba(208,0,255,0.2)]' : 'text-text-muted hover:text-white hover:bg-white/10 border-white/10',
          highlight ? 'font-bold' : ''
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
