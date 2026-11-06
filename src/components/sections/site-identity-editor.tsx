import { useState } from 'react'
import { ExternalLink, ImagePlus, Link2, Monitor, RotateCcw, Save, Upload, X } from 'lucide-react'
import type { PortfolioStore } from '../../hooks/use-portfolio'
import { saveUploadedMedia } from '../../lib/media-store'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import { QuickEditImageButton } from '../ui/image-quick-editor'

type Identity=Pick<PortfolioStore,'siteFavicon'|'seoTitle'|'seoDescription'>
type Props={
 value:Identity
 homeBanner:string
 onSave:(identity:Identity)=>void
 onEditBanner:()=>void
 onClose:()=>void
}
/** Social preview always follows the Home banner. Only favicon and copy are independent. */
export function SiteIdentityEditor({value,homeBanner,onSave,onEditBanner,onClose}:Props){
 const [draft,setDraft]=useState<Identity>(value)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const importFavicon=async(file:File)=>{
  setBusy(true);setError('')
  try{setDraft(current=>({...current,siteFavicon:await saveUploadedMedia(file,'branding','favicon')}))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar o favicon.')}
  finally{setBusy(false)}
 }
 const update=(patch:Partial<Identity>)=>setDraft(prev=>({...prev,...patch}))
 const favicon=draft.siteFavicon||import.meta.env.BASE_URL+'favicon-32x32.png'
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
  <section className="editor-panel site-identity-editor" role="dialog" aria-modal="true" aria-label="Identidade do site e compartilhamento">
   <header><div><span className="eyebrow">✦ IDENTIDADE DIGITAL</span><h2>Compartilhamento e favicon</h2><small>Como seu portfólio aparece nas abas e nas mensagens</small></div><button type="button" onClick={onClose} disabled={busy} aria-label="Fechar"><X size={20}/></button></header>
   <div className="editor-scroll">
    <div className="studio-intro-line"><Link2 size={18}/><span>O cartão compartilhado usa automaticamente o banner da Home publicada. Não é necessário enviar a mesma imagem duas vezes.</span></div>
    <section className="identity-section">
     <div className="identity-section-head"><h3>Prévia do link</h3><span>Automática</span></div>
     <div className="identity-link-preview" aria-label="Prévia aproximada do cartão ao compartilhar o site">
      <div className="identity-banner-preview"><AssetImage src={homeBanner} alt="Banner da Home que será usado no cartão compartilhado"/></div>
      <div className="identity-link-info"><small>jordanferrary.github.io</small><strong translate="no">{draft.seoTitle||'Jordan Ferrary — Creative Portfolio'}</strong><p>{draft.seoDescription||'Explore creative 3D projects by Jordan Ferrary.'}</p></div>
     </div>
     <p className="identity-help">Prévia ilustrativa: Discord, WhatsApp e outras plataformas podem alterar o recorte ou guardar uma imagem antiga em cache.</p>
     <button type="button" className="identity-secondary-button" onClick={()=>{onClose();onEditBanner()}}><ImagePlus size={16}/>Trocar banner na Home</button>
    </section>
    <section className="identity-section">
     <div className="identity-section-head"><h3>Textos do cartão</h3><span>Em inglês</span></div>
     <label className="identity-field">Título público<input maxLength={110} value={draft.seoTitle} onChange={e=>update({seoTitle:e.target.value})} placeholder="Jordan Ferrary — Creative Portfolio"/></label>
     <label className="identity-field">Descrição pública<textarea maxLength={240} rows={3} value={draft.seoDescription} onChange={e=>update({seoDescription:e.target.value})} placeholder="Describe your art and portfolio in English..."/></label>
     <p className="identity-help">Esses textos também serão usados nos metadados de busca do site. Mantenha seu nome como “Jordan Ferrary”.</p>
    </section>
    <section className="identity-section">
     <div className="identity-section-head"><h3>Favicon</h3><span>Ícone da aba</span></div>
     <div className="identity-favicon-preview"><div className="identity-favicon-circle"><AssetImage src={favicon} alt="Prévia do favicon"/></div><div><strong>Seu ícone personalizado</strong><p>Use PNG, JPG, WEBP ou AVIF. Uma arte quadrada com fundo transparente costuma ter o melhor resultado.</p></div></div>
     <div className="identity-favicon-actions">
      <label className="media-upload-button"><Upload size={15}/>{busy?'Importando...':'Importar ícone'}<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void importFavicon(file);e.target.value=''}}/></label>
      <AssetClipButton folder="branding" onSelect={ref=>update({siteFavicon:ref})}/>
      {draft.siteFavicon&&<QuickEditImageButton source={draft.siteFavicon} folder="branding" onSave={ref=>update({siteFavicon:ref})}/>}
      {draft.siteFavicon&&<button type="button" className="identity-secondary-button" onClick={()=>update({siteFavicon:''})}><RotateCcw size={15}/>Usar JF original</button>}
     </div>
     <p className="identity-help"><Monitor size={14}/> Ao publicar, o GitHub gera automaticamente os ícones de 16, 32 e 180 pixels.</p>
    </section>
    {error&&<p role="alert" className="editor-status">{error}</p>}
    <p className="identity-publish-reminder"><ExternalLink size={15}/> Salvar cria um rascunho neste navegador. Para atualizar o link e o favicon dos visitantes, use <b>Publicar no GitHub</b>.</p>
   </div>
   <footer><button type="button" className="subtle-action" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="save-action" disabled={busy||!draft.seoTitle.trim()||!draft.seoDescription.trim()} onClick={()=>{onSave(draft);onClose()}}><Save size={17}/>Salvar identidade</button></footer>
  </section>
 </div>
}
