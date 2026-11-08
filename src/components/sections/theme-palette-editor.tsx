import '../../styles/theme-palette-editor.css'
import { useEffect,useRef,useState } from 'react'
import { Check,Palette,RotateCcw,Save,Sparkles,X } from 'lucide-react'
import { ChromaticPicker } from '../ui/chromatic-picker'
import { applyThemePalette,contrastRatio,DEFAULT_THEME,PALETTE_FIELDS,type ThemeColorKey,type ThemePalette } from '../../lib/theme-palette'

type Props={value:ThemePalette;onSave:(theme:ThemePalette)=>void;onClose:()=>void}
const PRESETS:{name:string;palette:ThemePalette}[]=[
 {name:'Neon Dream',palette:{...DEFAULT_THEME}},
 {name:'Cyber Aurora',palette:{...DEFAULT_THEME,primary:'#3D91FF',secondary:'#43EDCD',background:'#070D1C',surface:'#111D32',muted:'#ACCEDE',border:'#3A729A'}},
 {name:'Electric Rose',palette:{...DEFAULT_THEME,primary:'#FF4D9D',secondary:'#FFA44B',background:'#160914',surface:'#2A1225',muted:'#DBC0CF',border:'#A44A83'}},
 {name:'Solar Flare',palette:{...DEFAULT_THEME,primary:'#FF8145',secondary:'#FFCE54',background:'#130A0E',surface:'#281719',muted:'#E0C1B4',border:'#995539'}},
 {name:'Moonlight',palette:{...DEFAULT_THEME,primary:'#B4AAFF',secondary:'#91DFFF',background:'#090B19',surface:'#1C1C34',muted:'#C0C0DC',border:'#6669A6'}}
]
export function ThemePaletteEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState<ThemePalette>(()=>({...value}))
 const [active,setActive]=useState<ThemeColorKey>('primary')
 const original=useRef({...value})
 const saved=useRef(false)
 useEffect(()=>()=>{if(!saved.current)applyThemePalette(original.current)},[])
 useEffect(()=>{applyThemePalette(draft)},[draft])
 const setColor=(color:string)=>setDraft(prev=>({...prev,[active]:color}))
 const save=()=>{saved.current=true;onSave(draft);onClose()}
 const contrastBackground=contrastRatio(draft.text,draft.background)
 const contrastSurface=contrastRatio(draft.text,draft.surface)
 const mutedContrast=contrastRatio(draft.muted,draft.background)
 const lowContrast=contrastBackground<4.5||contrastSurface<4.5||mutedContrast<4.5
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="editor-panel theme-palette-editor" role="dialog" aria-modal="true" aria-label="Direção de arte e cores do portfólio">
   <header><div><span className="eyebrow">✦ ESTÚDIO DE CORES</span><h2>Direção de arte</h2><small>Controle as sete cores globais do site com precisão.</small></div><button type="button" aria-label="Fechar editor de cores" onClick={onClose}><X size={20}/></button></header>
   <div className="editor-scroll">
    <div className="theme-editor-intro"><Sparkles size={18}/><p>Escolha uma identidade que combine com sua capa. O site responde às mudanças ao vivo; nada é publicado até você salvar e usar o GitHub Studio.</p></div>
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
        <span style={{color:draft.secondary}}>✦ CREATIVE PORTFOLIO</span>
        <h4>Art beyond<br/><em style={{color:draft.primary}}>the ordinary.</em></h4>
        <div className="theme-mini-actions"><div className="theme-mini-action theme-mini-glass-primary">Explore my work <span>↗</span></div><div className="theme-mini-action theme-mini-glass-secondary">Discover <span>✦</span></div></div>
       </div>
       <small style={{color:draft.muted}}>Prévia em tempo real · botões Liquid Glass, superfície, bordas e cores</small>
      </div>
     </div>
     <div className="theme-color-workspace">
      <div className="theme-current-label"><div><span>EDITANDO</span><h3>{PALETTE_FIELDS.find(f=>f.key===active)?.label}</h3></div><span className="theme-active-swatch" style={{background:draft[active]}}/></div>
      <ChromaticPicker value={draft[active]} onChange={setColor}/>
      <div className="theme-contrast-audit" role="status" aria-label="Verificação de contraste dos textos">
       <strong>Legibilidade real (WCAG AA)</strong>
       <p><span>Texto × fundo</span><b className={contrastBackground>=4.5?'passes':'fails'}>{contrastBackground.toFixed(1)}:1 · {contrastBackground>=4.5?'Aprovado':'Baixo contraste'}</b></p>
       <p><span>Texto × cards</span><b className={contrastSurface>=4.5?'passes':'fails'}>{contrastSurface.toFixed(1)}:1 · {contrastSurface>=4.5?'Aprovado':'Baixo contraste'}</b></p>
       <p><span>Texto secundário × fundo</span><b className={mutedContrast>=4.5?'passes':'fails'}>{mutedContrast.toFixed(1)}:1 · {mutedContrast>=4.5?'Aprovado':'Baixo contraste'}</b></p>
      </div>
      {lowContrast&&<p className="theme-contrast-note" role="status">Textos e descrições precisam de contraste 4,5:1 ou maior sobre os fundos. Revise as cores antes de publicar.</p>}
     </div>
    </div>
    <div className="theme-preset-area"><div><h3>Direções de cor</h3><p>Uma base rápida para experimentar — todos os valores continuam editáveis.</p></div><div className="theme-presets">{PRESETS.map(preset=><button type="button" key={preset.name} onClick={()=>setDraft({...preset.palette})} className="theme-preset"><span className="theme-preset-dots">{PALETTE_FIELDS.map(field=><i key={field.key} style={{background:preset.palette[field.key]}}/>)}</span><strong>{preset.name}</strong></button>)}</div></div>
    <div className="theme-editor-bottom"><button type="button" className="theme-reset" onClick={()=>setDraft({...DEFAULT_THEME})}><RotateCcw size={15}/>Restaurar cores originais</button><p><Palette size={15}/> A visualização é imediata. Somente <b>Salvar paleta</b> grava o rascunho local; <b>Publicar</b> atualiza o site para todos.</p></div>
   </div>
   <footer><button type="button" className="subtle-action" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={17}/>Salvar paleta</button></footer>
  </section>
 </div>
}
