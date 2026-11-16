import { useRef,type PointerEvent } from 'react'
import { Copy,Move,RotateCcw,Scan } from 'lucide-react'
import type { ImageFraming } from '../../lib/image-framing'
import { DEFAULT_FRAMING,framingStyle,normalizeFraming } from '../../lib/image-framing'
import { AssetImage } from '../ui/asset-image'

type Props={
 image:string
 coverFocus?:ImageFraming
 homeFocus?:ImageFraming
 heroFocus?:ImageFraming
 onChange:(values:{coverFocus?:ImageFraming;homeFocus?:ImageFraming;heroFocus?:ImageFraming})=>void
}

/** Gallery, Home and project banner have independent framing controls. */
function FramingView({
 type,title,description,source,value,onChange
}:{
 type:'cover'|'home'|'hero'
 title:string
 description:string
 source:string
 value:ImageFraming
 onChange:(next:ImageFraming)=>void
}){
 const pointer=useRef<{id:number;x:number;y:number;initial:ImageFraming}|null>(null)
 const update=(key:keyof ImageFraming,next:number)=>{
  onChange(normalizeFraming({...value,[key]:next}))
 }
 const pointerDown=(e:PointerEvent<HTMLDivElement>)=>{
  if(e.button!==0||!source)return
  pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,initial:value}
  e.currentTarget.setPointerCapture(e.pointerId)
 }
 const pointerMove=(e:PointerEvent<HTMLDivElement>)=>{
  const start=pointer.current
  if(!start||start.id!==e.pointerId)return
  const box=e.currentTarget.getBoundingClientRect()
  if(!box.width||!box.height)return
  // Drag the artwork toward the pointer: the focal point moves opposite the drag.
  const x=start.initial.x-(e.clientX-start.x)/box.width*100/start.initial.zoom
  const y=start.initial.y-(e.clientY-start.y)/box.height*100/start.initial.zoom
  onChange(normalizeFraming({...start.initial,x,y}))
 }
 const pointerEnd=(e:PointerEvent<HTMLDivElement>)=>{
  if(pointer.current?.id===e.pointerId)pointer.current=null
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)
 }
 const controls:{key:keyof ImageFraming;label:string;min:number;max:number;step:number;unit:string}[]=[
  {key:'x',label:'Horizontal',min:0,max:100,step:1,unit:'%'},
  {key:'y',label:'Vertical',min:0,max:100,step:1,unit:'%'},
  {key:'zoom',label:'Zoom',min:1,max:2.5,step:.01,unit:'×'}
 ]
 return <section className="framing-view" aria-label={title}>
  <div className="framing-view-heading"><div><span>{type==='cover'?'01 · CAPA DA GALERIA':type==='home'?'02 · DESTAQUE DA HOME':'03 · BANNER'}</span><h3>{title}</h3><p>{description}</p></div><button type="button" onClick={()=>onChange({...DEFAULT_FRAMING})}><RotateCcw size={15}/>Centralizar</button></div>
  <div
   className={'framing-canvas framing-canvas-'+type+(source?' can-drag':'')}
   onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
   title={source?'Arraste a arte para reposicioná-la':''}
  >
   {source?<AssetImage src={source} alt={'Prévia de enquadramento: '+title} draggable={false} style={framingStyle(value)}/>:<div className="framing-no-image">Adicione uma capa na aba Informações</div>}
   {source&&<div className="framing-crosshair" aria-hidden="true"><span/><span/></div>}
   <span className="framing-canvas-label"><Move size={13}/>Arraste para ajustar</span>
  </div>
  <div className="framing-controls">
   {controls.map(item=><label key={item.key} className="framing-control"><span className="framing-control-name">{item.label}</span><input aria-label={item.label+' de '+title} type="range" min={item.min} max={item.max} step={item.step} value={value[item.key]} onChange={event=>update(item.key,Number(event.target.value))}/><span className="framing-numeric"><input aria-label={'Valor de '+item.label+' de '+title} type="number" min={item.min} max={item.max} step={item.step} value={Number(value[item.key].toFixed(item.key==='zoom'?2:0))} onChange={event=>{const n=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(n))update(item.key,n)}}/>{item.unit}</span></label>)}
  </div>
 </section>
}

export function ProjectFramingEditor({image,coverFocus,homeFocus,heroFocus,onChange}:Props){
 const cover=normalizeFraming(coverFocus)
 // Older projects initially inherit the gallery crop; new edits are independent.
 const home=normalizeFraming(homeFocus??coverFocus)
 const hero=normalizeFraming(heroFocus)
 return <div className="project-framing-editor">
  <div className="framing-intro"><Scan size={20}/><div><strong>Direção de câmera da obra</strong><p>Personalize cada vitrine da obra separadamente: capa na galeria, cartão de destaque na Home e banner interno. Arraste a imagem ou ajuste Horizontal, Vertical e Zoom em cada quadro.</p></div></div>
  <div className="framing-dual-layout">
   <FramingView type="cover" title="Capa da galeria" description="Enquadramento dos cards na galeria de projetos." source={image} value={cover} onChange={coverFocus=>onChange({coverFocus})}/>
   <FramingView type="home" title="Destaque da Home" description="Enquadramento exclusivo dos cards Featured Projects." source={image} value={home} onChange={homeFocus=>onChange({homeFocus})}/>
   <FramingView type="hero" title="Banner do projeto" description="Enquadramento independente na página interna." source={image} value={hero} onChange={heroFocus=>onChange({heroFocus})}/>
  </div>
  <div className="framing-transfer"><span>Copiar ajustes (opcional)</span><button type="button" onClick={()=>onChange({homeFocus:{...cover}})}><Copy size={14}/>Galeria → Home</button><button type="button" onClick={()=>onChange({coverFocus:{...home}})}><Copy size={14}/>Home → Galeria</button><button type="button" onClick={()=>onChange({heroFocus:{...cover}})}><Copy size={14}/>Galeria → Banner</button><button type="button" onClick={()=>onChange({coverFocus:{...hero}})}><Copy size={14}/>Banner → Galeria</button></div>
  <p className="framing-footnote">Cada enquadramento é salvo separadamente neste projeto. A imagem original não é modificada; os visitantes verão as alterações após publicar no GitHub.</p>
 </div>
}
