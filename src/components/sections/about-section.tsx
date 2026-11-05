import { Brush, Code2, Cuboid, Gem, Lightbulb, Sparkles } from 'lucide-react'
import { SectionHeading } from '../ui/section-heading'

const specialties = [
  { icon: Cuboid, title: '3D Modeling', text: 'Personagens, props e formas com identidade própria.' },
  { icon: Lightbulb, title: 'Look Development', text: 'Materiais, luz e composição para contar histórias.' },
  { icon: Brush, title: 'Stylized Art', text: 'Universos visuais expressivos e cheios de personalidade.' },
  { icon: Code2, title: 'Interactive Assets', text: 'Assets preparados para experiências digitais e games.' },
]

export function AboutSection() {
  return (
    <section data-slot="about-section" id="sobre" className="about-section page-section">
      <SectionHeading eyebrow="✦ A little about me" title="Ideas become" highlight="worlds." description="I build visual experiences with curiosity, craft and a love for the details." />
      <div className="about-layout">
        <div className="about-copy surface-card">
          <div className="about-symbol"><Gem aria-hidden="true" /></div>
          <p className="about-lead">Art is where imagination finds a shape.</p>
          <p>Sou Jordan, artista 3D e criador digital. Gosto de transformar conceitos em personagens, objetos e ambientes que despertam curiosidade. Meu processo mistura experimentação, atenção aos detalhes e busca por uma linguagem visual consistente.</p>
          <p>Do primeiro blockout ao render final, cada etapa é uma oportunidade de dar personalidade a uma ideia.</p>
          <a href="#/contato" className="text-link">Vamos criar algo <span>↗</span></a>
        </div>
        <div className="specialty-grid">
          {specialties.map(({ icon: Icon, title, text }) => (
            <article className="specialty-card surface-card" key={title}>
              <span className="specialty-icon"><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="process-strip">
        <div><span>01</span><strong>Discover</strong><small>Ideia & direção</small></div>
        <i />
        <div><span>02</span><strong>Build</strong><small>Forma & detalhes</small></div>
        <i />
        <div><span>03</span><strong>Refine</strong><small>Luz & materiais</small></div>
        <i />
        <div><span>04</span><strong>Deliver</strong><small>Arte final</small></div>
      </div>
    </section>
  )
}
