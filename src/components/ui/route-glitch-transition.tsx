import {useLayoutEffect,useRef,useState,type CSSProperties,type AnimationEvent} from 'react'
import {createPortal} from 'react-dom'

/** Fixed deterministic coordinates avoid layout recalculation, assets, or randomness. */
const fragments=Array.from({length:12},(_,i)=>({
 left:((i*43+7)%112-9)+'%',
 top:((i*67+Math.floor(i/5)*19)%97)+'%',
 width:(14+(i*13)%37)+'%',
 height:(.45+(i%5)*.55)+'%',
 delay:'-'+((i*79)%850)+'ms'
}))
const bands=Array.from({length:4},(_,i)=>({
 top:((i*31+11)%97)+'%',
 height:(.2+(i%3)*.25)+'%',
 delay:'-'+((i*103)%850)+'ms'
}))
export function GlitchSignalArt(){
 return <div className="jf-glitch-scene" aria-hidden="true">
  <div className="jf-glitch-gradient-field"/>
  <div className="jf-glitch-blocks">
   {fragments.map((f,i)=><span key={i} className="jf-glitch-block" style={{
    left:f.left,top:f.top,width:f.width,height:f.height,animationDelay:f.delay
   } as CSSProperties}/>)}
  </div>
  <div className="jf-glitch-bands">
   {bands.map((f,i)=><span key={i} className="jf-glitch-band" style={{
    top:f.top,height:f.height,animationDelay:f.delay
   } as CSSProperties}/>)}
  </div>
  <div className="jf-glitch-grain"/>
  <div className="jf-glitch-chroma"/>
 </div>
}

/** Two-stage route transition: cover the outgoing page, then reveal the incoming page.
 * No first-load overlay and no dependency on network/chunk loading. */
export function RouteGlitchTransition({routeKey,onCovered}:{routeKey:string;onCovered:(key:string)=>void}){
 const previous=useRef(routeKey)
 const counter=useRef(0)
 const [active,setActive]=useState<{id:number;key:string;phase:'cover'|'reveal'}|null>(null)
 useLayoutEffect(()=>{
  if(previous.current===routeKey)return
  previous.current=routeKey
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){
   setActive(null)
   onCovered(routeKey)
   return
  }
  setActive({id:++counter.current,key:routeKey,phase:'cover'})
 },[routeKey,onCovered])
 const finish=(event:AnimationEvent<HTMLDivElement>)=>{
  if(event.currentTarget!==event.target||!active)return
  if(active.phase==='cover'&&event.animationName==='jf-glitch-cover'){
   onCovered(active.key)
   setActive(current=>current?.id===active.id&&current.phase==='cover'?{...current,phase:'reveal'}:current)
  }else if(active.phase==='reveal'&&event.animationName==='jf-glitch-reveal'){
   setActive(current=>current?.id===active.id?null:current)
  }
 }
 if(active===null)return null
 return createPortal(<div className="jf-route-glitch" data-phase={active.phase} key={active.id+'-'+active.phase} aria-hidden="true" onAnimationEnd={finish}>
  <GlitchSignalArt/>
 </div>,document.body)
}

/** Real Suspense fallback; the subdued static signal remains until the chunk arrives. */
export function RouteGlitchFallback(){
 const lang=typeof document!=='undefined'?document.documentElement.lang.toLowerCase():'en'
 const description=lang.startsWith('pt')?'Carregando conteúdo':lang.startsWith('es')?'Cargando contenido':'Loading content'
 const node=<div className="jf-route-glitch-pending" role="status" aria-label={description}>
  <GlitchSignalArt/>
 </div>
 return typeof document!=='undefined'?createPortal(node,document.body):node
}
