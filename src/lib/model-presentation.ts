export type ModelMode='material'|'clay'|'wireframe'|'flat'|'normals'|'unlit'
export type ModelPresentation={
 lighting:'studio'|'soft'|'contrast';exposure:number;environment:number;keyLight:number;lightAngle:number;lightColor:string;background:string;
 autoRotate:boolean;rotationSpeed:number;azimuth:number;elevation:number;zoom:number
}
export const DEFAULT_MODEL_PRESENTATION:ModelPresentation={
 lighting:'studio',exposure:1,environment:1,keyLight:2,lightAngle:45,lightColor:'#ffffff',background:'#15101e',
 autoRotate:true,rotationSpeed:1,azimuth:30,elevation:15,zoom:1
}
const numeric=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback
const color=(v:unknown,fallback:string)=>typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v)?v:fallback
export function normalizeModelPresentation(value?:Partial<ModelPresentation>|null):ModelPresentation{
 const d=DEFAULT_MODEL_PRESENTATION,v=value??{}
 return {lighting:v.lighting==='soft'||v.lighting==='contrast'?v.lighting:'studio',
 exposure:numeric(v.exposure,d.exposure,.2,3),environment:numeric(v.environment,d.environment,0,2),keyLight:numeric(v.keyLight,d.keyLight,0,5),
 lightAngle:numeric(v.lightAngle,d.lightAngle,-180,180),lightColor:color(v.lightColor,d.lightColor),background:color(v.background,d.background),
 autoRotate:typeof v.autoRotate==='boolean'?v.autoRotate:d.autoRotate,rotationSpeed:numeric(v.rotationSpeed,d.rotationSpeed,.2,4),
 azimuth:numeric(v.azimuth,d.azimuth,-180,180),elevation:numeric(v.elevation,d.elevation,-80,80),zoom:numeric(v.zoom,d.zoom,.5,2)}
}
export const MODEL_MODES:readonly {id:ModelMode;label:string}[]=[
 {id:'material',label:'Material'},{id:'clay',label:'Clay'},{id:'wireframe',label:'Wireframe'},{id:'flat',label:'Flat shading'},{id:'normals',label:'Normals'},{id:'unlit',label:'Unlit'}
]
