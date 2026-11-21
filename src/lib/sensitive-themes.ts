import type {Project} from '../data/projects'
import type {VisitorLanguage} from './visitor-language'

/** Independent of artistic categories; applies to non-explicit sensitive themes. */
export function projectMatchesVisibility(project:Pick<Project,'category'|'sensitiveTheme'>,filter:string):boolean{
 if(filter==='All')return true
 if(project.sensitiveTheme===true)return false
 return filter==='SFW'||project.category===filter
}
const copy={
 en:{safeTitle:'Hide sensitive themes',cover:'Sensitive theme',warningTitle:'Content notice',warningText:'This project explores a sensitive, non-explicit theme. Continue only if you are comfortable viewing this artwork.',back:'Back to portfolio',continue:'View this project'},
 pt:{safeTitle:'Ocultar temas sensíveis',cover:'Tema sensível',warningTitle:'Aviso de conteúdo',warningText:'Este projeto aborda um tema sensível, não explícito. Continue apenas se estiver confortável em visualizar esta obra.',back:'Voltar ao portfólio',continue:'Ver este projeto'},
 es:{safeTitle:'Ocultar temas sensibles',cover:'Tema sensible',warningTitle:'Aviso de contenido',warningText:'Este proyecto aborda un tema sensible, no explícito. Continúa solo si te sientes cómodo viendo esta obra.',back:'Volver al portafolio',continue:'Ver este proyecto'}
} as const
export function sensitiveCopy(language:VisitorLanguage){return copy[language]}
