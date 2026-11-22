import type {Project} from '../data/projects'
import type {VisitorLanguage} from './visitor-language'

/** Sensitivity is independent of artistic categories, including legacy warning labels. */
type ClassifiedProject=Pick<Project,'category'|'sensitiveTheme'>
export function isSensitiveCategory(category:string):boolean{return typeof category==='string'&&category.trim().toUpperCase()==='NSFW'}
export function isSensitiveTheme(project:ClassifiedProject):boolean{return project.sensitiveTheme===true||isSensitiveCategory(project.category)}
export function projectMatchesVisibility(project:ClassifiedProject,filter:string):boolean{
 if(filter==='All')return true
 if(filter==='SFW')return !isSensitiveTheme(project)
 if(isSensitiveCategory(filter))return isSensitiveTheme(project)
 return !isSensitiveTheme(project)&&project.category===filter
}
export function shouldCoverProject(project:ClassifiedProject&Pick<Project,'id'>,revealed:ReadonlySet<string>):boolean{return isSensitiveTheme(project)&&!revealed.has(project.id)}
const copy={
 en:{safeTitle:'Hide sensitive themes',cover:'Sensitive theme',warningTitle:'Content notice',warningText:'This project explores sensitive themes and may not be suitable for all audiences.',back:'Back to portfolio',continue:'View this project'},
 pt:{safeTitle:'Ocultar temas sensíveis',cover:'Tema sensível',warningTitle:'Aviso de conteúdo',warningText:'Este projeto aborda temas sensíveis e pode não ser adequado para todos os públicos.',back:'Voltar ao portfólio',continue:'Ver este projeto'},
 es:{safeTitle:'Ocultar temas sensibles',cover:'Tema sensible',warningTitle:'Aviso de contenido',warningText:'Este proyecto aborda temas sensibles y puede no ser adecuado para todos los públicos.',back:'Volver al portafolio',continue:'Ver este proyecto'}
} as const
export function sensitiveCopy(language:VisitorLanguage){return copy[language]}
