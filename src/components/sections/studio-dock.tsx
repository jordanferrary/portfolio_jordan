import '../../styles/studio-dock.css'
import { useEffect,useRef,useState } from 'react'
import {
 ArrowRight,BookOpen,ChevronDown,CloudUpload,Download,FileText,
 FolderKanban,LayoutGrid,LockKeyhole,Palette,Plus,Search,
 Settings2,Sparkles,WandSparkles,X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StudioSection='Páginas'|'Projetos'|'Familiar'|'Conteúdo'|'Identidade'
export type StudioAction={
 id:string;label:string;description:string;section:StudioSection;icon:LucideIcon;onClick:()=>void
}
type Props={
 pageLabel:string
 editLabel:string
 onEditCurrent:()=>void
 onNewProject:()=>void
 onPublish:()=>void
 onExport:()=>Promise<void>
 onRestorePublished:()=>void
 publishedRevision:string
 onLock:()=>void
 actions:StudioAction[]
}
type Workspace='overview'|'system'|StudioSection
const CATEGORIES:{id:StudioSection;description:string;icon:LucideIcon}[]=[
 {id:'Páginas',description:'Estrutura e conteúdo de cada página',icon:FileText},
 {id:'Projetos',description:'Obras, galerias e apresentações',icon:FolderKanban},
 {id:'Conteúdo',description:'Mídias, redes sociais e outras informações',icon:LayoutGrid},
 {id:'Identidade',description:'Cores, tipografia e direção de arte',icon:Palette},
 {id:'Familiar',description:'Alquimago, Grimório e modelos 3D',icon:WandSparkles}
]

/**
 * A consistent editor workspace: navigational categories on the left and a
 * focused set of real actions on the right. No decorative or inert controls.
 */
export function StudioDock({
 pageLabel,editLabel,onEditCurrent,onNewProject,onPublish,onExport,
 onRestorePublished,publishedRevision,onLock,actions
}:Props){
 const [open,setOpen]=useState(false)
 const [query,setQuery]=useState('')
 const [section,setSection]=useState<Workspace>('overview')
 const searchRef=useRef<HTMLInputElement>(null)
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const pointer=(event:PointerEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false)
  }
  const escape=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setOpen(false)
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
    event.preventDefault();searchRef.current?.focus()
   }
  }
  document.addEventListener('pointerdown',pointer)
  document.addEventListener('keydown',escape)
  return ()=>{
   document.removeEventListener('pointerdown',pointer)
   document.removeEventListener('keydown',escape)
  }
 },[open])
 const invoke=(callback:()=>void)=>{setOpen(false);callback()}
 const choose=(next:Workspace)=>{setSection(next);setQuery('')}
 const normalized=query.toLocaleLowerCase('pt-BR').trim()
 const matching=actions.filter(action=>
  !normalized||[action.label,action.description,action.section]
   .some(value=>value.toLocaleLowerCase('pt-BR').includes(normalized))
 )
 const buildCode=String(import.meta.env.VITE_BUILD_SHA||'local').slice(0,7)
 const categoriesWithCount=CATEGORIES.map(category=>({
  ...category,count:actions.filter(action=>action.section===category.id).length
 }))
 const featuredIds=['palette','new-project','alquimago-grimorio','alquimago-skin3d','media-manager','custom-pages']
 const featured=featuredIds.map(id=>actions.find(action=>action.id===id))
  .filter((action):action is StudioAction=>Boolean(action))
 const visible=normalized?matching:actions.filter(action=>action.section===section)
 const current=CATEGORIES.find(category=>category.id===section)
 const tile=(action:StudioAction)=>{
  const Icon=action.icon
  return <button type="button" key={action.id} className="studio-hub-item"
   onClick={()=>invoke(action.onClick)}>
    <span className="studio-hub-icon"><Icon size={20} aria-hidden="true"/></span>
    <span className="studio-hub-item-copy">
     <strong>{action.label}</strong><small>{action.description}</small>
    </span>
    <ArrowRight size={15} className="studio-hub-item-arrow" aria-hidden="true"/>
   </button>
 }
 return <div className="studio-dock-anchor" lang="pt-BR" ref={root}>
  {open&&<div id="studio-hub" className="studio-hub" role="dialog"
   aria-label="Central de ferramentas do Local Studio" aria-modal="false">
   <header className="studio-hub-header">
    <div className="studio-hub-identity">
     <span className="studio-hub-emblem"><Sparkles size={20} aria-hidden="true"/></span>
     <div><span className="studio-hub-eyebrow">AMBIENTE CRIATIVO</span>
      <h2>Local Studio</h2>
      <p>Edite, personalize e publique com controle sobre cada etapa.</p>
     </div>
    </div>
    <div className="studio-hub-header-actions">
     <span className="studio-hub-draft-indicator"><span/> Rascunho local</span>
     <button type="button" className="studio-hub-close" onClick={()=>setOpen(false)}
      aria-label="Fechar central de ferramentas"><X size={18}/></button>
    </div>
   </header>
   <div className="studio-hub-body">
    <nav className="studio-hub-sidebar" aria-label="Categorias do Local Studio">
     <button type="button" className={'studio-hub-nav-item'+(section==='overview'?' selected':'')}
      aria-current={section==='overview'?'page':undefined} onClick={()=>choose('overview')}>
      <LayoutGrid size={17}/><span>Visão geral</span>
     </button>
     <span className="studio-hub-nav-caption">ÁREAS DE TRABALHO</span>
     {categoriesWithCount.map(category=>{
      const Icon=category.icon
      return <button type="button" key={category.id}
       className={'studio-hub-nav-item'+(section===category.id?' selected':'')}
       aria-current={section===category.id?'page':undefined} onClick={()=>choose(category.id)}>
       <Icon size={17}/><span>{category.id}</span>
       <small>{category.count}</small>
      </button>
     })}
     <span className="studio-hub-nav-caption studio-hub-nav-caption-system">SISTEMA</span>
     <button type="button" className={'studio-hub-nav-item'+(section==='system'?' selected':'')}
      aria-current={section==='system'?'page':undefined} onClick={()=>choose('system')}>
      <Settings2 size={17}/><span>Gerenciamento</span>
     </button>
    </nav>
    <section className="studio-hub-workspace" aria-label="Ferramentas selecionadas">
     <div className="studio-hub-search">
      <Search size={17} aria-hidden="true"/>
      <input ref={searchRef} type="search" value={query}
       onChange={event=>setQuery(event.target.value)}
       placeholder="Pesquisar ferramentas, páginas ou ações..."
       aria-label="Pesquisar ferramentas do Local Studio"/>
      {query?<button type="button" className="studio-hub-search-clear"
        onClick={()=>{setQuery('');searchRef.current?.focus()}} aria-label="Limpar pesquisa"><X size={15}/></button>
       :<kbd>Ctrl K</kbd>}
     </div>
     <div className="studio-hub-workspace-scroll">
      {normalized?<div className="studio-hub-section-heading">
       <div><span>RESULTADOS DA BUSCA</span><h3>{matching.length} {matching.length===1?'ferramenta encontrada':'ferramentas encontradas'}</h3>
       <p>Pesquisando em todas as áreas do Local Studio.</p></div>
      </div>:section==='overview'?<>
       <div className="studio-hub-welcome">
        <span className="studio-hub-eyebrow">SEU ESPAÇO DE CRIAÇÃO</span>
        <h3>O que vamos construir hoje?</h3>
        <p>Seu portfólio está no controle. Encontre o editor certo e publique apenas quando estiver pronto.</p>
        <div className="studio-hub-welcome-actions">
         <button type="button" onClick={()=>invoke(onEditCurrent)}>
          <FileText size={16}/> Editar {pageLabel}
         </button>
         <button type="button" onClick={()=>invoke(onPublish)}>
          <CloudUpload size={16}/> Revisar publicação
         </button>
        </div>
       </div>
       <div className="studio-hub-section-heading">
        <div><span>ATALHOS</span><h3>Ferramentas frequentes</h3>
        <p>Acesso rápido às principais áreas de trabalho.</p></div>
       </div>
      </>:section==='system'?<div className="studio-hub-section-heading">
       <div><span>SEGURANÇA E ARQUIVOS</span><h3>Gerenciamento</h3>
       <p>Backup, recuperação de rascunhos e encerramento de edição.</p></div>
      </div>:<div className="studio-hub-section-heading">
       <div><span>ÁREA DE TRABALHO</span><h3>{section}</h3>
       <p>{current?.description}</p></div>
       <span className="studio-hub-count">{visible.length} ferramentas</span>
      </div>}
      {normalized&&!matching.length?<div className="studio-hub-empty">
       <Search size={25}/><strong>Nenhuma ferramenta encontrada</strong>
       <p>Tente buscar por “cores”, “Alquimago” ou “projetos”.</p>
      </div>:section==='system'&&!normalized?
       <div className="studio-hub-grid studio-hub-management">
        <button type="button" className="studio-hub-item" onClick={()=>{setOpen(false);void onExport()}}>
         <span className="studio-hub-icon"><Download size={20}/></span>
         <span className="studio-hub-item-copy"><strong>Backup ZIP</strong><small>Exportar uma cópia dos projetos e mídias.</small></span>
         <ArrowRight size={15} className="studio-hub-item-arrow"/>
        </button>
        <button type="button" className="studio-hub-item" onClick={()=>{
         const confirmed=window.confirm('Descartar os rascunhos locais deste portfólio e recuperar os dados da versão publicada? Esta ação não altera o GitHub. Exporte um backup ZIP antes de continuar caso queira guardar seus rascunhos.')
         if(confirmed)invoke(onRestorePublished)
        }}>
         <span className="studio-hub-icon"><BookOpen size={20}/></span>
         <span className="studio-hub-item-copy"><strong>Restaurar versão publicada</strong>
          <small>Descartar rascunhos locais após confirmação.</small></span>
         <ArrowRight size={15} className="studio-hub-item-arrow"/>
        </button>
        <button type="button" className="studio-hub-item" onClick={()=>invoke(onLock)}>
         <span className="studio-hub-icon"><LockKeyhole size={20}/></span>
         <span className="studio-hub-item-copy"><strong>Encerrar edição</strong>
          <small>Voltar à visualização pública do portfólio.</small></span>
         <ArrowRight size={15} className="studio-hub-item-arrow"/>
        </button>
       </div>:<div className="studio-hub-grid">
        {(normalized?matching:section==='overview'?featured:visible).map(tile)}
       </div>}
      {section==='overview'&&!normalized&&<div className="studio-hub-overview-areas">
       <div className="studio-hub-section-heading"><div>
        <span>ORGANIZAÇÃO</span><h3>Explorar todas as áreas</h3>
       </div></div>
       <div className="studio-hub-category-grid">
        {categoriesWithCount.map(category=>{
         const Icon=category.icon
         return <button type="button" key={category.id} onClick={()=>choose(category.id)}>
          <Icon size={17}/><span>{category.id}<small>{category.count} ferramentas</small></span>
          <ArrowRight size={14}/>
         </button>
        })}
       </div>
      </div>}
     </div>
    </section>
   </div>
   <footer className="studio-hub-footer">
    <div><span className="studio-hub-footer-dot"/><span>Build {buildCode} · Conteúdo {publishedRevision.slice(0,9)}</span></div>
    <button type="button" className="studio-hub-footer-publish" onClick={()=>invoke(onPublish)}>
     <CloudUpload size={16}/> Publicar alterações
    </button>
   </footer>
  </div>}
  <nav className="studio-dock" aria-label="Controles do Local Studio">
   <div className="studio-dock-brand">
    <span className="studio-dock-mark"><Sparkles size={17}/></span>
    <div><strong>Local Studio</strong><small><span className="studio-live-dot"/> Modo edição</small></div>
   </div>
   <div className="studio-dock-context"><span>{pageLabel}</span>
    <button type="button" className="studio-context-button" onClick={()=>invoke(onEditCurrent)}>{editLabel}</button>
   </div>
   <div className="studio-dock-actions">
    <button type="button" className="studio-dock-new" onClick={()=>invoke(onNewProject)}
     title="Criar projeto"><Plus size={18}/><span>Novo projeto</span></button>
    <button type="button" className={'studio-menu-button'+(open?' active':'')}
     aria-expanded={open} aria-controls="studio-hub" onClick={()=>setOpen(v=>!v)}>
     <LayoutGrid size={17}/><span>Ferramentas</span><ChevronDown size={14}/>
    </button>
    <button type="button" className="studio-dock-publish" onClick={()=>invoke(onPublish)}>
     <CloudUpload size={18}/><span>Publicar</span></button>
    <button type="button" className="studio-dock-exit" onClick={()=>invoke(onLock)}
     aria-label="Bloquear Local Studio" title="Sair do Studio"><LockKeyhole size={17}/></button>
   </div>
  </nav>
 </div>
}
