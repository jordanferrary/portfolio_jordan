import * as THREE from 'three'
import type {ModelMode} from './model-presentation'
type PBR=THREE.MeshPhysicalMaterial
const basic=(src:THREE.Material,params:THREE.MeshBasicMaterialParameters={})=>new THREE.MeshBasicMaterial({side:src.side,toneMapped:false,...params})
export function createChecker():THREE.CanvasTexture{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512
 const ctx=canvas.getContext('2d')!
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  ctx.fillStyle=(x+y)%2?'#242e46':'#dae4f3';ctx.fillRect(x*64,y*64,64,64)
  ctx.fillStyle=(x+y)%2?'#f5f7fa':'#202b40';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(String.fromCharCode(65+x)+(8-y),x*64+32,y*64+36)
 }
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;tex.flipY=false;return tex
}
export function createMatcap():THREE.CanvasTexture{
 const c=document.createElement('canvas');c.width=c.height=256
 const ctx=c.getContext('2d')!
 const g=ctx.createRadialGradient(78,59,4,128,128,182)
 g.addColorStop(0,'#f7f8ff');g.addColorStop(.36,'#b8c2d2');g.addColorStop(.69,'#657185');g.addColorStop(1,'#232b3c');ctx.fillStyle=g;ctx.fillRect(0,0,256,256)
 const rim=ctx.createRadialGradient(128,128,101,128,128,142);rim.addColorStop(0,'rgba(180,200,255,0)');rim.addColorStop(1,'rgba(210,224,255,.55)');ctx.fillStyle=rim;ctx.fillRect(0,0,256,256)
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex
}
// Map is deliberately reused, including its original UV set / transform.
// Use the proper packed glTF channel (R=AO, G=roughness, B=metalness).
function channel(src:THREE.Material,map:THREE.Texture|null|undefined,component:'r'|'g'|'b'|'a',factor:number,missing=1){
 const mat=basic(src,{map:map??null,color:0xffffff})
 mat.onBeforeCompile=shader=>{
  shader.uniforms.debugFactor={value:factor};shader.uniforms.debugMissing={value:missing}
  shader.fragmentShader='uniform float debugFactor; uniform float debugMissing;\n'+shader.fragmentShader
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',[
   'float debugValue = debugMissing;',
   '#ifdef USE_MAP',
   'debugValue = texture2D(map, vMapUv).'+component+';',
   '#endif',
   'diffuseColor = vec4(vec3(clamp(debugValue * debugFactor, 0.0, 1.0)), 1.0);'
  ].join('\n'))
 }
 mat.customProgramCacheKey=()=> 'jf-channel-'+component
 return mat
}
function weightMaterial(src:THREE.Material){
 const mat=basic(src,{color:0xffffff})
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying float jfWeight;\n'+shader.vertexShader
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\njfWeight = 0.0;\n#ifdef USE_SKINNING\njfWeight=max(max(skinWeight.x,skinWeight.y),max(skinWeight.z,skinWeight.w));\n#endif')
  shader.fragmentShader='varying float jfWeight;\n'+shader.fragmentShader
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(vec3(0.04,0.12,0.85),vec3(1.0,0.06,0.01),smoothstep(0.25,1.0,jfWeight));')
 }
 mat.customProgramCacheKey=()=> 'jf-skin-weights'
 return mat
}
export function debugMaterial(mode:ModelMode,source:THREE.Material,textures:{checker:()=>THREE.Texture;matcap:()=>THREE.Texture}):THREE.Material{
 const src=source as PBR
 const color=src.color?.clone()??new THREE.Color(0xffffff)
 if(mode==='material'||mode==='neutral'||mode==='bones'||mode==='shaded-wire'){
  const clone=source.clone();if(mode==='neutral')clone.toneMapped=false
  if(mode==='shaded-wire'){clone.transparent=false;clone.opacity=1;clone.depthWrite=true;if('transmission' in clone)(clone as PBR).transmission=0}
  return clone
 }
 if(mode==='wireframe')return basic(source,{wireframe:true,color:0xcfb9ff,side:THREE.DoubleSide})
 if(mode==='normals')return new THREE.MeshNormalMaterial({side:source.side})
 if(mode==='unlit')return basic(source,{color,map:src.map??null,vertexColors:source.vertexColors})
 if(mode==='metalness')return channel(source,src.metalnessMap,'b',src.metalness??0)
 if(mode==='roughness')return channel(source,src.roughnessMap,'g',src.roughness??1)
 if(mode==='normal-map')return basic(source,{map:src.normalMap??null,color:src.normalMap?0xffffff:0x8080ff})
 if(mode==='ao')return channel(source,src.aoMap,'r',1)
 if(mode==='opacity')return channel(source,src.map,'a',source.opacity)
 if(mode==='emission')return basic(source,{map:src.emissiveMap??null,color:(src.emissive?.clone()??new THREE.Color(0)).multiplyScalar(src.emissiveIntensity??1)})
 if(mode==='specular'){
  const metal=src.metalness??0
  const ior=src.ior??1.5,dielectric=Math.pow((ior-1)/(ior+1),2)*(src.specularIntensity??1)
  const f0=(src.specularColor?.clone()??new THREE.Color(1,1,1)).multiplyScalar(dielectric).lerp(color,metal)
  return basic(source,{color:f0})
 }
 if(mode==='matcap'||mode==='matcap-surface')return new THREE.MeshMatcapMaterial({side:source.side,color:0xffffff,matcap:textures.matcap(),...(mode==='matcap-surface'?{normalMap:src.normalMap??null,normalScale:src.normalScale?.clone(),bumpMap:src.bumpMap??null,bumpScale:src.bumpScale??1}:{})})
 if(mode==='uv')return basic(source,{map:textures.checker()})
 if(mode==='weights')return weightMaterial(source)
 return new THREE.MeshStandardMaterial({color:0xb8b8bf,roughness:.8,metalness:0,side:source.side,flatShading:mode==='flat'||mode==='flat-wire'})
}
