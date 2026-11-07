import { useEffect,useRef,useState } from 'react'
import { BookOpen,ChevronDown,CloudUpload,Download,LayoutGrid,LockKeyhole,Plus,Sparkles,X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StudioSection='Páginas'|'Projetos'|'Conteúdo'|'Identidade'
export type StudioAction={id:string;label:string;description:string;section:StudioSection;icon:LucideIcon;onClick:()=>void}
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

/** One stable, contextual control center, instead of a row of unrelated buttons. */
export function StudioDock({pageLabel,editLabel,onEditCurrent,onNewProject,onPublish,onExport,onRestorePublished,publishedRevision,onLock,actions}:Props){
 const [open,setOpen]=useState(false)
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const pointer=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)}
  document.addEventListener('pointerdown',pointer)
  document.addEventListener('keydown',escape)
  return ()=>{document.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',escape)}
 },[open])
 const invoke=(callback:()=>void)=>{setOpen(false);callback()}
 const groups:StudioSection[]=['Páginas','Projetos','Conteúdo','Identidade']
 const buildCode=String(import.meta.env.VITE_BUILD_SHA||'local').slice(0,7)
 return <div className="studio-dock-anchor" lang="pt-BR" ref={root}>
  {open&&<div id="studio-hub" className="studio-hub" role="dialog" aria-label="Central de ferramentas do Local Studio" aria-modal="false">
   <header className="studio-hub-header"><div><span>PAINEL DE CONTROLE</span><h2>Local Studio</h2><p>Selecione o que deseja ajustar. Os rascunhos ficam neste navegador.</p><p className="studio-hub-version">Build {buildCode} · Conteúdo {publishedRevision.slice(0,9)}</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar ferramentas"><X size={18}/></button></header>
   <div className="studio-hub-groups">
    {groups.map(group=>{const items=actions.filter(action=>action.section===group);return items.length>0&&<section key={group} className="studio-hub-group"><h3>{group}</h3><div className="studio-hub-grid">{items.map(action=>{const Icon=action.icon;return <button type="button" key={action.id} className="studio-hub-item" onClick={()=>invoke(action.onClick)}><span className="studio-hub-icon"><Icon size={19}/></span><span className="studio-hub-item-copy"><strong>{action.label}</strong><small>{action.description}</small></span></button>})}</div></section>})}
    <section className="studio-hub-group"><h3>Gerenciamento</h3><div className="studio-hub-grid">
     <button type="button" className="studio-hub-item" onClick={()=>{setOpen(false);void onExport()}}><span className="studio-hub-icon"><Download size={19}/></span><span className="studio-hub-item-copy"><strong>Backup ZIP</strong><small>Guarde uma cópia dos seus projetos e mídias.</small></span></button>
     <button type="button" className="studio-hub-item" onClick={()=>{
       const confirmed=window.confirm('Descartar os rascunhos locais deste portfólio e recuperar os dados da versão publicada? Esta ação não altera o GitHub. Exporte um backup ZIP antes de continuar caso queira guardar seus rascunhos.');
       if(confirmed)invoke(onRestorePublished);
     }}><span className="studio-hub-icon"><BookOpen size={19}/></span><span className="studio-hub-item-copy"><strong>Voltar à versão publicada</strong><small>Descarte apenas rascunhos locais após confirmação.</small></span></button>
     <button type="button" className="studio-hub-item" onClick={()=>invoke(onLock)}><span className="studio-hub-icon"><LockKeyhole size={19}/></span><span className="studio-hub-item-copy"><strong>Encerrar edição</strong><small>Voltar à versão pública do portfólio.</small></span></button>
    </div></section>
   </div>
   <footer className="studio-hub-footer"><BookOpen size={14}/> Edite, revise e só depois clique em Publicar.</footer>
  </div>}
  <nav className="studio-dock" aria-label="Controles do Local Studio">
   <div className="studio-dock-brand"><span className="studio-dock-mark"><Sparkles size={17}/></span><div><strong>Local Studio</strong><small><span className="studio-live-dot"/> Rascunho local</small></div></div>
   <div className="studio-dock-context"><span>{pageLabel}</span><button type="button" className="studio-context-button" onClick={()=>invoke(onEditCurrent)}>{editLabel}</button></div>
   <div className="studio-dock-actions">
    <button type="button" className="studio-dock-new" onClick={()=>invoke(onNewProject)} title="Criar projeto"><Plus size={18}/><span>Novo projeto</span></button>
    <button type="button" className={'studio-menu-button'+(open?' active':'')} aria-expanded={open} aria-controls="studio-hub" onClick={()=>setOpen(v=>!v)}><LayoutGrid size={17}/><span>Ferramentas</span><ChevronDown size={14}/></button>
    <button type="button" className="studio-dock-publish" onClick={()=>invoke(onPublish)}><CloudUpload size={18}/><span>Publicar</span></button>
    <button type="button" className="studio-dock-exit" onClick={()=>invoke(onLock)} aria-label="Bloquear Local Studio" title="Sair do Studio"><LockKeyhole size={17}/></button>
   </div>
  </nav>
 </div>
}
