import {useRef,type PointerEvent} from 'react'
import {Move,RotateCcw} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {DEFAULT_FRAMING,DEFAULT_GALLERY_BANNER_FRAMING,framingStyle,normalizeFraming,type ImageFraming} from '../../lib/image-framing'

type Props={image:string;value?:ImageFraming;onChange:(frame:ImageFraming)=>void;variant:'home'|'gallery'}

/** Dedicated banner crop, independent of project thumbnails and original media. */
export function BannerFramingControl({image,value,onChange,variant}:Props){
 const initial=variant==='gallery'?DEFAULT_GALLERY_BANNER_FRAMING:DEFAULT_FRAMING
 const framing=normalizeFraming(value??initial)
 const pointer=useRef<{id:number;startX:number;startY:number;frame:ImageFraming}|null>(null)
 const update=(key:keyof ImageFraming,num:number)=>onChange(normalizeFraming({...framing,[key]:num}))
 const onDown=(e:PointerEvent<HTMLDivElement>)=>{
  if(e.button!==0||!image)return
  pointer.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,frame:framing}
  e.currentTarget.setPointerCapture(e.pointerId)
 }
 const onMove=(e:PointerEvent<HTMLDivElement>)=>{
  const start=pointer.current
  if(!start||start.id!==e.pointerId)return
  const {width,height}=e.currentTarget.getBoundingClientRect()
  if(!width||!height)return
  onChange(normalizeFraming({
   ...start.frame,
   x:start.frame.x-(e.clientX-start.startX)/width*100/start.frame.zoom,
   y:start.frame.y-(e.clientY-start.startY)/height*100/start.frame.zoom
  }))
 }
 const onEnd=(e:PointerEvent<HTMLDivElement>)=>{
  if(pointer.current?.id===e.pointerId)pointer.current=null
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)
 }
 const title=variant==='gallery'?'Banner da galeria':'Banner de fundo da Home'
 const options:{key:keyof ImageFraming;label:string;min:number;max:number;step:number;unit:string}[]=[
  {key:'x',label:'Horizontal',min:0,max:100,step:1,unit:'%'},
  {key:'y',label:'Vertical',min:0,max:100,step:1,unit:'%'},
  {key:'zoom',label:'Zoom',min:1,max:2.5,step:.01,unit:'×'}
 ]
 return <section className={'banner-framing-control banner-framing-'+variant} aria-label={'Enquadramento: '+title}>
  <div className="banner-framing-head"><div><strong>Enquadramento do banner</strong><p>Arraste a imagem ou ajuste os controles. A arte original não é modificada.</p></div>
   <button type="button" onClick={()=>onChange({...initial})} title="Restaurar enquadramento padrão"><RotateCcw size={15}/>Centralizar</button></div>
  <div className={'banner-framing-preview'+(image?' can-drag':'')} role="img" aria-label={'Prévia de enquadramento do '+title}
   onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd}>
   {image?<AssetImage src={image} alt="" style={framingStyle(framing)} draggable={false}/>:<span>Selecione uma imagem para visualizar o enquadramento.</span>}
   <div className="banner-framing-crosshair" aria-hidden="true"><span/><span/></div>
   <span className="banner-framing-drag-label"><Move size={13}/>Arraste para ajustar</span>
  </div>
  <div className="banner-framing-sliders">
   {options.map(option=><label className="banner-framing-row" key={option.key}><span>{option.label}</span>
    <input aria-label={option.label+' do '+title} type="range" min={option.min} max={option.max} step={option.step} value={framing[option.key]}
     onChange={e=>update(option.key,Number(e.target.value))}/>
    <span className="banner-framing-numeric"><input aria-label={'Valor de '+option.label+' do '+title} type="number" min={option.min} max={option.max} step={option.step}
     value={Number(framing[option.key].toFixed(option.key==='zoom'?2:0))} onChange={e=>{if(e.target.value!=='')update(option.key,Number(e.target.value))}}/>{option.unit}</span>
   </label>)}
  </div>
 </section>
}
