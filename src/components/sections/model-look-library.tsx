
import {useEffect,useState,type ReactNode} from 'react'
import {Check,ChevronDown,Search} from 'lucide-react'
import {ART_SHADER_PRESETS,type ArtShaderPreset} from '../../lib/model-presentation'
import {filterShaders,SHADER_CATEGORIES,CAMERA_EFFECTS,type CameraEffect} from '../../lib/model-preview-library'
type Images=Record<string,string>
const cache:Images={}
export function useLookPreviews(active:boolean){
 const [images,setImages]=useState<Images>(()=>({...cache}))
 useEffect(()=>{
  if(!active)return
  const controller=new AbortController()
  if(Object.keys(cache).length>=ART_SHADER_PRESETS.length+CAMERA_EFFECTS.length){setImages({...cache});return}
  void import('../../lib/model-preview-renderer').then(({renderPreviewLibrary})=>renderPreviewLibrary((id,src)=>{if(controller.signal.aborted)return;cache[id]=src;setImages(old=>({...old,[id]:src}))},controller.signal)).catch(()=>{})
  return ()=>controller.abort()
 },[active])
 return images
}
export function LookTile({id,images,swatch}:{id:string;images:Images;swatch:string}){
 return <span className="model-look-tile" style={{background:swatch}} aria-hidden="true">{images[id]&&<img src={images[id]} alt="" draggable={false}/>}</span>
}
export function ShaderPicker({value,onChange,images,allowFlat=true,compact=false}:{value:ArtShaderPreset;onChange:(id:ArtShaderPreset)=>void;images:Images;allowFlat?:boolean;compact?:boolean}){
 const [open,setOpen]=useState(!compact),[search,setSearch]=useState(''),[group,setGroup]=useState('all')
 const current=ART_SHADER_PRESETS.find(p=>p.id===value)??ART_SHADER_PRESETS[0]
 const choices=filterShaders(group,search,allowFlat)
 return <div className="model-look-picker">{compact&&<button type="button" className="model-look-current" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><LookTile id={current.id} images={images} swatch={current.swatch}/><span><strong>{current.name}</strong><small>{current.description}</small></span><ChevronDown size={15}/></button>}
 {open&&<><div className="model-shader-filter"><label><Search size={15}/><input type="search" aria-label="Buscar shader" placeholder="Buscar efeito…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="model-shader-categories">{SHADER_CATEGORIES.map(c=><button key={c.id} type="button" aria-pressed={group===c.id} onClick={()=>setGroup(c.id)}>{c.name}</button>)}</div></div>
 <div className="model-art-shader-grid">{choices.map(p=><button type="button" key={p.id} className="model-art-shader-option" aria-pressed={value===p.id} onClick={()=>{onChange(p.id);if(compact)setOpen(false)}}><LookTile id={p.id} images={images} swatch={p.swatch}/><span className="model-look-title"><strong>{p.name}</strong>{value===p.id&&<Check size={13}/>}</span><small>{p.description}</small></button>)}</div>
 {!choices.length&&<p className="model-studio-tip">Nenhum efeito encontrado.</p>}<p className="model-studio-tip">Amostras em esfera de teste. O resultado depende do material, da geometria e das luzes.</p></>}
 </div>
}
export function CameraEffectCard({id,images,active,onToggle,children}:{id:CameraEffect;images:Images;active:boolean;onToggle:()=>void;children:ReactNode}){
 const effect=CAMERA_EFFECTS.find(p=>p.id===id)!
 return <section className="model-effect-card"><div className="model-effect-head"><LookTile id={'fx-'+id} images={images} swatch={effect.swatch}/><span><strong>{effect.name}</strong><small>{effect.description}</small></span><button type="button" className="model-effect-toggle" role="switch" aria-checked={active} aria-label={effect.name} onClick={onToggle}><i/></button></div>{active&&<div className="model-effect-settings">{children}</div>}</section>
}
