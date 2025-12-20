import { Users, MoreVertical } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const campaigns = [
  { 
    id: 1, 
    title: 'THE SHADOWED REALM', 
    description: 'A gothic adventure across the Shadowed health.',
    progress: 45, 
    players: 2, 
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80'
  },
  { 
    id: 2, 
    title: 'RISE OF THE TIAMAT', 
    description: 'Rise of the Tiamat comets the five dragon.',
    progress: 75, 
    players: 6, 
    image: 'https://images.unsplash.com/photo-1615672963428-2a81878d655f?w=800&q=80'
  },
  { 
    id: 3, 
    title: 'CURSE OF STRAHD', 
    description: 'Curse of Strahd is a session in vampire.',
    progress: 20, 
    players: 2, 
    image: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=800&q=80'
  },
  { 
    id: 4, 
    title: 'LOST MINE OF PHANDELVER', 
    description: 'Lost Mine of Phandelver has even mountains.',
    progress: 90, 
    players: 4, 
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'
  }
];

export function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL')
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 35, secs: 22 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Next Session Hero */}
      <section className="relative w-full h-[400px] rounded-3xl overflow-hidden group shadow-neon-purple border border-secondary/20">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2574&auto=format&fit=crop" 
            alt="Next Session Background" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-secondary/10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
          <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-6 tracking-widest uppercase drop-shadow-lg">
            NEXT SESSION
          </h3>
          
          <div className="flex items-center gap-4 md:gap-8 mb-8">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HOURS', value: timeLeft.hours },
              { label: 'MINS', value: timeLeft.mins },
              { label: 'SECS', value: timeLeft.secs }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-secondary to-purple-400 drop-shadow-[0_0_15px_rgba(208,0,255,0.5)] tabular-nums">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="text-xs md:text-sm font-medium text-text-secondary tracking-widest mt-2">{item.label}</span>
                {i < 3 && <div className="hidden md:block absolute ml-32 -mt-12 text-4xl text-secondary/30">:</div>}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-text-secondary font-medium tracking-wide">
              Session Title: <span className="text-white">The Siege of Blackwood</span> | Date: <span className="text-white">Saturday, 7:00 PM</span>
            </p>
            <button onClick={() => navigate('/session')} aria-label="Preparar sessão" className="btn-secondary px-12 py-3 mt-2 shadow-[0_0_20px_rgba(208,0,255,0.3)] hover:shadow-[0_0_30px_rgba(208,0,255,0.5)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-neon-purple">
              PREPARE NOW
            </button>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button onClick={() => setTab('ALL')} aria-pressed={tab === 'ALL'} className={[
              'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              tab === 'ALL' ? 'bg-white/10 text-white border-white/20' : 'text-text-muted hover:text-white'
            ].join(' ')}>All Campaigns</button>
            <button onClick={() => setTab('ACTIVE')} aria-pressed={tab === 'ACTIVE'} className={[
              'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              tab === 'ACTIVE' ? 'bg-white/10 text-white border-white/20' : 'text-text-muted hover:text-white'
            ].join(' ')}>Active</button>
            <button onClick={() => setTab('ARCHIVED')} aria-pressed={tab === 'ARCHIVED'} className={[
              'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              tab === 'ARCHIVED' ? 'bg-white/10 text-white border-white/20' : 'text-text-muted hover:text-white'
            ].join(' ')}>Archived</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {campaigns.filter(c => {
            if (tab === 'ACTIVE') return c.progress > 0 && c.progress < 100
            if (tab === 'ARCHIVED') return c.progress >= 100
            return true
          }).map((camp) => (
            <Link to="/campaigns" key={camp.id} className="group relative bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-neon-green/20">
              
              {/* Image Area */}
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={camp.image} 
                  alt={camp.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-90" />
                
                {/* Overlay Icons */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button aria-label="Mais opções" onClick={(e) => { e.preventDefault(); navigate('/campaigns') }} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:text-primary transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40">
                     <MoreVertical size={16} />
                   </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 relative">
                <h4 className="font-display font-bold text-lg text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                  {camp.title}
                </h4>
                <p className="text-sm text-text-muted mb-6 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                {/* Footer Info */}
                <div className="flex items-end justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                      <span>Progress: {camp.progress}%</span>
                    </div>
                    {/* Progress Bar with Glow */}
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary shadow-[0_0_10px_#00ff9d]"
                        style={{ width: `${camp.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-text-secondary bg-white/5 px-2 py-1 rounded-md">
                    <Users size={12} />
                    <span className="text-xs font-bold">{camp.players}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* New Campaign Card */}
          <Link to="/campaigns/new" className="h-full min-h-[320px] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-text-muted hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="w-16 h-16 rounded-full bg-surface-highlight group-hover:bg-primary/20 flex items-center justify-center transition-colors shadow-lg">
              <span className="text-3xl font-light text-text-secondary group-hover:text-primary">+</span>
            </div>
            <span className="font-medium tracking-wide">Create New Campaign</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
