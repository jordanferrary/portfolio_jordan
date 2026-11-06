import { Grid2X2, House, Mail, Pencil, UserRound } from 'lucide-react'
import { AssetImage } from '../ui/asset-image'
import { MusicPlayer } from './music-player'
import type { MusicTrack } from '../../data/studio'
export type Page = 'inicio'|'portfolio'|'sobre'|'contato'
export function Sidebar({page,navigate,tracks,siteLogo='',editing=false,onEditLogo}:{page:Page;navigate:(page:Page)=>void;tracks:MusicTrack[];siteLogo?:string;editing?:boolean;onEditLogo?:()=>void}){
 const links:[Page,typeof House,string][]=[['inicio',House,'Início'],['portfolio',Grid2X2,'Portfólio'],['sobre',UserRound,'Sobre'],['contato',Mail,'Contato']]
 return <aside className="sidebar"><div className="brand-wrap"><button className="brand" onClick={()=>navigate('inicio')} aria-label="Página inicial">{siteLogo?<AssetImage className="brand-logo" src={siteLogo} alt="Logo do portfólio"/>:<span>JF</span>}</button>{editing&&onEditLogo&&<button type="button" className="brand-edit-button" onClick={onEditLogo} aria-label="Trocar logo lateral" title="Editar logo"><Pencil size={13}/></button>}</div><nav className="side-nav" aria-label="Navegação principal">{links.map(([key,Icon,label])=><button key={key} className={page===key?'side-link current':'side-link'} onClick={()=>navigate(key)} aria-current={page===key?'page':undefined}><span className="side-icon"><Icon/></span><span>{label}</span></button>)}</nav><MusicPlayer tracks={tracks}/></aside>
}
