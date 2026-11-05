import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { projectCategories, projects, type Project, type ProjectFilter } from '../../data/projects'
import { ProjectCard } from './project-card'
import { SectionHeading } from '../ui/section-heading'
import { assetPath } from '../../lib/assets'

interface PortfolioSectionProps {
  onSelectProject: (project: Project) => void
}

export function PortfolioSection({ onSelectProject }: PortfolioSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return projects.filter((project) => {
      const matchesCategory = activeFilter === 'All' || project.category === activeFilter
      const matchesQuery = !query || `${project.title} ${project.category} ${project.description}`.toLocaleLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [activeFilter, search])

  useEffect(() => {
    setVisibleCount(6)
  }, [activeFilter, search])

  return (
    <section data-slot="portfolio-section" id="portfolio" className="portfolio-section page-section" aria-labelledby="portfolio-title">
      <div className="portfolio-banner-art" aria-hidden="true"><img src={assetPath('hero-character.webp')} alt="" loading="lazy" /></div>
      <SectionHeading
        eyebrow="✦ Explore my portfolio"
        title="A world of art,"
        highlight="in every detail."
        description="Dive into my 3D creations and discover the stories behind each project."
      />
      <div className="portfolio-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filtrar projetos por categoria">
          {projectCategories.map((category) => (
            <button key={category} type="button" data-active={activeFilter === category ? '' : undefined} onClick={() => setActiveFilter(category)}>
              {category === 'All' ? <Sparkles aria-hidden="true" /> : null}{category}
            </button>
          ))}
        </div>
        <label className="project-search">
          <Search aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for projects..." aria-label="Buscar projetos" />
          {search ? <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><X aria-hidden="true" /></button> : null}
        </label>
        <button className="filter-toggle" type="button" onClick={() => setShowFilters((visible) => !visible)} aria-expanded={showFilters} aria-label="Mostrar opções de filtro"><SlidersHorizontal aria-hidden="true" /></button>
      </div>
      {showFilters ? (
        <div className="filter-note" role="status">Mostrando {filteredProjects.length} de {projects.length} projetos. Use as categorias ou a busca para refinar a galeria.</div>
      ) : null}
      <div className="portfolio-grid">
        {filteredProjects.slice(0, visibleCount).map((project, index) => <ProjectCard key={project.id} project={project} onSelect={onSelectProject} featured={index === 0} />)}
      </div>
      {filteredProjects.length > 0 ? (
        <div className="portfolio-pagination">
          <span>Showing {Math.min(visibleCount, filteredProjects.length)} of {filteredProjects.length} projects</span>
          {visibleCount < filteredProjects.length ? (
            <button type="button" onClick={() => setVisibleCount((count) => count + 6)}>View more projects <span aria-hidden="true">↓</span></button>
          ) : null}
        </div>
      ) : null}
      {filteredProjects.length === 0 ? (
        <div className="empty-state"><Search aria-hidden="true" /><strong>Nenhum projeto encontrado</strong><span>Tente outra palavra ou escolha uma categoria diferente.</span></div>
      ) : null}
    </section>
  )
}
