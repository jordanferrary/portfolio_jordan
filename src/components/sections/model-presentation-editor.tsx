import {useEffect,useRef,useState} from 'react'
import {Box,Camera,Check,Lightbulb,Plus,RotateCcw,Save,SlidersHorizontal,Trash2,X} from 'lucide-react'
import {ProjectModel} from '../ui/project-model'
import {createModelLight,normalizeModelPresentation,DEFAULT_MODEL_PRESENTATION,MAX_MODEL_LIGHTS,type ModelPresentation,type ModelLight} from '../../lib/model-presentation'
import '../../styles/project-model.css'
type Props={url:string;poster?:string;title:string;value?:Partial<ModelPresentation>;onChange:(value:ModelPresentation)=>void}
type Tab='lighting'|'camera'|'scene'
function Range({label,value,min,max,step,onChange,suffix=''}:{label:string;value:number;min:number;max:number;step:number;onChange:(value:number)=>void;suffix?:string}){
 return <label className="model-studio-range"><span>{label}<output>{Number(value.toFixed(2))}{suffix}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/><input type="number" aria-label={label+' — valor numérico'} min={min} max={max} step={step} value={Number(value.toFixed(2))} onChange={e=>{const next=e.target.valueAsNumber;if(Number.isFinite(next))onChange(Math.max(min,Math.min(max,next)))}}/></label>
}
function LightEditor({light,onChange,onDelete}:{light:ModelLight;onChange:(next:Partial<ModelLight>)=>void;onDelete:()=>void}){
 const r=(key:'intensity'|'azimuth'|'elevation'|'distance'|'angle'|'softness'|'targetX'|'targetY'|'targetZ',label:string,min:number,max:number,step:number,suffix='')=><Range label={label} min={min} max={max} step={step} suffix={suffix} value={light[key]} onChange={value=>onChange({[key]:value})}/>
 return <section className="model-studio-light-detail"><div className="model-studio-field-row"><label>Nome<input maxLength={50} value={light.name} onChange={e=>onChange({name:e.target.value})}/></label><button className="model-studio-icon danger" type="button" title="Excluir luz" aria-label="Excluir luz" onClick={onDelete}><Trash2 size={16}/></button></div>
 <label>Tipo<select value={light.type} onChange={e=>onChange({type:e.target.value as ModelLight['type']})}><option value="directional">Direcional</option><option value="point">Pontual (Point)</option><option value="spot">Spot</option></select></label>
 <label className="model-studio-check"><input type="checkbox" checked={light.enabled} onChange={e=>onChange({enabled:e.target.checked})}/> Luz ativa</label>
 <label className="model-studio-color">Cor da luz<input type="color" value={light.color} onChange={e=>onChange({color:e.target.value})}/></label>
 {r('intensity','Intensidade',0,10,.1)}{r('azimuth','Posição horizontal',-180,180,1,'°')}{r('elevation','Posição vertical',-90,90,1,'°')}{r('distance','Distância',.25,12,.05)}
 {light.type==='spot'&&<>{r('angle','Abertura do cone',5,89,1,'°')}{r('softness','Suavidade da borda',0,1,.05)}</>}
 {light.type!=='point'&&<details><summary>Alvo da luz (X, Y, Z)</summary>{r('targetX','Alvo X',-3,3,.05)}{r('targetY','Alvo Y',-3,3,.05)}{r('targetZ','Alvo Z',-3,3,.05)}</details>}
 </section>
}
export function ModelPresentationEditor(props:Props){
 const [open,setOpen]=useState(false)
 const current=normalizeModelPresentation(props.value)
 return <><button type="button" className="model-studio-launch" onClick={()=>setOpen(true)}><span className="model-studio-launch-icon"><SlidersHorizontal size={22}/></span><span><strong>Configurar modelo 3D</strong><small>Iluminação, câmera, cenário e prévia ao vivo</small></span><Box size={19}/></button>
 <p className="model-studio-summary"><Check size={13}/> {current.lights.length} luzes personalizadas · {current.usePresetRig?'Rig de estúdio ativo':'Rig de estúdio desligado'}</p>
 {open&&<ModelStudio key={props.url} {...props} onClose={()=>setOpen(false)}/>}</>
}
function ModelStudio({url,poster,title,value,onChange,onClose}:Props&{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [draft,setDraft]=useState(()=>normalizeModelPresentation(value))
 const [tab,setTab]=useState<Tab>('lighting')
 const [selected,setSelected]=useState<string|null>(draft.lights[0]?.id??null)
 const [previewRotate,setPreviewRotate]=useState(false)
 const [resetKey,setResetKey]=useState(0)
 const [captured,setCaptured]=useState(false)
 useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();return ()=>{if(node?.open)node.close()}},[])
 const patch=(next:Partial<ModelPresentation>)=>setDraft(prev=>({...prev,...next}))
 const add=()=>{if(draft.lights.length>=MAX_MODEL_LIGHTS)return;const id=crypto.randomUUID();setDraft(prev=>({...prev,lights:[...prev.lights,{...createModelLight(id),name:'Luz '+(prev.lights.length+1)}]}));setSelected(id)}
 const changeLight=(id:string,next:Partial<ModelLight>)=>setDraft(prev=>({...prev,lights:prev.lights.map(light=>light.id===id?{...light,...next}:light)}))
 const removeLight=(id:string)=>{setDraft(prev=>({...prev,lights:prev.lights.filter(light=>light.id!==id)}));setSelected(null)}
 const active=draft.lights.find(light=>light.id===selected)
 const r=(key:'exposure'|'environment'|'keyLight'|'lightAngle'|'azimuth'|'elevation'|'zoom'|'fov'|'targetX'|'targetY'|'targetZ'|'rotationSpeed',label:string,min:number,max:number,step:number,suffix='')=><Range label={label} value={draft[key]} min={min} max={max} step={step} suffix={suffix} onChange={v=>{setCaptured(false);patch({[key]:v})}}/>
 const save=()=>{onChange(normalizeModelPresentation(draft));onClose()}
 return <dialog className="model-studio-dialog" ref={dialog} aria-labelledby="model-studio-title" onCancel={e=>{e.preventDefault();onClose()}}>
 <header className="model-studio-header"><div className="model-studio-heading"><span className="model-studio-launch-icon"><Box size={23}/></span><div><small>LOCAL STUDIO / 3D WORKSPACE</small><h2 id="model-studio-title">Direção de arte 3D</h2><p>{title}</p></div></div><button type="button" className="model-studio-icon" aria-label="Fechar sem aplicar" onClick={onClose}><X size={20}/></button></header>
 <div className="model-studio-body"><main className="model-studio-viewport"><div className="model-studio-viewport-head"><span><i/> Prévia em tempo real</span><label className="model-studio-check"><input type="checkbox" checked={previewRotate} onChange={e=>setPreviewRotate(e.target.checked)}/> Girar prévia</label></div>
 <ProjectModel resetCameraToken={resetKey} url={url} poster={poster} title={title} startActive presentation={{...draft,autoRotate:previewRotate}} onCaptureCamera={camera=>{setPreviewRotate(false);setCaptured(true);patch(normalizeModelPresentation({...draft,...camera}))}}/>
 <div className="model-studio-viewport-tip"><Camera size={16}/> Arraste para orbitar, use o zoom e clique em Capturar câmera para definir a vista inicial.</div>{captured&&<p className="model-studio-captured" role="status"><Check size={15}/> Enquadramento atual registrado no rascunho.</p>}</main>
 <aside className="model-studio-sidebar"><nav className="model-studio-tabs" aria-label="Configurações do modelo">{([{id:'lighting',label:'Luzes',icon:Lightbulb},{id:'camera',label:'Câmera',icon:Camera},{id:'scene',label:'Cena',icon:SlidersHorizontal}] as const).map(({id,label,icon:Icon})=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={16}/>{label}</button>)}</nav>
 <div className="model-studio-controls">
 {tab==='lighting'&&<><h3>Iluminação de estúdio</h3><label className="model-studio-check"><input type="checkbox" checked={draft.usePresetRig} onChange={e=>patch({usePresetRig:e.target.checked})}/> Usar iluminação padrão</label>{draft.usePresetRig&&<><label>Preset<select value={draft.lighting} onChange={e=>patch({lighting:e.target.value as ModelPresentation['lighting']})}><option value="studio">Studio equilibrado</option><option value="soft">Soft light</option><option value="contrast">Contraste dramático</option></select></label>{r('keyLight','Intensidade principal',0,5,.1)}{r('lightAngle','Direção principal',-180,180,1,'°')}<label className="model-studio-color">Cor principal<input type="color" value={draft.lightColor} onChange={e=>patch({lightColor:e.target.value})}/></label></>}
 {r('environment','Reflexos e luz ambiente',0,2,.05)}
 <div className="model-studio-section-head"><h3>Luzes personalizadas <small>{draft.lights.length}/{MAX_MODEL_LIGHTS}</small></h3><button type="button" className="model-studio-icon" disabled={draft.lights.length>=MAX_MODEL_LIGHTS} aria-label="Adicionar luz" onClick={add}><Plus size={17}/></button></div>
 <div className="model-studio-light-list">{draft.lights.map(light=><button type="button" key={light.id} aria-pressed={selected===light.id} onClick={()=>setSelected(light.id)}><i style={{background:light.color,opacity:light.enabled?1:.3}}/><span>{light.name||'Luz sem nome'}<small>{light.type==='directional'?'Direcional':light.type==='point'?'Point':'Spot'}{light.enabled?'':' · Desligada'}</small></span></button>)}</div>{!draft.lights.length&&<button type="button" className="model-studio-secondary" onClick={add}><Plus size={16}/> Adicionar primeira luz</button>}{active&&<LightEditor light={active} onChange={next=>changeLight(active.id,next)} onDelete={()=>removeLight(active.id)}/>}</>}
 {tab==='camera'&&<><h3>Enquadramento inicial</h3>{r('azimuth','Ângulo horizontal',-180,180,1,'°')}{r('elevation','Ângulo vertical',-89,89,1,'°')}{r('zoom','Aproximação',.2,8,.05,'×')}{r('fov','Campo de visão (FOV)',15,80,1,'°')}<h3>Centro de interesse</h3>{r('targetX','Alvo X',-5,5,.05)}{r('targetY','Alvo Y',-5,5,.05)}{r('targetZ','Alvo Z',-5,5,.05)}<div className="model-studio-tip">A câmera salva é a vista que o visitante encontra ao abrir o modelo. A captura do viewport também registra o alvo e o zoom.</div><button className="model-studio-secondary" type="button" onClick={()=>{const {azimuth,elevation,zoom,fov,targetX,targetY,targetZ}=DEFAULT_MODEL_PRESENTATION;patch({azimuth,elevation,zoom,fov,targetX,targetY,targetZ});setResetKey(k=>k+1);setCaptured(false)}}><RotateCcw size={15}/> Restaurar câmera</button></>}
 {tab==='scene'&&<><h3>Apresentação</h3>{r('exposure','Exposição',.2,3,.05)}<label className="model-studio-color">Cor de fundo<input type="color" value={draft.background} onChange={e=>patch({background:e.target.value})}/></label><h3>Movimento automático (visitante)</h3><label className="model-studio-check"><input type="checkbox" checked={draft.autoRotate} onChange={e=>patch({autoRotate:e.target.checked})}/> Rotação automática</label>{r('rotationSpeed','Velocidade de rotação',.2,4,.1)}<p className="model-studio-tip">A rotação da prévia é independente da configuração publicada.</p></>}
 </div></aside></div>
 <footer className="model-studio-footer"><button type="button" className="model-studio-secondary" onClick={()=>{setDraft(normalizeModelPresentation());setSelected(null);setCaptured(false);setPreviewRotate(false);setResetKey(k=>k+1)}}><RotateCcw size={16}/> Restaurar padrão</button><span>As alterações afetam somente este modelo.</span><button type="button" className="model-studio-secondary" onClick={onClose}>Cancelar</button><button type="button" className="model-studio-primary" onClick={save}><Save size={16}/> Aplicar configurações</button></footer>
 </dialog>
}
