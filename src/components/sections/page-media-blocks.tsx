import {lazy,Suspense,useEffect,useState} from 'react'
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

export function PageSlideshow({block}:{block:PageBlock}){
 const items=(block.slideItems??[]).filter(item=>item.image.trim())
 const [index,setIndex]=useState(0)
 const [playing,setPlaying]=useState(block.slideAutoplay===true)
 const [zoom,setZoom]=useState(false)
 const interval=Math.max(1500,Math.min(30000,block.slideInterval??5000))
 const transition=block.slideTransition??'fade'
 useEffect(()=>{setIndex(0);setPlaying(block.slideAutoplay===true)},[block.id,block.slideAutoplay])
 useEffect(()=>{
  if(!playing||items.length<2||zoom)return
  const timer=window.setInterval(()=>setIndex(i=>(i+1)%items.length),interval)
  return ()=>window.clearInterval(timer)
 },[playing,items.length,interval,zoom])
 if(!items.length)return null
 const current=items[Math.min(index,items.length-1)]
 const move=(direction:number)=>setIndex(i=>(i+direction+items.length)%items.length)
 return <section className={'page-slideshow transition-'+transition} aria-label="Apresentação de imagens" aria-roledescription="carousel">
  <div className="page-slideshow-stage" aria-live="off">
   <button type="button" className="page-slideshow-image" key={current.id} onClick={()=>setZoom(true)} aria-label="Ampliar slide"><AssetImage src={current.image} alt={current.caption||'Slide '+(index+1)}/><span className="page-slideshow-zoom"><Maximize2 size={17}/></span></button>
   {items.length>1&&<><button type="button" className="page-slideshow-arrow previous" onClick={()=>move(-1)} aria-label="Slide anterior"><ArrowLeft size={20}/></button><button type="button" className="page-slideshow-arrow next" onClick={()=>move(1)} aria-label="Próximo slide"><ArrowRight size={20}/></button></>}
  </div>
  <div className="page-slideshow-footer"><div className="page-slideshow-caption"><span>{String(index+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</span>{current.caption&&<p>{current.caption}</p>}</div>
   <div className="page-slideshow-controls">{items.length>1&&<><div className="page-slideshow-dots">{items.map((item,i)=><button type="button" key={item.id} className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={'Ir para slide '+(i+1)} aria-current={i===index?'true':undefined}/>)}</div><button type="button" className="page-slideshow-play" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pausar apresentação':'Reproduzir apresentação'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button></>}</div>
  </div>
  {zoom&&<Suspense fallback={null}><ArtLightbox src={current.image} alt={current.caption||'Slide'} onClose={()=>setZoom(false)}/></Suspense>}
 </section>
}