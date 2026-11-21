import * as THREE from 'three'
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js'
import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import type {LightEditState,LightEditCallbacks,LightEditPatch} from './model-presentation'
export type EditableLight=THREE.DirectionalLight|THREE.PointLight|THREE.SpotLight
type Marker={group:THREE.Group;dot:THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>;lines:THREE.LineSegments<THREE.BufferGeometry,THREE.LineBasicMaterial>;shapeKey:string}
const toDeg=THREE.MathUtils.radToDeg
/** All helper objects are isolated from the asset and created only in Studio. */
export function createLightGizmos(scene:THREE.Scene,camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,orbit:OrbitControls,lights:Map<string,EditableLight>,center:THREE.Vector3,getRadius:()=>number,callbacks:LightEditCallbacks){
 const root=new THREE.Group();root.name='Studio light guides';scene.add(root)
 const transform=new TransformControls(camera,canvas);transform.setMode('translate');transform.setSpace('world');transform.setSize(.7)
 const transformHelper=transform.getHelper();root.add(transformHelper)
 const sphere=new THREE.SphereGeometry(1,12,8)
 const markers=new Map<string,Marker>()
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),offset=new THREE.Vector3()
 let state:LightEditState={selected:null,helpers:true,target:false,solo:false}
 let dragging=false,dragId:string|null=null,dragTarget=false,downX=0,downY=0,downOnGizmo=false
 function removeMarker(marker:Marker){marker.group.removeFromParent();marker.dot.material.dispose();marker.lines.material.dispose();marker.lines.geometry.dispose()}
 function sync(){
  root.visible=state.helpers
  transform.enabled=state.helpers
  for(const [id,marker] of markers)if(!lights.has(id)){removeMarker(marker);markers.delete(id)}
  for(const [id,light] of lights){
   let marker=markers.get(id)
   if(!marker){
    const group=new THREE.Group(),dot=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({depthTest:false,depthWrite:false,toneMapped:false}))
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24*2*3),3));geometry.setDrawRange(0,0)
    const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({depthTest:false,depthWrite:false,toneMapped:false,transparent:true}))
    dot.renderOrder=110;dot.userData.lightId=id;lines.renderOrder=109;lines.frustumCulled=false;group.add(dot,lines);root.add(group);marker={group,dot,lines,shapeKey:''};markers.set(id,marker)
   }
   marker.group.position.copy(light.position)
   const selected=id===state.selected
   const viewDistance=camera.position.distanceTo(light.position)
   marker.dot.scale.setScalar(Math.max(getRadius()*.035,viewDistance*.014)*(selected?1.35:1))
   marker.dot.material.color.copy(light.color);marker.dot.material.color.lerp(new THREE.Color(0xffffff),selected?.32:.12)
   marker.lines.material.color.copy(marker.dot.material.color);marker.lines.material.opacity=selected?.95:light.visible?.55:.2
   const shapeKey=[light.type,light.position.x,light.position.y,light.position.z,getRadius(),...(light instanceof THREE.PointLight?[]:[light.target.position.x,light.target.position.y,light.target.position.z]),...(light instanceof THREE.SpotLight?[light.angle]:[])].join('|')
   if(marker.shapeKey===shapeKey)continue
   marker.shapeKey=shapeKey
   const data=marker.lines.geometry.getAttribute('position') as THREE.BufferAttribute
   let n=0
   function line(a:THREE.Vector3,b:THREE.Vector3){data.setXYZ(n++,a.x,a.y,a.z);data.setXYZ(n++,b.x,b.y,b.z)}
   const zero=new THREE.Vector3()
   if(light instanceof THREE.PointLight){
    const r=getRadius()*.22
    for(const axis of [new THREE.Vector3(r,0,0),new THREE.Vector3(0,r,0),new THREE.Vector3(0,0,r)])line(axis,axis.clone().negate())
   }else{
    const target=light.target.position.clone().sub(light.position)
    line(zero,target)
    if(light instanceof THREE.SpotLight&&target.lengthSq()>1e-10){
     const length=Math.min(target.length(),getRadius()*2.5)
     const forward=target.clone().normalize(),end=forward.clone().multiplyScalar(length)
     const right=new THREE.Vector3().crossVectors(forward,Math.abs(forward.y)>.95?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize()
     const up=new THREE.Vector3().crossVectors(forward,right).normalize(),width=length*Math.tan(light.angle)
     const ring=Array.from({length:12},(_,i)=>end.clone().addScaledVector(right,Math.cos(i*Math.PI/6)*width).addScaledVector(up,Math.sin(i*Math.PI/6)*width))
     ring.forEach((vertex,i)=>{line(vertex,ring[(i+1)%12]);if(i%3===0)line(zero,vertex)})
    }
   }
   data.needsUpdate=true;marker.lines.geometry.setDrawRange(0,n)
  }
  if(!dragging){
   const light=state.selected?lights.get(state.selected):undefined
   const attachment=state.helpers&&light?(state.target&&!(light instanceof THREE.PointLight)?light.target:light):null
   if(attachment){if(transform.object!==attachment)transform.attach(attachment)}else if(transform.object)transform.detach()
  }
 }
 function finish(){
  const id=dragId,light=id?lights.get(id):undefined
  if(light&&id){
   const r=Math.max(.0001,getRadius())
   let patch:LightEditPatch
   if(dragTarget&&!(light instanceof THREE.PointLight)){
    offset.copy(light.target.position).sub(center).divideScalar(r);patch={targetX:offset.x,targetY:offset.y,targetZ:offset.z}
   }else{
    offset.copy(light.position).sub(center).divideScalar(r)
    const distance=offset.length()
    patch={distance:Math.max(.25,distance),azimuth:toDeg(Math.atan2(offset.x,offset.z)),elevation:toDeg(Math.atan2(offset.y,Math.hypot(offset.x,offset.z)))}
   }
   callbacks.onChange(id,patch)
  }
  dragId=null
 }
 transform.addEventListener('dragging-changed',event=>{
  dragging=Boolean(event.value);orbit.enabled=!dragging
  if(dragging){dragId=state.selected;dragTarget=state.target;downOnGizmo=true}else finish()
 })
 const pointerDown=(event:PointerEvent)=>{downX=event.clientX;downY=event.clientY;downOnGizmo=dragging||!!transform.axis}
 const pointerUp=(event:PointerEvent)=>{
  if(!state.helpers||event.button!==0||downOnGizmo||dragging||Math.hypot(event.clientX-downX,event.clientY-downY)>5)return
  const rect=canvas.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
  ray.setFromCamera(mouse,camera)
  const hit=ray.intersectObjects([...markers.values()].map(marker=>marker.dot),false)[0]
  const id=hit?.object.userData.lightId;if(typeof id==='string')callbacks.onSelect(id)
 }
 canvas.addEventListener('pointerdown',pointerDown,true);canvas.addEventListener('pointerup',pointerUp)
 return {setState(next:LightEditState){state=next;sync()},sync,isDragging:(id:string)=>dragging&&dragId===id,
  dispose(){canvas.removeEventListener('pointerdown',pointerDown,true);canvas.removeEventListener('pointerup',pointerUp);transform.detach();transform.dispose();orbit.enabled=true;root.removeFromParent();for(const marker of markers.values())removeMarker(marker);markers.clear();sphere.dispose()}}
}
