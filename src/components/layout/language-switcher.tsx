import {Languages} from 'lucide-react'
import {LANGUAGE_OPTIONS,type VisitorLanguage} from '../../lib/visitor-language'

/** Manual override always takes precedence over the approximate IP location. */
export function LanguageSwitcher({language,onChange}:{language:VisitorLanguage;onChange:(value:VisitorLanguage)=>void}){
 return <div className="language-switcher notranslate" translate="no" title="Idioma automático por região; você pode trocar a qualquer momento">
  <Languages size={17} aria-hidden="true"/>
  <select value={language} onChange={event=>onChange(event.target.value as VisitorLanguage)}
   aria-label="Idioma do portfólio / Portfolio language / Idioma del portafolio">
   {LANGUAGE_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
  </select>
 </div>
}
