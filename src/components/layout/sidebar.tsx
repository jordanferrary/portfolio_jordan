import {Grid2X2,House,Mail,Pencil,Plus,Sparkles,UserRound} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {useEffect,useState,type CSSProperties} from 'react'
import {createPortal} from 'react-dom'
import {AssetImage} from '../ui/asset-image'
import {MusicPlayer} from './music-player'
import type {MusicTrack} from '../../data/studio'
import type {CustomPage} from '../../data/custom-pages'
import {customPageIcons} from '../../lib/custom-page-icons'

export type Page='inicio'|'portfolio'|'sobre'|'contato'
type Props={
 page:Page|'custom'
 customPageId?:string
 customPages:CustomPage[]
 navigate:(page:Page)=>void
 onOpenCustomPage:(id:string)=>void
 onManagePages?:()=>void
 onReorderCustomPages?:(fromId:string,toId:string)=>void
 tracks:MusicTrack[]
 siteLogo?:string
 siteLogoHover?:string
 siteLogoSize?:number
 siteLogoHoverScale?:number
 editing?:boolean
 onEditLogo?:()=>void
}
export function Sidebar({page,customPageId,customPages,navigate,onOpenCustomPage,onManagePages,onReorderCustomPages,tracks,siteLogo='',siteLogoHover='',siteLogoSize=100,siteLogoHoverScale=110,editing=false,onEditLogo}:Props){
 const [mobilePortal,setMobilePortal]=useState<HTMLElement|null>(null)
 const [draggingPage,setDraggingPage]=useState('')
 const [dropTarget,setDropTarget]=useState('')
 useEffect(()=>{
  const query=window.matchMedia('(max-width:750px)')
  const update=()=>setMobilePortal(query.matches?document.querySelector<HTMLElement>('.site-shell'):null)
  update()
  query.addEventListener('change',update)
  return ()=>query.removeEventListener('change',update)
 },[])
 const brandStyle={'--brand-size':siteLogoSize/100,'--brand-hover-total':siteLogoSize*siteLogoHoverScale/10000} as CSSProperties
 const staticStart:{key:Page;icon:LucideIcon;label:string}[]=[{key:'inicio',icon:House,label:'Home'},{key:'portfolio',icon:Grid2X2,label:'Portfolio'}]
 const staticEnd:{key:Page;icon:LucideIcon;label:string}[]=[{key:'sobre',icon:UserRound,label:'About'},{key:'contato',icon:Mail,label:'Contact'}]
 const builtin=(entry:{key:Page;icon:LucideIcon;label:string})=>{
  const Icon=entry.icon
  return <button type="button" key={entry.key} className={page===entry.key?'side-link current':'side-link'} onClick={()=>navigate(entry.key)} aria-current={page===entry.key?'page':undefined} title={entry.label}><span className="side-icon"><Icon/></span><span className="side-link-label">{entry.label}</span></button>
 }
 return <><aside className="sidebar"><div className="brand-wrap"><button className={'brand brand-logo-display'+(siteLogoHover?' has-brand-hover':'')} style={brandStyle} onClick={()=>navigate('inicio')} aria-label="Home page"><span className="brand-logo-layer brand-logo-normal">{siteLogo?<AssetImage className="brand-logo" src={siteLogo} alt="" loading="eager"/>:<span className="brand-monogram">JF</span>}</span>{siteLogoHover&&<span className="brand-logo-layer brand-logo-hover"><AssetImage className="brand-logo" src={siteLogoHover} alt=""/></span>}</button>{editing&&onEditLogo&&<button type="button" className="brand-edit-button" onClick={onEditLogo} aria-label="Trocar logo lateral" title="Editar logo"><Pencil size={13}/></button>}</div>
  <nav className="side-nav" aria-label="Navegação principal">
   {staticStart.map(builtin)}
   {customPages.filter(item=>item.showInNav).map(item=>{
    const Icon=customPageIcons[item.icon]??Sparkles
    const selected=page==='custom'&&customPageId===item.id
    const sortable=editing&&!!onReorderCustomPages
    return <button type="button" key={item.id} className={(selected?'side-link current':'side-link')+(sortable?' side-page-sortable':'')+(dropTarget===item.id&&draggingPage!==item.id?' side-page-drop-target':'')} draggable={sortable}
     onDragStart={event=>{if(!sortable)return;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-jf-custom-page',item.id);setDraggingPage(item.id)}}
     onDragOver={event=>{if(!sortable||!draggingPage||draggingPage===item.id)return;event.preventDefault();event.dataTransfer.dropEffect='move';setDropTarget(item.id)}}
     onDrop={event=>{const from=event.dataTransfer.getData('application/x-jf-custom-page');if(sortable&&from&&from!==item.id&&customPages.some(candidate=>candidate.id===from&&candidate.showInNav)){event.preventDefault();onReorderCustomPages?.(from,item.id)}setDraggingPage('');setDropTarget('')}}
     onDragEnd={()=>{setDraggingPage('');setDropTarget('')}}
     onClick={()=>onOpenCustomPage(item.id)} aria-current={selected?'page':undefined} title={sortable?item.navLabel+' · Arraste para reorganizar':item.navLabel}><span className="side-icon"><Icon/></span><span className="side-link-label">{item.navLabel}</span></button>
   })}
   {staticEnd.map(builtin)}
   {editing&&onManagePages&&<button type="button" className="side-link side-add-page" title="Criar ou organizar páginas" onClick={onManagePages}><span className="side-icon"><Plus/></span><span className="side-link-label">New page</span></button>}
  </nav>
  {!mobilePortal&&<MusicPlayer tracks={tracks}/>}
 </aside>{mobilePortal&&createPortal(<MusicPlayer tracks={tracks}/>,mobilePortal)}</>
}
