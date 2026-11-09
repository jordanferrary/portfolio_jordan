import {useEffect,useId,useRef,useState} from 'react'
import {Check,Languages} from 'lucide-react'
import {LANGUAGE_OPTIONS,type VisitorLanguage} from '../../lib/visitor-language'

/**
 * Language detection stays automatic. This is only the optional manual override:
 * a small glass button matching the social icons, never a native dropdown popup.
 */
export function LanguageSwitcher({language,onChange}:{language:VisitorLanguage;onChange:(value:VisitorLanguage)=>void}){
 const [open,setOpen]=useState(false)
 const root=useRef<HTMLDivElement>(null)
 const trigger=useRef<HTMLButtonElement>(null)
 const menuId=useId()
 const current=LANGUAGE_OPTIONS.find(option=>option.value===language)??LANGUAGE_OPTIONS[0]
 const selectionLabels={
  en:'Change portfolio language',
  pt:'Alterar idioma do portfólio',
  es:'Cambiar idioma del portafolio'
 }
 const descriptions={
  en:'Detected automatically. You can change it here.',
  pt:'Detectado automaticamente. Você pode trocar aqui.',
  es:'Detectado automáticamente. Puedes cambiarlo aquí.'
 }

 useEffect(()=>{
  if(!open)return
  const onPointer=(event:PointerEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false)
  }
  const onFocus=(event:FocusEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false)
  }
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){
    event.preventDefault()
    setOpen(false)
    trigger.current?.focus()
   }
  }
  document.addEventListener('pointerdown',onPointer)
  document.addEventListener('focusin',onFocus)
  document.addEventListener('keydown',onKey)
  return()=>{
   document.removeEventListener('pointerdown',onPointer)
   document.removeEventListener('focusin',onFocus)
   document.removeEventListener('keydown',onKey)
  }
 },[open])

 return <div ref={root} className={'language-switcher notranslate'+(open?' is-open':'')} translate="no">
  <button ref={trigger} type="button" className="language-switcher-trigger"
   title="Idioma / Language / Idioma"
   aria-label={selectionLabels[language]+': '+current.name}
   aria-haspopup="true" aria-controls={menuId} aria-expanded={open}
   onClick={()=>setOpen(value=>!value)}>
   <Languages size={18} strokeWidth={1.9} aria-hidden="true"/>
   <span className="language-switcher-code" aria-hidden="true">{current.label}</span>
  </button>
  {open&&<div id={menuId} className="language-switcher-menu" role="group" aria-label="Escolha o idioma / Choose language">
   <p className="language-switcher-heading">Idioma <span>·</span> Language</p>
   {LANGUAGE_OPTIONS.map(option=><button key={option.value} type="button"
    lang={option.value==='pt'?'pt-BR':option.value}
    className={'language-switcher-option'+(option.value===language?' is-selected':'')}
    aria-pressed={option.value===language}
    onClick={()=>{
     onChange(option.value)
     setOpen(false)
     trigger.current?.focus()
    }}>
    <span className="language-switcher-abbr" aria-hidden="true">{option.label}</span>
    <span className="language-switcher-name">{option.name}</span>
    {option.value===language&&<Check className="language-switcher-check" size={16} aria-hidden="true"/>}
   </button>)}
   <p className="language-switcher-note">{descriptions[language]}</p>
  </div>}
 </div>
}
