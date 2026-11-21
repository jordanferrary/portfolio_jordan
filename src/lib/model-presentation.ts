export type ModelMode='material'|'neutral'|'clay'|'wireframe'|'shaded-wire'|'clay-wire'|'flat'|'flat-wire'|'normals'|'unlit'|'metalness'|'roughness'|'normal-map'|'ao'|'opacity'|'emission'|'specular'|'scattering'|'matcap'|'matcap-surface'|'uv'|'bones'|'weights'
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
export type InspectorGroup={label:string;items:readonly {id:ModelMode;label:string;hint?:string}[]}
export const INSPECTOR_GROUPS:readonly InspectorGroup[]=[
 {label:'Render',items:[{id:'material',label:'Final render'},{id:'neutral',label:'No tone mapping'}]},
 {label:'Animation',items:[{id:'bones',label:'Bones'},{id:'weights',label:'Bones influence',hint:'Strongest skin weight per vertex'}]},
 {label:'Material channels',items:[{id:'unlit',label:'Base color'},{id:'metalness',label:'Metalness'},{id:'roughness',label:'Roughness'},{id:'scattering',label:'Scattering',hint:'Not a standard glTF surface channel'},{id:'normal-map',label:'Normal map'},{id:'ao',label:'Ambient occlusion',hint:'Baked AO, if present; not a generated cavity map'},{id:'opacity',label:'Opacity'},{id:'emission',label:'Emission'},{id:'specular',label:'Specular F0',hint:'Estimated reflectance from the PBR material'}]},
 {label:'Geometry',items:[{id:'matcap',label:'Matcap'},{id:'matcap-surface',label:'Matcap + surface'},{id:'clay',label:'Clay'},{id:'flat',label:'Flat shading'},{id:'wireframe',label:'Wireframe only'},{id:'shaded-wire',label:'Material + wireframe'},{id:'clay-wire',label:'Clay + wireframe'},{id:'flat-wire',label:'Flat + wireframe'},{id:'normals',label:'Surface normals'}]},
 {label:'UV',items:[{id:'uv',label:'UV checker'}]}
]
export const MODEL_MODES=INSPECTOR_GROUPS.flatMap(group=>group.items)
export const WIRE_MODES:readonly ModelMode[]=['wireframe','shaded-wire','clay-wire','flat-wire']
export const isWireOverlay=(mode:ModelMode)=>mode==='shaded-wire'||mode==='clay-wire'||mode==='flat-wire'
export type InspectorOptions={wireColor:string;singleSided:boolean;wireOpacity:number}
export const DEFAULT_INSPECTOR_OPTIONS:InspectorOptions={wireColor:'#25212e',singleSided:false,wireOpacity:1}
