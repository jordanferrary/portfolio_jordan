import { useEffect,useState } from 'react'
import { ArrowRight,ArrowUpRight,BriefcaseBusiness,Github,Instagram,Mail,Pencil,Plus,Sparkles } from 'lucide-react'
import { Sidebar,type Page } from './components/layout/sidebar'
import { Gallery } from './components/sections/gallery'
import { ProjectPage } from './components/sections/project-page'
import { AdminEditor } from './components/sections/admin-editor'
import { AdminGate } from './components/sections/admin-gate'
import { AssetImage } from './components/ui/asset-image'
import { usePortfolio } from './hooks/use-portfolio'
import type { Project } from './data/projects'
function route(){const part=location.hash.replace(/^#\/?/,'');return part.startsWith('project/')?'project':(['inicio','portfolio','sobre','contato'].includes(part)?part:'inicio')}
export function App(){
 const [page,setPage]=useState(route)
 const [previewId,setPreviewId]=useState<string|null>(null)
 const [editing,setEditing]=useState(false)
 const [gateOpen,setGateOpen]=useState(false)
 const [editor,setEditor]=useState<Project|null|undefined>(undefined)
 const portfolio=usePortfolio()
 const navigate=(next:Page)=>{location.hash='/'+next;setPage(next);window.scrollTo(0,0)}
 const projectId=location.hash.replace(/^#\/project\//,'')
 const project=portfolio.projects.find(p=>p.id===projectId)
 const preview=portfolio.projects.find(p=>p.id===previewId)??null
 const openProject=(p:Project)=>{setPreviewId(null);location.hash='/project/'+p.id;setPage('project');window.scrollTo(0,0)}
 useEffect(()=>{const sync=()=>{setPage(route());window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[])
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.ctrlKey&&(e.key==='\\'||e.code==='Backslash')){e.preventDefault();if(editing){setEditing(false);setEditor(undefined)}else setGateOpen(true)}else if(e.key==='Escape'&&gateOpen)setGateOpen(false)}
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[editing,gateOpen])
 const featured=portfolio.projects.filter(p=>p.featured).slice(0,3)
 return <div className="site-shell"><Sidebar page={page==='project'?'portfolio':page as Page} navigate={navigate}/><div className="site-main"><div className="socials"><a href="https://github.com/jordanferrary" aria-label="GitHub" target="_blank" rel="noreferrer"><Github size={20}/></a><a href="https://www.behance.net/" aria-label="Behance" target="_blank" rel="noreferrer">Bē</a><a href="https://www.instagram.com/jordan_.ferrary/" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={20}/></a></div>
 {page==='portfolio'&&<Gallery projects={portfolio.projects} categories={portfolio.categories} selected={preview} onPreview={p=>setPreviewId(p.id)} onClosePreview={()=>setPreviewId(null)} onOpen={openProject} editing={editing} onAdd={()=>setEditor(null)} onEdit={setEditor}/>}
 {page==='project'&&project&&<ProjectPage project={project} onBack={()=>navigate('portfolio')} editing={editing} onEdit={()=>setEditor(project)}/>}
 {page==='project'&&!project&&<section className="simple-page"><h1>Project not found</h1><button onClick={()=>navigate('portfolio')}>Back to portfolio</button></section>}
 {page==='inicio'&&<main className="home-page"><div className="home-art"><AssetImage src={import.meta.env.BASE_URL+'images/hero/hero-character.webp'} alt=""/></div><div className="home-copy"><span className="eyebrow"><Sparkles size={17}/> 3D ARTIST · DIGITAL CREATOR</span><h1>Crafting worlds<br/>beyond the <em>ordinary.</em></h1><p>Art, imagination and storytelling — from the first idea to the final pixel.</p><button className="home-cta" onClick={()=>navigate('portfolio')}>Explore my portfolio <ArrowRight size={19}/></button></div><div className="home-featured"><div className="home-featured-head"><h2>✦ Featured creations</h2><button onClick={()=>navigate('portfolio')}>View all <ArrowUpRight size={16}/></button></div><div className="featured-grid">{featured.map(p=><article key={p.id}><button onClick={()=>openProject(p)}><AssetImage src={p.image} alt={p.title}/><span>{p.title}</span></button>{editing&&<button className="featured-edit" onClick={()=>setEditor(p)} aria-label={'Editar destaque '+p.title}><Pencil size={16}/></button>}</article>)}</div></div></main>}
 {page==='sobre'&&<main className="simple-page"><span className="eyebrow">✦ Behind the art</span><h1>More than pixels.<br/><em>A creative vision.</em></h1><div className="about-layout"><AssetImage src={import.meta.env.BASE_URL+'images/profile/avatar.webp'} alt="Arte de perfil"/><div><h2>Jordan Ferrary</h2><p>3D artist, modeler, illustrator and motion designer. I create characters, environments and visual experiences through technical curiosity and artistic direction.</p><div className="about-skills"><span>3D Modeling</span><span>Sculpting</span><span>Motion Design</span><span>Illustration</span><span>Game Art</span></div><button className="home-cta" onClick={()=>navigate('contato')}>Let's collaborate <ArrowRight size={18}/></button></div></div></main>}
 {page==='contato'&&<main className="simple-page"><span className="eyebrow">✦ Work together</span><h1>Have a project<br/><em>in mind?</em></h1><p>Let's turn a creative idea into a remarkable visual experience.</p><a className="home-cta" href="https://www.instagram.com/jordan_.ferrary/" target="_blank" rel="noreferrer">Enviar mensagem pelo Instagram <Mail size={18}/></a><a className="contact-link" href="https://github.com/jordanferrary" target="_blank" rel="noreferrer">Find me on GitHub <ArrowUpRight size={18}/></a></main>}
 </div>
 {editing&&<div className="admin-bar"><BriefcaseBusiness size={16}/> Local Studio <span>Rascunhos locais · ZIP para backup</span><button onClick={()=>setEditor(null)}><Plus size={15}/> Novo projeto</button><button onClick={()=>{setEditing(false);setEditor(undefined)}}>Bloquear editor</button></div>}
 {portfolio.saveError&&<div className="storage-warning" role="alert">{portfolio.saveError}</div>}
 {gateOpen&&<AdminGate onUnlock={()=>{setGateOpen(false);setEditing(true)}} onClose={()=>setGateOpen(false)}/>}
 {editor!==undefined&&<AdminEditor key={editor?.id??'new'} project={editor} projects={portfolio.projects} categories={portfolio.categories} onSave={portfolio.update} onDelete={portfolio.remove} onClose={()=>setEditor(undefined)} onCategories={portfolio.setCategories} onExport={portfolio.exportData} onImport={portfolio.importData}/>}
 </div>
}
