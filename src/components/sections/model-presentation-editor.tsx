import {normalizeModelPresentation,DEFAULT_MODEL_PRESENTATION,type ModelPresentation} from '../../lib/model-presentation'
import {RotateCcw,SlidersHorizontal} from 'lucide-react'
type NumericKey={ [K in keyof ModelPresentation]:ModelPresentation[K] extends number?K:never }[keyof ModelPresentation]
const controls:readonly {key:NumericKey;label:string;min:number;max:number;step:number}[]=[
 {key:'exposure',label:'Exposição',min:.2,max:3,step:.1},{key:'environment',label:'Luz ambiente',min:0,max:2,step:.1},
 {key:'keyLight',label:'Intensidade da luz principal',min:0,max:5,step:.1},{key:'lightAngle',label:'Direção da luz',min:-180,max:180,step:5},
 {key:'azimuth',label:'Câmera horizontal',min:-180,max:180,step:5},{key:'elevation',label:'Câmera vertical',min:-80,max:80,step:5},
 {key:'zoom',label:'Enquadramento inicial',min:.5,max:2,step:.05},{key:'rotationSpeed',label:'Velocidade da rotação',min:.2,max:4,step:.1}
]
export function ModelPresentationEditor({value,onChange}:{value?:Partial<ModelPresentation>;onChange:(value:ModelPresentation)=>void}){
 const current=normalizeModelPresentation(value)
 const patch=(next:Partial<ModelPresentation>)=>onChange({...current,...next})
 return <details className="model-presentation-editor" open><summary><SlidersHorizontal size={17}/> Direção de arte do visualizador</summary><p className="editor-help">Ajuste a apresentação e abra a prévia para conferir. As configurações são salvas por modelo, sem alterar o GLB.</p>
 <div className="model-presentation-grid"><label>Iluminação<select value={current.lighting} onChange={e=>patch({lighting:e.target.value as ModelPresentation['lighting']})}><option value="studio">Studio equilibrado</option><option value="soft">Soft light</option><option value="contrast">Contraste dramático</option></select></label>
 {controls.map(item=><label key={item.key}><span>{item.label} <output>{current[item.key]}</output></span><input type="range" min={item.min} max={item.max} step={item.step} value={current[item.key]} onChange={e=>patch({[item.key]:Number(e.target.value)})}/></label>)}
 <label className="model-color-control">Cor da luz principal<input type="color" value={current.lightColor} onChange={e=>patch({lightColor:e.target.value})}/></label><label className="model-color-control">Cor do cenário<input type="color" value={current.background} onChange={e=>patch({background:e.target.value})}/></label></div>
 <label className="checkbox-line"><input type="checkbox" checked={current.autoRotate} onChange={e=>patch({autoRotate:e.target.checked})}/> Rotação automática quando o modelo não está em interação</label>
 <button type="button" className="subtle-action" onClick={()=>onChange({...DEFAULT_MODEL_PRESENTATION})}><RotateCcw size={15}/> Restaurar apresentação padrão</button></details>
}
