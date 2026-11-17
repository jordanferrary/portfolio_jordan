import {useLayoutEffect,useRef,useState} from 'react'
import type {AnimationEvent} from 'react'

/** Lightweight, nonblocking route-only transition (never used on the first load). */
export function RouteGlitchTransition({routeKey}:{routeKey:string}){
 const previous=useRef(routeKey)
 const counter=useRef(0)
 const [activeId,setActiveId]=useState<number|null>(null)
 useLayoutEffect(()=>{
  if(previous.current===routeKey)return
  previous.current=routeKey
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   setActiveId(null)
   return
  }
  setActiveId(++counter.current)
 },[routeKey])
 const onEnd=(event:AnimationEvent<HTMLDivElement>)=>{
  if(event.target!==event.currentTarget||event.animationName!=='jf-route-curtain')return
  setActiveId(current=>current===activeId?null:current)
 }
 if(activeId===null)return null
 return <div key={activeId} className="jf-route-glitch" aria-hidden="true" onAnimationEnd={onEnd}>
  {Array.from({length:7},(_,index)=><span key={index} className="jf-route-glitch-slice"/>)}
 </div>
}
