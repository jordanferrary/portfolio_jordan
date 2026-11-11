import {useEffect,useId,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import type {ProcessStep} from '../../data/projects'
import {ZoomableArt} from '../ui/zoomable-art'

/**
 * Project-owned steps are edited once in the Process tab. The composition
 * template decides their position in the editorial story, not their content.
 */
export function ProjectProcess({steps,heading,projectTitle}:{steps:ProcessStep[];heading:string;projectTitle:string}){
 const images=steps.filter(step=>typeof step.image==='string'&&step.image.trim().length>0)
 const titleId=useId()
 const scroller=useRef<HTMLDivElement>(null)
 const [active,setActive]=useState(0)
 const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:680px)').matches)
 useEffect(()=>{
  const query=window.matchMedia('(max-width:680px)')
  const sync=()=>{
   setMobile(query.matches)
   setActive(0)
   if(scroller.current)scroller.current.scrollLeft=0
  }
  query.addEventListener('change',sync)
  return ()=>query.removeEventListener('change',sync)
 },[])
 const lastStart=Math.max(0,images.length-(mobile?1:4))
 const navigate=(direction:-1|1)=>{
  const element=scroller.current
  if(!element)return
  const cards=Array.from(element.children) as HTMLElement[]
  if(!cards.length)return
  const target=Math.max(0,Math.min(lastStart,active+direction))
  const first=cards[0].offsetLeft
  element.scrollTo({left:cards[target].offsetLeft-first,behavior:'smooth'})
  setActive(target)
 }
 const syncPosition=()=>{
  const element=scroller.current
  if(!element)return
  const cards=Array.from(element.children) as HTMLElement[]
  if(!cards.length)return
  const first=cards[0].offsetLeft
  let nearest=0,distance=Infinity
  for(let i=0;i<cards.length;i++){
   const delta=Math.abs(element.scrollLeft-(cards[i].offsetLeft-first))
   if(delta<distance){distance=delta;nearest=i}
  }
  setActive(Math.min(lastStart,nearest))
 }
 if(!images.length)return null
 return <section className="story-block project-artwork-process project-process-section" aria-labelledby={titleId}>
  <header className="project-artwork-process-heading">
   <span className="project-process-eyebrow">✦ BEHIND THE ARTWORK</span>
   <h2 id={titleId}>{heading.trim()||'Creative process'}</h2>
   <p>A visual look at the stages behind this project.</p>
  </header>
  <div className={'project-artwork-process-grid process-count-'+Math.min(images.length,4)} ref={scroller} onScroll={syncPosition} aria-roledescription="carousel" aria-label="Creative process images">
   {images.map((step,index)=><figure className="project-process-step" key={step.id} aria-roledescription="slide">
    <div className="project-process-image">
     <ZoomableArt src={step.image} alt={projectTitle+' — '+(step.label.trim()||'Step '+(index+1))} loading="lazy" sizes="(max-width: 680px) 100vw, (max-width: 1200px) 25vw, 300px"/>
    </div>
    <figcaption><span className="project-process-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span>{step.label.trim()||'Step '+(index+1)}</span></figcaption>
   </figure>)}
  </div>
  {images.length>1&&<div className={'project-process-navigation'+(images.length>4?' has-overflow':'')} aria-label="Process carousel controls">
   <span className="project-process-position" aria-live="polite">{String(Math.min(active,lastStart)+1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}</span>
   <div className="project-process-navigation-actions">
    <button type="button" aria-label="Previous process image" onClick={()=>navigate(-1)} disabled={active<=0}><ArrowLeft size={17}/></button>
    <button type="button" aria-label="Next process image" onClick={()=>navigate(1)} disabled={active>=lastStart}><ArrowRight size={17}/></button>
   </div>
  </div>}
 </section>
}
