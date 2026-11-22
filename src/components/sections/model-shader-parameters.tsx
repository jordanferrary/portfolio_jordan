
import type {MaterialLayer} from '../../lib/model-presentation'
export function ShaderParameters({value,onChange}:{value:MaterialLayer;onChange:(next:Partial<MaterialLayer>)=>void}){
 const id=value.preset
 if(id==='original'||id==='flat')return null
 const range=(key:'strength'|'patternScale'|'patternAngle'|'scanSpeed'|'scanSpacing'|'bands'|'rimPower',label:string,min:number,max:number,step:number,unit='')=><label className="model-studio-range"><span>{label}<output>{Number(value[key].toFixed(2))}{unit}</output></span><input type="range" min={min} max={max} step={step} value={value[key]} onChange={e=>onChange({[key]:Number(e.target.value)})}/><input type="number" aria-label={label} min={min} max={max} step={step} value={Number(value[key].toFixed(2))} onChange={e=>{const n=e.target.valueAsNumber;if(Number.isFinite(n))onChange({[key]:Math.max(min,Math.min(max,n))})}}/></label>
 const color=(key:'tint'|'inkColor'|'paperColor',label:string)=><label className="model-studio-color">{label}<input type="color" value={value[key]} onChange={e=>onChange({[key]:e.target.value})}/></label>
 const ink=['hatch','crosshatch','stipple','halftone','pencil'].includes(id)
 const patterned=ink||['dither','watercolor','pearl','foil','opal'].includes(id)
 const directed=patterned||['hologram','chrome'].includes(id)
 const rim=['rim','iridescent','hologram','blueprint','outline','pearl','foil','opal','velvet','chrome','xray','watercolor','pencil'].includes(id)
 return <div className="model-shader-parameters">
 {range('strength','Influência do shader',0,1,.05)}
 {color('tint','Cor do efeito')}
 {['toon','pixel','dither'].includes(id)&&range('bands',id==='toon'?'Faixas de iluminação':'Níveis de cor',2,8,1)}
 {rim&&range('rimPower',id==='outline'?'Concentração do contorno':'Concentração Fresnel',.5,8,.25)}
 {patterned&&range('patternScale',['pearl','foil','opal'].includes(id)?'Escala das ondas cromáticas':'Escala do padrão',3,24,1)}
 {directed&&range('patternAngle',id==='hologram'?'Ângulo das linhas':'Ângulo do padrão',0,180,1,'°')}
 {id==='hologram'&&<>{range('scanSpacing','Espaçamento das linhas',3,24,1,' px')}{range('scanSpeed','Velocidade / sentido das linhas',-60,60,1,' px/s')}<p className="model-studio-tip">Ângulo 0° = linhas horizontais. Velocidade 0 = estáticas; valores negativos invertem o movimento.</p></>}
 {ink&&color('inkColor','Cor da tinta')}
 {(ink||id==='watercolor')&&color('paperColor','Cor do papel')}
 </div>
}
