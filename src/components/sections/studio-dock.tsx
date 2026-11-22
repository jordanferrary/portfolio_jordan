import '../../styles/studio-dock.css'
import { useEffect,useRef,useState } from 'react'
import {
 ArrowRight,BookOpen,ChevronDown,CloudUpload,Download,FileText,
 FolderKanban,LayoutGrid,LockKeyhole,Palette,Plus,Search,
 Settings2,Sparkles,WandSparkles,X,Star,Clock,Undo2,Redo2,Eye,ScanLine,Pencil,ChevronRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {readWorkflow,saveWorkflow,matchesTool,visitTool,toggleFavorite} from '../../lib/studio-workflow'

export type StudioSection='Páginas'|'Projetos'|'Familiar'|'Conteúdo'|'Identidade'|'Sistema'
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
 onImport?:(file:File)=>Promise<void>
 onRestorePublished:()=>Promise<void>
 publishedRevision:string
 onLock:()=>void
 actions:StudioAction[]
 onUndo?:()=>void;onRedo?:()=>void;canUndo?:boolean;canRedo?:boolean
}
type Workspace='overview'|'favorites'|'recent'|'system'|StudioSection
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
 pageLabel,editLabel,onEditCurrent,onNewProject,onPublish,onExport,onImport,
 onRestorePublished,publishedRevision,onLock,actions,onUndo,onRedo,canUndo,canRedo
}:Props){
 const [open,setOpen]=useState(false)
 const [workflow,setWorkflow]=useState(readWorkflow)
 useEffect(()=>{saveWorkflow(workflow)},[workflow])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.defaultPrevented&&!document.querySelector('.editor-overlay,[aria-modal=true],.studio-inspector')){e.preventDefault();setOpen(true);window.requestAnimationFrame(()=>searchRef.current?.focus())}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 const [backupBusy,setBackupBusy]=useState(false)
 const [backupNotice,setBackupNotice]=useState('')
 const runBackup=async(action:()=>Promise<void>,success:string)=>{
  setBackupBusy(true);setBackupNotice('')
  try{await action();setBackupNotice(success)}catch(error){setBackupNotice(error instanceof Error?error.message:'Operação de backup não concluída.')}
  finally{setBackupBusy(false)}
 }
 const [query,setQuery]=useState('')
 const [activeResult,setActiveResult]=useState(0)
 const scrollRef=useRef<HTMLDivElement>(null)
 const menuRef=useRef<HTMLButtonElement>(null)
 const [section,setSection]=useState<Workspace>('overview')
 const searchRef=useRef<HTMLInputElement>(null)
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const pointer=(event:PointerEvent)=>{
   if(!backupBusy&&root.current&&!root.current.contains(event.target as Node))setOpen(false)
  }
  const escape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'&&!backupBusy){if(query)setQuery('');else{setOpen(false);menuRef.current?.focus()}}
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
 },[open,backupBusy,query])
 const invoke=(callback:()=>void)=>{if(backupBusy)return;setOpen(false);callback()}
 const choose=(next:Workspace)=>{if(backupBusy)return;setSection(next);setQuery('');setActiveResult(0);scrollRef.current?.scrollTo({top:0})}
 const normalized=query.trim()
 useEffect(()=>{setActiveResult(0);scrollRef.current?.scrollTo({top:0})},[query])
 const matching=actions.filter(action=>matchesTool(query,[action.label,action.description,action.section]))
 const launch=(action:StudioAction)=>{if(backupBusy)return;setWorkflow(value=>visitTool(value,action.id));invoke(action.onClick)}
 const favorites=workflow.favorites.flatMap(id=>actions.filter(a=>a.id===id))
 const recent=workflow.recent.flatMap(id=>actions.filter(a=>a.id===id))
 const buildCode=String(import.meta.env.VITE_BUILD_SHA||'local').slice(0,7)
 const categoriesWithCount=CATEGORIES.map(category=>({
  ...category,count:actions.filter(action=>action.section===category.id).length
 }))
 const featuredIds=['visual-inspector','global-layout','palette','draft-preview','studio-health','new-project','custom-pages']
 const featured=featuredIds.map(id=>actions.find(action=>action.id===id))
  .filter((action):action is StudioAction=>Boolean(action))
 const visible=normalized?matching:actions.filter(action=>action.section===(section==='system'?'Sistema':section))
 const inspector=actions.find(a=>a.id==='visual-inspector')
 const preview=actions.find(a=>a.id==='draft-preview')
 const overviewTools=[...favorites.slice(0,4),...featured.filter(a=>!favorites.some(f=>f.id===a.id)).slice(0,Math.max(0,6-Math.min(favorites.length,4)))]
 const presented=normalized?matching:section==='overview'?overviewTools:section==='favorites'?favorites:section==='recent'?recent:visible
 const close=()=>{if(!backupBusy){setOpen(false);menuRef.current?.focus()}}
 useEffect(()=>{if(normalized&&open)document.getElementById('studio-result-'+activeResult)?.scrollIntoView({block:'nearest'})},[activeResult,normalized,open])
 const tile=(action:StudioAction,index:number)=>{
  const Icon=action.icon
  return <div className="studio-tool-tile" key={action.id} data-keyboard-active={normalized&&index===activeResult?true:undefined} id={normalized?'studio-result-'+index:undefined}><button type="button" className="studio-hub-item" disabled={backupBusy}
   onClick={()=>launch(action)}>
    <span className="studio-hub-icon"><Icon size={20} aria-hidden="true"/></span>
    <span className="studio-hub-item-copy">
     <strong>{action.label}</strong><small>{action.description}</small>
    </span>
    <ChevronRight size={15} className="studio-hub-item-arrow" aria-hidden="true"/>
   </button><button type="button" className="studio-tool-star" aria-label={workflow.favorites.includes(action.id)?'Remover dos favoritos '+action.label:'Favoritar '+action.label} aria-pressed={workflow.favorites.includes(action.id)} onClick={()=>setWorkflow(value=>toggleFavorite(value,action.id))}><Star size={15}/></button></div>
 }
 return <div className="studio-dock-anchor" lang="pt-BR" ref={root}>
  {open&&<div id="studio-hub" className="studio-hub" role="dialog"
   aria-label="Central de ferramentas do Local Studio" aria-modal="false">
   <header className="studio-hub-header">
    <div className="studio-hub-identity">
     <span className="studio-hub-emblem"><Sparkles size={20} aria-hidden="true"/></span>
     <div><h2>Local Studio</h2><p>{pageLabel} / Edição</p></div>
    </div>
    <div className="studio-hub-header-actions">
     <span className="studio-hub-draft-indicator"><span/> Rascunho local</span>
     <button type="button" className="studio-hub-close" onClick={close}
      aria-label="Fechar central de ferramentas" disabled={backupBusy}><X size={18}/></button>
    </div>
   </header>
   <div className="studio-hub-body">
    <nav className="studio-hub-sidebar" aria-label="Categorias do Local Studio">
     <button type="button" className={'studio-hub-nav-item'+(section==='overview'?' selected':'')}
      aria-current={section==='overview'?'page':undefined} onClick={()=>choose('overview')}>
      <LayoutGrid size={17}/><span>Visão geral</span>
     </button>
     <button type="button" className={'studio-hub-nav-item'+(section==='favorites'?' selected':'')} aria-current={section==='favorites'?'page':undefined} onClick={()=>choose('favorites')}><Star size={17}/><span>Favoritos</span><small>{favorites.length}</small></button>
     <button type="button" className={'studio-hub-nav-item'+(section==='recent'?' selected':'')} aria-current={section==='recent'?'page':undefined} onClick={()=>choose('recent')}><Clock size={17}/><span>Recentes</span><small>{recent.length}</small></button>
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
      <input ref={searchRef} type="search" disabled={backupBusy} value={query}
       onChange={event=>setQuery(event.target.value)} onKeyDown={e=>{if(!normalized||!matching.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActiveResult(i=>(i+(e.key==='ArrowDown'?1:-1)+matching.length)%matching.length)}else if(e.key==='Enter'){e.preventDefault();if(matching[activeResult])launch(matching[activeResult])}}}
       placeholder="Pesquisar ferramentas, páginas ou ações..."
       aria-label="Pesquisar ferramentas do Local Studio"/>
      {query?<button type="button" className="studio-hub-search-clear"
        onClick={()=>{setQuery('');searchRef.current?.focus()}} aria-label="Limpar pesquisa"><X size={15}/></button>
       :<kbd>Ctrl K</kbd>}
     </div>
     <div className="studio-hub-workspace-scroll" ref={scrollRef}>
      {normalized?<div className="studio-hub-section-heading"><h3>Pesquisa <small>{matching.length} resultados</small></h3><small>↑ ↓ / Enter</small></div>:section==='overview'?<>
       <div className="studio-current-page"><div><small>Página atual</small><strong>{pageLabel}</strong></div><div className="studio-current-actions"><button type="button" onClick={()=>invoke(onEditCurrent)}><Pencil size={15}/>Editar</button>{inspector&&<button type="button" onClick={()=>launch(inspector)}><ScanLine size={15}/>Inspetor</button>}{preview&&<button type="button" onClick={()=>launch(preview)}><Eye size={15}/>Prévia</button>}</div></div>
       <div className="studio-hub-section-heading"><h3>Acesso rápido</h3>{favorites.length>0&&<button type="button" className="studio-text-action" onClick={()=>choose('favorites')}>Todos os favoritos <ChevronRight size={13}/></button>}</div>
      </>:<div className="studio-hub-section-heading"><h3>{section==='system'?'Gerenciamento':section==='favorites'?'Favoritos':section==='recent'?'Recentes':section}</h3>{section!=='system'&&<small>{presented.length} ferramentas</small>}</div>}
      {normalized&&!matching.length?<div className="studio-hub-empty">
       <Search size={25}/><strong>Nenhuma ferramenta encontrada</strong>
       <p>Tente buscar por “cores”, “Alquimago” ou “projetos”.</p>
      </div>:section==='system'&&!normalized?
       <div className="studio-hub-grid studio-hub-management">
        <button type="button" className="studio-hub-item" disabled={backupBusy} onClick={()=>void runBackup(onExport,'Backup exportado.')}>
         <span className="studio-hub-icon"><Download size={20}/></span>
         <span className="studio-hub-item-copy"><strong>Backup ZIP</strong><small>Exportar uma cópia dos projetos e mídias.</small></span>
         <ArrowRight size={15} className="studio-hub-item-arrow"/>
        </button>
        {onImport&&<label className="studio-hub-item studio-backup-import">
         <span className="studio-hub-icon"><BookOpen size={20}/></span>
         <span className="studio-hub-item-copy"><strong>Importar backup</strong><small>Restaurar ZIP ou JSON neste navegador.</small></span>
         <input type="file" accept=".zip,.json,application/zip,application/json" disabled={backupBusy} onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(file&&window.confirm('Substituir o rascunho local pelo backup selecionado?'))void runBackup(()=>onImport(file),'Backup importado no rascunho local.')}}/>
        </label>}
        {backupNotice&&<p className="studio-backup-notice" role="status">{backupNotice}</p>}
        <button type="button" className="studio-hub-item" disabled={backupBusy} onClick={()=>{
         const confirmed=window.confirm('Descartar os rascunhos locais deste portfólio e recuperar os dados da versão publicada? Esta ação não altera o GitHub. Exporte um backup ZIP antes de continuar caso queira guardar seus rascunhos.')
         if(confirmed)void runBackup(onRestorePublished,'Versão publicada restaurada.')
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
        {visible.map(tile)}
       </div>:<div className="studio-hub-grid">
        {presented.map(tile)}
       </div>}
      {!normalized&&section!=='system'&&presented.length===0&&<p className="studio-workspace-empty">{section==='favorites'?'Marque a estrela de uma ferramenta para fixá-la aqui.':section==='recent'?'As ferramentas abertas aparecem aqui.':'Nenhuma ferramenta disponível nesta área.'}</p>}
      {section==='overview'&&!normalized&&recent.some(a=>!overviewTools.some(b=>b.id===a.id))&&<><div className="studio-hub-section-heading"><h3>Recentes</h3><button type="button" className="studio-text-action" onClick={()=>choose('recent')}>Ver todos <ChevronRight size={13}/></button></div><div className="studio-hub-grid">{recent.filter(a=>!overviewTools.some(b=>b.id===a.id)).slice(0,3).map(tile)}</div></>}
     </div>
    </section>
   </div>
   <footer className="studio-hub-footer">
    <div><span className="studio-hub-footer-dot"/><span>Build {buildCode} · Conteúdo {publishedRevision.slice(0,9)}</span></div>
   </footer>
  </div>}
  <nav className="studio-dock" aria-label="Controles do Local Studio">
   <div className="studio-dock-brand">
    <span className="studio-dock-mark"><Sparkles size={17}/></span>
    <div><strong>Local Studio</strong><small><span className="studio-live-dot"/> Modo edição</small></div>
   </div>
   <div className="studio-dock-context"><span>{pageLabel}</span>
    <button type="button" className="studio-context-button" onClick={()=>invoke(onEditCurrent)} title={editLabel}><Pencil size={16}/><span>{editLabel}</span></button>
   </div>
   <div className="studio-dock-actions">
    {onUndo&&<button type="button" className="studio-dock-history" disabled={!canUndo} title="Desfazer" aria-label="Desfazer última alteração" onClick={onUndo}><Undo2 size={17}/></button>}
    {onRedo&&<button type="button" className="studio-dock-history" disabled={!canRedo} title="Refazer" aria-label="Refazer última alteração" onClick={onRedo}><Redo2 size={17}/></button>}
    {inspector&&<button type="button" className="studio-dock-inspect" title="Inspetor visual" aria-label="Inspetor visual" onClick={()=>launch(inspector)}><ScanLine size={17}/></button>}
    {preview&&<button type="button" className="studio-dock-view" title="Prévia do visitante" aria-label="Prévia do visitante" onClick={()=>launch(preview)}><Eye size={17}/></button>}
    <button type="button" className="studio-dock-new" onClick={()=>invoke(onNewProject)}
     title="Criar projeto" aria-label="Criar projeto"><Plus size={18}/><span>Novo projeto</span></button>
    <button ref={menuRef} type="button" className={'studio-menu-button'+(open?' active':'')} aria-label="Ferramentas"
     aria-expanded={open} aria-controls="studio-hub" disabled={backupBusy} onClick={()=>setOpen(v=>!v)}>
     <LayoutGrid size={17}/><span>Ferramentas</span><ChevronDown size={14}/>
    </button>
    <button type="button" className="studio-dock-publish" aria-label="Publicar" onClick={()=>invoke(onPublish)}>
     <CloudUpload size={18}/><span>Publicar</span></button>
    <button type="button" className="studio-dock-exit" onClick={()=>invoke(onLock)}
     aria-label="Bloquear Local Studio" title="Sair do Studio"><LockKeyhole size={17}/></button>
   </div>
  </nav>
 </div>
}
