import { useState } from 'react'
import { ArrowRight,ArrowUpRight,ChevronLeft,ChevronRight,Gamepad2,Palette,Pencil,Quote,Shapes,Sparkles } from 'lucide-react'
import type { HomeContent,Testimonial } from '../../data/studio'
import type { Project } from '../../data/projects'
import { AssetImage } from '../ui/asset-image'
import { framingStyle } from '../../lib/image-framing'
import { protectArtistName } from '../ui/protected-name'
type Props={home:HomeContent;testimonials:Testimonial[];projects:Project[];editing:boolean;onOpenProject:(project:Project)=>void;onEditProject:(project:Project)=>void;onEditHome:()=>void;onNavigatePortfolio:()=>void}
export function HomePage({home,testimonials,projects,editing,onOpenProject,onEditProject,onEditHome,onNavigatePortfolio}:Props){
 const [slide,setSlide]=useState(0)
 const current=testimonials[slide%Math.max(1,testimonials.length)]
 const featured=projects.filter(p=>p.featured).slice(0,3)
 const focusIcons=[Shapes,Gamepad2,Palette]
 return <main className="home-dashboard">
  <div className="home-wallpaper" aria-hidden="true"><AssetImage src={home.background} alt="" loading="eager" fetchPriority="high"/></div>
  <div className="home-upper">
   <div className="home-intro"><p className="home-eyebrow"><i/>{home.eyebrow}</p><h1>{home.titleFirst.split('\n').map((line,index)=><span key={index}>{line}<br/></span>)}<em>{home.titleSecond}</em></h1><p className="home-blurb">{protectArtistName(home.introduction)}</p><button className="home-explore" onClick={onNavigatePortfolio}>Explore my portfolio <span><ArrowUpRight size={18}/></span></button></div>
   <aside className="home-about-panel"><div className="home-avatar-ring"><AssetImage src={home.avatar} alt="Artist portrait" loading="eager"/><span className="avatar-status"/></div><h2 translate="no" className="notranslate">Jordan Ferrary</h2><p className="home-profile-role">3D Artist</p><p className="home-availability"><i/>{home.available?'Available for projects':'Open to new ideas'}</p><p className="home-tagline">{home.aboutTagline}</p><div className="home-specialties"><small>✦ Specialties</small><div>{home.specialties.map(item=><span key={item}>{item}</span>)}</div></div></aside>
  </div>
  <div className={testimonials.length>0?"home-bottom-panels":"home-bottom-panels no-testimonials"}>
   <section className="home-featured-panel" aria-label="Featured projects"><div className="home-panel-heading"><h2><Sparkles size={17}/> Featured Projects</h2><button onClick={onNavigatePortfolio}>View all <ArrowRight size={15}/></button></div><div className="home-featured-cards">{featured.map(p=><div className="home-work" key={p.id} data-alquimago-project={p.title} data-alquimago-category={p.category} data-alquimago-year={String(p.year??'')} data-alquimago-tools={p.tools?.join(', ')??''}><button className="home-work-link" onClick={()=>onOpenProject(p)} title={'Open '+p.title}><AssetImage src={p.image} alt={p.title} style={framingStyle(p.coverFocus)} sizes="(max-width: 800px) 80vw, 260px" loading="lazy" decoding="async"/><span className="work-title">{p.title}</span><span className="work-arrow"><ArrowUpRight size={18}/></span></button>{editing&&<button className="home-work-edit" aria-label={'Editar '+p.title} onClick={()=>onEditProject(p)}><Pencil size={15}/></button>}</div>)}{featured.length===0&&<div className="no-featured">{editing?'Marque um projeto como destaque no editor.':'More featured work coming soon.'}</div>}</div></section>
   {testimonials.length>0&&<section className="home-testimonials-panel" aria-label="Testimonials"><div className="home-panel-heading"><h2>What people say</h2>{editing&&<button aria-label="Editar depoimentos" onClick={onEditHome}><Pencil size={15}/></button>}</div><div className="quote-illustration"><Quote size={31} fill="currentColor"/></div>{current?<div className="feedback-content"><blockquote>{current.quote}</blockquote><small>— {current.author}{current.role?' · '+current.role:''}</small></div>:<div className="feedback-empty"><p>Client and collaborator testimonials will appear here.</p>{editing&&<button onClick={onEditHome}>Adicionar primeiro feedback</button>}</div>}<div className="feedback-controls"><span>{testimonials.length?slide%testimonials.length+1:0} / {testimonials.length}</span><div><button disabled={testimonials.length<2} aria-label="Previous testimonial" onClick={()=>setSlide(v=>(v-1+testimonials.length)%testimonials.length)}><ChevronLeft size={18}/></button><button disabled={testimonials.length<2} aria-label="Next testimonial" onClick={()=>setSlide(v=>(v+1)%testimonials.length)}><ChevronRight size={18}/></button></div></div></section>}
   <section className="home-focus-panel" aria-label="Creative specialties"><div className="home-panel-heading"><h2><span className="focus-heading-icon">▥</span> Project Focus</h2></div><div className="focus-items">{home.focusItems.map((item,index)=>{const Icon=focusIcons[index%focusIcons.length];return <div className="focus-entry" key={index}><Icon size={27} aria-hidden="true"/><span>{item}</span></div>})}</div></section>
  </div>
 </main>
}
