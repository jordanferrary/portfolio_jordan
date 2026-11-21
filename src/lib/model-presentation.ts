export type ModelMode='material'|'neutral'|'clay'|'wireframe'|'shaded-wire'|'clay-wire'|'flat'|'flat-wire'|'normals'|'unlit'|'metalness'|'roughness'|'normal-map'|'ao'|'opacity'|'emission'|'specular'|'scattering'|'matcap'|'matcap-surface'|'uv'|'bones'|'weights'
export const MAX_MODEL_LIGHTS=8
export type ModelLight={id:string;name:string;type:'directional'|'point'|'spot';enabled:boolean;color:string;intensity:number;azimuth:number;elevation:number;distance:number;angle:number;softness:number;targetX:number;targetY:number;targetZ:number}
export type ModelCamera={azimuth:number;elevation:number;zoom:number;fov:number;targetX:number;targetY:number;targetZ:number}
export type ModelPresentation=ModelCamera&{
 lighting:'studio'|'soft'|'contrast';exposure:number;environment:number;keyLight:number;lightAngle:number;lightColor:string;background:string;
 autoRotate:boolean;rotationSpeed:number;usePresetRig:boolean;useEmbeddedLights:boolean;relightUnlit:boolean;lights:ModelLight[]
}
export const DEFAULT_MODEL_PRESENTATION:ModelPresentation={
 lighting:'studio',exposure:1,environment:1,keyLight:2,lightAngle:45,lightColor:'#ffffff',background:'#15101e',
 autoRotate:true,rotationSpeed:1,azimuth:30,elevation:15,zoom:1,fov:38,targetX:0,targetY:0,targetZ:0,usePresetRig:true,useEmbeddedLights:true,relightUnlit:false,lights:[]
}
const numeric=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback
const color=(v:unknown,fallback:string)=>typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v)?v:fallback
export function createModelLight(id:string):ModelLight{return {id,name:'Nova luz',type:'directional',enabled:true,color:'#ffffff',intensity:1,azimuth:-45,elevation:35,distance:3,angle:45,softness:.5,targetX:0,targetY:0,targetZ:0}}
function normalizeLights(value:unknown):ModelLight[]{
 if(!Array.isArray(value))return []
 const ids=new Set<string>()
 return value.slice(0,MAX_MODEL_LIGHTS).flatMap((item:unknown,index)=>{
  if(!item||typeof item!=='object')return []
  const v=item as Partial<ModelLight>
  let id=typeof v.id==='string'&&v.id.trim()?v.id.slice(0,80):'light-'+index
  while(ids.has(id))id+='-copy'
  ids.add(id);const d=createModelLight(id)
  return [{id,name:typeof v.name==='string'&&v.name.trim()?v.name.slice(0,50):d.name,type:v.type==='point'||v.type==='spot'?v.type:'directional' as const,
   enabled:v.enabled!==false,color:color(v.color,d.color),intensity:numeric(v.intensity,d.intensity,0,10),azimuth:numeric(v.azimuth,d.azimuth,-180,180),
   elevation:numeric(v.elevation,d.elevation,-90,90),distance:numeric(v.distance,d.distance,.25,12),angle:numeric(v.angle,d.angle,5,89),softness:numeric(v.softness,d.softness,0,1),
   targetX:numeric(v.targetX,0,-3,3),targetY:numeric(v.targetY,0,-3,3),targetZ:numeric(v.targetZ,0,-3,3)}]
 })
}
export function normalizeModelPresentation(value?:Partial<ModelPresentation>|null):ModelPresentation{
 const d=DEFAULT_MODEL_PRESENTATION,v=value??{}
 return {lighting:v.lighting==='soft'||v.lighting==='contrast'?v.lighting:'studio',
 exposure:numeric(v.exposure,d.exposure,.2,3),environment:numeric(v.environment,d.environment,0,2),keyLight:numeric(v.keyLight,d.keyLight,0,5),
 lightAngle:numeric(v.lightAngle,d.lightAngle,-180,180),lightColor:color(v.lightColor,d.lightColor),background:color(v.background,d.background),
 autoRotate:typeof v.autoRotate==='boolean'?v.autoRotate:d.autoRotate,rotationSpeed:numeric(v.rotationSpeed,d.rotationSpeed,.2,4),
 azimuth:numeric(v.azimuth,d.azimuth,-180,180),elevation:numeric(v.elevation,d.elevation,-89,89),zoom:numeric(v.zoom,d.zoom,.2,8),
 fov:numeric(v.fov,d.fov,15,80),targetX:numeric(v.targetX,0,-5,5),targetY:numeric(v.targetY,0,-5,5),targetZ:numeric(v.targetZ,0,-5,5),
 usePresetRig:v.usePresetRig!==false,useEmbeddedLights:v.useEmbeddedLights!==false,relightUnlit:v.relightUnlit===true,lights:normalizeLights(v.lights)}
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

/** Editor-only state: never serialized with ModelPresentation. */
export type LightEditState={selected:string|null;helpers:boolean;target:boolean;solo:boolean}
export type LightEditPatch=Partial<Pick<ModelLight,'azimuth'|'elevation'|'distance'|'targetX'|'targetY'|'targetZ'>>
export type LightEditCallbacks={onSelect:(id:string)=>void;onChange:(id:string,patch:LightEditPatch)=>void}
export function presetDirectionalLights(p:ModelPresentation):ModelLight[]{
 const degrees=(v:number)=>v*180/Math.PI
 const make=(id:string,name:string,x:number,y:number,z:number,intensity:number,color:string):ModelLight=>({...createModelLight(id),name,intensity,color,distance:Math.hypot(x,y,z),azimuth:degrees(Math.atan2(x,z)),elevation:degrees(Math.atan2(y,Math.hypot(x,z)))})
 const angle=p.lightAngle*Math.PI/180
 return [make('preset-key','Key Light',3*Math.sin(angle),3,3*Math.cos(angle),p.keyLight,p.lightColor),make('preset-fill','Fill Light',-3,1,3,p.lighting==='soft'?1.4:p.lighting==='contrast'?.12:.65,'#ffffff'),make('preset-rim','Rim Light',0,2,-4,p.lighting==='soft'?.3:p.lighting==='contrast'?2:1,'#ffffff')]
}
