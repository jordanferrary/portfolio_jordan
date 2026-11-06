import { Plus } from 'lucide-react'
import type { SocialLink } from '../../data/studio'
import { SocialMark,safeSocialUrl } from '../ui/social-mark'
export function SocialBar({links,editing,onEdit}:{links:SocialLink[];editing:boolean;onEdit:()=>void}){
 return <nav className="socials" aria-label="Redes sociais">{links.map(s=>{
  const href=safeSocialUrl(s.url)
  return href?<a className="social-link" key={s.id} href={href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}><SocialMark social={s}/></a>
   :<span className="social-link social-unconfigured" key={s.id} title={s.label+' — link não configurado'} aria-label={s.label+' — link não configurado'}><SocialMark social={s}/></span>
 })}{editing&&<button className="socials-edit-button" onClick={onEdit} aria-label="Editar redes sociais" title="Editar redes sociais"><Plus size={19}/></button>}</nav>
}
