import { useEffect, useState } from 'react'
import { SiteShell } from './components/layout/site-shell'
import { AboutSection } from './components/sections/about-section'
import { ContactSection } from './components/sections/contact-section'
import { FeaturedSection } from './components/sections/featured-section'
import { HeroSection } from './components/sections/hero-section'
import { PortfolioSection } from './components/sections/portfolio-section'
import { ProjectDialog } from './components/sections/project-dialog'
import type { Project } from './data/projects'

export type SitePage = 'inicio' | 'portfolio' | 'sobre' | 'contato'

function readPage(): SitePage {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return route === 'portfolio' || route === 'sobre' || route === 'contato' ? route : 'inicio'
}

export function App() {
  const [page, setPage] = useState<SitePage>(readPage)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    const syncPage = () => setPage(readPage())
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])

  return (
    <SiteShell activeSection={page}>
      {page === 'inicio' ? (
        <>
          <HeroSection />
          <FeaturedSection onSelectProject={setSelectedProject} />
        </>
      ) : null}
      {page === 'portfolio' ? <PortfolioSection onSelectProject={setSelectedProject} /> : null}
      {page === 'sobre' ? <AboutSection /> : null}
      {page === 'contato' ? <ContactSection /> : null}
      <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
    </SiteShell>
  )
}
