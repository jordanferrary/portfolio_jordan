import { ArrowUpRight, Box, Mountain, Palette, UserRound } from 'lucide-react'
import type { Project } from '../../data/projects'

interface ProjectCardProps {
  project: Project
  onSelect: (project: Project) => void
  featured?: boolean
}

const categoryIcons = {
  Characters: UserRound,
  Environments: Mountain,
  Props: Box,
  Stylized: Palette,
  Others: Box,
}

export function ProjectCard({ project, onSelect, featured = false }: ProjectCardProps) {
  const CategoryIcon = categoryIcons[project.category]

  return (
    <button
      type="button"
      data-slot="project-card"
      className={`project-card${featured ? ' project-card-featured' : ''}`}
      onClick={() => onSelect(project)}
      aria-label={`Abrir projeto ${project.title}`}
    >
      <img src={project.image} alt={`Arte do projeto ${project.title}`} loading="lazy" />
      <span className="project-overlay" />
      <span className="project-category"><CategoryIcon aria-hidden="true" />{project.category}</span>
      <span className="project-card-copy">
        <strong>{project.title}</strong>
        <small>{project.category === 'Environments' ? 'Environment' : 'Creative project'} · {project.year}</small>
      </span>
      <span className="project-open"><ArrowUpRight aria-hidden="true" /></span>
    </button>
  )
}
