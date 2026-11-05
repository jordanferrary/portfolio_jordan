import { BriefcaseBusiness, Grid2X2, House, Mail, Pause, Play, UserRound } from 'lucide-react'
import { useState } from 'react'
export type Page = 'inicio'|'portfolio'|'sobre'|'contato'
export function Sidebar({page,navigate}:{page:Page;navigate:(page:Page)=>void}){
 const [playing,setPlaying]=useState(false)
 const links:[Page,typeof House,string][]=[['inicio',House,'Início'],['portfolio',Grid2X2,'Portfólio'],['sobre',UserRound,'Sobre'],['contato',Mail,'Contato']]
 return <aside className="sidebar"><button className="brand" onClick={()=>navigate('inicio')} aria-label="Página inicial"><span>JF</span></button><nav className="side-nav" aria-label="Navegação principal">{links.map(([key,Icon,label])=><button key={key} className={page===key?'side-link current':'side-link'} onClick={()=>navigate(key)} aria-current={page===key?'page':undefined}><span className="side-icon"><Icon/></span><span>{label}</span></button>)}</nav><div className="mini-player"><div className="album"><BriefcaseBusiness size={18}/></div><div className="song"><b>Midnight</b><small>Luna Studio</small><span className="wave">▂▅▃▇▂▅▆▃</span></div><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pausar animação':'Ativar animação'} aria-pressed={playing}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><div className="music-progress"/></div></aside>
}
