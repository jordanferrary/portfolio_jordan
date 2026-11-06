import '../../styles/art-lightbox.css'
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type WheelEvent} from 'react'
import {createPortal} from 'react-dom'
import {Minus,Plus,RotateCcw,X} from 'lucide-react'
import {useAssetSrc} from './asset-image'

type Props={src:string;alt:string;onClose:()=>void}
type Point={x:number;y:number}
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}

export function ArtLightbox({src,alt,onClose}:Props){
 const resolved=useAssetSrc(src)
 const [zoom,setZoom]=useState(1)
 const [pan,setPan]=useState<Point>({x:0,y:0})
 const stage=useRef<HTMLDivElement>(null)
 const closeButton=useRef<HTMLButtonElement>(null)
 const points=useRef(new Map<number,Point>())
 const drag=useRef<{start:Point;pan:Point}|null>(null)
 const pinch=useRef<{distance:number;zoom:number}|null>(null)
 const previousFocus=useRef<HTMLElement|null>(null)
 const changeZoom=(value:number)=>{const next=clamp(Number(value.toFixed(2)),1,5);setZoom(next);if(next===1)setPan({x:0,y:0})}
 const adjustZoom=(amount:number)=>setZoom(previous=>clamp(Number((previous+amount).toFixed(2)),1,5))
 useEffect(()=>{
  previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null
  const previousOverflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  closeButton.current?.focus()
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose()}
   if(event.key==='+'||event.key==='='){event.preventDefault();adjustZoom(.5)}
   if(event.key==='-'){event.preventDefault();adjustZoom(-.5)}
   if(event.key==='0'){event.preventDefault();changeZoom(1)}
  }
  document.addEventListener('keydown',onKey)
  return ()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=previousOverflow;previousFocus.current?.focus()}
 },[onClose])
 const pointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(event.target instanceof HTMLElement&&event.target.closest('button'))return
  event.currentTarget.setPointerCapture(event.pointerId)
  points.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
  if(points.current.size===1){drag.current={start:{x:event.clientX,y:event.clientY},pan};pinch.current=null}
  else if(points.current.size===2){const [a,b]=[...points.current.values()];pinch.current={distance:Math.max(1,distance(a,b)),zoom};drag.current=null}
 }
 const pointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(!points.current.has(event.pointerId))return
  points.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
  if(points.current.size>=2&&pinch.current){
   const [a,b]=[...points.current.values()]
   changeZoom(pinch.current.zoom*distance(a,b)/pinch.current.distance)
  }else if(points.current.size===1&&drag.current&&zoom>1){
   setPan({x:drag.current.pan.x+event.clientX-drag.current.start.x,y:drag.current.pan.y+event.clientY-drag.current.start.y})
  }
 }
 const pointerEnd=(event:ReactPointerEvent<HTMLDivElement>)=>{
  points.current.delete(event.pointerId)
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
  pinch.current=null
  const first=[...points.current.values()][0]
  drag.current=first?{start:first,pan}:null
 }
 const wheel=(event:WheelEvent<HTMLDivElement>)=>{event.preventDefault();changeZoom(zoom+(event.deltaY<0?.25:-.25))}
 return createPortal(<div className="art-lightbox" role="dialog" aria-modal="true" aria-label={'Artwork viewer: '+alt} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <div className="art-lightbox-toolbar">
   <span className="art-lightbox-title">{alt}</span>
   <div className="art-lightbox-controls" aria-label="Zoom controls">
    <button type="button" onClick={()=>changeZoom(zoom-.5)} disabled={zoom<=1} aria-label="Zoom out"><Minus size={19}/></button>
    <output aria-label="Zoom level">{Math.round(zoom*100)}%</output>
    <button type="button" onClick={()=>changeZoom(zoom+.5)} disabled={zoom>=5} aria-label="Zoom in"><Plus size={19}/></button>
    <button type="button" onClick={()=>{setZoom(1);setPan({x:0,y:0})}} aria-label="Reset view"><RotateCcw size={18}/></button>
    <button type="button" ref={closeButton} onClick={onClose} aria-label="Close viewer"><X size={21}/></button>
   </div>
  </div>
  <div className="art-lightbox-stage" ref={stage} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onWheel={wheel} onDoubleClick={()=>changeZoom(zoom===1?2:1)}>
   {resolved&&<img src={resolved} alt={alt} draggable={false} style={{transform:'translate('+pan.x+'px,'+pan.y+'px) scale('+zoom+')',cursor:zoom>1?'grab':'zoom-in'}}/>}
  </div>
  <p className="art-lightbox-help">Scroll or pinch to zoom · Drag to inspect · Esc to close</p>
 </div>,document.body)
}
