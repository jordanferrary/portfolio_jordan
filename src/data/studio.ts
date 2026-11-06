import type { Project } from './projects'
import { bundledAsset } from '../lib/default-assets'
export interface Testimonial { id:string; author:string; role:string; quote:string }
export interface MusicTrack { id:string; title:string; artist:string; src:string; cover?:string }
export type SocialIcon = 'github'|'instagram'|'behance'|'youtube'|'linkedin'|'twitter'|'facebook'|'twitch'|'dribbble'|'discord'|'tiktok'|'pinterest'|'reddit'|'artstation'|'globe'|'mail'|'custom'
export interface SocialLink { id:string; label:string; url:string; icon:SocialIcon; iconImage?:string }
export const socialIconOptions:SocialIcon[]=['github','instagram','behance','youtube','linkedin','twitter','facebook','twitch','dribbble','discord','tiktok','pinterest','reddit','artstation','globe','mail','custom']
export const defaultSocialLinks:SocialLink[]=[
 {id:'instagram',label:'Instagram',url:'https://www.instagram.com/jordan_.ferrary/',icon:'instagram'},
 {id:'github',label:'GitHub',url:'https://github.com/jordanferrary',icon:'github'},
 {id:'behance',label:'Behance',url:'',icon:'behance'}
]
export interface HomeContent {
 eyebrow:string
 titleFirst:string
 titleSecond:string
 introduction:string
 avatar:string
 background:string
 available:boolean
 aboutTagline:string
 specialties:string[]
 focusItems:string[]
}
export const defaultHome:HomeContent = {
 eyebrow:'3D Artist & Digital Creator',
 titleFirst:'The artist\nbehind the',
 titleSecond:'worlds.',
 introduction:"I'm Jordan Ferrary, a 3D artist focused on bringing ideas to life through art, modeling and creativity.",
 avatar:bundledAsset('profile/avatar.webp'),
 background:bundledAsset('hero/hero-character.webp'),
 available:true,
 aboutTagline:'Turning imagination into reality.',
 specialties:['3D Modeling','LookDev','Stylized Art','Animation'],
 focusItems:['3D Art & Characters','Games & Interactive','Stylized Assets & Environments']
}
export const defaultTestimonials:Testimonial[] = []
export const defaultMusicTracks:MusicTrack[] = []
export const projectProcess=(p:Project)=>p.processSteps??[]

export interface AboutContent {
 eyebrow:string
 titleFirst:string
 titleAccent:string
 name:string
 bio:string
 portrait:string
 secondaryImage:string
 specialties:string[]
}
export const defaultAbout:AboutContent={
 eyebrow:'✦ Behind the art',
 titleFirst:'More than pixels.',
 titleAccent:'A creative vision.',
 name:'Jordan Ferrary',
 bio:'3D artist, modeler, illustrator and motion designer. I create characters, environments and visual experiences through technical curiosity and artistic direction.',
 portrait:import.meta.env.BASE_URL+'images/profile/avatar.webp',
 secondaryImage:'',
 specialties:['3D Modeling','Sculpting','Motion Design','Illustration','Game Art']
}


export interface ContactSettings {
 titleFirst:string
 titleAccent:string
 introduction:string
 greeting:string
 interestOptions:string[]
 allowAvatar:boolean
 allowAttachments:boolean
}
export const defaultContact:ContactSettings={
 titleFirst:'Have a project',
 titleAccent:'in mind?',
 introduction:'For collaborations, commissions, or questions about my work, reach out through my social profiles. Let’s start a conversation.',
 greeting:'Choose a platform below to explore my work or get in touch.',
 interestOptions:['3D Characters','3D Modeling & Sculpting','Environments','Game Art','Motion Design','Illustration','Other'],
 allowAvatar:false,
 allowAttachments:true
}

/** The portfolio banner is configured independently from the Home wallpaper. */
export const defaultGalleryBackground=bundledAsset('hero/hero-character.webp')
