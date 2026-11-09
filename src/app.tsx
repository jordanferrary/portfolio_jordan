import { lazy,Suspense,useEffect,useState } from 'react'
import { Home,Grid2X2,UserRound,Mail,Image as ImageIcon,Heart,Music,Share2,Layers,Palette,Plus,MessageSquare,Eye,EyeOff } from 'lucide-react'
import { Sidebar,type Page } from './components/layout/sidebar'
import { SocialBar } from './components/layout/social-bar'
const Gallery=lazy(()=>import('./components/sections/gallery').then(m=>({default:m.Gallery})))
const GalleryBackgroundEditor=lazy(()=>import('./components/sections/gallery-background-editor').then(m=>({default:m.GalleryBackgroundEditor})))
const BrandLogoEditor=lazy(()=>import('./components/sections/brand-logo-editor').then(m=>({default:m.BrandLogoEditor})))
const ProjectPage=lazy(()=>import('./components/sections/project-page').then(m=>({default:m.ProjectPage})))
const CustomPageView=lazy(()=>import('./components/sections/custom-page').then(m=>({default:m.CustomPageView})))
const AdminEditor=lazy(()=>import('./components/sections/admin-editor').then(m=>({default:m.AdminEditor})))
const AdminGate=lazy(()=>import('./components/sections/admin-gate').then(m=>({default:m.AdminGate})))
import { HomePage } from './components/sections/home-page'
import { AboutPage } from './components/sections/about-page'
const AboutEditor=lazy(()=>import('./components/sections/about-editor').then(m=>({default:m.AboutEditor})))
import {ContactPage} from './components/sections/contact-page'
const ContactEditor=lazy(()=>import('./components/sections/contact-editor').then(m=>({default:m.ContactEditor})))
const HomeEditor=lazy(()=>import('./components/sections/home-editor').then(m=>({default:m.HomeEditor})))
import { AssetLibraryProvider } from './components/ui/asset-library-context'
import { ImageVariantProvider } from './components/ui/asset-image'
import { usePortfolio,currentPublishedRevision } from './hooks/use-portfolio'
const GitHubPublishEditor=lazy(()=>import('./components/sections/github-publish-editor').then(m=>({default:m.GitHubPublishEditor})))
const SiteIdentityEditor=lazy(()=>import('./components/sections/site-identity-editor').then(m=>({default:m.SiteIdentityEditor})))
const ThemePaletteEditor=lazy(()=>import('./components/sections/theme-palette-editor').then(m=>({default:m.ThemePaletteEditor})))
import { applyThemePalette } from './lib/theme-palette'
import {detectCountryByIp,initialLanguage,languageFromCountry,saveLanguageChoice,savedLanguage,type VisitorLanguage} from './lib/visitor-language'
import {observePublicTranslation} from './lib/public-page-translation'
import {AppErrorBoundary} from './components/ui/app-error-boundary'
import {readAlquimagoVisibilityDraft,writeAlquimagoVisibilityDraft} from './lib/alquimago-visibility'
import {githubTokenVault,type GitHubTokenCheck} from './lib/github-token-vault'
import {hasGitHubLogin,readGitHubSession} from './lib/github-auth'
import type {StudioAction} from './components/sections/studio-dock'
const StudioDock=lazy(()=>import('./components/sections/studio-dock').then(m=>({default:m.StudioDock})))
const ImageConverter=lazy(()=>import('./components/sections/image-converter').then(m=>({default:m.ImageConverter})))
const MediaManager=lazy(()=>import('./components/sections/media-manager').then(m=>({default:m.MediaManager})))
const Alquimago3DEditor=lazy(()=>import('./components/sections/alquimago-3d-editor').then(m=>({default:m.Alquimago3DEditor})))
const CustomPageEditor=lazy(()=>import('./components/sections/custom-page-editor').then(m=>({default:m.CustomPageEditor})))
import type { Project } from './data/projects'
function route():Page|'project'|'custom'{const part=location.hash.replace(/^#\/?/,'');return part.startsWith('project/')?'project':part.startsWith('page/')?'custom':(['inicio','portfolio','sobre','contato'].includes(part)?part as Page:'inicio')}
export function App(){
 const [page,setPage]=useState(route)
 const [editing,setEditing]=useState(false)
 // Keep an out-of-root Studio flag for safe recovery after a render crash.
 // Never automatically reload while an editor may contain unsaved form fields.
 useEffect(()=>{
  document.documentElement.dataset.jfStudioActive=editing?'true':'false'
 },[editing])
 const [visitorLanguage,setVisitorLanguage]=useState<VisitorLanguage>(initialLanguage)
 const changeVisitorLanguage=(next:VisitorLanguage)=>{
  saveLanguageChoice(next)
  setVisitorLanguage(next)
 }
 useEffect(()=>{
  if(savedLanguage())return
  const controller=new AbortController()
  void detectCountryByIp(controller.signal).then(country=>{
   if(country&&!controller.signal.aborted&&!savedLanguage())setVisitorLanguage(languageFromCountry(country))
  })
  return()=>controller.abort()
 },[])
 useEffect(()=>{
  document.documentElement.lang=visitorLanguage==='pt'?'pt-BR':visitorLanguage
  const root=document.querySelector<HTMLElement>('.site-shell')
  if(!root)return
  return observePublicTranslation(root,visitorLanguage)
 },[visitorLanguage])

 const [gateOpen,setGateOpen]=useState(false)
 const [editor,setEditor]=useState<Project|null|undefined>(undefined)
 const [homeEditorOpen,setHomeEditorOpen]=useState(false)
 const [aboutEditorOpen,setAboutEditorOpen]=useState(false)
 const [contactEditorOpen,setContactEditorOpen]=useState(false)
 const [githubPublishOpen,setGitHubPublishOpen]=useState(false)
 const [galleryBackgroundEditorOpen,setGalleryBackgroundEditorOpen]=useState(false)
 const [logoEditorOpen,setLogoEditorOpen]=useState(false)
 const [siteIdentityOpen,setSiteIdentityOpen]=useState(false)
 const [themePaletteOpen,setThemePaletteOpen]=useState(false)
 const [imageConverterOpen,setImageConverterOpen]=useState(false)
 const [mediaManagerOpen,setMediaManagerOpen]=useState(false)
 const [skin3DOpen,setSkin3DOpen]=useState(false)
 const [alquimagoVisible,setAlquimagoVisible]=useState<boolean|null>(null)
 const [publishedAlquimagoVisible,setPublishedAlquimagoVisible]=useState<boolean|null>(null)
 // A creator can keep the Studio familiar independently of public visibility.
 const [studioFamiliarVisible,setStudioFamiliarVisible]=useState(()=>{
  try{return localStorage.getItem('jf-alquimago-studio-visible')!=='false'}
  catch{return true}
 })
 const toggleStudioFamiliar=()=>{
  setStudioFamiliarVisible(current=>{
   const next=!current
   try{localStorage.setItem('jf-alquimago-studio-visible',String(next))}catch{/* optional */}
   return next
  })
 }
 const toggleAlquimagoVisible=()=>{
  setAlquimagoVisible(current=>{
   const next=current===false
   writeAlquimagoVisibilityDraft(next)
   return next
  })
 }
 const [customPageEditorTarget,setCustomPageEditorTarget]=useState<string|null>(null)
 const [stagedMediaDeletions,setStagedMediaDeletions]=useState<string[]>([])
 const [homeEditorTab,setHomeEditorTab]=useState<'home'|'feedback'|'music'|'socials'|'likes'>('home')
 const portfolio=usePortfolio(editing)
 const navigate=(next:Page)=>{location.hash='/'+next;setPage(next);window.scrollTo(0,0)}
 const navigateCustomPage=(id:string)=>{location.hash='/page/'+id;setPage('custom');window.scrollTo(0,0)}
 const openHomeTab=(tab:'home'|'feedback'|'music'|'socials'|'likes')=>{setHomeEditorTab(tab);setHomeEditorOpen(true)}
 const projectId=location.hash.replace(/^#\/project\//,'')
 const project=portfolio.projects.find(p=>p.id===projectId)
 const customPageId=location.hash.replace(/^#\/page\//,'').split('/')[0]
 const customPage=page==='custom'?portfolio.customPages.find(item=>item.id===customPageId):undefined
 const openProject=(p:Project)=>{location.hash='/project/'+p.id;setPage('project');window.scrollTo(0,0)}
 const pageLabels:Record<Page|'project'|'custom',string>={inicio:'Home',portfolio:'Galeria',sobre:'Sobre',contato:'Contato',project:'Projeto',custom:customPage?.navLabel??'Página'}
 const editCurrent=()=>{if(page==='inicio')openHomeTab('home');else if(page==='portfolio')setGalleryBackgroundEditorOpen(true);else if(page==='sobre')setAboutEditorOpen(true);else if(page==='contato')setContactEditorOpen(true);else if(page==='custom')setCustomPageEditorTarget(customPage?.id??'manage');else setEditor(project??null)}
 const editingLabel=page==='project'?'Editar projeto':page==='custom'?'Editar página':page==='portfolio'?'Editar galeria':'Editar página'
 const studioActions:StudioAction[]=[
  {id:'home',label:'Home',description:'Apresentação, banner e conteúdo inicial',section:'Páginas',icon:Home,onClick:()=>openHomeTab('home')},
  {id:'about',label:'Sobre',description:'Bio, especialidades e imagens',section:'Páginas',icon:UserRound,onClick:()=>setAboutEditorOpen(true)},
  {id:'contact',label:'Contato',description:'Apresentação e redes para contato direto',section:'Páginas',icon:Mail,onClick:()=>setContactEditorOpen(true)},
  {id:'gallery',label:'Galeria',description:'Imagem de fundo da galeria',section:'Páginas',icon:Grid2X2,onClick:()=>setGalleryBackgroundEditorOpen(true)},
  {id:'custom-pages',label:'Minhas páginas',description:'Criar, organizar e editar páginas extras do menu',section:'Páginas',icon:Layers,onClick:()=>setCustomPageEditorTarget('manage')},
  {id:'new-custom-page',label:'Nova página',description:'Cursos, recursos, guias, downloads e outros',section:'Páginas',icon:Plus,onClick:()=>setCustomPageEditorTarget('new')},
  {id:'new-project',label:'Novo projeto',description:'Criar e compor uma nova obra',section:'Projetos',icon:Plus,onClick:()=>setEditor(null)},
  ...(page==='project'&&project?[{id:'active-project',label:'Editar obra atual',description:project.title,section:'Projetos' as const,icon:Layers,onClick:()=>setEditor(project)}]:[]),
  {id:'alquimago-visibility',
   label:alquimagoVisible===false?'Público · Ativar Alquimago':'Público · Desativar Alquimago',
   description:alquimagoVisible===false
    ?'Exibir o mascote aos visitantes após publicar. Não altera o Grimório do Studio.'
    :'Ocultar apenas o mascote dos visitantes após publicar. O Studio permanece independente.',
   section:'Familiar',icon:alquimagoVisible===false?Eye:EyeOff,
   onClick:toggleAlquimagoVisible},
  {id:'alquimago-studio-visibility',
   label:studioFamiliarVisible?'Studio · Ocultar Alquimago':'Studio · Mostrar Alquimago',
   description:'Preferência apenas deste navegador de edição; não modifica o site público.',
   section:'Familiar',icon:studioFamiliarVisible?EyeOff:Eye,
   onClick:toggleStudioFamiliar},
  {id:'alquimago-grimorio',label:'Abrir Grimório',description:'Conversar com Alquimago, consultar o professor Gemini e ensinar',section:'Familiar',icon:MessageSquare,onClick:()=>{
    const familiar=document.querySelector('alquimago-familiar') as (HTMLElement & {state?:{open:boolean;tab:number};render?:()=>void})|null
    if(familiar?.state){
     familiar.state.open=true
     familiar.state.tab=5
     familiar.render?.()
     requestAnimationFrame(()=>familiar.shadowRoot?.querySelector<HTMLInputElement>('#alquimago-message')?.focus())
    }
   }},
  {id:'alquimago-skin3d',label:'Ateliê do Alquimago',description:'Modelo GLB, emoções, respiração e enquadramento',section:'Familiar',icon:Palette,onClick:()=>setSkin3DOpen(true)},
  {id:'media-manager',label:'Gerenciar arquivos',description:'Excluir imagens e áudios antigos, locais ou publicados',section:'Conteúdo',icon:ImageIcon,onClick:()=>setMediaManagerOpen(true)},
  {id:'image-converter',label:'Conversor WebP',description:'Compactar, redimensionar e baixar imagens',section:'Conteúdo',icon:ImageIcon,onClick:()=>setImageConverterOpen(true)},
  {id:'music',label:'Músicas',description:'Faixas, capas e ordem da playlist',section:'Conteúdo',icon:Music,onClick:()=>openHomeTab('music')},
  {id:'reviews',label:'Feedbacks',description:'Depoimentos reais e autoria',section:'Conteúdo',icon:MessageSquare,onClick:()=>openHomeTab('feedback')},
  {id:'social',label:'Redes sociais',description:'Links, ícones e plataformas',section:'Conteúdo',icon:Share2,onClick:()=>openHomeTab('socials')},
  {id:'likes',label:'Curtidas',description:'Visibilidade e contagem',section:'Conteúdo',icon:Heart,onClick:()=>openHomeTab('likes')},
  {id:'palette',label:'Paleta de cores',description:'Círculo cromático, HEX, RGB e variáveis globais',section:'Identidade',icon:Palette,onClick:()=>setThemePaletteOpen(true)},
  {id:'brand',label:'Logo lateral',description:'Imagem principal, hover e escala',section:'Identidade',icon:ImageIcon,onClick:()=>setLogoEditorOpen(true)},
  {id:'share',label:'Favicon e link',description:'Ícone da aba e prévia compartilhada',section:'Identidade',icon:ImageIcon,onClick:()=>setSiteIdentityOpen(true)}
 ]
 useEffect(()=>{
  const openSkinEditor=()=>{
   setSkin3DOpen(true)
   if(!editing)setGateOpen(true)
  }
  window.addEventListener('alquimago:request-skin-editor',openSkinEditor)
  return ()=>window.removeEventListener('alquimago:request-skin-editor',openSkinEditor)
 },[editing])
 useEffect(()=>{applyThemePalette(portfolio.themePalette)},[portfolio.themePalette])
 useEffect(()=>{
  // Installed mascot is public; Gemini chat and creator tools are only shown
  // once Local Studio is unlocked. This is UI gating, not API authentication.
  document.documentElement.dataset.alquimagoStudio=editing?'true':'false'
 },[editing])
 useEffect(()=>{
  let active=true
  // Avoid showing the mascot before the published visibility setting loads.
  const load=async()=>{
   let published=false
   try{
    const response=await fetch(import.meta.env.BASE_URL+'alquimago/config.json',{cache:'no-store'})
    if(response.ok){
     const config=await response.json() as {appearance?:{visible?:unknown}}
     if(typeof config.appearance?.visible==='boolean')published=config.appearance.visible
    }
   }catch{/* A missing config safely keeps the public mascot hidden. */}
   if(active){
    setPublishedAlquimagoVisible(published)
    setAlquimagoVisible(readAlquimagoVisibilityDraft()??published)
   }
  }
  void load()
  return()=>{active=false}
 },[])
 useEffect(()=>{
  // Unpublished Studio drafts must never override the public site.
  const show=editing?studioFamiliarVisible:publishedAlquimagoVisible
  document.documentElement.dataset.alquimagoVisible=show===null?'pending':String(show)
  if(show===false){
   // Remove listeners and animation when hidden in this particular context.
   document.querySelectorAll('alquimago-familiar').forEach(element=>element.remove())
  }else if(show===true){
   const api=(window as Window&{Alquimago?:{mount:(target:HTMLElement,mode:'web')=>HTMLElement}}).Alquimago
   if(api&&!document.querySelector('alquimago-familiar'))api.mount(document.body,'web')
  }
 },[editing,studioFamiliarVisible,publishedAlquimagoVisible])
 useEffect(()=>{
  // Skip downloading the familiar entirely for public visitors when disabled.
  // The Studio still loads it on demand after its owner unlocks editing.
  if(!editing&&publishedAlquimagoVisible!==true)return
  // Use the actual release SHA for the script URL. Cloudflare builds do not
  // receive VITE_BUILD_SHA, and a fixed fallback previously froze the cache.
  let active=true
  let script:HTMLScriptElement|undefined
  const host=window as Window & {
   ALQUIMAGO_AUTO_MOUNT?:boolean
   Alquimago?:{version?:string;mount:(target:HTMLElement,mode:'web')=>HTMLElement}
  }
  host.ALQUIMAGO_AUTO_MOUNT=false
  const mount=()=>{if(active&&document.documentElement.dataset.alquimagoVisible==='true'&&!document.querySelector('alquimago-familiar'))host.Alquimago?.mount(document.body,'web')}
  const load=async()=>{
   const base=import.meta.env.BASE_URL
   const buildSha=import.meta.env.VITE_BUILD_SHA
   let releaseHash=''
   let releaseVersion=''
   try{
    const response=await fetch(base+'alquimago/release.json?check='+Date.now(),{
     cache:'no-store',credentials:'same-origin'
    })
    if(response.ok){
     const info=await response.json() as {version?:unknown;bundleBlobSha?:unknown}
     if(typeof info.version==='string'&&/^\d+\.\d+\.\d+$/.test(info.version))releaseVersion=info.version
     if(typeof info.bundleBlobSha==='string'&&/^[a-f0-9]{40}$/.test(info.bundleBlobSha))
      releaseHash=info.bundleBlobSha
    }
   }catch{/* Offline fallback: use the site build key. */}
   if(!active)return
   const cacheKey=encodeURIComponent(releaseHash||buildSha||String(Date.now()))
   if(host.Alquimago){
    // Once a custom element is defined, it cannot be replaced in this document.
    if(!releaseVersion||host.Alquimago.version===releaseVersion){mount();return}
    console.warn('Alquimago: versão anterior carregada; recarregue o documento para atualizar.')
    mount();return
   }
   script=document.createElement('script')
   script.src=base+'alquimago/alquimago.js?v='+cacheKey
   script.dataset.config=base+'alquimago/config.json?v='+cacheKey
   script.async=true
   script.addEventListener('load',mount,{once:true})
   script.addEventListener('error',()=>{console.error('Alquimago: falha ao carregar a versão '+(releaseVersion||'desconhecida'))},{once:true})
   document.body.appendChild(script)
  }
  void load()
  return()=>{
   active=false
   script?.remove()
   document.querySelectorAll('alquimago-familiar').forEach(el=>el.remove())
  }
 },[editing,publishedAlquimagoVisible])
 useEffect(()=>{
  if(!editing)return;
  const openPublish=(event:Event)=>{
   setGitHubPublishOpen(true)
   if(!(event instanceof CustomEvent)||event.detail?.source!=='chat')return
   void (async()=>{
    let status:GitHubTokenCheck='missing'
    try{
     if(hasGitHubLogin()&&(await readGitHubSession()).authenticated)status='ready'
     else status=(await githubTokenVault.inspect()).status
    }catch{status='unavailable'}
    // Public events carry a *status only*, never a token or session cookie.
    window.dispatchEvent(new CustomEvent('alquimago:publish-auth-status',{detail:{status}}))
   })()
  }
  window.addEventListener('alquimago:request-publish',openPublish)
  return()=>window.removeEventListener('alquimago:request-publish',openPublish)
 },[editing])
 useEffect(()=>{
  window.dispatchEvent(new CustomEvent('alquimago:publish-dialog',{detail:{open:githubPublishOpen}}))
 },[githubPublishOpen])
 useEffect(()=>{
  if(!editing)return
  // Public structure and counts only; no draft contents or credentials.
  const announce=()=>window.dispatchEvent(new CustomEvent('alquimago:studio-context',{
   detail:{editing:true,section:page,projects:portfolio.projects.length,pages:portfolio.customPages.length}
  }))
  window.addEventListener('alquimago:request-context',announce)
  announce()
  return()=>window.removeEventListener('alquimago:request-context',announce)
 },[editing,page,portfolio.projects.length,portfolio.customPages.length])

 useEffect(()=>{const sync=()=>{setPage(route());window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[])
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.ctrlKey&&(e.key==='\\'||e.code==='Backslash')){e.preventDefault();if(editing){setEditing(false);setEditor(undefined)}else setGateOpen(true)}else if(e.key==='Escape'&&gateOpen)setGateOpen(false)}
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[editing,gateOpen])
 return <ImageVariantProvider variants={portfolio.imageVariants??{}}><AssetLibraryProvider projects={portfolio.projects} categories={portfolio.categories} home={portfolio.home} about={portfolio.about} galleryBackground={portfolio.galleryBackground} siteLogo={portfolio.siteLogo} siteLogoHover={portfolio.siteLogoHover} siteFavicon={portfolio.siteFavicon} tracks={portfolio.musicTracks} pages={portfolio.customPages}><div className={page==='inicio'?'site-shell home-route':page==='contato'?'site-shell contact-route':page==='sobre'?'site-shell about-route':'site-shell'}><Sidebar page={page==='project'?'portfolio':page} navigate={navigate} customPages={portfolio.customPages} customPageId={customPage?.id} onOpenCustomPage={navigateCustomPage} onManagePages={()=>setCustomPageEditorTarget('manage')} tracks={portfolio.musicTracks} siteLogo={portfolio.siteLogo} siteLogoHover={portfolio.siteLogoHover} siteLogoSize={portfolio.siteLogoSize} siteLogoHoverScale={portfolio.siteLogoHoverScale} editing={editing} onEditLogo={()=>setLogoEditorOpen(true)}/><div className="site-main"><SocialBar links={portfolio.socialLinks} editing={editing} onEdit={()=>{setHomeEditorTab('socials');setHomeEditorOpen(true)}} language={visitorLanguage} onLanguageChange={changeVisitorLanguage}/>
 {page==='portfolio'&&<AppErrorBoundary compact><Suspense fallback={<div className="simple-page" role="status">Loading portfolio…</div>}><Gallery projects={portfolio.projects} categories={portfolio.categories} onOpen={openProject} editing={editing} onAdd={()=>setEditor(null)} onEdit={setEditor} onReorder={portfolio.reorderProjects} heroImage={portfolio.galleryBackground} onEditBackground={()=>setGalleryBackgroundEditorOpen(true)}/></Suspense></AppErrorBoundary>}
 {page==='project'&&project&&<AppErrorBoundary compact><Suspense fallback={<div className="simple-page" role="status">Loading project…</div>}><ProjectPage project={project} onBack={()=>navigate('portfolio')} editing={editing} onEdit={()=>setEditor(project)} showLikeCounts={portfolio.showLikeCounts}/></Suspense></AppErrorBoundary>}
 {page==='project'&&!project&&<section className="simple-page"><h1>Project not found</h1><button onClick={()=>navigate('portfolio')}>Back to portfolio</button></section>}
 {page==='custom'&&customPage&&<AppErrorBoundary compact><Suspense fallback={<div className="simple-page">Loading page…</div>}><CustomPageView page={customPage} editing={editing} onEdit={()=>setCustomPageEditorTarget(customPage.id)}/></Suspense></AppErrorBoundary>}
 {page==='custom'&&!customPage&&<section className="simple-page"><h1>Page not found</h1><p>This page may have moved or been removed.</p><button type="button" className="primary-action" onClick={()=>navigate('inicio')}>Return home</button></section>}
 {page==='inicio'&&<HomePage home={portfolio.home} testimonials={portfolio.testimonials} projects={portfolio.projects} editing={editing} onOpenProject={openProject} onEditProject={setEditor} onEditHome={()=>{setHomeEditorTab('feedback');setHomeEditorOpen(true)}} onNavigatePortfolio={()=>navigate('portfolio')}/>}
 {page==='sobre'&&<AboutPage about={portfolio.about} editing={editing} onEdit={()=>setAboutEditorOpen(true)} onContact={()=>navigate('contato')}/>}
 {page==='contato'&&<ContactPage socials={portfolio.socialLinks} settings={portfolio.contact} demoEnabled={editing} onEdit={()=>setContactEditorOpen(true)}/>}
 </div>
 {editing&&<AppErrorBoundary compact><Suspense fallback={null}><StudioDock pageLabel={pageLabels[page]} editLabel={editingLabel} onEditCurrent={editCurrent} onNewProject={()=>setEditor(null)} onPublish={()=>setGitHubPublishOpen(true)} onExport={portfolio.exportData} onRestorePublished={portfolio.restorePublished} publishedRevision={currentPublishedRevision} onLock={()=>{setEditing(false);setEditor(undefined)}} actions={studioActions}/></Suspense></AppErrorBoundary>} 
  {portfolio.saveError&&<div className="storage-warning" role="alert">{portfolio.saveError}</div>}
 <AppErrorBoundary compact><Suspense fallback={null}>
 {gateOpen&&<AdminGate onUnlock={()=>{setGateOpen(false);setEditing(true)}} onClose={()=>{setGateOpen(false);setSkin3DOpen(false)}}/>}
 {editing&&imageConverterOpen&&<ImageConverter onClose={()=>setImageConverterOpen(false)}/>}
 {editing&&customPageEditorTarget!==null&&<CustomPageEditor key={customPageEditorTarget} initialPageId={customPageEditorTarget} pages={portfolio.customPages} onSavePages={portfolio.setCustomPages} onNavigatePage={navigateCustomPage} onClose={()=>setCustomPageEditorTarget(null)}/>}
 {editing&&skin3DOpen&&<Alquimago3DEditor onClose={()=>setSkin3DOpen(false)} onPublish={()=>setGitHubPublishOpen(true)}/>}
 {editing&&mediaManagerOpen&&<MediaManager store={portfolio} onClose={()=>setMediaManagerOpen(false)} onOpenPublished={()=>{setMediaManagerOpen(false);setGitHubPublishOpen(true)}} onPreparePublished={paths=>{setStagedMediaDeletions(paths);setMediaManagerOpen(false);setGitHubPublishOpen(true)}}/>}
 {editing&&themePaletteOpen&&<ThemePaletteEditor value={portfolio.themePalette} onSave={portfolio.setThemePalette} onClose={()=>setThemePaletteOpen(false)}/>}
 {editing&&siteIdentityOpen&&<SiteIdentityEditor value={{siteFavicon:portfolio.siteFavicon,seoTitle:portfolio.seoTitle,seoDescription:portfolio.seoDescription}} homeBanner={portfolio.home.background} onSave={portfolio.setSiteIdentity} onEditBanner={()=>openHomeTab('home')} onClose={()=>setSiteIdentityOpen(false)}/>}
 {editing&&logoEditorOpen&&<BrandLogoEditor value={{siteLogo:portfolio.siteLogo,siteLogoHover:portfolio.siteLogoHover,siteLogoSize:portfolio.siteLogoSize,siteLogoHoverScale:portfolio.siteLogoHoverScale}} onSave={portfolio.setBranding} onClose={()=>setLogoEditorOpen(false)}/>}
 {editing&&galleryBackgroundEditorOpen&&<GalleryBackgroundEditor value={portfolio.galleryBackground} onSave={portfolio.setGalleryBackground} onClose={()=>setGalleryBackgroundEditorOpen(false)}/>}
 {editing&&githubPublishOpen&&<GitHubPublishEditor store={portfolio} stagedDeletionPaths={stagedMediaDeletions} onPublished={revision=>{portfolio.markPublished(revision);setStagedMediaDeletions([])}} onRestore={portfolio.restorePublished} onExport={portfolio.exportData} onClose={()=>{setGitHubPublishOpen(false);setStagedMediaDeletions([])}}/>}
 {editing&&contactEditorOpen&&<ContactEditor settings={portfolio.contact} links={portfolio.socialLinks} onSave={portfolio.setContactPage} onClose={()=>setContactEditorOpen(false)}/>}
 {editing&&aboutEditorOpen&&<AboutEditor value={portfolio.about} onSave={portfolio.setAbout} onClose={()=>setAboutEditorOpen(false)}/>}
 {editing&&homeEditorOpen&&<HomeEditor initialTab={homeEditorTab} showLikeCounts={portfolio.showLikeCounts} onShowLikeCounts={portfolio.setShowLikeCounts} home={portfolio.home} testimonials={portfolio.testimonials} tracks={portfolio.musicTracks} links={portfolio.socialLinks} onLinks={portfolio.setSocialLinks} onHome={portfolio.setHome} onTestimonials={portfolio.setTestimonials} onTracks={portfolio.setMusicTracks} onClose={()=>setHomeEditorOpen(false)} onExport={portfolio.exportData}/>} 
 {editing&&editor!==undefined&&<AdminEditor key={editor?.id??'new'} project={editor} projects={portfolio.projects} categories={portfolio.categories} onSave={portfolio.update} onDelete={portfolio.remove} onClose={()=>setEditor(undefined)} onCategories={portfolio.setCategories} onExport={portfolio.exportData} onImport={portfolio.importData}/>}
 </Suspense></AppErrorBoundary>
 </div></AssetLibraryProvider></ImageVariantProvider>
}
