import { useState } from 'react'
import { ImagePlus,RotateCcw,Save,Upload,X } from 'lucide-react'
import { defaultGalleryBackground } from '../../data/studio'
import { saveUploadedMedia } from '../../lib/media-store'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import { QuickEditImageButton } from '../ui/image-quick-editor'
type Props={value:string;onSave:(src:string)=>void;onClose:()=>void}
export function GalleryBackgroundEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState(value)
 const [error,setError]=useState('')
 const [uploading,setUploading]=useState(false)
 const upload=async(file:File)=>{
  setUploading(true);setError('')
  try{setDraft(await saveUploadedMedia(file,'gallery','background'))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível importar a imagem.')}
  finally{setUploading(false)}
 }
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="editor-panel gallery-background-editor" role="dialog" aria-modal="true" aria-label="Editar imagem de fundo da galeria">
   <header><div><span className="eyebrow">✦ LOCAL STUDIO</span><h2>Fundo da galeria</h2></div><button type="button" onClick={onClose} aria-label="Fechar editor"><X size={20}/></button></header>
   <div className="editor-scroll">
    <p className="gallery-background-hint">Personalize a arte do topo do portfólio, independentemente da imagem usada na Home.</p>
    <div className="gallery-background-preview">{draft?<AssetImage src={draft} alt="Prévia do fundo da galeria"/>:<div className="gallery-background-empty"><ImagePlus size={27}/><span>Nenhuma imagem escolhida</span></div>}</div>
    <div className="gallery-background-actions">
     <label className="media-upload-button"><Upload size={15}/>{uploading?'Importando...':'Importar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label>
     <AssetClipButton folder="gallery" onSelect={setDraft}/>
     {draft&&<QuickEditImageButton source={draft} folder="gallery" onSave={setDraft}/>}
    </div>
    <button type="button" className="gallery-background-reset" onClick={()=>setDraft(defaultGalleryBackground)}><RotateCcw size={15}/>Restaurar arte padrão</button>
    {error&&<p className="editor-status" role="alert">{error}</p>}
   </div>
   <footer><button className="subtle-action" type="button" onClick={onClose}>Cancelar</button><button className="save-action" type="button" disabled={uploading} onClick={()=>{onSave(draft||defaultGalleryBackground);onClose()}}><Save size={16}/>Salvar fundo</button></footer>
  </section>
 </div>
}
