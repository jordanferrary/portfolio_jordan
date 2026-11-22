import {ArrowRight,ArrowUpRight,Pencil} from 'lucide-react'
import type {SocialLink,ContactSettings} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {protectArtistName} from '../ui/protected-name'
import type {HeadingSymbolStyle} from '../../lib/heading-symbol'

type Props={socials:SocialLink[];settings:ContactSettings;demoEnabled:boolean;onEdit:()=>void;headingSymbol?:HeadingSymbolStyle}

/** Contact is now social-first: no browser-only inbox and no form that might never be read. */
export function ContactPage({socials,settings,demoEnabled,onEdit}:Props){
 const channels=socials
  .map(s=>({social:s,url:safeSocialUrl(s.url)}))
  .filter((item):item is {social:SocialLink;url:string}=>
   Boolean(item.url)&&item.social.icon!=='mail'&&!item.url?.startsWith('mailto:'))
 const density=channels.length>=9?'icons':channels.length>=4?'grid':'list'
 return <main className="contact-page contact-social-page">
  <div className="contact-social-atmosphere" aria-hidden="true"><i/><i/><i/></div>
  <div className="contact-social-layout">
   <section className="contact-social-intro">
    <h1>{settings.titleFirst}<br/><em>{settings.titleAccent}</em></h1>
    {settings.introduction.trim()&&<p className="contact-social-description">{protectArtistName(settings.introduction)}</p>}
    <a className="contact-social-portfolio-link" href="#/portfolio">Explore the portfolio <ArrowRight size={17}/></a>
    {demoEnabled&&<button type="button" lang="pt-BR" className="contact-dev-edit" onClick={onEdit}><Pencil size={15}/>Personalizar contato e redes</button>}
   </section>
   <section className={'contact-social-directory contact-directory-'+density} aria-label="Social media contact channels">
    <header className="contact-social-directory-head">
     <div><h2>Find me online</h2>{settings.greeting.trim()&&<p>{settings.greeting}</p>}</div>
    </header>
    {channels.length>0?<div className={'contact-social-cards contact-cards-'+density}>
     {channels.map(({social,url},index)=>{
      return <a key={social.id} href={url} target="_blank" rel="noopener noreferrer" title={social.label}
       className={'contact-social-card'+(index===0?' contact-social-card-featured':'')}
       aria-label={'Visit '+social.label+' profile (opens in a new tab)'}>
       <span className="contact-social-card-icon"><SocialMark social={social}/></span>
       <span className="contact-social-card-info"><strong>{social.label}</strong></span>
       <span className="contact-social-card-arrow"><ArrowUpRight size={20}/></span>
      </a>
     })}
    </div>:<div className="contact-social-empty"><p>Social profiles are being updated. Please check back soon.</p>{demoEnabled&&<button type="button" onClick={onEdit}>Configurar redes sociais</button>}</div>}
   </section>
  </div>
  {settings.footerTags.length>0&&<div className="contact-social-bottomline" aria-label="Creative specialties">{settings.footerTags.map((label,index)=><span key={index} className="contact-social-bottomline-item"><span>{label}</span></span>)}</div>}
 </main>
}
