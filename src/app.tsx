import { lazy,Suspense,useRef,useEffect,useState } from 'react'
import { Home,Grid2X2,UserRound,Mail,Image as ImageIcon,Heart,Music,Share2,Layers,Palette,ScanLine,Plus,MessageSquare,Eye,EyeOff,ArrowLeft } from 'lucide-react'
import { Sidebar,type Page } from './components/layout/sidebar'
import {moveStudioBlock,duplicateStudioBlock,type BlockAppearance,type BlockAppearancePreview} from './lib/component-settings'
import {reorderCustomPages} from './data/custom-pages'
import {RouteGlitchFallback,RouteGlitchTransition} from './components/ui/route-glitch-transition'
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
const GlitchPaletteEditor=lazy(()=>import('./components/sections/glitch-palette-editor').then(m=>({default:m.GlitchPaletteEditor})))
import { applyThemePalette } from './lib/theme-palette'
import {applyTypography} from './lib/typography'
import {applyStudioControls,normalizeStudioControls} from './lib/studio-controls'
const StudioInspector=lazy(()=>import('./components/sections/studio-inspector').then(m=>({default:m.StudioInspector})))
const StudioCheckpoints=lazy(()=>import('./components/sections/studio-checkpoints').then(m=>({default:m.StudioCheckpoints})))
const StudioCloud=lazy(()=>import('./components/sections/studio-cloud').then(m=>({default:m.StudioCloud})))
const StudioComposition=lazy(()=>import('./components/sections/studio-composition').then(m=>({default:m.StudioComposition})))
const StudioThemeLibrary=lazy(()=>import('./components/sections/studio-theme-library').then(m=>({default:m.StudioThemeLibrary})))
const StudioMaintenance=lazy(()=>import('./components/sections/studio-maintenance').then(m=>({default:m.StudioMaintenance})))
const StudioControlsEditor=lazy(()=>import('./components/sections/studio-controls-editor').then(m=>({default:m.StudioControlsEditor})))
import {applyGlitchPalette} from './lib/glitch-palette'
import {detectCountryByIp,initialLanguage,languageFromCountry,saveLanguageChoice,savedLanguage,type VisitorLanguage} from './lib/visitor-language'
import {observePublicOverlayTranslation,observePublicTranslation,setManualTranslations} from './lib/public-page-translation'
import {AppErrorBoundary} from './components/ui/app-error-boundary'
import {readAlquimagoVisibilityDraft,writeAlquimagoVisibilityDraft} from './lib/alquimago-visibility'
import {alquimagoPublishTokenVault,retireStudioSavedTokens} from './lib/github-token-vault'
import type {StudioAction} from './components/sections/studio-dock'
const StudioDock=lazy(()=>import('./components/sections/studio-dock').then(m=>({default:m.StudioDock})))
const ImageConverter=lazy(()=>import('./components/sections/image-converter').then(m=>({default:m.ImageConverter})))
const MediaManager=lazy(()=>import('./components/sections/media-manager').then(m=>({default:m.MediaManager})))
const Alquimago3DEditor=lazy(()=>import('./components/sections/alquimago-3d-editor').then(m=>({default:m.Alquimago3DEditor})))
const CustomPageEditor=lazy(()=>import('./components/sections/custom-page-editor').then(m=>({default:m.CustomPageEditor})))
import type { Project } from './data/projects'
import { sensitiveCopy,shouldCoverProject } from './lib/sensitive-themes'
function route():Page|'project'|'custom'{const part=location.hash.replace(/^#\/?/,'');return part.startsWith('project/')?'project':part.startsWith('page/')?'custom':(['inicio','portfolio','sobre','contato'].includes(part)?part as Page:'inicio')}
export function App(){
 // Migration: remove all legacy Studio publishing tokens on the next site load.
 // The current Alquimago v2 vault is deliberately not touched.
 useEffect(()=>{
  void retireStudioSavedTokens().catch(()=>{
   console.warn('[Studio] Browser did not allow old publishing credentials to be cleared.')
  })
 },[])
 const [page,setPage]=useState(route)
 // Displayed content stays on the outgoing route until the glitch covers it.
 const [visibleRouteHash,setVisibleRouteHash]=useState(()=>location.hash||'#/inicio')
 const [routeIdentity,setRouteIdentity]=useState(()=>location.hash||'#/inicio')
 const routeRef=useRef(location.hash||'#/inicio')
 const pendingPage=useRef<Page|'project'|'custom'|null>(null)
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


 const [gateOpen,setGateOpen]=useState(false)
 const [editor,setEditor]=useState<Project|null|undefined>(undefined)
 const [projectBlockTarget,setProjectBlockTarget]=useState<string|null>(null)
 const [homeEditorOpen,setHomeEditorOpen]=useState(false)
 // Preload contextual editors when Studio unlocks so frequent deployments do
 // not invalidate their lazy chunks while the owner is working on the page.
 useEffect(()=>{
  if(!editing)return
  void import('./components/sections/home-editor').catch(()=>{})
  void import('./components/sections/gallery-background-editor').catch(()=>{})
 },[editing])
 const [aboutEditorOpen,setAboutEditorOpen]=useState(false)
 const [contactEditorOpen,setContactEditorOpen]=useState(false)
 const [githubPublishOpen,setGitHubPublishOpen]=useState(false)
 const [publishSource,setPublishSource]=useState<'studio'|'alquimago'>('studio')
 const openPublishDialog=(source:'studio'|'alquimago')=>{
  setPublishSource(source)
  setGitHubPublishOpen(true)
 }
 const [galleryBackgroundEditorOpen,setGalleryBackgroundEditorOpen]=useState(false)
 const [logoEditorOpen,setLogoEditorOpen]=useState(false)
 const [siteIdentityOpen,setSiteIdentityOpen]=useState(false)
 const [themePaletteOpen,setThemePaletteOpen]=useState(false)
 const [controlsTab,setControlsTab]=useState<'layout'|'motion'|'features'|'navigation'|'translations'|null>(null)
 const [glitchPaletteOpen,setGlitchPaletteOpen]=useState(false)
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
 const [homeEditorTab,setHomeEditorTab]=useState<'home'|'featured'|'feedback'|'music'|'socials'|'likes'>('home')
 const portfolio=usePortfolio(editing)
 const controls=normalizeStudioControls(portfolio.studioControls)
 const [previewDraft,setPreviewDraft]=useState(false)
 const [inspectorOpen,setInspectorOpen]=useState(false)
 const [appearancePreview,setAppearancePreview]=useState<BlockAppearancePreview|undefined>(undefined)
 useEffect(()=>{setInspectorOpen(false);setAppearancePreview(undefined)},[visibleRouteHash])
 useEffect(()=>{if(!inspectorOpen)setAppearancePreview(undefined)},[inspectorOpen])
 const [checkpointsOpen,setCheckpointsOpen]=useState(false)
 const [cloudOpen,setCloudOpen]=useState(false)
 const [compositionOpen,setCompositionOpen]=useState(false)
 const [componentTarget,setComponentTarget]=useState<string|null>(null)
 const [themeLibraryOpen,setThemeLibraryOpen]=useState(false)
 const [maintenanceTab,setMaintenanceTab]=useState<'history'|'health'|null>(null)
 const viewEditing=editing&&!previewDraft
 useEffect(()=>{
  if(!editing||githubPublishOpen)return
  const key=(event:KeyboardEvent)=>{
   if(!(event.ctrlKey||event.metaKey)||event.altKey||event.defaultPrevented)return
   const target=event.target instanceof Element?event.target:null
   if(target?.closest('input,textarea,select,[contenteditable=true]')||document.querySelector('.editor-overlay,[aria-modal=true],.studio-inspector'))return
   const name=event.key.toLowerCase()
   if(name==='z'&&!event.shiftKey&&portfolio.historyInfo.past.length){event.preventDefault();portfolio.undo()}
   else if((name==='y'||(name==='z'&&event.shiftKey))&&portfolio.historyInfo.future.length){event.preventDefault();portfolio.redo()}
  }
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[editing,githubPublishOpen,portfolio.undo,portfolio.redo,portfolio.historyInfo.past.length,portfolio.historyInfo.future.length])
 useEffect(()=>{
  setManualTranslations(normalizeStudioControls(portfolio.studioControls).translations)
  document.documentElement.lang=visitorLanguage==='pt'?'pt-BR':visitorLanguage
  const root=document.querySelector<HTMLElement>('.site-shell')
  const stopPage=root?observePublicTranslation(root,visitorLanguage):()=>{}
  // Art and PDF lightboxes are public React portals outside the page shell.
  const stopLightboxes=observePublicOverlayTranslation(visitorLanguage)
  return ()=>{stopLightboxes();stopPage()}
 },[visitorLanguage,portfolio.studioControls,editing])
 useEffect(()=>{applyStudioControls(portfolio.studioControls)},[portfolio.studioControls])
 const lockStudio=()=>{
  if(githubPublishOpen)return
  setEditing(false);setGateOpen(false);setEditor(undefined);setProjectBlockTarget(null);setHomeEditorOpen(false);setAboutEditorOpen(false);setContactEditorOpen(false)
  setGalleryBackgroundEditorOpen(false);setLogoEditorOpen(false);setSiteIdentityOpen(false);setThemePaletteOpen(false);setGlitchPaletteOpen(false)
  setImageConverterOpen(false);setMediaManagerOpen(false);setSkin3DOpen(false);setCustomPageEditorTarget(null);setControlsTab(null);setMaintenanceTab(null);setThemeLibraryOpen(false);setCompositionOpen(false);setCloudOpen(false);setCheckpointsOpen(false);setComponentTarget(null);setPreviewDraft(false);setInspectorOpen(false);setStagedMediaDeletions([])
 }
 const [galleryFilter,setGalleryFilter]=useState('SFW')
 const [revealedProjects,setRevealedProjects]=useState<Set<string>>(()=>new Set())
 // Navigation starts a signal corruption burst even when all route chunks are cached.
 // Only swap the content after the cover phase has concealed the outgoing page.
 const switchRoute=(hash:string,next:Page|'project'|'custom',writeHash:boolean)=>{
  if(routeRef.current===hash)return
  routeRef.current=hash
  pendingPage.current=next
  if(writeHash&&location.hash!==hash)location.hash=hash
  setRouteIdentity(hash)
 }
 const commitRoute=(hash:string)=>{
  // Ignore obsolete animation events when visitors navigate several times rapidly.
  if(routeRef.current!==hash)return
  const next=pendingPage.current
  if(next===null)return
  pendingPage.current=null
  setVisibleRouteHash(hash)
  setPage(next)
  window.scrollTo(0,0)
 }
 const navigate=(next:Page)=>switchRoute('#/'+next,next,true)
 const navigateCustomPage=(id:string)=>switchRoute('#/page/'+id,'custom',true)
 const openHomeTab=(tab:'home'|'featured'|'feedback'|'music'|'socials'|'likes')=>{setHomeEditorTab(tab);setHomeEditorOpen(true)}
 const projectId=visibleRouteHash.replace(/^#\/project\//,'')
 const project=portfolio.projects.find(p=>p.id===projectId)
 const customPageId=visibleRouteHash.replace(/^#\/page\//,'').split('/')[0]
 const customPage=page==='custom'?portfolio.customPages.find(item=>item.id===customPageId):undefined
 const openProject=(p:Project)=>switchRoute('#/project/'+p.id,'project',true)
 const pageLabels:Record<Page|'project'|'custom',string>={inicio:'Home',portfolio:'Galeria',sobre:'Sobre',contato:'Contato',project:'Projeto',custom:customPage?.navLabel??'Página'}
 const nativeComposition=page!=='project'&&page!=='custom'?portfolio.customPages.find(p=>p.id===portfolio.nativeLayouts?.[page]):undefined
 const inspectedPage=nativeComposition??customPage
 const inspectedProject=page==='project'&&project&&!shouldCoverProject(project,revealedProjects)?project:undefined
 const inspectedBlocks=inspectedProject?.blocks??inspectedPage?.blocks
 const saveInspected=(id:string,appearance?:BlockAppearance)=>{
  if(inspectedProject)portfolio.update({...inspectedProject,blocks:inspectedProject.blocks.map(b=>b.id===id?{...b,appearance}:b)})
  else if(inspectedPage)portfolio.setCustomPages(portfolio.customPages.map(p=>p.id===inspectedPage.id?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,appearance}:b)}:p))
 }
 const moveInspected=(id:string,delta:number)=>{
  if(inspectedProject)portfolio.update({...inspectedProject,blocks:moveStudioBlock(inspectedProject.blocks,id,delta)})
  else if(inspectedPage)portfolio.setCustomPages(portfolio.customPages.map(p=>p.id===inspectedPage.id?{...p,blocks:moveStudioBlock(p.blocks,id,delta)}:p))
 }
 const duplicateInspected=(id:string)=>{
  const newId='block-'+crypto.randomUUID()
  if(inspectedProject)portfolio.update({...inspectedProject,blocks:duplicateStudioBlock(inspectedProject.blocks,id,newId)})
  else if(inspectedPage)portfolio.setCustomPages(portfolio.customPages.map(p=>p.id===inspectedPage.id?{...p,blocks:duplicateStudioBlock(p.blocks,id,newId)}:p))
 }
 const openComponent=(pageId:string,blockId:string)=>{setInspectorOpen(false);setComponentTarget(blockId);setCustomPageEditorTarget(pageId)}
 const editCurrent=()=>{if(nativeComposition){setCustomPageEditorTarget(nativeComposition.id);return}if(page==='inicio')openHomeTab('home');else if(page==='portfolio')setGalleryBackgroundEditorOpen(true);else if(page==='sobre')setAboutEditorOpen(true);else if(page==='contato')setContactEditorOpen(true);else if(page==='custom')setCustomPageEditorTarget(customPage?.id??'manage');else setEditor(project??null)}
 const editingLabel=page==='project'?'Editar projeto':page==='custom'?'Editar página':page==='portfolio'?'Editar galeria':'Editar página'
 const studioActions:StudioAction[]=[
  ...(inspectedBlocks&&!previewDraft?[{id:'visual-inspector',label:'Inspetor visual',description:'Hierarquia, seleção e propriedades dos blocos da página atual',section:'Páginas' as const,icon:ScanLine,onClick:()=>setInspectorOpen(true)}]:[]),
  {id:'home',label:'Home',description:'Apresentação, banner e conteúdo inicial',section:'Páginas',icon:Home,onClick:()=>openHomeTab('home')},
  {id:'featured-projects',label:'Projetos em destaque',description:'Escolher e reorganizar as 3 obras exibidas na Home',section:'Projetos',icon:Grid2X2,onClick:()=>openHomeTab('featured')},
  {id:'about',label:'Sobre',description:'Bio, especialidades e imagens',section:'Páginas',icon:UserRound,onClick:()=>setAboutEditorOpen(true)},
  {id:'contact',label:'Contato',description:'Apresentação e redes para contato direto',section:'Páginas',icon:Mail,onClick:()=>setContactEditorOpen(true)},
  {id:'gallery',label:'Galeria',description:'Textos e imagem da galeria',section:'Páginas',icon:Grid2X2,onClick:()=>setGalleryBackgroundEditorOpen(true)},
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
  {id:'draft-preview',label:previewDraft?'Sair da prévia':'Prévia do visitante',description:'Visualizar o rascunho sem os botões contextuais de edição',section:'Páginas',icon:Eye,onClick:()=>setPreviewDraft(value=>!value)},
  {id:'studio-cloud',label:'Rascunho na nuvem',description:'Transferir backups privados entre dispositivos',section:'Sistema',icon:Layers,onClick:()=>setCloudOpen(true)},
  {id:'studio-checkpoints',label:'Pontos de recuperação',description:'Cópias persistentes do rascunho e mídias locais',section:'Sistema',icon:Layers,onClick:()=>setCheckpointsOpen(true)},
  {id:'studio-history',label:'Histórico local',description:'Desfazer e refazer alterações recentes do rascunho',section:'Sistema',icon:Layers,onClick:()=>setMaintenanceTab('history')},
  {id:'studio-health',label:'Diagnóstico',description:'Verificação de referências, contraste e integridade',section:'Sistema',icon:ScanLine,onClick:()=>setMaintenanceTab('health')},
  {id:'theme-library',label:'Biblioteca de temas',description:'Salvar, importar, exportar e reutilizar identidades visuais',section:'Identidade',icon:Palette,onClick:()=>setThemeLibraryOpen(true)},
  {id:'native-composition',label:'Compositor e modelos',description:'Layouts nativos, modelos de páginas e componentes vinculados',section:'Páginas',icon:Layers,onClick:()=>setCompositionOpen(true)},
  {id:'global-layout',label:'Layout e materiais',description:'Dimensões, espaçamento, cantos e Liquid Glass por dispositivo',section:'Identidade',icon:Layers,onClick:()=>setControlsTab('layout')},
  {id:'global-motion',label:'Animações',description:'Modo e duração da transição de páginas',section:'Identidade',icon:ScanLine,onClick:()=>setControlsTab('motion')},
  {id:'global-features',label:'Funcionalidades',description:'Ativar ou ocultar módulos públicos',section:'Conteúdo',icon:Eye,onClick:()=>setControlsTab('features')},
  {id:'global-navigation',label:'Navegação',description:'Ordem, nomes, ícones e visibilidade do menu',section:'Páginas',icon:Grid2X2,onClick:()=>setControlsTab('navigation')},
  {id:'global-translations',label:'Traduções',description:'Revisar frases em português e espanhol',section:'Conteúdo',icon:MessageSquare,onClick:()=>setControlsTab('translations')},
  {id:'palette',label:'Paleta de cores',description:'Círculo cromático, HEX, RGB e variáveis globais',section:'Identidade',icon:Palette,onClick:()=>setThemePaletteOpen(true)},
  {id:'glitch-palette',label:'Paleta do glitch',description:'Cores neon, ruído, intensidade e prévia da transição',section:'Identidade',icon:ScanLine,onClick:()=>setGlitchPaletteOpen(true)},
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
 useEffect(()=>{applyThemePalette(portfolio.themePalette);applyTypography(portfolio.typography)},[portfolio.themePalette,portfolio.typography])
 useEffect(()=>{applyGlitchPalette(portfolio.glitchPalette)},[portfolio.glitchPalette])
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
  if(!editing)return
  const onAlquimagoPublish=(event:Event)=>{
   // Only the exact command submitted inside Alquimago's Studio chat opens this
   // panel. A visible shortcut, generic browser event, or AI reply cannot.
   if(githubPublishOpen||!(event instanceof CustomEvent)||
    event.detail?.source!=='chat'||event.detail?.action!=='review-only')return
   setPublishSource('alquimago')
   setGitHubPublishOpen(true)
   {
    void alquimagoPublishTokenVault.inspect().then(status=>{
     // Never expose a PAT, a crypto key, or any credential in public events.
     window.dispatchEvent(new CustomEvent('alquimago:publish-auth-status',{detail:{status:status.status}}))
    }).catch(()=>{
     window.dispatchEvent(new CustomEvent('alquimago:publish-auth-status',{detail:{status:'unavailable'}}))
    })
   }
  }
  window.addEventListener('alquimago:request-publish',onAlquimagoPublish)
  return()=>window.removeEventListener('alquimago:request-publish',onAlquimagoPublish)
 },[editing,githubPublishOpen])
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

 useEffect(()=>{
  const sync=()=>switchRoute(location.hash||'#/inicio',route(),false)
  window.addEventListener('hashchange',sync)
  return()=>window.removeEventListener('hashchange',sync)
 },[])
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.ctrlKey&&(e.key==='\\'||e.code==='Backslash')){e.preventDefault();if(editing){lockStudio()}else setGateOpen(true)}else if(e.key==='Escape'&&gateOpen)setGateOpen(false)}
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[editing,gateOpen,githubPublishOpen])
 return <ImageVariantProvider variants={portfolio.imageVariants??{}}><AssetLibraryProvider projects={portfolio.projects} categories={portfolio.categories} home={portfolio.home} about={portfolio.about} galleryBackground={portfolio.galleryBackground} siteLogo={portfolio.siteLogo} siteLogoHover={portfolio.siteLogoHover} siteFavicon={portfolio.siteFavicon} tracks={portfolio.musicTracks} pages={portfolio.customPages}><div className={page==='inicio'?'site-shell home-route':page==='contato'?'site-shell contact-route':page==='sobre'?'site-shell about-route':'site-shell'}><Sidebar controls={controls} page={page==='project'?'portfolio':page} navigate={navigate} customPages={portfolio.customPages} customPageId={customPage?.id} onOpenCustomPage={navigateCustomPage} onManagePages={()=>setCustomPageEditorTarget('manage')} onReorderCustomPages={(fromId,toId)=>portfolio.setCustomPages(reorderCustomPages(portfolio.customPages,fromId,toId))} tracks={portfolio.musicTracks} siteLogo={portfolio.siteLogo} siteLogoHover={portfolio.siteLogoHover} siteLogoSize={portfolio.siteLogoSize} siteLogoHoverScale={portfolio.siteLogoHoverScale} editing={viewEditing} onEditLogo={()=>setLogoEditorOpen(true)}/><RouteGlitchTransition routeKey={routeIdentity} onCovered={commitRoute} motion={controls.motion}/><div className="site-main"><SocialBar links={portfolio.socialLinks} editing={viewEditing} onEdit={()=>{setHomeEditorTab('socials');setHomeEditorOpen(true)}} language={visitorLanguage} onLanguageChange={changeVisitorLanguage}/>
 {page==='portfolio'&&!nativeComposition&&<AppErrorBoundary compact><Suspense fallback={<RouteGlitchFallback/>}><Gallery filter={galleryFilter} onFilterChange={setGalleryFilter} revealedProjects={revealedProjects} headingSymbol={portfolio.headingSymbol} language={visitorLanguage} projects={portfolio.projects} categories={portfolio.categories} onOpen={openProject} editing={viewEditing} onAdd={()=>setEditor(null)} onEdit={setEditor} onReorder={portfolio.reorderProjects} heroImage={portfolio.galleryBackground} heroFocus={portfolio.galleryFocus} content={portfolio.galleryContent}/></Suspense></AppErrorBoundary>}
 {page==='project'&&project&&shouldCoverProject(project,revealedProjects)&&<section className="sensitive-project-warning" aria-labelledby="sensitive-warning-title" translate="no"><div className="sensitive-warning-panel"><div className="sensitive-warning-symbol" aria-hidden="true"><EyeOff size={28} strokeWidth={1.65}/></div><h1 id="sensitive-warning-title">{sensitiveCopy(visitorLanguage).warningTitle}</h1><p>{sensitiveCopy(visitorLanguage).warningText}</p><div className="sensitive-warning-actions"><button className="primary-action sensitive-warning-button" type="button" onClick={()=>navigate('portfolio')}><ArrowLeft size={17} aria-hidden="true"/><span>{sensitiveCopy(visitorLanguage).back}</span></button><button className="secondary-action sensitive-warning-button" type="button" onClick={()=>setRevealedProjects(previous=>new Set([...previous,project.id]))}><Eye size={17} aria-hidden="true"/><span>{sensitiveCopy(visitorLanguage).continue}</span></button></div></div></section>}
 {page==='project'&&project&&!shouldCoverProject(project,revealedProjects)&&<AppErrorBoundary compact><Suspense fallback={<RouteGlitchFallback/>}><ProjectPage appearancePreview={inspectorOpen?appearancePreview:undefined} project={project} onBack={()=>navigate('portfolio')} editing={viewEditing} onEdit={()=>{setInspectorOpen(false);setEditor(project)}} onEditBlock={id=>{setInspectorOpen(false);setProjectBlockTarget(id);setEditor(project)}} showLikeCounts={portfolio.showLikeCounts} headingSymbol={portfolio.headingSymbol}/></Suspense></AppErrorBoundary>}
 {page==='project'&&!project&&<section className="simple-page"><h1>Project not found</h1><button onClick={()=>navigate('portfolio')}>Back to portfolio</button></section>}
 {nativeComposition&&<AppErrorBoundary compact><Suspense fallback={<RouteGlitchFallback/>}><CustomPageView appearancePreview={inspectorOpen?appearancePreview:undefined} page={nativeComposition} pages={portfolio.customPages} editing={viewEditing} headingSymbol={portfolio.headingSymbol} onEdit={()=>{setInspectorOpen(false);setCustomPageEditorTarget(nativeComposition.id)}} onEditBlock={id=>openComponent(nativeComposition.id,id)}/></Suspense></AppErrorBoundary>}
 {page==='custom'&&customPage&&<AppErrorBoundary compact><Suspense fallback={<RouteGlitchFallback/>}><CustomPageView appearancePreview={inspectorOpen?appearancePreview:undefined} page={customPage} pages={portfolio.customPages} onEditBlock={id=>openComponent(customPage.id,id)} editing={viewEditing} headingSymbol={portfolio.headingSymbol} onEdit={()=>{setInspectorOpen(false);setCustomPageEditorTarget(customPage.id)}}/></Suspense></AppErrorBoundary>}
 {page==='custom'&&!customPage&&<section className="simple-page"><h1>Page not found</h1><p>This page may have moved or been removed.</p><button type="button" className="primary-action" onClick={()=>navigate('inicio')}>Return home</button></section>}
 {page==='inicio'&&!nativeComposition&&<HomePage moduleOrder={portfolio.homeModuleOrder} onEditIntro={()=>openHomeTab('home')} features={controls.features} headingSymbol={portfolio.headingSymbol} profileName={portfolio.about.name} home={portfolio.home} testimonials={portfolio.testimonials} projects={portfolio.projects} editing={viewEditing} onOpenProject={openProject} onEditProject={setEditor} onEditHome={()=>openHomeTab('feedback')} onManageFeatured={()=>openHomeTab('featured')} onNavigatePortfolio={()=>navigate('portfolio')}/>}
 {page==='sobre'&&!nativeComposition&&<AboutPage headingSymbol={portfolio.headingSymbol} about={portfolio.about} editing={viewEditing} onEdit={()=>setAboutEditorOpen(true)} onContact={()=>navigate('contato')}/>}
 {page==='contato'&&!nativeComposition&&<ContactPage headingSymbol={portfolio.headingSymbol} socials={portfolio.socialLinks} settings={portfolio.contact} demoEnabled={viewEditing} onEdit={()=>setContactEditorOpen(true)}/>}
 </div>
 {viewEditing&&!inspectorOpen&&<AppErrorBoundary compact><Suspense fallback={null}><StudioDock pageLabel={pageLabels[page]} editLabel={editingLabel} onEditCurrent={editCurrent} onUndo={portfolio.undo} onRedo={portfolio.redo} canUndo={portfolio.historyInfo.past.length>0} canRedo={portfolio.historyInfo.future.length>0} onNewProject={()=>setEditor(null)} onPublish={()=>openPublishDialog('studio')} onExport={portfolio.exportData} onImport={portfolio.importData} onRestorePublished={portfolio.restorePublished} publishedRevision={currentPublishedRevision} onLock={lockStudio} actions={studioActions}/></Suspense></AppErrorBoundary>} 
 {viewEditing&&inspectorOpen&&inspectedBlocks&&<AppErrorBoundary compact><Suspense fallback={null}><StudioInspector key={visibleRouteHash} title={inspectedProject?.title??inspectedPage?.navLabel??'Página'} blocks={inspectedBlocks} onSave={saveInspected} onPreview={setAppearancePreview} onMove={moveInspected} onDuplicate={duplicateInspected} onEdit={id=>{setInspectorOpen(false);if(inspectedProject){setProjectBlockTarget(id);setEditor(inspectedProject)}else if(inspectedPage)openComponent(inspectedPage.id,id)}} onClose={()=>setInspectorOpen(false)}/></Suspense></AppErrorBoundary>}
  {editing&&previewDraft&&<button type="button" className="studio-preview-exit" onClick={()=>setPreviewDraft(false)}>Sair da prévia</button>}
 {portfolio.saveError&&<div className="storage-warning" role="alert">{portfolio.saveError}</div>}
 <AppErrorBoundary compact editorOverlay><Suspense fallback={null}>
 {gateOpen&&<AdminGate onUnlock={()=>{setGateOpen(false);setEditing(true)}} onClose={()=>{setGateOpen(false);setSkin3DOpen(false)}}/>}
 {editing&&imageConverterOpen&&<ImageConverter onClose={()=>setImageConverterOpen(false)}/>}
 {editing&&customPageEditorTarget!==null&&<CustomPageEditor key={customPageEditorTarget} initialPageId={customPageEditorTarget} initialBlockId={componentTarget} pages={portfolio.customPages} onSavePages={portfolio.setCustomPages} onNavigatePage={navigateCustomPage} onClose={()=>{setCustomPageEditorTarget(null);setComponentTarget(null)}}/>}
 {editing&&skin3DOpen&&<Alquimago3DEditor onClose={()=>setSkin3DOpen(false)} onPublish={()=>openPublishDialog('studio')}/>}
 {editing&&mediaManagerOpen&&<MediaManager store={portfolio} onClose={()=>setMediaManagerOpen(false)} onOpenPublished={()=>{setMediaManagerOpen(false);openPublishDialog('studio')}} onPreparePublished={paths=>{setStagedMediaDeletions(paths);setMediaManagerOpen(false);openPublishDialog('studio')}}/>}
 {editing&&cloudOpen&&<StudioCloud onBackup={portfolio.buildBackup} onImport={portfolio.importData} onClose={()=>setCloudOpen(false)}/>}
 {editing&&checkpointsOpen&&<StudioCheckpoints onCreate={()=>portfolio.makeCheckpoint()} onRestore={portfolio.recoverCheckpoint} onClose={()=>setCheckpointsOpen(false)}/>}
 {editing&&compositionOpen&&<StudioComposition pages={portfolio.customPages} layouts={portfolio.nativeLayouts??{}} homeModuleOrder={portfolio.homeModuleOrder} onSetHomeModuleOrder={portfolio.setHomeModuleOrder} onSetLayouts={portfolio.setNativeLayouts} onAddPage={next=>{portfolio.setCustomPages([next,...portfolio.customPages]);setCompositionOpen(false);setCustomPageEditorTarget(next.id)}} onEditPage={id=>{setCompositionOpen(false);setCustomPageEditorTarget(id)}} onClose={()=>setCompositionOpen(false)}/>}
 {editing&&themeLibraryOpen&&<StudioThemeLibrary store={portfolio} onApply={portfolio.applyDesignTheme} onClose={()=>setThemeLibraryOpen(false)}/>}
 {editing&&maintenanceTab&&<StudioMaintenance tab={maintenanceTab} historyStorage={portfolio.historyStorage} past={portfolio.historyInfo.past} future={portfolio.historyInfo.future} onUndo={portfolio.undo} onRedo={portfolio.redo} onAudit={portfolio.runAudit} onClose={()=>setMaintenanceTab(null)}/>}
 {editing&&controlsTab&&<StudioControlsEditor value={portfolio.studioControls} initialTab={controlsTab} onSave={portfolio.setStudioControls} onClose={()=>setControlsTab(null)}/>}
 {editing&&themePaletteOpen&&<ThemePaletteEditor symbol={portfolio.headingSymbol} value={portfolio.themePalette} typography={portfolio.typography} onSave={portfolio.setThemePalette} onClose={()=>setThemePaletteOpen(false)}/>}
 {editing&&glitchPaletteOpen&&<GlitchPaletteEditor value={portfolio.glitchPalette} onSave={portfolio.setGlitchPalette} onClose={()=>setGlitchPaletteOpen(false)}/>}
 {editing&&siteIdentityOpen&&<SiteIdentityEditor value={{siteFavicon:portfolio.siteFavicon,seoTitle:portfolio.seoTitle,seoDescription:portfolio.seoDescription}} homeBanner={portfolio.home.background} onSave={portfolio.setSiteIdentity} onEditBanner={()=>openHomeTab('home')} onClose={()=>setSiteIdentityOpen(false)}/>}
 {editing&&logoEditorOpen&&<BrandLogoEditor value={{siteLogo:portfolio.siteLogo,siteLogoHover:portfolio.siteLogoHover,siteLogoSize:portfolio.siteLogoSize,siteLogoHoverScale:portfolio.siteLogoHoverScale}} onSave={portfolio.setBranding} onClose={()=>setLogoEditorOpen(false)}/>}
 {editing&&galleryBackgroundEditorOpen&&<GalleryBackgroundEditor value={portfolio.galleryBackground} focus={portfolio.galleryFocus} content={portfolio.galleryContent} headingSymbol={portfolio.headingSymbol} onSave={({background,content,focus})=>portfolio.setGalleryPage(background,content,focus)} onClose={()=>setGalleryBackgroundEditorOpen(false)}/>}
 {editing&&githubPublishOpen&&<GitHubPublishEditor key={publishSource} entryPoint={publishSource} store={portfolio} stagedDeletionPaths={publishSource==='studio'?stagedMediaDeletions:[]} onPublished={(revision,snapshot)=>{portfolio.markPublished(revision,snapshot);setStagedMediaDeletions([])}} onRestore={portfolio.restorePublished} onExport={portfolio.exportData} onClose={()=>{setGitHubPublishOpen(false);setStagedMediaDeletions([])}}/>}
 {editing&&contactEditorOpen&&<ContactEditor settings={portfolio.contact} links={portfolio.socialLinks} onSave={portfolio.setContactPage} onClose={()=>setContactEditorOpen(false)}/>}
 {editing&&aboutEditorOpen&&<AboutEditor value={portfolio.about} onSave={portfolio.setAbout} onClose={()=>setAboutEditorOpen(false)}/>}
 {editing&&homeEditorOpen&&<HomeEditor initialTab={homeEditorTab} projects={portfolio.projects} onFeaturedProjects={portfolio.setFeaturedProjects} showLikeCounts={portfolio.showLikeCounts} onShowLikeCounts={portfolio.setShowLikeCounts} home={portfolio.home} testimonials={portfolio.testimonials} tracks={portfolio.musicTracks} links={portfolio.socialLinks} onLinks={portfolio.setSocialLinks} onHome={portfolio.setHome} onTestimonials={portfolio.setTestimonials} onTracks={portfolio.setMusicTracks} onClose={()=>setHomeEditorOpen(false)} onExport={portfolio.exportData}/>} 
 {editing&&editor!==undefined&&<AdminEditor key={(editor?.id??'new')+':'+(projectBlockTarget??'')} initialBlockId={projectBlockTarget} project={editor} projects={portfolio.projects} categories={portfolio.categories} onSave={portfolio.update} onDelete={portfolio.remove} onClose={()=>{setEditor(undefined);setProjectBlockTarget(null)}} onCategories={portfolio.setCategories} onExport={portfolio.exportData} onImport={portfolio.importData}/>}
 </Suspense></AppErrorBoundary>
 </div></AssetLibraryProvider></ImageVariantProvider>
}
