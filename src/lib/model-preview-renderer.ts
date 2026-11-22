
import * as THREE from 'three'
import {attachArtShader,createArtUniforms,updateArtUniforms} from './model-art-shaders'
import {createChromaticPass} from './model-chromatic-pass'
import {DEFAULT_ART_SHADER} from './model-presentation'
import {PREVIEW_STYLES} from './model-preview-library'
/** One temporary renderer for all static samples; no persistent animation loop. */
export async function renderPreviewLibrary(onImage:(id:string,src:string)=>void,signal:AbortSignal){
 let renderer:THREE.WebGLRenderer|undefined,geometry:THREE.BufferGeometry|undefined,flatGeometry:THREE.BufferGeometry|undefined,material:THREE.MeshStandardMaterial|undefined,accent:THREE.MeshStandardMaterial|undefined,ringGeometry:THREE.BufferGeometry|undefined,compositor:ReturnType<typeof createChromaticPass>|undefined
 try{
  if(signal.aborted)return
  renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true})
  renderer.setPixelRatio(1);renderer.setSize(144,112,false);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.setClearColor(0x171521,1)
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,144/112,.1,20)
  camera.position.set(2.6,1.8,3.7);camera.lookAt(0,0,0)
  scene.add(new THREE.HemisphereLight(0xdde8ff,0x31203f,.8))
  const key=new THREE.DirectionalLight(0xfff0df,2.4);key.position.set(-3,4,5);scene.add(key)
  const rim=new THREE.DirectionalLight(0x8eaeff,1.4);rim.position.set(2,1,-3);scene.add(rim)
  geometry=new THREE.SphereGeometry(1,40,24);flatGeometry=new THREE.IcosahedronGeometry(1,1)
  material=new THREE.MeshStandardMaterial({color:0xb8a4cf,metalness:.15,roughness:.38})
  const uniforms=createArtUniforms(DEFAULT_ART_SHADER);attachArtShader(material,uniforms)
  const mesh=new THREE.Mesh(geometry,material);scene.add(mesh)
  ringGeometry=new THREE.TorusGeometry(1.02,.055,12,64)
  accent=new THREE.MeshStandardMaterial({color:0x162d64,emissive:0x70aaff,emissiveIntensity:3,roughness:.3})
  const ring=new THREE.Mesh(ringGeometry,accent);ring.rotation.x=Math.PI/2.5;ring.visible=false;scene.add(ring)
  for(const {id,style,camera:fx} of PREVIEW_STYLES){
   if(signal.aborted)return
   updateArtUniforms(uniforms,style);uniforms.jfTime.value=1
   mesh.geometry=style.preset==='flat'?flatGeometry:geometry
   const flat=style.preset==='flat';if(material.flatShading!==flat){material.flatShading=flat;material.needsUpdate=true}
   ring.visible=fx
   if(fx){compositor??=createChromaticPass(renderer);compositor.render(scene,camera,style,1)}else renderer.render(scene,camera)
   onImage(id,renderer.domElement.toDataURL('image/png'))
   await new Promise<void>(resolve=>setTimeout(resolve,0))
  }
 }finally{compositor?.dispose();material?.dispose();accent?.dispose();geometry?.dispose();flatGeometry?.dispose();ringGeometry?.dispose();renderer?.dispose();renderer?.forceContextLoss()}
}
