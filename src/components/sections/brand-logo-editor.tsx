import { useState } from 'react'
import { ImagePlus, RotateCcw, Save, Upload, X } from 'lucide-react'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import { QuickEditImageButton } from '../ui/image-quick-editor'
import { saveUploadedMedia } from '../../lib/media-store'

type Props={value:string;onSave:(image:string)=>void;onClose:()=>void}

/** Edit the actual sidebar brand while retaining the original JF fallback. */
export function BrandLogoEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState(value)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const upload=async(file:File)=>{
  setBusy(true);setError('')
  try{setDraft(await saveUploadedMedia(file,'branding','sidebar-logo'))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível importar o logo.')}
  finally{setBusy(false)}
 }
 return <div className="editor-overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
  <section className="editor-panel brand-logo-editor" role="dialog" aria-modal="true" aria-label="Editar logo do portfólio">
   <header><div><span className="eyebrow">✦ IDENTIDADE VISUAL</span><h2>Logo do portfólio</h2></div><button type="button" onClick={onClose} disabled={busy} aria-label="Fechar editor"><X size={20}/></button></header>
   <div className="editor-scroll">
    <p className="brand-logo-hint">Substitua o monograma JF por sua identidade visual. O logo será exibido na lateral e acompanhará suas publicações pelo GitHub Studio.</p>
    <div className="brand-logo-preview-surface">
     <div className="brand-logo-preview-frame">{draft?<AssetImage src={draft} alt="Prévia do logo escolhido"/>:<span>JF</span>}</div>
     <div className="brand-logo-preview-copy"><strong>Visualização</strong><small>Este é o espaço utilizado pelo logo no site.</small></div>
    </div>
    <div className="brand-logo-actions">
     <label className="media-upload-button"><Upload size={16}/>{busy?'Importando...':'Importar logo'}<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp,image/avif" onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.target.value=''}}/></label>
     <AssetClipButton folder="branding" onSelect={setDraft}/>
     {draft&&<QuickEditImageButton source={draft} folder="branding" onSave={setDraft}/>}
    </div>
    <button type="button" className="brand-logo-reset" onClick={()=>setDraft('')} disabled={busy}><RotateCcw size={15}/>Restaurar JF original</button>
    <div className="brand-logo-tip"><ImagePlus size={17}/><p>Para logos com transparência, prefira PNG ou WEBP. A imagem será ajustada proporcionalmente, sem cortes.</p></div>
    {error&&<p role="alert" className="editor-status">{error}</p>}
   </div>
   <footer><button type="button" className="subtle-action" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="save-action" disabled={busy} onClick={()=>{onSave(draft);onClose()}}><Save size={16}/>Salvar logo</button></footer>
  </section>
 </div>
}
