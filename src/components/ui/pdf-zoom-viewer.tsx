import '../../styles/art-lightbox.css'
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type WheelEvent} from 'react'
import {createPortal} from 'react-dom'
import {ChevronLeft,ChevronRight,Minus,Plus,RotateCcw,X} from 'lucide-react'
import {pdfFetchHref,pdfPreviewHref} from '../../lib/showcase-pdf'
import {pdfWorkerHref} from '../../lib/pdf-worker'
import {isPointOnDisplayedArtwork} from '../../lib/lightbox-hit-test'

type Point={x:number;y:number}
type PdfDocument=Awaited<ReturnType<typeof import('pdfjs-dist').getDocument>['promise']>
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n))
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)

/** The same centered, wheel/pinch/drag lightbox experience as portfolio art,
 * with first-class page navigation instead of a download button. */
export function PdfZoomViewer({url,title,onClose}:{url:string;title:string;onClose:()=>void}){
 const direct=pdfFetchHref(url)
 const embedded=direct?null:pdfPreviewHref(url)
 const pdfRef=useRef<PdfDocument|null>(null)
 const stageRef=useRef<HTMLDivElement>(null)
 const canvasRef=useRef<HTMLCanvasElement>(null)
 const closeRef=useRef<HTMLButtonElement>(null)
 const previousFocus=useRef<HTMLElement|null>(null)
 const points=useRef(new Map<number,Point>())
 const drag=useRef<{start:Point;pan:Point}|null>(null)
 const pinch=useRef<{distance:number;zoom:number}|null>(null)
 const outside=useRef<{id:number;point:Point}|null>(null)
 const onCloseRef=useRef(onClose)
 const [documentRevision,setDocumentRevision]=useState(0)
 const [pageNumber,setPageNumber]=useState(1)
 const [pageCount,setPageCount]=useState(0)
 const [zoom,setZoom]=useState(1)
 const [pan,setPan]=useState<Point>({x:0,y:0})
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading')
 useEffect(()=>{onCloseRef.current=onClose},[onClose])

 useEffect(()=>{
  if(!direct){setStatus(embedded?'ready':'error');return}
  let cancelled=false
  let loadingTask:ReturnType<typeof import('pdfjs-dist').getDocument>|null=null
  setStatus('loading')
  void (async()=>{
   try{
    const pdfjs=await import('pdfjs-dist')
    if(cancelled)return
    pdfjs.GlobalWorkerOptions.workerSrc=pdfWorkerHref()
    loadingTask=pdfjs.getDocument({url:direct,withCredentials:false,disableRange:true,disableStream:true})
    const pdf=await loadingTask.promise
    if(cancelled)return
    pdfRef.current=pdf
    setPageCount(pdf.numPages)
    setPageNumber(1)
    setDocumentRevision(current=>current+1)
   }catch{if(!cancelled)setStatus('error')}
  })()
  return ()=>{cancelled=true;pdfRef.current=null;if(loadingTask)void loadingTask.destroy().catch(()=>{})}
 },[direct,embedded])

 useEffect(()=>{
  const pdf=pdfRef.current
  if(!pdf||!direct)return
  let cancelled=false
  let rendering:{cancel:()=>void}|null=null
  setStatus('loading')
  void (async()=>{
   try{
    const page=await pdf.getPage(pageNumber)
    if(cancelled)return
    const canvas=canvasRef.current
    const ctx=canvas?.getContext('2d',{alpha:false})
    if(!canvas||!ctx)throw new Error('Canvas unavailable')
    const base=page.getViewport({scale:1})
    // Higher density than thumbnails for legibility, bounded to avoid large allocations.
    const scale=Math.min(3.5,2400/base.width,3200/base.height)
    const viewport=page.getViewport({scale})
    canvas.width=Math.max(1,Math.round(viewport.width))
    canvas.height=Math.max(1,Math.round(viewport.height))
    const task=page.render({canvas,canvasContext:ctx,viewport})
    rendering=task
    await task.promise
    if(!cancelled)setStatus('ready')
   }catch{if(!cancelled)setStatus('error')}
  })()
  return ()=>{cancelled=true;rendering?.cancel()}
 },[direct,documentRevision,pageNumber])

 useEffect(()=>{
  previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null
  const previousOverflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  closeRef.current?.focus()
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onCloseRef.current()}
   if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();setPageNumber(n=>Math.min(pageCount||1,n+1));setZoom(1);setPan({x:0,y:0})}
   if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();setPageNumber(n=>Math.max(1,n-1));setZoom(1);setPan({x:0,y:0})}
   if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(z=>clamp(Number((z+.5).toFixed(2)),1,5))}
   if(event.key==='-'){event.preventDefault();setZoom(z=>clamp(Number((z-.5).toFixed(2)),1,5))}
   if(event.key==='0'){event.preventDefault();setZoom(1);setPan({x:0,y:0})}
  }
  document.addEventListener('keydown',onKey)
  return ()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',onKey);previousFocus.current?.focus()}
 },[pageCount])
 useEffect(()=>{if(zoom===1)setPan(old=>old.x===0&&old.y===0?old:{x:0,y:0})},[zoom])

 const setZoomClamped=(value:number)=>{
  const next=clamp(Number(value.toFixed(2)),1,5)
  setZoom(next)
  if(next===1)setPan({x:0,y:0})
 }
 const changePage=(difference:number)=>{
  setPageNumber(n=>clamp(n+difference,1,Math.max(1,pageCount)))
  setZoom(1);setPan({x:0,y:0})
 }
 const pointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(embedded)return
  const point={x:event.clientX,y:event.clientY}
  const canvas=canvasRef.current
  const blank=canvas&&status==='ready'
   ?!isPointOnDisplayedArtwork(point,canvas.getBoundingClientRect(),canvas.width,canvas.height):false
  outside.current=points.current.size===0&&blank?{id:event.pointerId,point}:null
  event.currentTarget.setPointerCapture(event.pointerId)
  points.current.set(event.pointerId,point)
  if(points.current.size===1){drag.current={start:point,pan};pinch.current=null}
  else if(points.current.size===2){const [a,b]=[...points.current.values()];pinch.current={distance:Math.max(1,distance(a,b)),zoom};drag.current=null}
 }
 const pointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!points.current.has(event.pointerId))return
  const marker=outside.current
  if(marker?.id===event.pointerId&&distance(marker.point,{x:event.clientX,y:event.clientY})>8)outside.current=null
  points.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
  if(points.current.size>=2&&pinch.current){
   const [a,b]=[...points.current.values()]
   setZoomClamped(pinch.current.zoom*distance(a,b)/pinch.current.distance)
  }else if(points.current.size===1&&drag.current&&zoom>1){
   setPan({x:drag.current.pan.x+event.clientX-drag.current.start.x,y:drag.current.pan.y+event.clientY-drag.current.start.y})
  }
 }
 const pointerEnd=(event:ReactPointerEvent<HTMLDivElement>)=>{
  const marker=outside.current
  const close=event.type==='pointerup'&&marker?.id===event.pointerId&&points.current.size===1
   &&distance(marker.point,{x:event.clientX,y:event.clientY})<=8
  outside.current=null
  points.current.delete(event.pointerId)
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
  pinch.current=null
  const first=[...points.current.values()][0]
  drag.current=first?{start:first,pan}:null
  if(close)onCloseRef.current()
 }
 const wheel=(event:WheelEvent<HTMLDivElement>)=>{
  if(embedded)return
  event.preventDefault()
  const next=clamp(Number((zoom+(event.deltaY<0?.25:-.25)).toFixed(2)),1,5)
  const rect=stageRef.current?.getBoundingClientRect()
  if(rect&&next!==zoom){
   const cursorX=event.clientX-rect.left-rect.width/2
   const cursorY=event.clientY-rect.top-rect.height/2
   const ratio=next/zoom
   setPan(old=>({x:cursorX-(cursorX-old.x)*ratio,y:cursorY-(cursorY-old.y)*ratio}))
  }
  setZoomClamped(next)
 }
 return createPortal(<div className="art-lightbox pdf-lightbox" role="dialog" aria-modal="true" aria-label={'PDF viewer: '+title} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <div className="art-lightbox-toolbar">
   <span className="art-lightbox-title">{title}</span>
   <div className="art-lightbox-controls" aria-label="PDF viewing controls">
    {direct&&<><button type="button" onClick={()=>changePage(-1)} disabled={pageNumber<=1} aria-label="Previous PDF page"><ChevronLeft size={18}/></button>
     <output className="pdf-lightbox-count" aria-label="PDF page number">{pageCount?pageNumber+' / '+pageCount:'…'}</output>
     <button type="button" onClick={()=>changePage(1)} disabled={!pageCount||pageNumber>=pageCount} aria-label="Next PDF page"><ChevronRight size={18}/></button></>}
    <button type="button" onClick={()=>setZoomClamped(zoom-.5)} disabled={zoom<=1||!!embedded} aria-label="Zoom out"><Minus size={18}/></button>
    <output aria-label="Zoom level">{Math.round(zoom*100)}%</output>
    <button type="button" onClick={()=>setZoomClamped(zoom+.5)} disabled={zoom>=5||!!embedded} aria-label="Zoom in"><Plus size={18}/></button>
    <button type="button" onClick={()=>{setZoom(1);setPan({x:0,y:0})}} disabled={!!embedded} aria-label="Reset view"><RotateCcw size={17}/></button>
    <button type="button" ref={closeRef} onClick={onClose} aria-label="Close PDF"><X size={20}/></button>
   </div>
  </div>
  <div className="art-lightbox-stage pdf-lightbox-stage" ref={stageRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onWheel={wheel} onDoubleClick={()=>setZoomClamped(zoom===1?2:1)}>
   {direct&&<canvas ref={canvasRef} aria-label={'Page '+pageNumber+' of '+pageCount} style={{visibility:status==='ready'?'visible':'hidden',transform:'translate('+pan.x+'px,'+pan.y+'px) scale('+zoom+')',cursor:zoom>1?'grab':'zoom-in'}}/>}
   {embedded&&<iframe className="pdf-lightbox-embedded" title={'PDF: '+title} src={embedded}/>}
   {status==='loading'&&<p className="pdf-lightbox-feedback">Loading certificate…</p>}
   {status==='error'&&<p className="pdf-lightbox-feedback">Unable to display this PDF. Check that the document is publicly accessible.</p>}
  </div>
  <p className="art-lightbox-help">Scroll or pinch to zoom, and drag to move the page. Use the arrow keys to change pages or press Esc to close.</p>
 </div>,document.body)
}
