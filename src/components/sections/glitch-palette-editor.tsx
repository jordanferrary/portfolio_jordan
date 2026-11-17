import {useState} from 'react'
import {RotateCcw,Save,SlidersHorizontal,X} from 'lucide-react'
import {GlitchSignalArt} from '../ui/route-glitch-transition'
import {DEFAULT_GLITCH_PALETTE,GLITCH_COLORS,GLITCH_PRESETS,glitchPaletteStyle,normalizeGlitchPalette,
 type GlitchPalette,type GlitchColorKey} from '../../lib/glitch-palette'
import '../../styles/glitch-palette-editor.css'

type Props={value:GlitchPalette;onSave:(value:GlitchPalette)=>void;onClose:()=>void}

export function GlitchPaletteEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState<GlitchPalette>(()=>normalizeGlitchPalette(value))
 const [inputs,setInputs]=useState<Record<GlitchColorKey,string>>(()=>({
  magenta:draft.magenta,cyan:draft.cyan,lime:draft.lime,noise:draft.noise,dark:draft.dark
 }))
 const setColor=(key:GlitchColorKey,color:string)=>{
  setDraft(current=>({...current,[key]:color}))
  setInputs(current=>({...current,[key]:color}))
 }
 const setPalette=(palette:GlitchPalette)=>{
  const normalized=normalizeGlitchPalette(palette)
  setDraft(normalized)
  setInputs({magenta:normalized.magenta,cyan:normalized.cyan,lime:normalized.lime,noise:normalized.noise,dark:normalized.dark})
 }
 const editHex=(key:GlitchColorKey,text:string)=>{
  setInputs(current=>({...current,[key]:text}))
  if(/^#[a-f0-9]{6}$/i.test(text))setDraft(current=>({...current,[key]:text.toUpperCase()}))
 }
 const resetHex=(key:GlitchColorKey)=>setInputs(current=>({...current,[key]:draft[key]}))
 const save=()=>{onSave(normalizeGlitchPalette(draft));onClose()}
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="editor-panel glitch-palette-editor" role="dialog" aria-modal="true" aria-label="Paleta exclusiva do glitch">
   <header><div><span className="eyebrow">✦ SIGNAL CORRUPTION</span><h2>Paleta do glitch</h2><small>Personalize a interferência digital sem alterar as cores do site.</small></div><button type="button" aria-label="Fechar paleta do glitch" onClick={onClose}><X size={20}/></button></header>
   <div className="editor-scroll">
    <p className="glitch-editor-description">Este efeito usa cores independentes: retângulos neon, bandas fragmentadas, ruído de sinal e deslocamentos bruscos. A prévia abaixo acompanha suas alterações.</p>
    <div className="glitch-palette-workspace">
     <div className="glitch-editor-options">
      <h3>Canais de interferência</h3>
      <div className="glitch-editor-color-list">
       {GLITCH_COLORS.map(c=><label key={c.key} className="glitch-editor-color-row">
        <input type="color" value={draft[c.key]} aria-label={'Selecionar '+c.label} onChange={e=>setColor(c.key,e.target.value.toUpperCase())}/>
        <span><strong>{c.label}</strong><small>{c.description}</small></span>
        <input type="text" spellCheck={false} maxLength={7} value={inputs[c.key]} aria-label={'HEX de '+c.label}
         onChange={e=>editHex(c.key,e.target.value)} onBlur={()=>resetHex(c.key)}/>
       </label>)}
      </div>
      <label className="glitch-editor-intensity">
       <span><SlidersHorizontal size={16}/>Intensidade <b>{Math.round(draft.intensity*100)}%</b></span>
       <input type="range" min=".5" max="1.4" step=".05" value={draft.intensity} onChange={e=>setDraft(prev=>({...prev,intensity:Number(e.target.value)}))}/>
      </label>
     </div>
     <div className="glitch-editor-demo">
      <h3>Prévia animada</h3>
      <div className="jf-glitch-preview" aria-label="Prévia da interferência digital" role="img" style={glitchPaletteStyle(draft)}><GlitchSignalArt/></div>
      <p>Blocos e ruído em movimento · nenhuma cor do portfólio é modificada pela prévia.</p>
      <h4>Direções prontas</h4>
      <div className="glitch-editor-presets">
       {GLITCH_PRESETS.map(preset=><button type="button" key={preset.name} onClick={()=>setPalette(preset.palette)}>
        <span className="glitch-preset-swatches">{GLITCH_COLORS.slice(0,3).map(color=><i key={color.key} style={{background:preset.palette[color.key]}}/>)}</span>
        <span>{preset.name}</span>
       </button>)}
      </div>
     </div>
    </div>
    <div className="glitch-editor-note"><button type="button" className="subtle-action" onClick={()=>setPalette(DEFAULT_GLITCH_PALETTE)}><RotateCcw size={15}/>Restaurar glitch original</button><p>Salvar atualiza seu rascunho. Para disponibilizar a configuração aos visitantes, publique pelo Studio.</p></div>
   </div>
   <footer><button type="button" className="subtle-action" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={16}/>Salvar glitch</button></footer>
  </section>
 </div>
}
