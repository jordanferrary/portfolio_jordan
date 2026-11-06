import { useEffect,useState } from 'react'
import { BriefcaseBusiness,Plus } from 'lucide-react'
import { Sidebar,type Page } from './components/layout/sidebar'
import { SocialBar } from './components/layout/social-bar'
import { Gallery } from './components/sections/gallery'
import { ProjectPage } from './components/sections/project-page'
import { AdminEditor } from './components/sections/admin-editor'
import { AdminGate } from './components/sections/admin-gate'
import { HomePage } from './components/sections/home-page'
import { AboutPage } from './components/sections/about-page'
import { AboutEditor } from './components/sections/about-editor'
import {ContactPage} from './components/sections/contact-page'
import {AdminInboxBell} from './components/sections/admin-inbox'
import { HomeEditor } from './components/sections/home-editor'
import { AssetLibraryProvider } from './components/ui/asset-picker'
import { usePortfolio } from './hooks/use-portfolio'
import type { Project } from './data/projects'
function route(){const part=location.hash.replace(/^#\/?/,'');return part.startsWith('project/')?'project':(['inicio','portfolio','sobre','contato'].includes(part)?part:'inicio')}
export function App(){
 const [page,setPage]=useState(route)
 const [previewId,setPreviewId]=useState<string|null>(null)
 const [editing,setEditing]=useState(false)
 const [gateOpen,setGateOpen]=useState(false)
 const [editor,setEditor]=useState<Project|null|undefined>(undefined)
 const [homeEditorOpen,setHomeEditorOpen]=useState(false)
 const [aboutEditorOpen,setAboutEditorOpen]=useState(false)
 const [homeEditorTab,setHomeEditorTab]=useState<'home'|'feedback'|'music'|'socials'|'likes'>('home')
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
 return <AssetLibraryProvider projects={portfolio.projects} categories={portfolio.categories} home={portfolio.home} about={portfolio.about} tracks={portfolio.musicTracks}><div className={page==='inicio'?'site-shell home-route':'site-shell'}><Sidebar page={page==='project'?'portfolio':page as Page} navigate={navigate} tracks={portfolio.musicTracks}/><div className="site-main"><SocialBar links={portfolio.socialLinks} editing={editing} onEdit={()=>{setHomeEditorTab('socials');setHomeEditorOpen(true)}}/>
 {page==='portfolio'&&<Gallery projects={portfolio.projects} categories={portfolio.categories} selected={preview} onPreview={p=>setPreviewId(p.id)} onClosePreview={()=>setPreviewId(null)} onOpen={openProject} editing={editing} onAdd={()=>setEditor(null)} onEdit={setEditor} onReorder={portfolio.reorderProjects} showLikeCounts={portfolio.showLikeCounts} heroImage={portfolio.home.background}/>}
 {page==='project'&&project&&<ProjectPage project={project} onBack={()=>navigate('portfolio')} editing={editing} onEdit={()=>setEditor(project)} showLikeCounts={portfolio.showLikeCounts}/>}
 {page==='project'&&!project&&<section className="simple-page"><h1>Project not found</h1><button onClick={()=>navigate('portfolio')}>Back to portfolio</button></section>}
 {page==='inicio'&&<HomePage home={portfolio.home} testimonials={portfolio.testimonials} projects={portfolio.projects} editing={editing} onOpenProject={openProject} onEditProject={setEditor} onEditHome={()=>{setHomeEditorTab('feedback');setHomeEditorOpen(true)}} onNavigatePortfolio={()=>navigate('portfolio')}/>}
 {page==='sobre'&&<AboutPage about={portfolio.about} editing={editing} onEdit={()=>setAboutEditorOpen(true)} onContact={()=>navigate('contato')}/>}
 {page==='contato'&&<ContactPage socials={portfolio.socialLinks}/>}
 </div>
 {editing&&<div className="admin-bar"><BriefcaseBusiness size={16}/> Local Studio <span>Rascunhos locais · ZIP para backup</span><button onClick={()=>{setHomeEditorTab('home');setHomeEditorOpen(true)}}>Editar Home, redes e músicas</button><button onClick={()=>setAboutEditorOpen(true)}>Editar Sobre</button><button onClick={()=>{setHomeEditorTab('likes');setHomeEditorOpen(true)}}>Curtidas</button><button onClick={()=>setEditor(null)}><Plus size={15}/> Novo projeto</button><button onClick={()=>{setEditing(false);setEditor(undefined)}}>Bloquear editor</button></div>}
 {editing&&<AdminInboxBell/>}
 {portfolio.saveError&&<div className="storage-warning" role="alert">{portfolio.saveError}</div>}
 {gateOpen&&<AdminGate onUnlock={()=>{setGateOpen(false);setEditing(true)}} onClose={()=>setGateOpen(false)}/>}
 {aboutEditorOpen&&<AboutEditor value={portfolio.about} onSave={portfolio.setAbout} onClose={()=>setAboutEditorOpen(false)}/>}
 {homeEditorOpen&&<HomeEditor initialTab={homeEditorTab} showLikeCounts={portfolio.showLikeCounts} onShowLikeCounts={portfolio.setShowLikeCounts} home={portfolio.home} testimonials={portfolio.testimonials} tracks={portfolio.musicTracks} links={portfolio.socialLinks} onLinks={portfolio.setSocialLinks} onHome={portfolio.setHome} onTestimonials={portfolio.setTestimonials} onTracks={portfolio.setMusicTracks} onClose={()=>setHomeEditorOpen(false)} onExport={portfolio.exportData}/>} 
 {editor!==undefined&&<AdminEditor key={editor?.id??'new'} project={editor} projects={portfolio.projects} categories={portfolio.categories} onSave={portfolio.update} onDelete={portfolio.remove} onClose={()=>setEditor(undefined)} onCategories={portfolio.setCategories} onExport={portfolio.exportData} onImport={portfolio.importData}/>}
 </div></AssetLibraryProvider>
}
