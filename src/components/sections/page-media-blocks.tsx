import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight,ArrowUpRight,Maximize2,Pause,Play,X} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {safePageHref,type PageBlock} from '../../data/custom-pages'
const ArtLightbox=lazy(()=>import('../ui/art-lightbox').then(module=>({default:module.ArtLightbox})))

/** Independent images can belong to artists, awards, certificates or any collection. */
export function ArtistShowcase({block}:{block:PageBlock}){
 const items=(block.showcaseItems??[]).filter(item=>item.image.trim())
 const [selectedId,setSelectedId]=useState<string|null>(null)
 const [zoom,setZoom]=useState(false)
 useEffect(()=>{setSelectedId(null);setZoom(false)},[block.id])
 const current=items.find(item=>item.id===selectedId)??null
 const destination=current?safePageHref(current.portfolioUrl):null
 if(!items.length)return null
 return <section className={'artist-showcase'+(current?' is-open':'')} aria-label="Interactive gallery">
  <div className="artist-showcase-grid">{items.map(item=><button type="button" key={item.id} className={'artist-showcase-card'+(current?.id===item.id?' active':'')} onClick={()=>{setZoom(false);setSelectedId(previous=>previous===item.id?null:item.id)}} aria-label={'View details: '+(item.name||'Untitled item')} aria-pressed={current?.id===item.id}>
   <AssetImage src={item.image} alt={item.name||'Gallery item'} loading="lazy" sizes="(max-width: 700px) 45vw, 240px" style={{objectFit:block.showcaseFit==='contain'?'contain':'cover'}}/>
   {item.name&&<span>{item.name}</span>}
  </button>)}</div>
  {current&&<aside className="artist-showcase-detail" aria-label={'Details: '+(current.name||'Selected item')}>
   <button type="button" className="artist-showcase-close" onClick={()=>{setSelectedId(null);setZoom(false)}} aria-label="Close details"><X size={18}/></button>
   <button type="button" className="artist-showcase-zoom" onClick={()=>setZoom(true)} aria-label="Enlarge selected image"><AssetImage src={current.image} alt={current.name||'Selected item'}/><span><Maximize2 size={16}/> Zoom</span></button>
   <div className="artist-showcase-detail-copy"><span className="artist-showcase-kicker">✦ ITEM DETAILS</span>{current.name&&<h3>{current.name}</h3>}{current.description&&<p>{current.description}</p>}
    {current.showLink!==false&&destination&&<a className="artist-showcase-portfolio" href={destination} target="_blank" rel="noopener noreferrer">{current.linkLabel?.trim()||'View portfolio'} <ArrowUpRight size={17}/></a>}
   </div>
  </aside>}
  {zoom&&current&&<Suspense fallback={null}><ArtLightbox src={current.image} alt={current.name||'Gallery item'} onClose={()=>setZoom(false)}/></Suspense>}
 </section>
}

/** Responsive multi-image carousel: the stage is shorter => more images can fit. */
export function PageSlideshow({block}:{block:PageBlock}){
 const items=(block.slideItems??[]).filter(item=>item.image.trim())
 const [index,setIndex]=useState(0)
 const [playing,setPlaying]=useState(block.slideAutoplay===true)
 const [zoomedId,setZoomedId]=useState<string|null>(null)
 const [stageWidth,setStageWidth]=useState(1024)
 const stageRef=useRef<HTMLDivElement>(null)
 const interval=Math.max(1500,Math.min(30000,block.slideInterval??5000))
 const transition=block.slideTransition??'fade'
 const height=Math.max(180,Math.min(640,block.slideHeight??520))
 const preferred=height<=240?4:height<=320?3:height<=430?2:1
 // Preserve usable artwork widths; on a narrow screen even a short carousel will show fewer cards.
 const widthLimit=Math.max(1,Math.floor((stageWidth-30)/150))
 const visibleCount=Math.max(1,Math.min(items.length,preferred,widthLimit))
 const current=items[Math.min(index,Math.max(0,items.length-1))]
 const visible=Array.from({length:Math.min(visibleCount,items.length)},(_,offset)=>items[(index+offset)%items.length])
 const zoomed=items.find(item=>item.id===zoomedId)
 useEffect(()=>{setIndex(0);setPlaying(block.slideAutoplay===true);setZoomedId(null)},[block.id,block.slideAutoplay])
 useEffect(()=>{
  const node=stageRef.current
  if(!node)return
  const measure=()=>setStageWidth(node.getBoundingClientRect().width)
  measure()
  if(typeof ResizeObserver!=='undefined'){
   const observer=new ResizeObserver(measure)
   observer.observe(node)
   return ()=>observer.disconnect()
  }
  window.addEventListener('resize',measure)
  return ()=>window.removeEventListener('resize',measure)
 },[items.length])
 useEffect(()=>{
  if(!playing||items.length<2||zoomedId)return
  const timer=window.setInterval(()=>setIndex(i=>(i+1)%items.length),interval)
  return ()=>window.clearInterval(timer)
 },[playing,items.length,interval,zoomedId])
 if(!items.length)return null
 const move=(direction:number)=>setIndex(i=>(i+direction+items.length)%items.length)
 return <section className={'page-slideshow transition-'+transition} aria-label="Apresentação de imagens" aria-roledescription="carousel">
  <div className="page-slideshow-stage" ref={stageRef} style={{height}} aria-live="off">
   <div className="page-slideshow-track" key={current.id+'-'+visibleCount} style={{gridTemplateColumns:'repeat('+visibleCount+',minmax(0,1fr))'}}>
    {visible.map((item,offset)=><button type="button" key={item.id} className="page-slideshow-image" onClick={()=>setZoomedId(item.id)} aria-label={'Ampliar slide '+(((index+offset)%items.length)+1)}>
     <AssetImage src={item.image} alt={item.caption||'Slide '+(((index+offset)%items.length)+1)} loading="lazy" style={{objectFit:block.slideFit==='cover'?'cover':'contain'}}/>
     <span className="page-slideshow-zoom"><Maximize2 size={17}/></span>
    </button>)}
   </div>
   {items.length>1&&<><button type="button" className="page-slideshow-arrow previous" onClick={()=>move(-1)} aria-label="Slide anterior"><ArrowLeft size={20}/></button><button type="button" className="page-slideshow-arrow next" onClick={()=>move(1)} aria-label="Próximo slide"><ArrowRight size={20}/></button></>}
   {items.length>1&&block.slideShowPauseButton===true&&<button type="button" className="page-slideshow-floating-play" onClick={()=>setPlaying(value=>!value)} aria-label={playing?'Pausar apresentação':'Reproduzir apresentação'} title={playing?'Pausar':'Reproduzir'}>{playing?<Pause size={16} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}</button>}
  </div>
  {zoomed&&<Suspense fallback={null}><ArtLightbox src={zoomed.image} alt={zoomed.caption||'Slide'} onClose={()=>setZoomedId(null)}/></Suspense>}
 </section>
}
