import { Grid2X2, House, Mail, UserRound } from 'lucide-react'
import { MusicPlayer } from './music-player'
import type { MusicTrack } from '../../data/studio'
export type Page = 'inicio'|'portfolio'|'sobre'|'contato'
export function Sidebar({page,navigate,tracks}:{page:Page;navigate:(page:Page)=>void;tracks:MusicTrack[]}){
 const links:[Page,typeof House,string][]=[['inicio',House,'Início'],['portfolio',Grid2X2,'Portfólio'],['sobre',UserRound,'Sobre'],['contato',Mail,'Contato']]
 return <aside className="sidebar"><button className="brand" onClick={()=>navigate('inicio')} aria-label="Página inicial"><span>JF</span></button><nav className="side-nav" aria-label="Navegação principal">{links.map(([key,Icon,label])=><button key={key} className={page===key?'side-link current':'side-link'} onClick={()=>navigate(key)} aria-current={page===key?'page':undefined}><span className="side-icon"><Icon/></span><span>{label}</span></button>)}</nav><MusicPlayer tracks={tracks}/></aside>
}
