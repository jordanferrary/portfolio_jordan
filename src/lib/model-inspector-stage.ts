import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js'
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {DEFAULT_INSPECTOR_OPTIONS,isWireOverlay,type InspectorOptions,type ModelMode,type ModelPresentation} from './model-presentation'
import {createChecker,createMatcap,debugMaterial} from './model-debug-materials'
import {attachSolidWireShader,createWireUniforms,makeWireGeometry} from './model-solid-wireframe'
export type ModelStats={triangles:number;vertices:number;meshes:number;available:ModelMode[];animations:string[]}
export type ModelStage={setPresentation:(value:ModelPresentation)=>void;setMode:(mode:ModelMode)=>void;setRotation:(value:boolean)=>void;setOptions:(options:InspectorOptions)=>void;setAnimation:(index:number,playing:boolean)=>void;resetCamera:()=>void;dispose:()=>void}
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
 const originalGeometry=new Map<THREE.Mesh,THREE.BufferGeometry>()
 const wireGeometries=new Map<THREE.BufferGeometry,THREE.BufferGeometry>()
 let options={...DEFAULT_INSPECTOR_OPTIONS},checker:THREE.Texture|undefined,matcap:THREE.Texture|undefined,mixer:THREE.AnimationMixer|undefined,clips:THREE.AnimationClip[]=[],action:THREE.AnimationAction|undefined,animationIndex=-1,animationPlaying=false
 const skeletonHelpers:THREE.SkeletonHelper[]=[]
 const wireUniforms=createWireUniforms(options.wireColor,options.wireOpacity)
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
  const next=debugMaterial(mode,mat,{checker:()=>checker??(checker=createChecker()),matcap:()=>matcap??(matcap=createMatcap())})
  if(isWireOverlay(mode))attachSolidWireShader(next,wireUniforms)
  cache.set(mat,next);return next
 }
 function wireGeometry(source:THREE.BufferGeometry){
  let geometry=wireGeometries.get(source)
  if(!geometry){geometry=makeWireGeometry(source);wireGeometries.set(source,geometry)}
  return geometry
 }
 function releaseWireGeometries(){
  for(const [mesh,geometry] of originalGeometry)mesh.geometry=geometry
  for(const geometry of wireGeometries.values())geometry.dispose()
  wireGeometries.clear()
 }
 function applyOptions(){
  wireUniforms.color.value.set(options.wireColor).convertLinearToSRGB();wireUniforms.opacity.value=options.wireOpacity
  for(const [mesh,source] of original){
   const list=Array.isArray(mesh.material)?mesh.material:[mesh.material],base=Array.isArray(source)?source:[source]
   list.forEach((mat,i)=>{const next=options.singleSided?THREE.FrontSide:mode==='wireframe'?THREE.DoubleSide:base[i]?.side??THREE.FrontSide;if(mat.side!==next){mat.side=next;mat.needsUpdate=true}if(mode==='wireframe'&&mat instanceof THREE.MeshBasicMaterial){mat.color.set(options.wireColor);mat.opacity=options.wireOpacity;mat.transparent=options.wireOpacity<1}})
  }
 }
 function setMode(next:ModelMode){
  mode=next
  const solidWire=isWireOverlay(mode)
  if(!solidWire&&wireGeometries.size)releaseWireGeometries()
  for(const [mesh,mat] of original){
   const geometry=originalGeometry.get(mesh)
   if(solidWire&&geometry)mesh.geometry=wireGeometry(geometry)
   mesh.material=Array.isArray(mat)?mat.map(variant):variant(mat)
  }
  for(const helper of skeletonHelpers)helper.visible=mode==='bones'
  if(mode==='bones'&&model&&!skeletonHelpers.length){
   model.traverse(obj=>{if(obj instanceof THREE.SkinnedMesh){const helper=new THREE.SkeletonHelper(obj);helper.renderOrder=20;const mat=helper.material as THREE.LineBasicMaterial;mat.depthTest=false;mat.depthWrite=false;scene.add(helper);skeletonHelpers.push(helper)}})
  }
  applyOptions()
 }
 function setAnimation(index:number,playing:boolean){
  if(!mixer||index<0||index>=clips.length){action?.stop();action=undefined;animationIndex=-1;animationPlaying=false;return}
  if(index!==animationIndex){action?.stop();action=mixer.clipAction(clips[index]);action.reset().play();animationIndex=index}
  animationPlaying=playing;if(action)action.paused=!playing
 }
 const draco=new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/')
 const ktx2=new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/basis/').detectSupport(renderer)
 const loader=new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder)
 void loader.loadAsync(source).then(gltf=>{
  if(disposed){disposeObject(gltf.scene);return}
  model=gltf.scene;scene.add(model);model.updateMatrixWorld(true)
  const bounds=new THREE.Box3().setFromObject(model)
  if(!bounds.isEmpty()){bounds.getCenter(vertexCenter);bounds.getSize(size);radius=Math.max(size.length()/2,.0001)}
  clips=gltf.animations;mixer=new THREE.AnimationMixer(model)
  const available=new Set<ModelMode>(['material','neutral','clay','wireframe','shaded-wire','clay-wire','flat','flat-wire','normals','unlit','matcap','metalness','roughness','opacity','emission','specular'])
  const stats:ModelStats={triangles:0,vertices:0,meshes:0,available:[],animations:clips.map((clip,i)=>clip.name||'Animation '+(i+1))}
  model.traverse(obj=>{if(obj instanceof THREE.Mesh){original.set(obj,obj.material);originalGeometry.set(obj,obj.geometry);stats.meshes++
   if(obj.geometry.hasAttribute('uv'))available.add('uv')
   if(obj instanceof THREE.SkinnedMesh){available.add('bones');if(obj.geometry.hasAttribute('skinWeight'))available.add('weights')}
   for(const material of Array.isArray(obj.material)?obj.material:[obj.material]){const pbr=material as THREE.MeshStandardMaterial;if(pbr.normalMap){available.add('normal-map');available.add('matcap-surface')}if(pbr.aoMap)available.add('ao')}
   const position=obj.geometry.getAttribute('position');const count=obj instanceof THREE.InstancedMesh?obj.count:1
   stats.vertices+=(position?.count??0)*count;stats.triangles+=Math.floor((obj.geometry.index?.count??position?.count??0)/3)*count
  }})
  stats.available=[...available];resetCamera();setMode(mode);callbacks.onLoad(stats)
 }).catch(error=>{if(!disposed)callbacks.onError(error)})
 applyLighting()
 let last=0
 renderer.setAnimationLoop(time=>{
  if(disposed)return
  const delta=last?Math.min((time-last)/1000,.05):1/60;last=time
  if(!visible||document.hidden||!model)return
  controls.autoRotate=rotate&&!hovered&&!interacting&&time>idleUntil&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if(animationPlaying)mixer?.update(delta)
  controls.update(delta);renderer.render(scene,camera)
 })
 return {
  setPresentation(next){const reframe=next.azimuth!==presentation.azimuth||next.elevation!==presentation.elevation||next.zoom!==presentation.zoom;presentation=next;applyLighting();if(reframe)resetCamera()},
  setMode,setRotation(value){rotate=value},setOptions(value){options=value;applyOptions()},setAnimation,resetCamera,
  dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();controls.dispose();canvas.removeEventListener('pointerenter',enter);canvas.removeEventListener('pointerleave',exit)
   mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model)
   for(const helper of skeletonHelpers){scene.remove(helper);helper.dispose()}
   releaseWireGeometries();checker?.dispose();matcap?.dispose()
   if(model){for(const [mesh,material] of original)mesh.material=material;disposeObject(model);scene.remove(model)}
   for(const cache of variants.values())for(const material of cache.values())material.dispose()
   environment.dispose();draco.dispose();ktx2.dispose();renderer.dispose();canvas.remove()
  }
 }
}
