import type { ImageFraming } from '../lib/image-framing'
export type BlockType = 'heading' | 'text' | 'image' | 'image-left' | 'image-right' | 'before-after' | 'gallery' | 'divider' | 'video' | 'model'
export type Block = { id:string; type:BlockType; content:string; videoTitle?:string; media?:string; after?:string; gallery?:string[]; dividerIcon?:'none'|'sparkles'|'star'|'diamond'|'circle'; dividerStyle?:'glow'|'solid'|'dashed'; beforeLabel?:string; afterLabel?:string }
export type ProcessStep = { id:string; label:string; image:string }
export type CategoryIcon = 'user'|'mountain'|'box'|'sparkles'|'grid'|'palette'|'film'|'brush'|'shapes'
export type Category = { id:string; label:string; icon:CategoryIcon; image?:string }
export type Project = { id:string;title:string;category:string;year:string;image:string;description:string;tools:string[];featured:boolean;blocks:Block[];processSteps?:ProcessStep[];coverFocus?:ImageFraming;heroFocus?:ImageFraming }
export const imageUrl = (name:string)=>import.meta.env.BASE_URL+'images/'+name
const sample=(id:string,title:string,category:string,year:string,image:string,description:string,tools:string[],featured:boolean):Project=>({
 id,title,category,year,image:imageUrl('projects/'+id+'/'+image),description,tools,featured,
 blocks:[{id:id+'-intro',type:'heading',content:'Behind the project'},
 {id:id+'-story',type:'text',content:description},
 {id:id+'-visual',type:'image',content:imageUrl('projects/'+id+'/'+image)},
 {id:id+'-process',type:'heading',content:'Creative process'},
 {id:id+'-details',type:'text',content:'From early exploration to final presentation — modeling, materials, lighting and artistic decisions.'}]
})
export const initialProjects:Project[]=[
 sample('void-wanderer','Void Wanderer','Characters','2026','void-wanderer.webp','A character study focused on style, expression and mood. This project explores a more introspective and mysterious aesthetic.',['ZBrush','Blender','Texturing'],true),
 sample('moonlit-cottage','Moonlit Cottage','Environments','2026','moonlit-cottage.webp','A stylized fantasy cottage with warm windows and a cinematic nighttime atmosphere.',['Blender','Lighting'],true),
 sample('deepwalker','Deepwalker','Characters','2026','deepwalker.webp','An underwater-inspired stylized character exploring silhouette, materials and personality.',['ZBrush','Blender'],true),
 sample('astral-guardian','Astral Guardian','Stylized','2025','astral-guardian.webp','A fantasy-inspired stylized character exploration.',['Blender'],false),
 sample('neon-armor','Neon Armor','Props','2025','neon-armor.webp','Hard-surface shapes, modular forms and glowing purple accents.',['Blender'],false),
 sample('ancient-ruins','Ancient Ruins','Environments','2025','ancient-ruins.webp','An atmospheric study of monumental ancient architecture.',['Blender'],false)]
export const starterCategories:Category[]=[
 {id:'characters',label:'Characters',icon:'user'},
 {id:'environments',label:'Environments',icon:'mountain'},
 {id:'props',label:'Props',icon:'box'},
 {id:'stylized',label:'Stylized',icon:'sparkles'},
 {id:'others',label:'Others',icon:'grid'}]
export const categoryIcons:CategoryIcon[]=['user','mountain','box','sparkles','grid','palette','film','brush','shapes']
