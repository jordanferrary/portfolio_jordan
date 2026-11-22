
import type {Project} from '../data/projects'
import {isSensitiveTheme,projectMatchesVisibility} from './sensitive-themes'

type ListingProject=Pick<Project,'category'|'sensitiveTheme'|'unlisted'>
export const UNLISTED_FILTER='__studio_unlisted__'
export const UNLISTED_SEARCH='020802'
// Unlisted sharing is for ordinary portfolio projects, independent of content notices.
export function isUnlisted(project:ListingProject){
 return project.unlisted===true&&!isSensitiveTheme(project)
}
export function canFeatureProject(project:ListingProject){
 return !isUnlisted(project)&&!isSensitiveTheme(project)
}
export function projectInListing(project:ListingProject,filter:string,editing:boolean,search:string){
 if(search===UNLISTED_SEARCH)return isUnlisted(project)
 if(filter===UNLISTED_FILTER)return editing&&isUnlisted(project)
 return !isUnlisted(project)&&projectMatchesVisibility(project,filter)
}
export function normalizeProjectListing<T extends ListingProject&Pick<Project,'featured'|'featuredOrder'>>(project:T):T{
 const unlisted=isUnlisted(project)
 return {...project,unlisted,...(!canFeatureProject(project)?{featured:false,featuredOrder:undefined}:{})}
}

/** Public category chips reflect the normal listing, not the current search.
 * Empty categories remain available for authoring; unlisted work never counts. */
export function visibleGalleryCategories<T extends {label:string}>(categories:readonly T[],projects:readonly ListingProject[],editing:boolean):readonly T[]{
 if(editing)return categories
 return categories.filter(category=>projects.some(project=>projectInListing(project,category.label,false,'')))
}
