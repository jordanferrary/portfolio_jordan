import type { Project } from './projects'
export interface Testimonial { id:string; author:string; role:string; quote:string }
export interface MusicTrack { id:string; title:string; artist:string; src:string }
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
 avatar:import.meta.env.BASE_URL+'images/profile/avatar.webp',
 background:import.meta.env.BASE_URL+'images/hero/hero-character.webp',
 available:true,
 aboutTagline:'Turning imagination into reality.',
 specialties:['3D Modeling','LookDev','Stylized Art','Animation'],
 focusItems:['3D Art & Characters','Games & Interactive','Stylized Assets & Environments']
}
export const defaultTestimonials:Testimonial[] = []
export const defaultMusicTracks:MusicTrack[] = []
export const projectProcess=(p:Project)=>p.processSteps??[]
