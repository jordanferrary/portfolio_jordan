import { useState } from 'react'
import { assetPath } from '../../lib/assets'
import { Grid2X2, House, Mail, Pause, Play, UserRound } from 'lucide-react'

interface SidebarProps {
  activeSection: string
}

const navItems = [
  { id: 'inicio', label: 'Início', icon: House },
  { id: 'portfolio', label: 'Portfólio', icon: Grid2X2 },
  { id: 'sobre', label: 'Sobre', icon: UserRound },
  { id: 'contato', label: 'Contato', icon: Mail },
]

export function Sidebar({ activeSection }: SidebarProps) {
  const [isPlaying, setIsPlaying] = useState(true)

  return (
    <aside data-slot="sidebar" className="sidebar" aria-label="Navegação principal">
      <a className="brand-mark" href="#/inicio" aria-label="Jordan Ferrary — início">
        <span>JF</span>
      </a>
      <nav className="side-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#/${id}`}
            className="side-nav-link"
            data-active={activeSection === id ? '' : undefined}
            aria-current={activeSection === id ? 'location' : undefined}
          >
            <span className="side-icon"><Icon aria-hidden="true" /></span>
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="music-card">
        <img src={assetPath('album-cover.webp')} alt="Capa abstrata da faixa Midnight" />
        <div className="music-copy">
          <strong>Midnight</strong>
          <span>Luna Studio</span>
          <span className="music-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
        </div>
        <button
          type="button"
          className="music-toggle"
          aria-label={isPlaying ? 'Pausar animação musical decorativa' : 'Reproduzir animação musical decorativa'}
          aria-pressed={isPlaying}
          onClick={() => setIsPlaying((playing) => !playing)}
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
      </div>
    </aside>
  )
}
