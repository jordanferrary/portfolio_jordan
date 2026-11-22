import * as THREE from 'three'
import type {ArtShader} from './model-presentation'
import {createBloomPass} from './model-bloom-pass'
/** Shared camera compositor. Technical views bypass it; bloom has its own lazy buffers. */
export function createChromaticPass(renderer:THREE.WebGLRenderer){
 const size=new THREE.Vector2()
 const target=new THREE.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter})
 let bloomPass:ReturnType<typeof createBloomPass>|null=null
 const uniforms={bloomMap:{value:null as THREE.Texture|null},bloomStrength:{value:0},sceneMap:{value:target.texture},offsetUv:{value:new THREE.Vector2()},resolution:{value:new THREE.Vector2(1,1)},crt:{value:0},vhs:{value:0},pixelSize:{value:0},time:{value:0}}
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,toneMapped:true,transparent:false,
 vertexShader:'varying vec2 jfUv; void main(){ jfUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
 fragmentShader:[
 'uniform sampler2D sceneMap; uniform sampler2D bloomMap; uniform float bloomStrength; uniform vec2 offsetUv; uniform vec2 resolution; uniform float crt; uniform float vhs; uniform float pixelSize; uniform float time; varying vec2 jfUv;',
 'void main(){',
 ' vec2 uv=jfUv;',
 ' vec2 centered=uv-0.5; uv+=centered*dot(centered,centered)*crt*0.12;',
 ' uv.x+=sin(uv.y*48.0+time*1.3)*vhs*0.0025;',
 ' if(pixelSize>0.0){vec2 grid=resolution/max(pixelSize,1.0);uv=(floor(uv*grid)+0.5)/grid;}',
 ' vec2 separation=offsetUv+vec2(vhs*1.8/resolution.x,0.0);',
 ' vec4 middle=texture2D(sceneMap,clamp(uv,0.0,1.0));',
 ' vec4 red=texture2D(sceneMap,clamp(uv+separation,0.0,1.0));',
 ' vec4 blue=texture2D(sceneMap,clamp(uv-separation,0.0,1.0));',
 ' float alpha=max(middle.a,max(red.a,blue.a));',
 ' vec3 rgb=vec3(red.r,middle.g,blue.b);',
 ' if(bloomStrength>0.0){vec3 glow=max(texture2D(bloomMap,clamp(uv,0.0,1.0)).rgb,vec3(0.0))*bloomStrength;rgb+=glow;alpha=max(alpha,clamp(max(max(glow.r,glow.g),glow.b)*0.65,0.0,1.0));}',
 ' float scan=0.86+0.14*cos(uv.y*resolution.y*2.0944); rgb*=mix(1.0,scan,crt);',
 ' float grain=fract(sin(dot(floor(uv*resolution)+floor(time*5.0),vec2(127.1,311.7)))*43758.5453);',
 ' rgb+=vec3((grain-0.5)*0.05*vhs)*alpha;',
 ' if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0)))){rgb=vec3(0.0);alpha=0.0;}',
 ' gl_FragColor=vec4(rgb/max(alpha,0.00001),alpha);',
 ' #include <tonemapping_fragment>',
 ' #include <colorspace_fragment>',
 ' gl_FragColor.rgb *= gl_FragColor.a;',
 '}'
 ].join('\n')})
 const geometry=new THREE.PlaneGeometry(2,2),quad=new THREE.Mesh(geometry,material),scene=new THREE.Scene(),camera=new THREE.Camera()
 quad.frustumCulled=false;scene.add(quad)
 return {render(source:THREE.Scene,view:THREE.Camera,style:ArtShader,time:number){
  renderer.getDrawingBufferSize(size)
  const w=Math.max(1,size.x),h=Math.max(1,size.y)
  if(target.width!==w||target.height!==h)target.setSize(w,h)
  const rad=THREE.MathUtils.degToRad(style.chromaticAngle),pixelRatio=renderer.getPixelRatio()
  uniforms.resolution.value.set(w,h);uniforms.crt.value=style.crt;uniforms.vhs.value=style.vhs;uniforms.pixelSize.value=style.pixelSize*pixelRatio;uniforms.time.value=time
  uniforms.offsetUv.value.set(Math.cos(rad)*style.chromaticAberration*pixelRatio/w,Math.sin(rad)*style.chromaticAberration*pixelRatio/h)
  const previous=renderer.getRenderTarget()
  try{renderer.setRenderTarget(target);renderer.render(source,view);
   uniforms.bloomStrength.value=style.bloom
   if(style.bloom>0){bloomPass??=createBloomPass(renderer,target.texture.type);uniforms.bloomMap.value=bloomPass.render(target,style.bloomThreshold,style.bloomRadius)}else{bloomPass?.dispose();bloomPass=null;uniforms.bloomMap.value=null}
   renderer.setRenderTarget(previous);renderer.render(scene,camera)}
  finally{renderer.setRenderTarget(previous)}
 },dispose(){bloomPass?.dispose();target.dispose();geometry.dispose();material.dispose()}}
}
