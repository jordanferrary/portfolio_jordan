import '../../styles/theme-palette-editor.css'
import { useState,type CSSProperties } from 'react'
import { Eye, MousePointer2, RotateCcw, Save, Upload, X } from 'lucide-react'
import type { PortfolioStore } from '../../hooks/use-portfolio'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import { QuickEditImageButton } from '../ui/image-quick-editor'
import { saveUploadedMedia } from '../../lib/media-store'
import { BrandMark } from '../ui/brand-mark'
import { ChromaticPicker } from '../ui/chromatic-picker'
import { brandLogoStyle,DEFAULT_BRAND_LOGO_APPEARANCE,normalizeBrandLogoAppearance,type BrandLogoAppearance } from '../../lib/brand-logo-appearance'

type Branding=Pick<PortfolioStore,'siteLogo'|'siteLogoHover'|'siteLogoSize'|'siteLogoHoverScale'|'siteLogoAppearance'>
type Props={value:Branding;onSave:(values:Branding)=>void;onClose:()=>void}
type ImageField='siteLogo'|'siteLogoHover'

export function BrandLogoEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState<Branding>(()=>({...value,siteLogoAppearance:normalizeBrandLogoAppearance(value.siteLogoAppearance)}))
 const [activeColor,setActiveColor]=useState<'primary'|'secondary'|'glow'>('primary')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [showHover,setShowHover]=useState(false)
 const patch=(data:Partial<Branding>)=>setDraft(current=>({...current,...data}))
 const patchAppearance=(data:Partial<BrandLogoAppearance>)=>setDraft(current=>({...current,siteLogoAppearance:normalizeBrandLogoAppearance({...current.siteLogoAppearance,...data})}))
 const upload=async(file:File,field:ImageField)=>{
  setBusy(true);setError('')
  try{patch({[field]:await saveUploadedMedia(file,'branding',field==='siteLogo'?'sidebar-logo':'sidebar-hover')})}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível importar a imagem.')}
  finally{setBusy(false)}
 }
 const previewStyle={'--brand-size':draft.siteLogoSize/100,'--brand-hover-total':draft.siteLogoSize*draft.siteLogoHoverScale/10000,...brandLogoStyle(draft.siteLogoAppearance)} as CSSProperties
 const logoColors=[{key:'primary' as const,label:'Símbolo esquerdo'},{key:'secondary' as const,label:'Símbolo direito'},{key:'glow' as const,label:'Brilho'}]
 const imageControl=(field:ImageField,title:string,description:string)=>(
  <div className="brand-logo-image-section" key={field}>
   <div className="brand-logo-section-heading"><h3>{title}</h3><p>{description}</p></div>
   <div className="brand-logo-actions">
    <label className="media-upload-button"><Upload size={15}/>Importar imagem<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,field);e.target.value=''}}/></label>
    <AssetClipButton folder="branding" onSelect={ref=>patch({[field]:ref})}/>
    {draft[field]&&<QuickEditImageButton source={draft[field]} folder="branding" onSave={ref=>patch({[field]:ref})}/>}
   </div>
   {draft[field]&&<button className="brand-logo-reset" type="button" disabled={busy} onClick={()=>patch({[field]:''})}><RotateCcw size={14}/>{field==='siteLogo'?'Usar JF original':'Remover versão hover'}</button>}
  </div>
 )
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}>
  <section className="editor-panel brand-logo-editor" role="dialog" aria-modal="true" aria-label="Personalizar logo e hover">
   <header><div><span className="eyebrow">✦ IDENTIDADE VISUAL</span><h2>Logo do portfólio</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar editor"><X size={20}/></button></header>
   <div className="editor-scroll">
    <p className="brand-logo-hint">Controle o tamanho da marca e, se quiser, escolha outra arte para aparecer quando o visitante passar o cursor sobre ela.</p>
    <div className="brand-logo-preview-surface">
     <button type="button" className={'brand-logo-preview-frame brand-logo-display'+(draft.siteLogoHover?' has-brand-hover':'')} data-preview-hover={showHover?'true':'false'} style={previewStyle} onClick={()=>setShowHover(v=>!v)} title="Passe o cursor ou clique para testar o hover" aria-label="Alternar prévia do logo em hover" aria-pressed={showHover}>
      <span className="brand-logo-layer brand-logo-normal">{draft.siteLogo?<AssetImage className="brand-logo" src={draft.siteLogo} alt=""/>:<BrandMark/>}</span>
      {draft.siteLogoHover&&<span className="brand-logo-layer brand-logo-hover"><AssetImage className="brand-logo" src={draft.siteLogoHover} alt=""/></span>}
     </button>
     <div className="brand-logo-preview-copy">
      <strong>Prévia interativa</strong>
      <small>Passe o mouse sobre a marca ou clique para simular o hover.</small>
      <span><MousePointer2 size={13}/> {showHover?'Hover ativado':'Visual padrão'}</span>
     </div>
    </div>
    <section className="brand-logo-color-panel" aria-label="Cores e brilho do logo">
     <div className="brand-logo-section-heading"><h3>Cores do JF vetorial</h3><p>O desenho original do Figma acompanha a identidade visual. Escolha entre sincronizar com o tema ou definir suas próprias cores.</p></div>
     <div className="brand-logo-mode-options" role="group" aria-label="Modo de cores do logo">
      <button type="button" aria-pressed={draft.siteLogoAppearance.mode==='auto'} onClick={()=>patchAppearance({mode:'auto'})}>Automático · paleta do site</button>
      <button type="button" aria-pressed={draft.siteLogoAppearance.mode==='custom'} onClick={()=>patchAppearance({mode:'custom'})}>Personalizado · cores próprias</button>
     </div>
     {draft.siteLogo&&<p className="brand-logo-palette-help">Essas cores são aplicadas ao JF vetorial original. Para visualizá-las na marca lateral, use “Usar JF original” na seção da imagem principal.</p>}
     {draft.siteLogoAppearance.mode==='auto'?<p className="brand-logo-palette-help">O JF usa automaticamente as cores principal e secundária da paleta atual. Ao trocar de tema, o logo acompanha as novas cores.</p>:
     <div>
      <div className="brand-logo-color-fields" role="group" aria-label="Partes editáveis do logo">
       {logoColors.map(field=><button type="button" key={field.key} aria-pressed={activeColor===field.key} onClick={()=>setActiveColor(field.key)}><span className="brand-logo-color-swatch" style={{background:draft.siteLogoAppearance[field.key]}}/>{field.label}</button>)}
      </div>
      <p className="brand-logo-color-hex">{logoColors.find(item=>item.key===activeColor)?.label}: {draft.siteLogoAppearance[activeColor]}</p>
      <ChromaticPicker value={draft.siteLogoAppearance[activeColor]} onChange={color=>patchAppearance({[activeColor]:color})}/>
     </div>}
     <label className="brand-logo-slider-label" htmlFor="brand-glow-strength">Intensidade do brilho <b>{draft.siteLogoAppearance.glowStrength}%</b></label>
     <input id="brand-glow-strength" type="range" min="0" max="100" step="5" value={draft.siteLogoAppearance.glowStrength} onChange={e=>patchAppearance({glowStrength:Number(e.target.value)})}/>
     <div className="brand-logo-scale-help"><span>Sem brilho</span><span>Brilho intenso</span></div>
    </section>
    <div className="brand-logo-slider-group">
     <label className="brand-logo-slider-label" htmlFor="brand-size">Tamanho do logo <b>{draft.siteLogoSize}%</b></label>
     <input id="brand-size" type="range" min="65" max="180" step="5" value={draft.siteLogoSize} onChange={e=>patch({siteLogoSize:Number(e.target.value)})}/>
     <div className="brand-logo-scale-help"><span>Menor</span><span>Maior</span></div>
     <label className="brand-logo-slider-label" htmlFor="brand-hover-size">Aumento no hover <b>{draft.siteLogoHoverScale}%</b></label>
     <input id="brand-hover-size" type="range" min="100" max="170" step="5" value={draft.siteLogoHoverScale} onChange={e=>patch({siteLogoHoverScale:Number(e.target.value)})}/>
     <div className="brand-logo-scale-help"><span>Sem aumento</span><span>Maior destaque</span></div>
    </div>
    {imageControl('siteLogo','Imagem principal','A imagem exibida normalmente. Sem imagem, o site mantém o monograma JF.')}
    {imageControl('siteLogoHover','Imagem alternativa no hover','Opcional. Esta arte substitui a principal enquanto o visitante passa o cursor sobre o logo.')}
    <div className="brand-logo-tip"><Eye size={17}/><p>O hover funciona com mouse e foco por teclado. Em telas sensíveis ao toque, o logo principal permanece visível. O JF padrão é vetorial e aceita cores por tema; imagens importadas mantêm suas próprias cores.</p></div>
    <button className="brand-logo-reset" type="button" disabled={busy} onClick={()=>{setDraft({siteLogo:'',siteLogoHover:'',siteLogoSize:100,siteLogoHoverScale:110,siteLogoAppearance:{...DEFAULT_BRAND_LOGO_APPEARANCE}});setShowHover(false)}}><RotateCcw size={15}/>Restaurar identidade original</button>
    {error&&<p className="editor-status" role="alert">{error}</p>}
   </div>
   <footer><button type="button" className="subtle-action" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="save-action" disabled={busy} onClick={()=>{onSave(draft);onClose()}}><Save size={16}/>Salvar logo</button></footer>
  </section>
 </div>
}
