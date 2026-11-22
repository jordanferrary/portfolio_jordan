import '../../styles/theme-palette-editor.css'
import { useEffect,useRef,useState } from 'react'
import { Check,Palette,RotateCcw,Save,Paintbrush,X } from 'lucide-react'
import { ChromaticPicker } from '../ui/chromatic-picker'
import { applyThemePalette,contrastRatio,DEFAULT_THEME,PALETTE_FIELDS,type ThemeColorKey,type ThemePalette } from '../../lib/theme-palette'
import {applyTypography,normalizeTypography,DEFAULT_TYPOGRAPHY,type TypographySettings} from '../../lib/typography'
import {HeadingSymbol} from '../ui/heading-symbol'
import {DEFAULT_HEADING_SYMBOL,HEADING_SYMBOL_OPTIONS,type HeadingSymbolStyle} from '../../lib/heading-symbol'

type Props={value:ThemePalette;symbol?:HeadingSymbolStyle;typography?:TypographySettings;onSave:(theme:ThemePalette,symbol:HeadingSymbolStyle,typography:TypographySettings)=>void;onClose:()=>void}
const PRESETS:{name:string;palette:ThemePalette}[]=[
 {name:'Neon Dream',palette:{...DEFAULT_THEME}},
 {name:'Cyber Aurora',palette:{...DEFAULT_THEME,primary:'#3D91FF',secondary:'#43EDCD',background:'#070D1C',surface:'#111D32',muted:'#ACCEDE',border:'#3A729A'}},
 {name:'Electric Rose',palette:{...DEFAULT_THEME,primary:'#FF4D9D',secondary:'#FFA44B',background:'#160914',surface:'#2A1225',muted:'#DBC0CF',border:'#A44A83'}},
 {name:'Solar Flare',palette:{...DEFAULT_THEME,primary:'#FF8145',secondary:'#FFCE54',background:'#130A0E',surface:'#281719',muted:'#E0C1B4',border:'#995539'}},
 {name:'Moonlight',palette:{...DEFAULT_THEME,primary:'#B4AAFF',secondary:'#91DFFF',background:'#090B19',surface:'#1C1C34',muted:'#C0C0DC',border:'#6669A6'}}
]
export function ThemePaletteEditor({value,symbol=DEFAULT_HEADING_SYMBOL,typography,onSave,onClose}:Props){
 const [draft,setDraft]=useState<ThemePalette>(()=>({...value}))
 const [active,setActive]=useState<ThemeColorKey>('primary')
 const [draftSymbol,setDraftSymbol]=useState<HeadingSymbolStyle>(symbol)
 const original=useRef({...value})
 const originalType=useRef(normalizeTypography(typography))
 const [draftType,setDraftType]=useState(()=>normalizeTypography(typography))
 const saved=useRef(false)
 useEffect(()=>()=>{if(!saved.current){applyThemePalette(original.current);applyTypography(originalType.current)}},[])
 useEffect(()=>{applyThemePalette(draft)},[draft])
 useEffect(()=>{applyTypography(draftType)},[draftType])
 const setColor=(color:string)=>setDraft(prev=>({...prev,[active]:color}))
 const save=()=>{saved.current=true;onSave(draft,draftSymbol,draftType);onClose()}
 const contrastBackground=contrastRatio(draft.text,draft.background)
 const contrastSurface=contrastRatio(draft.text,draft.surface)
 const mutedContrast=contrastRatio(draft.muted,draft.background)
 const mutedSurfaceContrast=contrastRatio(draft.muted,draft.surface)
 const lowContrast=mutedSurfaceContrast<4.5||contrastBackground<4.5||contrastSurface<4.5||mutedContrast<4.5
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="editor-panel theme-palette-editor" role="dialog" aria-modal="true" aria-label="Direção de arte e cores do portfólio">
   <header><div><span className="eyebrow">✦ ESTÚDIO DE CORES</span><h2>Direção de arte</h2><small>Controle as sete cores globais do site com precisão.</small></div><button type="button" aria-label="Fechar editor de cores" onClick={onClose}><X size={20}/></button></header>
   <div className="editor-scroll">
    <div className="theme-editor-intro"><Paintbrush size={18}/><p>Escolha uma identidade que combine com sua capa. O site responde às mudanças ao vivo; nada é publicado até você salvar e usar o GitHub Studio.</p></div>
    <div className="theme-workspace">
     <div className="theme-controls">
      <h3>Variáveis globais</h3>
      <p className="theme-lead">Personalize fundo, cartões, destaques, textos e bordas. A página pública inteira responde à mudança.</p>
      <div className="theme-token-list">
       {PALETTE_FIELDS.map(field=><button key={field.key} className={'theme-token'+(active===field.key?' selected':'')} type="button" aria-pressed={active===field.key} onClick={()=>setActive(field.key)}><span className="theme-token-swatch" style={{background:draft[field.key]}}/><span className="theme-token-copy"><strong>{field.label}</strong><small>{field.description}</small></span><span className="theme-token-hex">{draft[field.key]}</span>{active===field.key&&<Check size={16}/>}</button>)}
      </div>
      <div className="theme-live-preview" style={{background:draft.background,color:draft.text}}>
       <div className="theme-mini-top"><span className="theme-mini-mark" style={{background:draft.primary}}/> <span>JORDAN FERRARY</span><span className="theme-mini-dot" style={{background:draft.secondary}}/></div>
       <div className="theme-mini-card" style={{background:draft.surface,borderColor:draft.border,color:draft.text}}>
        <span className="theme-mini-heading" style={{color:draft.secondary}}><HeadingSymbol symbol={draftSymbol} size={14}/> CREATIVE PORTFOLIO</span>
        <h4>Art beyond<br/><em style={{color:draft.primary}}>the ordinary.</em></h4>
        <div className="theme-mini-actions"><div className="theme-mini-action theme-mini-glass-primary">Explore my work <span>↗</span></div><div className="theme-mini-action theme-mini-glass-secondary">Discover <span>↗</span></div></div>
       </div>
       <small style={{color:draft.muted}}>Prévia em tempo real · botões Liquid Glass, superfície, bordas e cores</small>
      </div>
     </div>
     <div className="theme-color-workspace">
      <div className="theme-current-label"><div><span>EDITANDO</span><h3>{PALETTE_FIELDS.find(f=>f.key===active)?.label}</h3></div><span className="theme-active-swatch" style={{background:draft[active]}}/></div>
      <ChromaticPicker value={draft[active]} onChange={setColor}/>
      <div className="theme-contrast-audit" role="status" aria-label="Verificação de contraste dos textos">
       <strong>Contraste das cores-base (WCAG AA)</strong>
       <p><span>Texto × fundo</span><b className={contrastBackground>=4.5?'passes':'fails'}>{contrastBackground.toFixed(1)}:1 · {contrastBackground>=4.5?'Aprovado':'Baixo contraste'}</b></p>
       <p><span>Texto × cards</span><b className={contrastSurface>=4.5?'passes':'fails'}>{contrastSurface.toFixed(1)}:1 · {contrastSurface>=4.5?'Aprovado':'Baixo contraste'}</b></p>
       <p><span>Texto secundário × fundo</span><b className={mutedContrast>=4.5?'passes':'fails'}>{mutedContrast.toFixed(1)}:1 · {mutedContrast>=4.5?'Aprovado':'Baixo contraste'}</b></p>
       <p><span>Texto secundário × cards</span><b className={mutedSurfaceContrast>=4.5?'passes':'fails'}>{mutedSurfaceContrast.toFixed(1)}:1 {mutedSurfaceContrast>=4.5?'Aprovado':'Baixo contraste'}</b></p>
      </div>
      {lowContrast&&<p className="theme-contrast-note" role="status">Textos e descrições precisam de contraste 4,5:1 ou maior sobre os fundos. Revise as cores antes de publicar.</p>}
     </div>
    </div>

    <section className="theme-symbol-panel theme-typography-settings" aria-label="Tipografia pública">
     <h3>Tipografia</h3><p>Altere as famílias e a escala global sem modificar a hierarquia ou os controles técnicos.</p>
     <div className="theme-type-grid">
      <label>Fonte dos títulos<select value={draftType.headingFont} onChange={e=>setDraftType(prev=>normalizeTypography({...prev,headingFont:e.target.value}))}><option value="manrope">Manrope</option><option value="dm-sans">DM Sans</option></select></label>
      <label>Fonte dos textos<select value={draftType.bodyFont} onChange={e=>setDraftType(prev=>normalizeTypography({...prev,bodyFont:e.target.value}))}><option value="dm-sans">DM Sans</option><option value="manrope">Manrope</option></select></label>
      <label>Escala dos títulos ({Math.round(draftType.headingScale*100)}%)<input type="range" min=".9" max="1.15" step=".01" value={draftType.headingScale} onChange={e=>setDraftType(prev=>({...prev,headingScale:Number(e.target.value)}))}/></label>
      <label>Escala dos textos ({Math.round(draftType.bodyScale*100)}%)<input type="range" min=".9" max="1.15" step=".01" value={draftType.bodyScale} onChange={e=>setDraftType(prev=>({...prev,bodyScale:Number(e.target.value)}))}/></label>
     </div>
     <button type="button" className="theme-symbol-reset" onClick={()=>setDraftType({...DEFAULT_TYPOGRAPHY})}>Restaurar tipografia</button>
    </section>
    <section className="theme-symbol-panel" aria-label="Símbolos dos títulos">
     <div className="theme-symbol-panel-heading">
      <div><span className="eyebrow">IDENTIDADE VISUAL / SÍMBOLOS</span><h3>Símbolos dos títulos</h3><p>Uma identidade consistente nas apresentações das páginas, sem ícones duplicados.</p></div>
      <button type="button" className="theme-symbol-reset" onClick={()=>setDraftSymbol(DEFAULT_HEADING_SYMBOL)}><RotateCcw size={15}/>Padrão</button>
     </div>
     <div className="theme-symbol-options" role="group" aria-label="Estilo global dos símbolos">
      {HEADING_SYMBOL_OPTIONS.map(option=><button key={option.id} type="button" className={'theme-symbol-option'+(draftSymbol===option.id?' selected':'')} onClick={()=>setDraftSymbol(option.id)} aria-pressed={draftSymbol===option.id} title={option.label}>
       <span className="theme-symbol-option-graphic"><HeadingSymbol symbol={option.id} size={21}/>{option.id==='none'&&<span className="theme-symbol-none">—</span>}</span>
       <small>{option.label}</small>
      </button>)}
     </div>
     <div className="theme-symbol-example"><span style={{color:draft.secondary}}><HeadingSymbol symbol={draftSymbol} size={16}/> EXPLORAR MEU PORTFÓLIO</span><strong style={{color:draft.text}}>Prévia do título</strong></div>
    </section>
    <div className="theme-preset-area"><div><h3>Direções de cor</h3><p>Experimente uma base de cores e ajuste os valores como preferir.</p></div><div className="theme-presets">{PRESETS.map(preset=><button type="button" key={preset.name} onClick={()=>setDraft({...preset.palette})} className="theme-preset"><span className="theme-preset-dots">{PALETTE_FIELDS.map(field=><i key={field.key} style={{background:preset.palette[field.key]}}/>)}</span><strong>{preset.name}</strong></button>)}</div></div>
    <div className="theme-editor-bottom"><button type="button" className="theme-reset" onClick={()=>setDraft({...DEFAULT_THEME})}><RotateCcw size={15}/>Restaurar cores originais</button><p><Palette size={15}/> A visualização é imediata. Somente <b>Salvar paleta</b> grava o rascunho local; <b>Publicar</b> atualiza o site para todos.</p></div>
   </div>
   <footer><button type="button" className="subtle-action" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={17}/>Salvar paleta</button></footer>
  </section>
 </div>
}
