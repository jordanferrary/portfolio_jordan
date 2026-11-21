import type {Project} from '../data/projects'
import type {VisitorLanguage} from './visitor-language'

/** Sensitivity is independent of artistic categories, including legacy warning labels. */
type ClassifiedProject=Pick<Project,'category'|'sensitiveTheme'>
export function isSensitiveCategory(category:string):boolean{return category.trim().toUpperCase()==='NSFW'}
export function isSensitiveTheme(project:ClassifiedProject):boolean{return project.sensitiveTheme===true||isSensitiveCategory(project.category)}
export function projectMatchesVisibility(project:ClassifiedProject,filter:string):boolean{
 if(filter==='All')return true
 if(filter==='SFW')return !isSensitiveTheme(project)
 if(isSensitiveCategory(filter))return isSensitiveTheme(project)
 return !isSensitiveTheme(project)&&project.category===filter
}
export function shouldCoverProject(project:ClassifiedProject&Pick<Project,'id'>,revealed:ReadonlySet<string>):boolean{return isSensitiveTheme(project)&&!revealed.has(project.id)}
const copy={
 en:{safeTitle:'Hide sensitive themes',cover:'Sensitive theme',warningTitle:'Content notice',warningText:'This project explores a sensitive, non-explicit theme. Continue only if you are comfortable viewing this artwork.',back:'Back to portfolio',continue:'View this project'},
 pt:{safeTitle:'Ocultar temas sensíveis',cover:'Tema sensível',warningTitle:'Aviso de conteúdo',warningText:'Este projeto aborda um tema sensível, não explícito. Continue apenas se estiver confortável em visualizar esta obra.',back:'Voltar ao portfólio',continue:'Ver este projeto'},
 es:{safeTitle:'Ocultar temas sensibles',cover:'Tema sensible',warningTitle:'Aviso de contenido',warningText:'Este proyecto aborda un tema sensible, no explícito. Continúa solo si te sientes cómodo viendo esta obra.',back:'Volver al portafolio',continue:'Ver este proyecto'}
} as const
export function sensitiveCopy(language:VisitorLanguage){return copy[language]}
