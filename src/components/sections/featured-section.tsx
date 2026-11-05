import { useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, ChartNoAxesColumn, Quote, Sparkles } from 'lucide-react'
import { projects, type Project } from '../../data/projects'
import { testimonials } from '../../data/testimonials'
import { ProjectCard } from './project-card'
import { FocusItems } from './hero-section'

interface FeaturedSectionProps {
  onSelectProject: (project: Project) => void
}

export function FeaturedSection({ onSelectProject }: FeaturedSectionProps) {
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const featuredProjects = projects.filter((project) => project.featured)
  const testimonial = testimonials[testimonialIndex]

  function changeTestimonial(direction: -1 | 1) {
    setTestimonialIndex((current) => (current + direction + testimonials.length) % testimonials.length)
  }

  return (
    <section data-slot="featured-section" className="featured-section" aria-label="Destaques do portfólio">
      <div className="featured-projects surface-card">
        <div className="card-section-heading">
          <h2><Sparkles aria-hidden="true" />Featured Projects</h2>
          <a href="#/portfolio">View all <ArrowUpRight aria-hidden="true" /></a>
        </div>
        <div className="featured-grid">
          {featuredProjects.map((project) => <ProjectCard key={project.id} project={project} onSelect={onSelectProject} featured />)}
        </div>
      </div>
      <article className="testimonial-card surface-card" aria-live="polite">
        <div className="testimonial-top">
          <h2>What people say</h2>
          <div className="avatar-stack" aria-hidden="true"><span>M</span><span>J</span><span>A</span></div>
        </div>
        <Quote className="quote-icon" aria-hidden="true" />
        <p className="testimonial-quote">“{testimonial.quote}”</p>
        <div className="testimonial-bottom">
          <span><b>→ {testimonial.author}</b><small>{testimonial.role}</small></span>
          <div className="carousel-controls">
            <button type="button" onClick={() => changeTestimonial(-1)} aria-label="Depoimento anterior"><ArrowLeft aria-hidden="true" /></button>
            <button type="button" onClick={() => changeTestimonial(1)} aria-label="Próximo depoimento"><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>
      </article>
      <article className="focus-card surface-card">
        <h2><ChartNoAxesColumn aria-hidden="true" />Project Focus</h2>
        <FocusItems />
        <div className="focus-decoration" aria-hidden="true"><AudioLines /></div>
      </article>
    </section>
  )
}
