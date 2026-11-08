import {BookOpen,Code2,Download,FileText,FolderOpen,Gem,GraduationCap,Grid2X2,House,Layers,Link2,Mail,Pencil,Plus,Sparkles,Star,UserRound,Video} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {useEffect,useState,type CSSProperties} from 'react'
import {createPortal} from 'react-dom'
import {AssetImage} from '../ui/asset-image'
import {MusicPlayer} from './music-player'
import type {MusicTrack} from '../../data/studio'
import type {CustomPage,CustomPageIcon} from '../../data/custom-pages'

export type Page='inicio'|'portfolio'|'sobre'|'contato'
const icons:Record<CustomPageIcon,LucideIcon>={
 book:BookOpen,graduation:GraduationCap,sparkles:Sparkles,layers:Layers,code:Code2,
 download:Download,file:FileText,gem:Gem,folder:FolderOpen,video:Video,star:Star,link:Link2
}
type Props={
 page:Page|'custom'
 customPageId?:string
 customPages:CustomPage[]
 navigate:(page:Page)=>void
 onOpenCustomPage:(id:string)=>void
 onManagePages?:()=>void
 tracks:MusicTrack[]
 siteLogo?:string
 siteLogoHover?:string
 siteLogoSize?:number
 siteLogoHoverScale?:number
 editing?:boolean
 onEditLogo?:()=>void
}
export function Sidebar({page,customPageId,customPages,navigate,onOpenCustomPage,onManagePages,tracks,siteLogo='',siteLogoHover='',siteLogoSize=100,siteLogoHoverScale=110,editing=false,onEditLogo}:Props){
 const [mobilePortal,setMobilePortal]=useState<HTMLElement|null>(null)
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
    const Icon=icons[item.icon]??Sparkles
    const selected=page==='custom'&&customPageId===item.id
    return <button type="button" key={item.id} className={selected?'side-link current':'side-link'} onClick={()=>onOpenCustomPage(item.id)} aria-current={selected?'page':undefined} title={item.navLabel}><span className="side-icon"><Icon/></span><span className="side-link-label">{item.navLabel}</span></button>
   })}
   {staticEnd.map(builtin)}
   {editing&&onManagePages&&<button type="button" className="side-link side-add-page" title="Criar ou organizar páginas" onClick={onManagePages}><span className="side-icon"><Plus/></span><span className="side-link-label">New page</span></button>}
  </nav>
  {!mobilePortal&&<MusicPlayer tracks={tracks}/>}
 </aside>{mobilePortal&&createPortal(<MusicPlayer tracks={tracks}/>,mobilePortal)}</>
}
