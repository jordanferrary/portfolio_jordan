import { Dribbble,Facebook,Github,Globe,Instagram,Linkedin,Mail,Twitch,Twitter,Youtube,Link as LinkIcon } from 'lucide-react'
import type { SocialIcon,SocialLink } from '../../data/studio'
import { AssetImage } from './asset-image'
const icons={github:Github,instagram:Instagram,youtube:Youtube,linkedin:Linkedin,twitter:Twitter,facebook:Facebook,twitch:Twitch,dribbble:Dribbble,globe:Globe,mail:Mail,custom:LinkIcon}
const short:Partial<Record<SocialIcon,string>>={behance:'Bē',discord:'Di',tiktok:'♪',pinterest:'P',reddit:'r',artstation:'A'}
export function SocialMark({social}:{social:SocialLink}){
 if(social.iconImage)return <AssetImage className="social-custom-icon" src={social.iconImage} alt=""/>
 const Icon=icons[social.icon as keyof typeof icons]
 if(Icon)return <Icon size={20} aria-hidden="true"/>
 return <span className="social-short-mark">{short[social.icon]??social.label.slice(0,2)}</span>
}
export function safeSocialUrl(url:string):string|undefined{
 const value=url.trim()
 if(/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value))return value
 try{const parsed=new URL(value);if(['http:','https:'].includes(parsed.protocol)&&parsed.hostname.includes('.'))return parsed.href}catch{/* invalid */ }
 return undefined
}
