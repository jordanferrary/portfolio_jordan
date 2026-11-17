import type {Project} from '../data/projects'

/** The Home has exactly three showcase slots. Gallery order is independent. */
export const FEATURED_LIMIT=3

export function getFeaturedProjects(projects:Project[]):Project[]{
 return projects.map((project,index)=>({project,index}))
  .filter(({project})=>project.featured)
  .sort((a,b)=>{
   // Legacy projects have no custom rank and retain their original gallery order.
   const rank=(item:{project:Project;index:number})=>Number.isInteger(item.project.featuredOrder)&&
    (item.project.featuredOrder??-1)>=0&&item.project.featuredOrder!<FEATURED_LIMIT
     ?item.project.featuredOrder! : FEATURED_LIMIT+item.index
   return rank(a)-rank(b)||a.index-b.index
  })
  .slice(0,FEATURED_LIMIT).map(({project})=>project)
}

/** Selecting Home projects never rearranges the gallery or edits artwork. */
export function applyFeaturedSelection(projects:Project[],ids:string[]):Project[]{
 const valid=[...new Set(ids)].filter(id=>projects.some(p=>p.id===id)).slice(0,FEATURED_LIMIT)
 return projects.map(p=>{
  const rank=valid.indexOf(p.id)
  return {...p,featured:rank!==-1,featuredOrder:rank!==-1?rank:undefined}
 })
}
