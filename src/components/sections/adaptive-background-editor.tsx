import {useState} from 'react'
import {DEFAULT_ADAPTIVE_COLOR,effectiveAdaptiveColor,normalizeAdaptiveStop,paletteIdentity,resolveAdaptiveColor,type AdaptiveColor,type AdaptiveStop} from '../../lib/adaptive-background'
import {PALETTE_FIELDS,type ThemePalette} from '../../lib/theme-palette'
type Props={label:string;fixed:string;value?:AdaptiveStop;palette:ThemePalette;onFixed:(value:string)=>void;onChange:(value:AdaptiveStop)=>void}
export function AdaptiveBackgroundColor({label,fixed,value,palette,onFixed,onChange}:Props){
 const [scope,setScope]=useState<'global'|'theme'>('global')
 const stop=normalizeAdaptiveStop(value),id=paletteIdentity(palette),override=stop.themes[id]
 const settings=scope==='theme'?effectiveAdaptiveColor(stop,palette):stop.global
 const patch=(next:Partial<AdaptiveColor>)=>onChange(scope==='global'?{...stop,global:{...stop.global,...next}}:{...stop,themes:{...stop.themes,[id]:{...override,...next}}})
 const reset=()=>{const themes={...stop.themes};delete themes[id];onChange({...stop,themes})}
 const range=(key:'hue'|'saturation'|'lightness'|'opacity',title:string,min:number,max:number,step:number)=><label className="model-studio-range"><span>{title}<output>{Number(settings[key].toFixed(2))}</output></span><input type="range" min={min} max={max} step={step} value={settings[key]} onChange={e=>patch({[key]:Number(e.target.value)})}/><input type="number" aria-label={title} min={min} max={max} step={step} value={settings[key]} onChange={e=>{if(Number.isFinite(e.target.valueAsNumber))patch({[key]:Math.max(min,Math.min(max,e.target.valueAsNumber))})}}/></label>
 return <details className="model-workspace-section"><summary>{label} <span aria-hidden="true" style={{display:'inline-block',width:18,height:18,borderRadius:4,verticalAlign:'middle',background:resolveAdaptiveColor(fixed,stop,palette)}}/></summary>
 <label>Escopo<select value={scope} onChange={e=>setScope(e.target.value as 'global'|'theme')}><option value="global">Todos os temas (regra global)</option><option value="theme">Somente a paleta ativa</option></select></label>
 <label>Origem da cor<select value={settings.source} onChange={e=>patch({source:e.target.value as AdaptiveColor['source']})}><option value="fixed">Cor fixa</option>{PALETTE_FIELDS.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
 {settings.source==='fixed'&&<label className="model-studio-color">Cor fixa compartilhada<input type="color" value={fixed} onChange={e=>onFixed(e.target.value)}/></label>}
 {range('hue','Matiz',-180,180,1)}{range('saturation','Saturação',-100,100,1)}{range('lightness','Luminosidade',-100,100,1)}{range('opacity','Opacidade',0,1,.05)}
 <p className="model-studio-tip">{override?'A paleta ativa tem exceções; somente os parâmetros personalizados substituem a regra global.':'A paleta ativa herda todos os parâmetros globais.'}</p>
 {scope==='theme'&&override&&<button type="button" className="model-studio-secondary" onClick={reset}>Restaurar herança global</button>}
 {scope==='global'&&<button type="button" className="model-studio-secondary" onClick={()=>onChange({...stop,global:{...DEFAULT_ADAPTIVE_COLOR}})}>Restaurar regra global</button>}
 </details>
}
