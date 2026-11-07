import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight,ArrowUpRight,Maximize2,Pause,Play} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {safePageHref,type PageBlock} from '../../data/custom-pages'
const ArtLightbox=lazy(()=>import('../ui/art-lightbox').then(module=>({default:module.ArtLightbox})))

/** External images remain remote: no upload to the portfolio repository. */
export function ArtistShowcase({block}:{block:PageBlock}){
 const items=(block.showcaseItems??[]).filter(item=>item.image.trim())
 const [selected,setSelected]=useState(0)
 const [zoom,setZoom]=useState(false)
 useEffect(()=>{setSelected(0);setZoom(false)},[block.id])
 if(!items.length)return null
 const current=items[Math.min(selected,items.length-1)]
 const portfolio=safePageHref(current.portfolioUrl)
 return <section className="artist-showcase" aria-label="Galeria de artistas">
  <div className="artist-showcase-grid">{items.map((item,index)=><button type="button" key={item.id} className={'artist-showcase-card'+(current.id===item.id?' active':'')} onClick={()=>setSelected(index)} aria-label={'Ver detalhes de '+(item.name||'artista '+(index+1))} aria-pressed={current.id===item.id}>
   <AssetImage src={item.image} alt={item.name||'Arte do participante'} loading="lazy" sizes="(max-width: 700px) 45vw, 240px"/>
   <span>{item.name||'Artist '+(index+1)}</span>
  </button>)}</div>
  <aside className="artist-showcase-detail">
   <button type="button" className="artist-showcase-zoom" onClick={()=>setZoom(true)} aria-label="Ampliar arte selecionada"><AssetImage src={current.image} alt={current.name||'Arte selecionada'}/><span><Maximize2 size={16}/> Zoom</span></button>
   <div className="artist-showcase-detail-copy"><span className="artist-showcase-kicker">✦ FEATURED ARTIST</span><h3>{current.name||'Featured artist'}</h3>{current.description&&<p>{current.description}</p>}
   {portfolio?<a className="artist-showcase-portfolio" href={portfolio} target="_blank" rel="noopener noreferrer">View portfolio <ArrowUpRight size={17}/></a>:<span className="artist-showcase-portfolio disabled">Portfolio unavailable</span>}</div>
  </aside>
  {zoom&&<Suspense fallback={null}><ArtLightbox src={current.image} alt={current.name||'Artwork'} onClose={()=>setZoom(false)}/></Suspense>}
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
 const width=Math.max(50,Math.min(100,block.slideWidth??100))
 const preferred=block.slideVisible&&block.slideVisible>0?Math.min(5,Math.round(block.slideVisible)):height<=240?4:height<=320?3:height<=430?2:1
 // Preserve usable artwork widths; on a narrow screen even a short carousel will show fewer cards.
 const widthLimit=Math.max(1,Math.floor(stageWidth/175))
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
 },[width])
 useEffect(()=>{
  if(!playing||items.length<2||zoomedId)return
  const timer=window.setInterval(()=>setIndex(i=>(i+1)%items.length),interval)
  return ()=>window.clearInterval(timer)
 },[playing,items.length,interval,zoomedId])
 if(!items.length)return null
 const move=(direction:number)=>setIndex(i=>(i+direction+items.length)%items.length)
 const countLabel=visibleCount>1?String(index+1).padStart(2,'0')+'–'+String(((index+visibleCount-1)%items.length)+1).padStart(2,'0'):String(index+1).padStart(2,'0')
 return <section className={'page-slideshow transition-'+transition} style={{width:width+'%'}} aria-label="Apresentação de imagens" aria-roledescription="carousel">
  <div className="page-slideshow-stage" ref={stageRef} style={{height}} aria-live="off">
   <div className="page-slideshow-track" key={current.id+'-'+visibleCount} style={{gridTemplateColumns:'repeat('+visibleCount+',minmax(0,1fr))'}}>
    {visible.map((item,offset)=><button type="button" key={item.id} className="page-slideshow-image" onClick={()=>setZoomedId(item.id)} aria-label={'Ampliar slide '+(((index+offset)%items.length)+1)}>
     <AssetImage src={item.image} alt={item.caption||'Slide '+(((index+offset)%items.length)+1)} loading="lazy" style={{objectFit:block.slideFit==='cover'?'cover':'contain'}}/>
     <span className="page-slideshow-zoom"><Maximize2 size={17}/></span>
    </button>)}
   </div>
   {items.length>1&&<><button type="button" className="page-slideshow-arrow previous" onClick={()=>move(-1)} aria-label="Slide anterior"><ArrowLeft size={20}/></button><button type="button" className="page-slideshow-arrow next" onClick={()=>move(1)} aria-label="Próximo slide"><ArrowRight size={20}/></button></>}
  </div>
  <div className="page-slideshow-footer"><div className="page-slideshow-caption"><span>{countLabel} / {String(items.length).padStart(2,'0')}</span>{current.caption&&<p>{current.caption}</p>}</div>
   <div className="page-slideshow-controls">{items.length>1&&<><div className="page-slideshow-dots">{items.map((item,i)=><button type="button" key={item.id} className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={'Ir para slide '+(i+1)} aria-current={i===index?'true':undefined}/>)}</div><button type="button" className="page-slideshow-play" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pausar apresentação':'Reproduzir apresentação'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button></>}</div>
  </div>
  {zoomed&&<Suspense fallback={null}><ArtLightbox src={zoomed.image} alt={zoomed.caption||'Slide'} onClose={()=>setZoomedId(null)}/></Suspense>}
 </section>
}
