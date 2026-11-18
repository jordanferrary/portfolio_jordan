import {useEffect,useState} from 'react'
import {createPortal} from 'react-dom'
import {ArrowUpRight,Minus,Plus,X} from 'lucide-react'
import {PdfPagePreview} from './pdf-page-preview'
import {safeShowcaseDocumentHref} from '../../lib/showcase-pdf'

/** Focused first-page zoom; the full PDF link stays available for multipage documents. */
export function PdfZoomViewer({url,title,onClose}:{url:string;title:string;onClose:()=>void}){
 const [zoom,setZoom]=useState(100)
 const href=safeShowcaseDocumentHref(url)
 useEffect(()=>{
  const before=document.body.style.overflow
  document.body.style.overflow='hidden'
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.stopPropagation();onClose()}
   if(event.key==='+'||event.key==='=')setZoom(value=>Math.min(250,value+25))
   if(event.key==='-')setZoom(value=>Math.max(75,value-25))
  }
  document.addEventListener('keydown',onKey)
  return ()=>{document.body.style.overflow=before;document.removeEventListener('keydown',onKey)}
 },[onClose])
 return createPortal(<div className="pdf-zoom-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className="pdf-zoom-dialog" role="dialog" aria-modal="true" aria-label={'Ampliar certificado: '+title}>
   <header className="pdf-zoom-header">
    <h2>{title}</h2>
    <div className="pdf-zoom-controls">
     <button type="button" disabled={zoom===75} onClick={()=>setZoom(value=>Math.max(75,value-25))} aria-label="Diminuir zoom"><Minus size={16}/></button>
     <span aria-live="polite">{zoom}%</span>
     <button type="button" disabled={zoom===250} onClick={()=>setZoom(value=>Math.min(250,value+25))} aria-label="Aumentar zoom"><Plus size={16}/></button>
     {href&&<a href={href} target="_blank" rel="noopener noreferrer">Full PDF <ArrowUpRight size={15}/></a>}
     <button type="button" onClick={onClose} aria-label="Fechar visualização"><X size={19}/></button>
    </div>
   </header>
   <div className="pdf-zoom-scroll">
    <div className="pdf-zoom-sheet" style={{width:zoom+'%'}}>
     <PdfPagePreview url={url} label={title} mode="zoom"/>
    </div>
   </div>
  </section>
 </div>,document.body)
}
