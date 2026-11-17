import type {VisitorLanguage} from './visitor-language'
import {localPhrase} from './public-page-translation'

/** Stable, offline translation for dynamic filter status text. */
export function galleryFilterSummary(visible:number,total:number,selected:string,language:VisitorLanguage):string{
 const category=selected==='All'
  ?(localPhrase('All categories',language)??'All categories')
  :(localPhrase(selected,language)??selected)
 if(language==='pt')return visible+' de '+total+' projetos · '+category+' · Pesquise também por software ou técnica.'
 if(language==='es')return visible+' de '+total+' proyectos · '+category+' · También puedes buscar por software o técnica.'
 return visible+' of '+total+' projects · '+category+' · Search by software or technique as well.'
}
