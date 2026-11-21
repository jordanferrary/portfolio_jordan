import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js'
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import type {ModelMode,ModelPresentation} from './model-presentation'
export type ModelStats={triangles:number;vertices:number;meshes:number}
export type ModelStage={setPresentation:(value:ModelPresentation)=>void;setMode:(mode:ModelMode)=>void;setRotation:(value:boolean)=>void;resetCamera:()=>void;dispose:()=>void}
const rad=THREE.MathUtils.degToRad
function disposeObject(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>(),skeletons=new Set<THREE.Skeleton>()
 root.traverse(obj=>{
  if(!(obj instanceof THREE.Mesh))return
  geometries.add(obj.geometry)
  for(const mat of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(mat)
  if(obj instanceof THREE.SkinnedMesh)skeletons.add(obj.skeleton)
 })
 for(const mat of materials){for(const v of Object.values(mat))if(v instanceof THREE.Texture)textures.add(v);mat.dispose()}
 const bitmaps=new Set<ImageBitmap>()
 for(const t of textures){const image=t.source.data;if(typeof ImageBitmap!=='undefined'&&image instanceof ImageBitmap)bitmaps.add(image);t.dispose()}
 for(const image of bitmaps)image.close()
 for(const g of geometries)g.dispose()
 for(const s of skeletons)s.dispose()
}
export function createModelStage(host:HTMLElement,source:string,initial:ModelPresentation,callbacks:{onLoad:(stats:ModelStats)=>void;onError:(error:unknown)=>void}):ModelStage{
 let disposed=false,model:THREE.Object3D|undefined,presentation=initial,mode:ModelMode='material',rotate=initial.autoRotate,hovered=false,interacting=false,visible=true,idleUntil=0
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5))
 renderer.outputColorSpace=THREE.SRGBColorSpace
 renderer.toneMapping=THREE.ACESFilmicToneMapping
 renderer.setClearColor(0x000000,0)
 const canvas=renderer.domElement
 canvas.className='project-model-canvas';canvas.tabIndex=0;canvas.setAttribute('aria-label','Interactive 3D viewport')
 host.appendChild(canvas)
 const scene=new THREE.Scene()
 const camera=new THREE.PerspectiveCamera(38,1,.01,1000)
 const controls=new OrbitControls(camera,canvas)
 controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=true;controls.enableZoom=true
 controls.listenToKeyEvents(canvas)
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer)
 const environment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=environment.texture
 const key=new THREE.DirectionalLight(0xffffff,2),fill=new THREE.DirectionalLight(0xffffff,.5),rim=new THREE.DirectionalLight(0xffffff,1),ambient=new THREE.HemisphereLight(0xffffff,0x454454,.35)
 fill.position.set(-3,1,3);rim.position.set(0,2,-4);scene.add(key,fill,rim,ambient)
 const original=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>()
 const variants=new Map<ModelMode,Map<THREE.Material,THREE.Material>>()
 const vertexCenter=new THREE.Vector3(),size=new THREE.Vector3()
 let radius=1,fitDistance=3
 const resize=()=>{
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight)
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)
 }
 const observer=new ResizeObserver(resize);observer.observe(host);resize()
 const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true},{rootMargin:'100px'})
 intersection.observe(host)
 const enter=(event:PointerEvent)=>{if(event.pointerType==='mouse'||event.pointerType==='pen')hovered=true}
 const exit=()=>{hovered=false}
 const start=()=>{interacting=true}
 const end=()=>{interacting=false;idleUntil=performance.now()+900}
 canvas.addEventListener('pointerenter',enter);canvas.addEventListener('pointerleave',exit)
 controls.addEventListener('start',start);controls.addEventListener('end',end)
 const resetCamera=()=>{
  if(!model)return
  const vertical=rad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect)
  fitDistance=radius/Math.sin(Math.min(vertical,horizontal))*1.12
  const phi=rad(90-presentation.elevation),theta=rad(presentation.azimuth)
  controls.target.copy(vertexCenter)
  camera.position.copy(vertexCenter).add(new THREE.Vector3().setFromSphericalCoords(fitDistance/presentation.zoom,phi,theta))
  controls.minDistance=radius*.12;controls.maxDistance=fitDistance*8
  camera.near=Math.max(radius*.001,.00001);camera.far=Math.max(radius*100,100);camera.updateProjectionMatrix()
  controls.update()
 }
 function applyLighting(){
  renderer.toneMappingExposure=presentation.exposure
  scene.environmentIntensity=presentation.environment
  key.intensity=presentation.keyLight
  key.color.set(presentation.lightColor)
  const angle=rad(presentation.lightAngle)
  key.position.set(Math.sin(angle)*3,3,Math.cos(angle)*3)
  fill.intensity=presentation.lighting==='soft'?1.4:presentation.lighting==='contrast'?.12:.65
  rim.intensity=presentation.lighting==='soft'?.3:presentation.lighting==='contrast'?2:1
  ambient.intensity=presentation.lighting==='contrast'?.1:.35
  controls.autoRotateSpeed=presentation.rotationSpeed
 }
 function variant(mat:THREE.Material):THREE.Material{
  let cache=variants.get(mode);if(!cache){cache=new Map();variants.set(mode,cache)}
  const previous=cache.get(mat);if(previous)return previous
  const src=mat as THREE.MeshStandardMaterial
  let next:THREE.Material
  if(mode==='wireframe')next=new THREE.MeshBasicMaterial({color:0xcfb9ff,wireframe:true,side:THREE.DoubleSide,toneMapped:false})
  else if(mode==='normals')next=new THREE.MeshNormalMaterial({side:mat.side})
  else if(mode==='unlit')next=new THREE.MeshBasicMaterial({color:src.color?.clone()??new THREE.Color(0xffffff),map:src.map??null,vertexColors:mat.vertexColors,side:mat.side,transparent:mat.transparent,opacity:mat.opacity,alphaTest:mat.alphaTest,toneMapped:false})
  else next=new THREE.MeshStandardMaterial({color:0xb8b8bf,roughness:.8,metalness:0,side:mat.side,flatShading:mode==='flat'})
  cache.set(mat,next);return next
 }
 function setMode(next:ModelMode){
  mode=next
  for(const [mesh,mat] of original)mesh.material=mode==='material'?mat:Array.isArray(mat)?mat.map(variant):variant(mat)
 }
 const draco=new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/')
 const ktx2=new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/basis/').detectSupport(renderer)
 const loader=new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder)
 void loader.loadAsync(source).then(gltf=>{
  if(disposed){disposeObject(gltf.scene);return}
  model=gltf.scene;scene.add(model);model.updateMatrixWorld(true)
  const bounds=new THREE.Box3().setFromObject(model)
  if(!bounds.isEmpty()){bounds.getCenter(vertexCenter);bounds.getSize(size);radius=Math.max(size.length()/2,.0001)}
  const stats:ModelStats={triangles:0,vertices:0,meshes:0}
  model.traverse(obj=>{if(obj instanceof THREE.Mesh){original.set(obj,obj.material);stats.meshes++
   const position=obj.geometry.getAttribute('position');const count=obj instanceof THREE.InstancedMesh?obj.count:1
   stats.vertices+=(position?.count??0)*count;stats.triangles+=Math.floor((obj.geometry.index?.count??position?.count??0)/3)*count
  }})
  resetCamera();setMode(mode);callbacks.onLoad(stats)
 }).catch(error=>{if(!disposed)callbacks.onError(error)})
 applyLighting()
 let last=0
 renderer.setAnimationLoop(time=>{
  if(disposed)return
  const delta=last?Math.min((time-last)/1000,.05):1/60;last=time
  if(!visible||document.hidden||!model)return
  controls.autoRotate=rotate&&!hovered&&!interacting&&time>idleUntil&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches
  controls.update(delta);renderer.render(scene,camera)
 })
 return {
  setPresentation(next){const reframe=next.azimuth!==presentation.azimuth||next.elevation!==presentation.elevation||next.zoom!==presentation.zoom;presentation=next;applyLighting();if(reframe)resetCamera()},
  setMode,setRotation(value){rotate=value},resetCamera,
  dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();controls.dispose();canvas.removeEventListener('pointerenter',enter);canvas.removeEventListener('pointerleave',exit)
   if(model){for(const [mesh,material] of original)mesh.material=material;disposeObject(model);scene.remove(model)}
   for(const cache of variants.values())for(const material of cache.values())material.dispose()
   environment.dispose();draco.dispose();ktx2.dispose();renderer.dispose();canvas.remove()
  }
 }
}
