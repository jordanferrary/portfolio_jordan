import type { ComponentProps, ReactNode } from 'react'
import { Mail, Sparkles, UserRound } from 'lucide-react'
import { Sidebar } from './sidebar'

interface SiteShellProps extends ComponentProps<'main'> {
  activeSection: string
  children: ReactNode
}

export function SiteShell({ activeSection, children, ...props }: SiteShellProps) {
  return (
    <div data-slot="site-shell" className="app-shell">
      <Sidebar activeSection={activeSection} />
      <main className="main-content" {...props}>
        <div className="social-links" aria-label="Atalhos do site">
          <a href="#/portfolio" aria-label="Ir para portfólio"><Sparkles aria-hidden="true" /></a>
          <a href="#/sobre" aria-label="Conhecer o artista"><UserRound aria-hidden="true" /></a>
          <a href="#/contato" aria-label="Ir para contato"><Mail aria-hidden="true" /></a>
        </div>
        {children}
        <footer className="site-footer">
          <span>© 2026 Jordan Ferrary</span>
          <span>Feito com criatividade <b>✦</b> e cuidado</span>
          <a href="#/inicio">Voltar ao topo ↑</a>
        </footer>
      </main>
    </div>
  )
}
