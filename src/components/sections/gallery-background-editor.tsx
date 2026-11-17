import {useState} from 'react'
import {ImagePlus,RotateCcw,Save,Upload,X} from 'lucide-react'
import {defaultGalleryBackground,defaultGalleryContent,normalizeGalleryContent,type GalleryContent} from '../../data/studio'
import {saveUploadedMedia} from '../../lib/media-store'
import {AssetImage} from '../ui/asset-image'
import {AssetClipButton} from '../ui/asset-picker'
import {QuickEditImageButton} from '../ui/image-quick-editor'
import {HeadingSymbol} from '../ui/heading-symbol'
import type {HeadingSymbolStyle} from '../../lib/heading-symbol'
type Props={value:string;content?:GalleryContent;headingSymbol?:HeadingSymbolStyle;onSave:(next:{background:string;content:GalleryContent})=>void;onClose:()=>void}
export function GalleryBackgroundEditor({value,content=defaultGalleryContent,headingSymbol,onSave,onClose}:Props){
 const [image,setImage]=useState(value)
 const [draft,setDraft]=useState<GalleryContent>(()=>normalizeGalleryContent(content))
 const [error,setError]=useState('')
 const [uploading,setUploading]=useState(false)
 const patch=(delta:Partial<GalleryContent>)=>setDraft(old=>({...old,...delta}))
 const upload=async(file:File)=>{
  setUploading(true);setError('')
  try{setImage(await saveUploadedMedia(file,'gallery','background'))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível importar a imagem.')}
  finally{setUploading(false)}
 }
 const save=()=>{onSave({background:image||defaultGalleryBackground,content:normalizeGalleryContent(draft)});onClose()}
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="editor-panel gallery-background-editor" role="dialog" aria-modal="true" aria-label="Editar página da galeria">
   <header><div><span className="eyebrow">✦ LOCAL STUDIO · GALERIA</span><h2>Personalizar galeria</h2></div><button type="button" onClick={onClose} aria-label="Fechar editor"><X size={20}/></button></header>
   <div className="editor-scroll">
    <p className="gallery-background-hint">Edite textos e imagem de fundo da galeria. Salve o rascunho e use Publicar no Studio para enviar ao site.</p>
    <div className="gallery-custom-layout">
     <section className="gallery-copy-editor" aria-label="Textos da galeria">
      <div className="gallery-edit-section-title"><span>01 · CONTEÚDO</span><h3>Textos e apresentação</h3></div>
      <label>Frase superior (eyebrow)<input value={draft.eyebrow} maxLength={100} onChange={e=>patch({eyebrow:e.target.value})}/></label>
      <label>Título principal (Enter para quebrar linha)<textarea rows={3} maxLength={160} value={draft.titleFirst} onChange={e=>patch({titleFirst:e.target.value})}/></label>
      <label>Destaque roxo<input value={draft.titleAccent} maxLength={90} onChange={e=>patch({titleAccent:e.target.value})}/></label>
      <label>Descrição (Enter para quebrar linha)<textarea rows={3} maxLength={600} value={draft.introduction} onChange={e=>patch({introduction:e.target.value})}/></label>
      <div className="gallery-edit-section-title"><span>02 · NAVEGAÇÃO</span><h3>Rótulos da galeria</h3></div>
      <label>Filtro geral (Todos / All)<input value={draft.allLabel} maxLength={28} onChange={e=>patch({allLabel:e.target.value})}/></label>
      <label>Texto da busca<input value={draft.searchPlaceholder} maxLength={100} onChange={e=>patch({searchPlaceholder:e.target.value})}/></label>
      <label>Mensagem quando a busca não encontra projetos<textarea rows={2} maxLength={240} value={draft.emptyMessage} onChange={e=>patch({emptyMessage:e.target.value})}/></label>
      <button type="button" className="gallery-background-reset" onClick={()=>setDraft({...defaultGalleryContent})}><RotateCcw size={15}/>Restaurar textos padrão</button>
     </section>
     <section className="gallery-art-editor" aria-label="Prévia e imagem da galeria">
      <div className="gallery-edit-section-title"><span>03 · PRÉVIA</span><h3>Visualização dos textos</h3></div>
      <div className="gallery-copy-preview">
       <p className="eyebrow"><HeadingSymbol symbol={headingSymbol} size={14}/>{draft.eyebrow}</p>
       <h3><span>{draft.titleFirst}</span>{draft.titleAccent&&<>{' '}<em>{draft.titleAccent}</em></>}</h3>
       <p className="gallery-copy-preview-description">{draft.introduction}</p>
       <div className="gallery-copy-preview-controls"><span>{draft.allLabel}</span><span>{draft.searchPlaceholder}</span></div>
      </div>
      <div className="gallery-edit-section-title"><span>04 · VISUAL</span><h3>Fundo da galeria</h3></div>
      <div className="gallery-background-preview">{image?<AssetImage src={image} alt="Prévia do fundo da galeria"/>:<div className="gallery-background-empty"><ImagePlus size={27}/><span>Nenhuma imagem escolhida</span></div>}</div>
      <div className="gallery-background-actions">
       <label className="media-upload-button"><Upload size={15}/>{uploading?'Importando...':'Importar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=''}}/></label>
       <AssetClipButton folder="gallery" onSelect={setImage}/>
       {image&&<QuickEditImageButton source={image} folder="gallery" onSave={setImage}/>}
      </div>
      <button type="button" className="gallery-background-reset" onClick={()=>setImage(defaultGalleryBackground)}><RotateCcw size={15}/>Restaurar arte padrão</button>
     </section>
    </div>
    {error&&<p className="editor-status" role="alert">{error}</p>}
   </div>
   <footer><button className="subtle-action" type="button" onClick={onClose}>Cancelar</button><button className="save-action" type="button" disabled={uploading} onClick={save}><Save size={16}/>Salvar galeria</button></footer>
  </section>
 </div>
}
