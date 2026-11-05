export type Block = { id: string; type: 'heading' | 'text' | 'image'; content: string }
export type Project = { id: string; title: string; category: string; year: string; image: string; description: string; tools: string[]; featured: boolean; blocks: Block[] }
export const images = ['void-wanderer.webp','moonlit-cottage.webp','deepwalker.webp','astral-guardian.webp','neon-armor.webp','ancient-ruins.webp']
export const imageUrl = (name:string) => import.meta.env.BASE_URL + 'images/' + name
const sample = (id:string,title:string,category:string,year:string,image:string,description:string,tools:string[],featured:boolean):Project => ({id,title,category,year,image:imageUrl(image),description,tools,featured,blocks:[{id:id+'-intro',type:'heading',content:'Behind the project'},{id:id+'-story',type:'text',content:description},{id:id+'-visual',type:'image',content:imageUrl(image)},{id:id+'-process',type:'heading',content:'Creative process'},{id:id+'-details',type:'text',content:'Explore the sculpt, topology, materials, lighting and final presentation of this work.'}]})
export const initialProjects:Project[] = [
sample('void-wanderer','Void Wanderer','Characters','2026','void-wanderer.webp','A character study focused on style, expression and mood. This project explores a more introspective and mysterious aesthetic.',['ZBrush','Blender','Texturing'],true),
sample('moonlit-cottage','Moonlit Cottage','Environments','2026','moonlit-cottage.webp','A stylized fantasy cottage with warm windows and a cinematic nighttime atmosphere.',['Blender','Lighting'],true),
sample('deepwalker','Deepwalker','Characters','2026','deepwalker.webp','An underwater-inspired stylized character exploring silhouette, materials and personality.',['ZBrush','Blender'],true),
sample('astral-guardian','Astral Guardian','Stylized','2025','astral-guardian.webp','A fantasy-inspired stylized character exploration.',['Blender'],false),
sample('neon-armor','Neon Armor','Props','2025','neon-armor.webp','Hard-surface shapes, modular forms and glowing purple accents.',['Blender'],false),
sample('ancient-ruins','Ancient Ruins','Environments','2025','ancient-ruins.webp','An atmospheric study of monumental ancient architecture.',['Blender'],false)
]
export const starterCategories = ['Characters','Environments','Props','Stylized','Others']
