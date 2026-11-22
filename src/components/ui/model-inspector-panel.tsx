import {Box,ChevronDown,Grid3X3,Layers,Palette,Play,Pause,ScanLine,X} from 'lucide-react'
import {INSPECTOR_GROUPS,MODEL_MODES,WIRE_MODES,type InspectorOptions,type ModelMode} from '../../lib/model-presentation'
import type {ModelStats} from '../../lib/model-inspector-stage'
const icons=[Box,Play,Palette,Layers,Grid3X3]
const colors=['#25212e','#ffffff','#bfbfbf','#ff4141','#3879ff','#47e66b','#ffe34f']
type Props={mode:ModelMode;onMode:(mode:ModelMode)=>void;options:InspectorOptions;onOptions:(value:InspectorOptions)=>void;stats:ModelStats;onClose:()=>void;animation:number;playing:boolean;onAnimation:(index:number)=>void;onPlaying:(value:boolean)=>void}
export function ModelInspectorPanel({mode,onMode,options,onOptions,stats,onClose,animation,playing,onAnimation,onPlaying}:Props){
 const available=new Set(stats.available)
 const patch=(next:Partial<InspectorOptions>)=>onOptions({...options,...next})
 return <aside className="model-inspector-panel" aria-label="Model inspector" onPointerDown={event=>event.stopPropagation()}>
  <header><div><ScanLine size={17}/><strong>Model inspector</strong></div><button type="button" aria-label="Close inspector" onClick={onClose}><X size={17}/></button></header>
  <div className="model-inspector-current"><span>Active view</span><strong>{MODEL_MODES.find(item=>item.id===mode)?.label}</strong></div>
  <div className="model-inspector-scroll">
   {WIRE_MODES.includes(mode)&&<div className="model-wire-config"><span>Wire color</span><div className="model-wire-swatches">{colors.map(color=><button key={color} type="button" aria-label={'Wire color '+color} aria-pressed={options.wireColor===color} style={{backgroundColor:color}} onClick={()=>patch({wireColor:color})}/>)}<input type="color" aria-label="Custom wire color" value={options.wireColor} onChange={event=>patch({wireColor:event.target.value})}/></div><label>Wire opacity <output>{Math.round(options.wireOpacity*100)}%</output><input type="range" min=".15" max="1" step=".05" value={options.wireOpacity} onChange={event=>patch({wireOpacity:Number(event.target.value)})}/></label></div>}
   <label className="model-inspector-toggle"><input type="checkbox" checked={options.singleSided} onChange={event=>patch({singleSided:event.target.checked})}/> Single sided</label>
   {INSPECTOR_GROUPS.map((group,i)=>{const Icon=icons[i]??Box;return <details key={group.label} open={i!==1||stats.animations.length>0}><summary><Icon size={14}/><span>{group.label}</span><ChevronDown size={14}/></summary><div className="model-inspector-list">{group.items.map(item=><button type="button" key={item.id} disabled={!available.has(item.id)} aria-pressed={mode===item.id} title={available.has(item.id)?item.hint??item.label:'Unavailable in this model — '+(item.hint??item.label)} onClick={()=>onMode(item.id)}><span className="model-mode-dot"/><span>{item.label}</span></button>)}</div>{i===1&&stats.animations.length>0&&<div className="model-animation-controls"><label>Animation clip ({stats.animations.length})<select value={animation} onChange={event=>onAnimation(Number(event.target.value))}><option value={-1}>Rest pose</option>{stats.animations.map((name,index)=><option key={index} value={index}>{name}</option>)}</select></label><button type="button" disabled={animation<0} onClick={()=>onPlaying(!playing)} aria-label={playing?'Pause animation':'Play animation'}>{playing?<Pause size={15}/>:<Play size={15}/>}</button></div>}</details>})}
  </div>
  <footer><span>{stats.meshes.toLocaleString()} meshes</span><span>{stats.triangles.toLocaleString()} tris</span></footer>
 </aside>
}
