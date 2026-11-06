import {useEffect,useRef,useState} from 'react'
import {Crop,FlipHorizontal,Image as ImageIcon,Pencil,RotateCcw,RotateCw,Save,SlidersHorizontal,X} from 'lucide-react'
import {useAssetSrc} from './asset-image'
import {saveUploadedMedia} from '../../lib/media-store'
type CropFormat='original'|'square'|'portrait'|'landscape'
type Props={source:string;folder:string;onSave:(src:string)=>void;onClose:()=>void}
function render(source:HTMLImageElement,rotation:number,mirror:boolean,brightness:number,contrast:number,crop:CropFormat,maxSide:number):HTMLCanvasElement{
 const scale=Math.min(1,maxSide/Math.max(source.naturalWidth,source.naturalHeight))
 const iw=Math.max(1,Math.round(source.naturalWidth*scale))
 const ih=Math.max(1,Math.round(source.naturalHeight*scale))
 const quarter=rotation%180!==0
 const stage=document.createElement('canvas')
 stage.width=quarter?ih:iw
 stage.height=quarter?iw:ih
 const ctx=stage.getContext('2d')
 if(!ctx)throw new Error('Seu navegador não permite editar imagens.')
 ctx.translate(stage.width/2,stage.height/2)
 ctx.rotate(rotation*Math.PI/180)
 ctx.scale(mirror?-1:1,1)
 ctx.filter='brightness('+brightness+'%) contrast('+contrast+'%)'
 ctx.drawImage(source,-iw/2,-ih/2,iw,ih)
 const ratio=crop==='square'?1:crop==='portrait'?4/5:crop==='landscape'?16/9:stage.width/stage.height
 const actual=stage.width/stage.height
 const sourceWidth=actual>ratio?stage.height*ratio:stage.width
 const sourceHeight=actual>ratio?stage.height:stage.width/ratio
 const dx=(stage.width-sourceWidth)/2
 const dy=(stage.height-sourceHeight)/2
 const output=document.createElement('canvas')
 output.width=Math.max(1,Math.round(sourceWidth))
 output.height=Math.max(1,Math.round(sourceHeight))
 const target=output.getContext('2d')
 if(!target)throw new Error('Não foi possível gerar a imagem.')
 target.drawImage(stage,dx,dy,sourceWidth,sourceHeight,0,0,output.width,output.height)
 return output
}
function useImageAsset(source:string){
 const url=useAssetSrc(source)
 const [image,setImage]=useState<HTMLImageElement|null>(null)
 const [error,setError]=useState('')
 useEffect(()=>{
  setImage(null);setError('')
  if(!url)return
  const loaded=new Image()
  loaded.crossOrigin='anonymous'
  loaded.onload=()=>setImage(loaded)
  loaded.onerror=()=>setError('Não foi possível abrir esta imagem. Algumas URLs externas bloqueiam a edição por segurança (CORS).')
  loaded.src=url
  return ()=>{loaded.onload=null;loaded.onerror=null}
 },[url])
 return {image,error}
}
export function ImageQuickEditor({source,folder,onSave,onClose}:Props){
 const {image,error:loadError}=useImageAsset(source)
 const canvas=useRef<HTMLCanvasElement>(null)
 const [rotation,setRotation]=useState(0)
 const [mirror,setMirror]=useState(false)
 const [brightness,setBrightness]=useState(100)
 const [contrast,setContrast]=useState(100)
 const [crop,setCrop]=useState<CropFormat>('original')
 const [error,setError]=useState('')
 const [saving,setSaving]=useState(false)
 useEffect(()=>{
  if(!image||!canvas.current)return
  try{
   const result=render(image,rotation,mirror,brightness,contrast,crop,760)
   const target=canvas.current
   target.width=result.width;target.height=result.height
   const context=target.getContext('2d')
   context?.drawImage(result,0,0)
   setError('')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível pré-visualizar a imagem.')}
 },[image,rotation,mirror,brightness,contrast,crop])
 const save=async()=>{
  if(!image)return
  setSaving(true);setError('')
  try{
   const output=render(image,rotation,mirror,brightness,contrast,crop,2200)
   const blob=await new Promise<Blob>((resolve,reject)=>{try{output.toBlob(item=>item?resolve(item):reject(new Error('Não foi possível exportar a imagem.')),'image/webp',.9)}catch(e){reject(e)}})
   const file=new File([blob],'edited-'+Date.now()+'.webp',{type:'image/webp'})
   const ref=await saveUploadedMedia(file,folder,'edited')
   onSave(ref)
   onClose()
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar. Se a imagem está em outro servidor, experimente importá-la primeiro.')}
  finally{setSaving(false)}
 }
 return <div className="quick-image-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="quick-image-panel" role="dialog" aria-modal="true" aria-label="Edição rápida de imagem">
   <header><div><span className="eyebrow"><SlidersHorizontal size={15}/> IMAGE STUDIO</span><h2>Edição rápida</h2><p>Salve uma nova versão sem modificar o arquivo original.</p></div><button type="button" onClick={onClose} aria-label="Fechar editor"><X size={19}/></button></header>
   <div className="quick-image-preview">{image?<canvas ref={canvas} role="img" aria-label="Prévia da imagem editada"/>:<div className="quick-image-empty"><ImageIcon size={26}/>{loadError||'Carregando imagem...'}</div>}</div>
   <div className="quick-image-controls">
    <div className="quick-image-buttons"><button type="button" title="Girar para a esquerda" onClick={()=>setRotation(v=>(v+270)%360)}><RotateCcw size={16}/> -90°</button><button type="button" title="Girar para a direita" onClick={()=>setRotation(v=>(v+90)%360)}><RotateCw size={16}/> +90°</button><button type="button" className={mirror?'active':''} aria-pressed={mirror} onClick={()=>setMirror(v=>!v)}><FlipHorizontal size={16}/>Espelhar</button></div>
    <label className="quick-crop-select"><Crop size={16}/>Enquadramento<select value={crop} onChange={e=>setCrop(e.target.value as CropFormat)}><option value="original">Original</option><option value="square">Quadrado 1:1</option><option value="portrait">Retrato 4:5</option><option value="landscape">Paisagem 16:9</option></select></label>
    <div className="quick-range-row"><label>Brilho <span>{brightness}%</span><input type="range" min="40" max="160" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></label><label>Contraste <span>{contrast}%</span><input type="range" min="50" max="160" value={contrast} onChange={e=>setContrast(Number(e.target.value))}/></label></div>
   </div>
   {(error||loadError)&&<p className="quick-image-error" role="alert">{error||loadError}</p>}
   <footer><button type="button" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={()=>void save()} disabled={!image||saving}><Save size={16}/>{saving?'Salvando...':'Salvar nova versão'}</button></footer>
  </section>
 </div>
}
export function QuickEditImageButton({source,folder,onSave}:{source:string;folder:string;onSave:(src:string)=>void}){
 const [open,setOpen]=useState(false)
 if(!source)return null
 return <><button type="button" className="quick-edit-image-button" onClick={()=>setOpen(true)} title="Editar esta imagem" aria-label="Editar imagem"><Pencil size={15}/>Editar imagem</button>{open&&<ImageQuickEditor source={source} folder={folder} onSave={onSave} onClose={()=>setOpen(false)}/>}</>
}
