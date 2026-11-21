import {useEffect,useRef,useState} from 'react'
import {Box,Upload,X} from 'lucide-react'
import {isLocalMedia,listMediaAssets,saveUploadedModel} from '../../lib/media-store'
import {parseModelUrl} from '../../lib/model-embed'
import '../../styles/project-model.css'

export function ModelFileField({value,onChange,onError}:{value:string;onChange:(value:string)=>void;onError:(message:string)=>void}){
 const [busy,setBusy]=useState(false)
 const [dragging,setDragging]=useState(false)
 const [name,setName]=useState('')
 const [error,setError]=useState('')
 const uploadLock=useRef(false)
 const local=isLocalMedia(value)
 useEffect(()=>{
  let live=true
  setName('')
  if(local)void listMediaAssets().then(items=>{if(live)setName(items.find(item=>item.ref===value)?.name??'Modelo GLB armazenado')}).catch(()=>{if(live)setName('Modelo GLB armazenado')})
  return ()=>{live=false}
 },[local,value])
 const upload=async(file:File)=>{
  if(uploadLock.current)return
  uploadLock.current=true;setBusy(true);setError('')
  try{const ref=await saveUploadedModel(file);onChange(ref)}
  catch(reason){const message=reason instanceof Error?reason.message:'Falha ao importar modelo.';setError(message);onError(message)}
  finally{uploadLock.current=false;setBusy(false)}
 }
 return <div className="model-file-field">
  <label>URL externa do modelo (GLB ou glTF)<input type="url" value={local?'':value} disabled={busy} placeholder={local?'Modelo local selecionado':'https://site.com/modelo.glb'} onChange={e=>onChange(e.target.value)}/></label>
  <div className={'model-file-drop'+(dragging?' is-dragging':'')} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();e.stopPropagation();setDragging(false);const file=e.dataTransfer.files[0];if(file)void upload(file)}}>
   <Box size={30} strokeWidth={1.6}/><strong>{busy?'Validando e armazenando…':local?name||'Modelo GLB armazenado':'Arraste um modelo GLB aqui'}</strong>
   <small>{local?'Arquivo local · será enviado ao publicar':'GLB 2.0 · até 24 MiB · texturas incorporadas'}</small>
  </div>
  <div className="media-controls"><label className="media-upload-button"><Upload size={15}/>{busy?'Importando…':local?'Substituir modelo':'Carregar modelo 3D'}<input type="file" accept=".glb,model/gltf-binary" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label>{value&&<button type="button" disabled={busy} onClick={()=>{onChange('');setError('')}}><X size={15}/>Remover modelo</button>}</div>
  <p className="editor-help">Importe GLB com materiais e texturas incorporados ou informe uma URL direta. FBX, OBJ e glTF com arquivos separados devem ser convertidos para GLB no Blender. O visualizador só carrega após o clique.</p>
  {error&&<p role="alert" className="editor-status">{error}</p>}
  {value&&!parseModelUrl(value)&&<p role="alert" className="editor-status">Informe uma URL direta .glb ou .gltf ou importe um GLB válido.</p>}
 </div>
}
