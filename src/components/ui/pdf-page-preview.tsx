import {useEffect,useRef,useState} from 'react'
import {FileText} from 'lucide-react'
import {pdfFetchHref,pdfPreviewHref} from '../../lib/showcase-pdf'
import {pdfWorkerHref} from '../../lib/pdf-worker'

type Mode='card'|'detail'|'editor'|'zoom'
type PreviewState='waiting'|'loading'|'ready'|'error'

/**
 * Renders the first PDF page locally into a canvas, instead of embedding github.com
 * (which refuses framing) or raw.githubusercontent.com (which may force download).
 * The PDF parser/worker are self-hosted Vite assets, fetched only for visible previews.
 */
export function PdfPagePreview({url,label,mode='detail'}:{url:string;label:string;mode?:Mode}){
 const outer=useRef<HTMLDivElement>(null)
 const canvasRef=useRef<HTMLCanvasElement>(null)
 const [visible,setVisible]=useState(false)
 const [state,setState]=useState<PreviewState>('waiting')
 const direct=pdfFetchHref(url)
 const framed=direct?null:pdfPreviewHref(url)

 useEffect(()=>{
  setVisible(false)
  const node=outer.current
  if(!node)return
  if(typeof IntersectionObserver==='undefined'){setVisible(true);return}
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}
  },{rootMargin:'120px 0px',threshold:0.01})
  observer.observe(node)
  return ()=>observer.disconnect()
 },[url])

 useEffect(()=>{
  if(!direct||!visible)return
  let cancelled=false
  let cancelRender:(()=>void)|undefined
  let closeDocument:(()=>Promise<void>)|undefined
  setState('loading')
  void (async()=>{
   try{
    const pdfjs=await import('pdfjs-dist')
    if(cancelled)return
    pdfjs.GlobalWorkerOptions.workerSrc=pdfWorkerHref()
    const task=pdfjs.getDocument({url:direct,withCredentials:false,disableRange:true,disableStream:true})
    closeDocument=()=>task.destroy()
    const doc=await task.promise
    if(cancelled)return
    const page=await doc.getPage(1)
    const canvas=canvasRef.current
    if(!canvas||cancelled)return
    const context=canvas.getContext('2d',{alpha:false})
    if(!context)throw new Error('Canvas unavailable')
    const original=page.getViewport({scale:1})
    const maxWidth=mode==='card'?540:mode==='editor'?1200:mode==='zoom'?2400:1800
    const elementWidth=Math.max(160,outer.current?.clientWidth||400)
    const pixels=Math.min(maxWidth,elementWidth*Math.min(2,window.devicePixelRatio||1))
    const viewport=page.getViewport({scale:pixels/original.width})
    canvas.width=Math.max(1,Math.round(viewport.width))
    canvas.height=Math.max(1,Math.round(viewport.height))
    const render=page.render({canvas,canvasContext:context,viewport})
    cancelRender=()=>render.cancel()
    await render.promise
    if(!cancelled)setState('ready')
   }catch{
    if(!cancelled)setState('error')
   }finally{
    if(closeDocument)await closeDocument().catch(()=>{})
   }
  })()
  return ()=>{cancelled=true;cancelRender?.();if(closeDocument)void closeDocument().catch(()=>{})}
 },[direct,visible,mode])

 return <div ref={outer} className={'pdf-page-preview pdf-page-preview-'+mode} role="img" aria-label={(mode==='editor'?'Primeira página do PDF: ':'First page of PDF: ')+label}>
  {direct&&<canvas ref={canvasRef} aria-hidden="true" style={{visibility:state==='ready'?'visible':'hidden'}}/>}
  {framed&&visible&&<iframe title={'PDF: '+label} src={framed} loading="lazy" referrerPolicy="no-referrer" tabIndex={mode==='card'?-1:0}/>}
  {(!direct&&!framed||direct&&state!=='ready')&&<div className="pdf-page-preview-fallback" aria-hidden="true">
   <FileText size={mode==='card'?36:46}/>
   <small>{direct&&state==='loading'?(mode==='editor'?'Carregando PDF…':'Loading PDF…'):direct&&state==='error'?(mode==='editor'?'Prévia indisponível':'Preview unavailable'):'PDF'}</small>
   {direct&&state==='error'&&<small>{mode==='editor'?'Abra o documento pelo botão abaixo':'Open this document from the details panel'}</small>}
  </div>}
 </div>
}
