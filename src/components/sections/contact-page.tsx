import {ArrowRight,ArrowUpRight,MessagesSquare,Pencil,Sparkles,Waypoints} from 'lucide-react'
import type {SocialLink,ContactSettings} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {protectArtistName} from '../ui/protected-name'

type Props={socials:SocialLink[];settings:ContactSettings;demoEnabled:boolean;onEdit:()=>void}

function channelDetails(link:SocialLink){
 switch(link.icon){
  case 'instagram':return {tag:'DIRECT CONVERSATIONS',description:'Follow my creative process or send a direct message.'}
  case 'behance':return {tag:'CURATED PORTFOLIO',description:'Explore more artwork, collections and finished projects.'}
  case 'artstation':return {tag:'ART & PROJECTS',description:'Discover my artwork and creative portfolio.'}
  case 'github':return {tag:'PROJECTS & CODE',description:'See projects and work shared on GitHub.'}
  default:return {tag:'CONNECT',description:'Visit my profile and connect with me there.'}
 }
}

/** Contact is now social-first: no browser-only inbox and no form that might never be read. */
export function ContactPage({socials,settings,demoEnabled,onEdit}:Props){
 const channels=socials
  .map(s=>({social:s,url:safeSocialUrl(s.url)}))
  .filter((item):item is {social:SocialLink;url:string}=>
   Boolean(item.url)&&item.social.icon!=='mail'&&!item.url?.startsWith('mailto:'))
 const primary=channels[0]
 return <main className="contact-page contact-social-page">
  <div className="contact-social-atmosphere" aria-hidden="true"><i/><i/><i/></div>
  <div className="contact-social-layout">
   <section className="contact-social-intro">
    <p className="eyebrow"><Sparkles size={17}/> CONNECT & COLLABORATE</p>
    <h1>{settings.titleFirst}<br/><em>{settings.titleAccent}</em></h1>
    <p className="contact-social-description">{protectArtistName(settings.introduction)}</p>
    <div className="contact-social-divider" aria-hidden="true"><span/><span/></div>
    <div className="contact-social-message"><span className="contact-social-message-icon"><MessagesSquare size={19}/></span><div><strong>Let's talk where we're already connected.</strong><p>Choose one of my social platforms and reach out there — no forms or email required.</p></div></div>
    {primary&&<a className="contact-social-primary-link" href={primary.url} target="_blank" rel="noopener noreferrer"><span>Connect on {primary.social.label}</span><ArrowUpRight size={18}/></a>}
    <a className="contact-social-portfolio-link" href="#/portfolio">Explore the portfolio <ArrowRight size={17}/></a>
    {demoEnabled&&<button type="button" lang="pt-BR" className="contact-dev-edit" onClick={onEdit}><Pencil size={15}/>Personalizar contato e redes</button>}
   </section>
   <section className="contact-social-directory" aria-label="Social media contact channels">
    <header className="contact-social-directory-head">
     <div><span className="contact-social-section-index">DIRECT CONNECTIONS / 01</span><h2>Find me online<span>.</span></h2><p>{settings.greeting}</p></div>
     <span className="contact-social-head-ornament"><Waypoints size={21}/></span>
    </header>
    {channels.length>0?<div className="contact-social-cards">
     {channels.map(({social,url},index)=>{
      const meta=channelDetails(social)
      return <a key={social.id} href={url} target="_blank" rel="noopener noreferrer"
       className={'contact-social-card'+(index===0?' contact-social-card-featured':'')}
       aria-label={'Visit '+social.label+' profile (opens in a new tab)'}>
       <span className="contact-social-card-icon"><SocialMark social={social}/></span>
       <span className="contact-social-card-info"><span className="contact-social-card-tag">{meta.tag}</span><strong>{social.label}</strong><small>{meta.description}</small></span>
       <span className="contact-social-card-arrow"><ArrowUpRight size={20}/></span>
      </a>
     })}
    </div>:<div className="contact-social-empty"><p>Social profiles are being updated. Please check back soon.</p>{demoEnabled&&<button type="button" onClick={onEdit}>Configurar redes sociais</button>}</div>}
    <div className="contact-social-directory-footer"><span className="contact-social-status-dot"/>Links open directly on their respective platforms.</div>
   </section>
  </div>
  <div className="contact-social-bottomline" aria-hidden="true"><span>3D ART</span><i/><span>CHARACTERS</span><i/><span>ENVIRONMENTS</span><i/><span>CREATIVE DIRECTION</span></div>
 </main>
}
