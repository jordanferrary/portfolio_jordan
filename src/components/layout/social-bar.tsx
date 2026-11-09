import { Plus } from 'lucide-react'
import {LanguageSwitcher} from './language-switcher'
import type {VisitorLanguage} from '../../lib/visitor-language'
import type { SocialLink } from '../../data/studio'
import { SocialMark,safeSocialUrl } from '../ui/social-mark'
export function SocialBar({links,editing,onEdit,language,onLanguageChange}:{links:SocialLink[];editing:boolean;onEdit:()=>void;language:VisitorLanguage;onLanguageChange:(value:VisitorLanguage)=>void}){
 return <nav className="socials" aria-label="Social links and language preferences">{links.map(s=>{
  const href=safeSocialUrl(s.url)
  return href?<a className="social-link" key={s.id} href={href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}><SocialMark social={s}/></a>
   :<span className="social-link social-unconfigured" key={s.id} title={s.label+' — link not configured'} aria-label={s.label+' — link não configurado'}><SocialMark social={s}/></span>
 })}<LanguageSwitcher language={language} onChange={onLanguageChange}/>{editing&&<button className="socials-edit-button" onClick={onEdit} aria-label="Editar redes sociais" title="Editar redes sociais"><Plus size={19}/></button>}</nav>
}
