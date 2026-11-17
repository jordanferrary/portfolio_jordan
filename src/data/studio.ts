import type { Project } from './projects'
import { bundledAsset } from '../lib/default-assets'
import type {ImageFraming} from '../lib/image-framing'
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
 backgroundFocus?:ImageFraming
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
 backgroundFocus:{x:50,y:50,zoom:1},
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
 footerTags:string[]
}
export const defaultContact:ContactSettings={
 titleFirst:'Have a project',
 titleAccent:'in mind?',
 introduction:'For collaborations, commissions, or questions about my work, reach out through my social profiles. Let’s start a conversation.',
 greeting:'Choose a platform below to explore my work or get in touch.',
 footerTags:['3D ART','CHARACTERS','ENVIRONMENTS','CREATIVE DIRECTION'],
}

/** Normalize Contact footer tags. Empty array deliberately hides the entire ribbon. */
export function normalizeContactTags(input:unknown,fallback:string[]=defaultContact.footerTags):string[]{
 if(!Array.isArray(input))return [...fallback]
 const seen=new Set<string>()
 return input.filter((value):value is string=>typeof value==='string').map(value=>value.trim().slice(0,38)).filter(value=>{
  const key=value.toLocaleLowerCase('en')
  if(!value||seen.has(key))return false
  seen.add(key)
  return true
 }).slice(0,18)
}


export interface GalleryContent{
 eyebrow:string
 titleFirst:string
 titleAccent:string
 introduction:string
 allLabel:string
 searchPlaceholder:string
 emptyMessage:string
}
export const defaultGalleryContent:GalleryContent={
 eyebrow:'Explore my portfolio',
 titleFirst:'A world of art,\nin every',
 titleAccent:'detail.',
 introduction:'Dive into my 3D creations and discover the stories\nbehind each project.',
 allLabel:'All',
 searchPlaceholder:'Search for projects...',
 emptyMessage:'No projects found. Try another filter or search term.'
}
export function normalizeGalleryContent(value:unknown):GalleryContent{
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value as Partial<Record<keyof GalleryContent,unknown>>:{}
 const result={...defaultGalleryContent}
 const limits:Record<keyof GalleryContent,number>={eyebrow:100,titleFirst:160,titleAccent:90,introduction:600,allLabel:28,searchPlaceholder:100,emptyMessage:240}
 for(const key of Object.keys(limits) as Array<keyof GalleryContent>){
  const item=input[key]
  if(typeof item==='string')result[key]=item.slice(0,limits[key])
 }
 return result
}

/** The portfolio banner is configured independently from the Home wallpaper. */
export const defaultGalleryBackground=bundledAsset('hero/hero-character.webp')
