import { Grid2X2, House, Mail, Pencil, UserRound } from 'lucide-react'
import type { CSSProperties } from 'react'
import { AssetImage } from '../ui/asset-image'
import { MusicPlayer } from './music-player'
import type { MusicTrack } from '../../data/studio'
export type Page = 'inicio'|'portfolio'|'sobre'|'contato'
export function Sidebar({page,navigate,tracks,siteLogo='',siteLogoHover='',siteLogoSize=100,siteLogoHoverScale=110,editing=false,onEditLogo}:{page:Page;navigate:(page:Page)=>void;tracks:MusicTrack[];siteLogo?:string;siteLogoHover?:string;siteLogoSize?:number;siteLogoHoverScale?:number;editing?:boolean;onEditLogo?:()=>void}){
 const links:[Page,typeof House,string][]=[['inicio',House,'Início'],['portfolio',Grid2X2,'Portfólio'],['sobre',UserRound,'Sobre'],['contato',Mail,'Contato']]
 const brandStyle={'--brand-size':siteLogoSize/100,'--brand-hover-size':siteLogoHoverScale/100} as CSSProperties
 return <aside className="sidebar"><div className="brand-wrap"><button className={'brand brand-logo-display'+(siteLogoHover?' has-brand-hover':'')} style={brandStyle} onClick={()=>navigate('inicio')} aria-label="Página inicial"><span className="brand-logo-layer brand-logo-normal">{siteLogo?<AssetImage className="brand-logo" src={siteLogo} alt=""/>:<span className="brand-monogram">JF</span>}</span>{siteLogoHover&&<span className="brand-logo-layer brand-logo-hover"><AssetImage className="brand-logo" src={siteLogoHover} alt=""/></span>}</button>{editing&&onEditLogo&&<button type="button" className="brand-edit-button" onClick={onEditLogo} aria-label="Trocar logo lateral" title="Editar logo"><Pencil size={13}/></button>}</div><nav className="side-nav" aria-label="Navegação principal">{links.map(([key,Icon,label])=><button key={key} className={page===key?'side-link current':'side-link'} onClick={()=>navigate(key)} aria-current={page===key?'page':undefined}><span className="side-icon"><Icon/></span><span>{label}</span></button>)}</nav><MusicPlayer tracks={tracks}/></aside>
}
