import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js'
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {DEFAULT_INSPECTOR_OPTIONS,isWireOverlay,type InspectorOptions,type ModelMode,type ModelPresentation,type MaterialInfo,type MaterialEditState,type ModelCamera,type LightEditState,type LightEditCallbacks} from './model-presentation'
import {createChecker,createMatcap,debugMaterial,isPresentationMaterial,createPresentationMaterial,applyPresentationEmission} from './model-debug-materials'
import {attachSolidWireShader,createWireUniforms,makeWireGeometry} from './model-solid-wireframe'
import {createLightGizmos} from './model-light-gizmos'
import {attachArtShader,createArtUniforms,updateArtUniforms,updateMaterialLayers,type ArtUniforms} from './model-art-shaders'
import {createChromaticPass} from './model-chromatic-pass'
export type ModelStats={triangles:number;vertices:number;meshes:number;available:ModelMode[];animations:string[];unlitMaterials:number;materials:MaterialInfo[]}
export type ModelStage={setPresentation:(value:ModelPresentation)=>void;setMode:(mode:ModelMode)=>void;setRotation:(value:boolean)=>void;setOptions:(options:InspectorOptions)=>void;setAnimation:(index:number,playing:boolean)=>void;resetCamera:()=>void;captureCamera:()=>ModelCamera|null;setLightEditing:(state:LightEditState)=>void;frameLights:()=>void;setMaterialEditing:(state:MaterialEditState)=>void;dispose:()=>void}
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
export function createModelStage(host:HTMLElement,source:string,initial:ModelPresentation,callbacks:{onLoad:(stats:ModelStats)=>void;onError:(error:unknown)=>void},lightEditing?:LightEditCallbacks,onMaterialSelect?:(id:string)=>void):ModelStage{
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
 scene.add(key,fill,rim,ambient,key.target,fill.target,rim.target)
 type CustomLight=THREE.DirectionalLight|THREE.PointLight|THREE.SpotLight
 const customLights=new Map<string,CustomLight>()
 function removeCustomLight(light:CustomLight){
  scene.remove(light);if(light instanceof THREE.DirectionalLight||light instanceof THREE.SpotLight)scene.remove(light.target)
  light.dispose()
 }
 const original=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>()
 const variants=new Map<ModelMode,Map<THREE.Material,THREE.Material>>()
 const originalGeometry=new Map<THREE.Mesh,THREE.BufferGeometry>()
 const wireGeometries=new Map<THREE.BufferGeometry,THREE.BufferGeometry>()
 let options={...DEFAULT_INSPECTOR_OPTIONS},checker:THREE.Texture|undefined,matcap:THREE.Texture|undefined,mixer:THREE.AnimationMixer|undefined,clips:THREE.AnimationClip[]=[],action:THREE.AnimationAction|undefined,animationIndex=-1,animationPlaying=false
 const skeletonHelpers:THREE.SkeletonHelper[]=[]
 const wireUniforms=createWireUniforms(options.wireColor,options.wireOpacity)
 const materialIds=new Map<THREE.Material,string>()
 const materialInfo=new Map<string,MaterialInfo>()
 const artUniforms=new Map<THREE.Material,ArtUniforms>()
 let materialEdit:MaterialEditState={active:false,selected:null,isolate:false,highlight:false}
 const lookFor=(source:THREE.Material)=>presentation.materialLooks[materialIds.get(source)??'']
 function updateMaterialLook(source:THREE.Material,material:THREE.Material){
  const id=materialIds.get(source),look=lookFor(source),style=look?.surface??presentation.artShader
  const uniforms=artUniforms.get(source)
  if(uniforms){updateArtUniforms(uniforms,style);updateMaterialLayers(uniforms,look,materialEdit.active&&materialEdit.highlight&&materialEdit.selected===id)}
  const base=source as THREE.MeshStandardMaterial,lit=material as THREE.MeshStandardMaterial
  if(lit.color&&base.color){lit.color.copy(base.color);if(look)lit.color.multiply(new THREE.Color(look.baseTint))}
  material.opacity=source.opacity*(look?.opacity??1)
  const transparent=source.transparent||material.opacity<1
  const flat=style.preset==='flat'||Boolean(base.flatShading)
  if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true}
  material.depthWrite=source.depthWrite&&material.opacity>=1
  if(lit.isMeshStandardMaterial&&lit.flatShading!==flat){lit.flatShading=flat;lit.needsUpdate=true}
  applyPresentationEmission(material,source,presentation.emissionScale*(look?.emission??1))
  material.visible=source.visible&&(!materialEdit.active||!materialEdit.isolate||!materialEdit.selected||id===materialEdit.selected)
 }
 function updateMaterialLooks(){
  for(const [source,mat] of variants.get('material')??[])updateMaterialLook(source,mat)
 }
 const ray=new THREE.Raycaster(),pickPoint=new THREE.Vector2()
 let pickX=0,pickY=0
 const pickDown=(event:PointerEvent)=>{pickX=event.clientX;pickY=event.clientY}
 const pickUp=(event:PointerEvent)=>{
  if(!onMaterialSelect||!materialEdit.active||mode!=='material'||event.button!==0||Math.hypot(event.clientX-pickX,event.clientY-pickY)>5)return
  const rect=canvas.getBoundingClientRect();pickPoint.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
  ray.setFromCamera(pickPoint,camera)
  for(const hit of ray.intersectObjects([...original.keys()],false)){
   const mesh=hit.object as THREE.Mesh,source=original.get(mesh)
   if(!source)continue
   const index=hit.face?.materialIndex??0,visibleMaterial=Array.isArray(mesh.material)?mesh.material[index]:mesh.material
   const selected=Array.isArray(source)?source[index]:source
   const id=selected&&materialIds.get(selected)
   if(id&&visibleMaterial?.visible){onMaterialSelect(id);break}
  }
 }
 if(onMaterialSelect){canvas.addEventListener('pointerdown',pickDown);canvas.addEventListener('pointerup',pickUp)}
 let chromaticPass:ReturnType<typeof createChromaticPass>|null=null
 const vertexCenter=new THREE.Vector3(),size=new THREE.Vector3()
 let radius=1,fitDistance=3
 let editState:LightEditState={selected:null,helpers:false,target:false,solo:false}
 const embeddedLights=new Map<THREE.Light,boolean>()
 const gizmos=lightEditing?createLightGizmos(scene,camera,canvas,controls,customLights,vertexCenter,()=>radius,lightEditing):null
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
 const calculateFitDistance=()=>{
  const vertical=rad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect)
  return radius/Math.sin(Math.min(vertical,horizontal))*1.12
 }
 const captureCamera=():ModelCamera|null=>{
  if(!model)return null
  const offset=new THREE.Vector3().subVectors(controls.target,vertexCenter).divideScalar(radius)
  return {azimuth:THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()),elevation:90-THREE.MathUtils.radToDeg(controls.getPolarAngle()),zoom:calculateFitDistance()/Math.max(controls.getDistance(),.00001),fov:camera.fov,targetX:offset.x,targetY:offset.y,targetZ:offset.z}
 }
 const frameLights=()=>{
  if(!model||!gizmos)return
  const bounds=new THREE.Box3().setFromCenterAndSize(vertexCenter,new THREE.Vector3(radius*2,radius*2,radius*2))
  for(const light of customLights.values()){bounds.expandByPoint(light.position);if(light instanceof THREE.DirectionalLight||light instanceof THREE.SpotLight)bounds.expandByPoint(light.target.position)}
  const sphere=bounds.getBoundingSphere(new THREE.Sphere())
  const direction=new THREE.Vector3().subVectors(camera.position,controls.target).normalize()
  const vertical=rad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect)
  const distance=sphere.radius/Math.sin(Math.min(vertical,horizontal))*1.15
  controls.maxDistance=Math.max(controls.maxDistance,distance*2)
  controls.target.copy(sphere.center);camera.position.copy(sphere.center).addScaledVector(direction,distance)
  camera.far=Math.max(camera.far,distance*4);camera.updateProjectionMatrix();controls.update()
 }
 const resetCamera=()=>{
  if(!model)return
  camera.fov=presentation.fov
  fitDistance=calculateFitDistance()
  const phi=rad(90-presentation.elevation),theta=rad(presentation.azimuth)
  controls.target.copy(vertexCenter).addScaledVector(new THREE.Vector3(presentation.targetX,presentation.targetY,presentation.targetZ),radius)
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(fitDistance/presentation.zoom,phi,theta))
  controls.minDistance=radius*.12;controls.maxDistance=fitDistance*8
  camera.near=Math.max(radius*.001,.00001);camera.far=Math.max(radius*100,100);camera.updateProjectionMatrix()
  controls.update()
 }
 function applyLighting(){
  renderer.toneMappingExposure=presentation.exposure
  const solo=editState.solo&&presentation.lights.some(light=>light.id===editState.selected)
  scene.environmentIntensity=solo?0:presentation.environment
  key.visible=fill.visible=rim.visible=ambient.visible=presentation.usePresetRig&&!solo
  for(const [light,wasVisible] of embeddedLights)light.visible=wasVisible&&presentation.useEmbeddedLights&&!solo
  key.intensity=presentation.keyLight
  key.color.set(presentation.lightColor)
  const angle=rad(presentation.lightAngle)
  key.position.copy(vertexCenter).addScaledVector(new THREE.Vector3(Math.sin(angle)*3,3,Math.cos(angle)*3),radius)
  fill.position.copy(vertexCenter).addScaledVector(new THREE.Vector3(-3,1,3),radius);rim.position.copy(vertexCenter).addScaledVector(new THREE.Vector3(0,2,-4),radius)
  for(const light of [key,fill,rim])light.target.position.copy(vertexCenter)
  fill.intensity=presentation.lighting==='soft'?1.4:presentation.lighting==='contrast'?.12:.65
  rim.intensity=presentation.lighting==='soft'?.3:presentation.lighting==='contrast'?2:1
  ambient.intensity=presentation.lighting==='contrast'?.1:.35
  controls.autoRotateSpeed=presentation.rotationSpeed
  const ids=new Set(presentation.lights.map(light=>light.id))
  for(const [id,light] of customLights)if(!ids.has(id)){removeCustomLight(light);customLights.delete(id)}
  for(const settings of presentation.lights){
   let light=customLights.get(settings.id)
   const matches=light&&(settings.type==='directional'?light instanceof THREE.DirectionalLight:settings.type==='point'?light instanceof THREE.PointLight:light instanceof THREE.SpotLight)
   if(!matches){
    if(light)removeCustomLight(light)
    light=settings.type==='directional'?new THREE.DirectionalLight():settings.type==='point'?new THREE.PointLight():new THREE.SpotLight()
    customLights.set(settings.id,light);scene.add(light)
    if(light instanceof THREE.DirectionalLight||light instanceof THREE.SpotLight)scene.add(light.target)
   }
   if(!light)continue
   light.visible=settings.enabled&&(!solo||settings.id===editState.selected)
   light.color.set(settings.color)
   // Distances are expressed in bounding radii, so small and large assets behave alike.
   if(!gizmos?.isDragging(settings.id))light.position.copy(vertexCenter).add(new THREE.Vector3().setFromSphericalCoords(settings.distance*radius,rad(90-settings.elevation),rad(settings.azimuth)))
   light.intensity=settings.intensity*(light instanceof THREE.DirectionalLight?1:radius*radius)
   if(!gizmos?.isDragging(settings.id)&&(light instanceof THREE.DirectionalLight||light instanceof THREE.SpotLight))light.target.position.copy(vertexCenter).addScaledVector(new THREE.Vector3(settings.targetX,settings.targetY,settings.targetZ),radius)
   if(light instanceof THREE.SpotLight){light.angle=rad(settings.angle);light.penumbra=settings.softness}
  }
  gizmos?.sync()
 }
 function updateEmission(){for(const [variantMode,cache] of variants)if(isPresentationMaterial(variantMode))for(const [source,material] of cache)applyPresentationEmission(material,source,presentation.emissionScale)}
 function variant(mat:THREE.Material):THREE.Material{
  let cache=variants.get(mode);if(!cache){cache=new Map();variants.set(mode,cache)}
  const previous=cache.get(mat);if(previous)return previous
  const next=isPresentationMaterial(mode)?createPresentationMaterial(mode,mat,presentation):debugMaterial(mode,mat,{checker:()=>checker??(checker=createChecker()),matcap:()=>matcap??(matcap=createMatcap())})
  if(isPresentationMaterial(mode))applyPresentationEmission(next,mat,presentation.emissionScale)
  if(mode==='material'){
   const uniforms=createArtUniforms(lookFor(mat)?.surface??presentation.artShader);artUniforms.set(mat,uniforms)
   attachArtShader(next,uniforms);updateMaterialLook(mat,next)
  }
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
  const stats:ModelStats={triangles:0,vertices:0,meshes:0,available:[],animations:clips.map((clip,i)=>clip.name||'Animation '+(i+1)),unlitMaterials:0,materials:[]}
  model.traverse(obj=>{if(obj instanceof THREE.Light)embeddedLights.set(obj,obj.visible);if(obj instanceof THREE.Mesh){if(!obj.geometry.hasAttribute('normal')&&obj.geometry.hasAttribute('position'))obj.geometry.computeVertexNormals();original.set(obj,obj.material);originalGeometry.set(obj,obj.geometry);stats.meshes++
   if(obj.geometry.hasAttribute('uv'))available.add('uv')
   if(obj instanceof THREE.SkinnedMesh){available.add('bones');if(obj.geometry.hasAttribute('skinWeight'))available.add('weights')}
   for(const material of new Set(Array.isArray(obj.material)?obj.material:[obj.material])){if(!materialIds.has(material)){const association=gltf.parser.associations.get(material)?.materials;const id=typeof association==='number'?'mat-glb-'+association:'mat-local-'+materialIds.size;materialIds.set(material,id);if(!materialInfo.has(id))materialInfo.set(id,{id,name:material.name||'Material '+(materialInfo.size+1),meshes:0,color:'#ffffff'})}const info=materialInfo.get(materialIds.get(material)!)!;info.meshes++;const sourceColor=(material as THREE.MeshStandardMaterial).color;if(sourceColor)info.color='#'+sourceColor.getHexString();if(material instanceof THREE.MeshBasicMaterial)stats.unlitMaterials++;const pbr=material as THREE.MeshStandardMaterial;if(pbr.normalMap){available.add('normal-map');available.add('matcap-surface')}if(pbr.aoMap)available.add('ao')}
   const position=obj.geometry.getAttribute('position');const count=obj instanceof THREE.InstancedMesh?obj.count:1
   stats.vertices+=(position?.count??0)*count;stats.triangles+=Math.floor((obj.geometry.index?.count??position?.count??0)/3)*count
  }})
  stats.materials=[...materialInfo.values()];stats.available=[...available];applyLighting();resetCamera();setMode(mode);callbacks.onLoad(stats)
 }).catch(error=>{if(!disposed)callbacks.onError(error)})
 applyLighting()
 let last=0
 renderer.setAnimationLoop(time=>{
  if(disposed)return
  const delta=last?Math.min((time-last)/1000,.05):1/60;last=time
  if(!visible||document.hidden||!model)return
  controls.autoRotate=rotate&&!hovered&&!interacting&&time>idleUntil&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if(animationPlaying)mixer?.update(delta)
  const artTime=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:time/1000;for(const uniforms of artUniforms.values())uniforms.jfTime.value=artTime
  controls.update(delta);gizmos?.sync()
  if(mode==='material'&&(presentation.artShader.chromaticAberration>0||presentation.artShader.crt>0||presentation.artShader.vhs>0||presentation.artShader.pixelSize>0)&&!editState.helpers){chromaticPass??=createChromaticPass(renderer);chromaticPass.render(scene,camera,presentation.artShader,artTime)}else{if(chromaticPass){chromaticPass.dispose();chromaticPass=null}renderer.render(scene,camera)}
 })
 return {
  setPresentation(next){const reframe=next.azimuth!==presentation.azimuth||next.elevation!==presentation.elevation||next.zoom!==presentation.zoom||next.fov!==presentation.fov||next.targetX!==presentation.targetX||next.targetY!==presentation.targetY||next.targetZ!==presentation.targetZ;const relight=next.relightUnlit!==presentation.relightUnlit;const emissionChanged=next.emissionScale!==presentation.emissionScale;presentation=next;applyLighting();if(relight){for(const cache of variants.values())for(const material of cache.values())material.dispose();variants.clear();artUniforms.clear();setMode(mode)}else{if(emissionChanged)updateEmission();updateMaterialLooks()}if(reframe)resetCamera()},
  setMode,setRotation(value){rotate=value},setOptions(value){options=value;applyOptions()},setAnimation,resetCamera,captureCamera,frameLights,setMaterialEditing(state){materialEdit=state;updateMaterialLooks()},setLightEditing(state){editState=state;gizmos?.setState(state);applyLighting()},
  dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);canvas.removeEventListener('pointerdown',pickDown);canvas.removeEventListener('pointerup',pickUp);artUniforms.clear();observer.disconnect();intersection.disconnect();controls.dispose();canvas.removeEventListener('pointerenter',enter);canvas.removeEventListener('pointerleave',exit)
   mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model)
   for(const helper of skeletonHelpers){scene.remove(helper);helper.dispose()}
   releaseWireGeometries();checker?.dispose();matcap?.dispose()
   if(model){for(const [mesh,material] of original)mesh.material=material;disposeObject(model);scene.remove(model)}
   for(const cache of variants.values())for(const material of cache.values())material.dispose()
   gizmos?.dispose();for(const light of customLights.values())removeCustomLight(light);customLights.clear()
   chromaticPass?.dispose();environment.dispose();draco.dispose();ktx2.dispose();renderer.dispose();canvas.remove()
  }
 }
}
