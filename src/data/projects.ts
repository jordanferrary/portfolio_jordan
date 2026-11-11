import type { ImageFraming } from '../lib/image-framing'
export type BlockType = 'heading' | 'text' | 'image' | 'image-left' | 'image-right' | 'before-after' | 'gallery' | 'divider' | 'video' | 'model' | 'slideshow' | 'process'
export type GalleryEntry = {id:string;image:string;artist:string;title:string;description:string;portfolioUrl:string}
export type SlideEntry = {id:string;image:string;title:string;caption:string}
export type SlideEffect = 'fade'|'slide'|'zoom'|'none'
export type Block = { id:string; type:BlockType; content:string; videoTitle?:string; media?:string; after?:string; gallery?:string[];galleryEntries?:GalleryEntry[];galleryMode?:'simple'|'artists';slides?:SlideEntry[];slideAutoplay?:boolean;slideEffect?:SlideEffect;slideInterval?:number;slideHeight?:number;slideShowPauseButton?:boolean; dividerIcon?:'none'|'sparkles'|'star'|'diamond'|'circle'; dividerStyle?:'glow'|'solid'|'dashed'; beforeLabel?:string; afterLabel?:string }
export type ProcessStep = { id:string; label:string; image:string }
export type CategoryIcon = 'user'|'mountain'|'box'|'sparkles'|'grid'|'palette'|'film'|'brush'|'shapes'
export type Category = { id:string; label:string; icon:CategoryIcon; image?:string }
export type Project = { id:string;title:string;category:string;year:string;image:string;description:string;tools:string[];featured:boolean;blocks:Block[];processSteps?:ProcessStep[];processTemplateMigrated?:boolean;coverFocus?:ImageFraming;heroFocus?:ImageFraming }
/**
 * Migrate the old, end-of-page process presentation into a movable block once.
 * The marker prevents a deliberately removed template from returning on reload.
 */
export function upgradeProcessTemplate(project:Project):Project{
 if(project.processTemplateMigrated)return project
 const blocks=project.blocks??[]
 const alreadyPresent=blocks.some(block=>block.type==='process')
 const hasImages=(project.processSteps??[]).some(step=>typeof step.image==='string'&&step.image.trim().length>0)
 if(alreadyPresent||!hasImages)return {...project,processTemplateMigrated:true}
 const firstComparison=blocks.findIndex(block=>block.type==='before-after')
 const firstGallery=blocks.findIndex(block=>block.type==='gallery'||block.type==='slideshow')
 const insertAt=firstComparison>=0?firstComparison:firstGallery>=0?firstGallery+1:blocks.length
 const movableBlock:Block={id:'b-process-'+project.id,type:'process',content:'Creative process'}
 const upgraded=[...blocks]
 upgraded.splice(insertAt,0,movableBlock)
 return {...project,blocks:upgraded,processTemplateMigrated:true}
}
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
