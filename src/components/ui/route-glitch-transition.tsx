import {useLayoutEffect,useRef,useState} from 'react'
import type {AnimationEvent} from 'react'
import {createPortal} from 'react-dom'

/** CSS-only fallback on browsers without native screenshot-based transitions. */
export function RouteGlitchTransition({routeKey}:{routeKey:string}){
 const previous=useRef(routeKey)
 const count=useRef(0)
 const [run,setRun]=useState<number|null>(null)
 useLayoutEffect(()=>{
  if(previous.current===routeKey)return
  previous.current=routeKey
  if(typeof document.startViewTransition==='function'||
     window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   setRun(null)
   return
  }
  setRun(++count.current)
 },[routeKey])
 const finish=(event:AnimationEvent<HTMLDivElement>)=>{
  if(event.target!==event.currentTarget||event.animationName!=='jf-fallback-glitch')return
  setRun(current=>current===run?null:current)
 }
 if(run===null)return null
 return <div key={run} className="jf-route-glitch" aria-hidden="true" onAnimationEnd={finish}>
  {Array.from({length:10},(_,i)=><span className="jf-glitch-fragment" key={i}/>)}
 </div>
}

/** Actual lazy-route fallback: no visible text; vivid bursts until resolved. */
export function RouteGlitchFallback(){
 const lang=typeof document!=='undefined'?document.documentElement.lang.toLowerCase():'en'
 const description=lang.startsWith('pt')?'Carregando conteúdo':lang.startsWith('es')?'Cargando contenido':'Loading content'
 const element=<div className="jf-route-glitch-pending" role="status" aria-label={description}>
  <div className="jf-glitch-corruption" aria-hidden="true">
   {Array.from({length:10},(_,i)=><span className="jf-glitch-fragment" key={i}/>)}
  </div>
 </div>
 return typeof document!=='undefined'?createPortal(element,document.body):element
}
