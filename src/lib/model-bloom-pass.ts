import * as THREE from 'three'
const vertexShader='varying vec2 jfUv; void main(){jfUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}'
export function createBloomPass(renderer:THREE.WebGLRenderer,type:THREE.TextureDataType){
 const targetOptions={type,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}
 const a=new THREE.WebGLRenderTarget(1,1,targetOptions),b=new THREE.WebGLRenderTarget(1,1,targetOptions)
 const extract=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{inputMap:{value:null as THREE.Texture|null},threshold:{value:1},exposure:{value:1},texel:{value:new THREE.Vector2()}},vertexShader,fragmentShader:[
 'uniform sampler2D inputMap;uniform float threshold;uniform float exposure;uniform vec2 texel;varying vec2 jfUv;',
 'vec3 bright(vec2 uv){vec4 s=texture2D(inputMap,clamp(uv,0.0,1.0));vec3 c=max(s.rgb,vec3(0.0));float v=max(max(c.r,c.g),c.b)*exposure;float weight=smoothstep(threshold*0.7,threshold*1.3,v);return c*weight;}',
 'void main(){vec2 d=texel*1.5;vec3 c=(bright(jfUv+vec2(d.x,d.y))+bright(jfUv+vec2(-d.x,d.y))+bright(jfUv+vec2(d.x,-d.y))+bright(jfUv-d))*0.25;gl_FragColor=vec4(c,1.0);}'
 ].join('\n')})
 const blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{inputMap:{value:a.texture},stepUv:{value:new THREE.Vector2()}},vertexShader,fragmentShader:[
 'uniform sampler2D inputMap;uniform vec2 stepUv;varying vec2 jfUv;',
 'void main(){vec3 c=texture2D(inputMap,jfUv).rgb*0.227027;',
 'c+=(texture2D(inputMap,clamp(jfUv+stepUv*1.384615,0.0,1.0)).rgb+texture2D(inputMap,clamp(jfUv-stepUv*1.384615,0.0,1.0)).rgb)*0.316216;',
 'c+=(texture2D(inputMap,clamp(jfUv+stepUv*3.230769,0.0,1.0)).rgb+texture2D(inputMap,clamp(jfUv-stepUv*3.230769,0.0,1.0)).rgb)*0.070270;gl_FragColor=vec4(c,1.0);}'
 ].join('\n')})
 const geometry=new THREE.PlaneGeometry(2,2),quad=new THREE.Mesh(geometry,extract),scene=new THREE.Scene(),camera=new THREE.Camera()
 quad.frustumCulled=false;scene.add(quad)
 return {render(input:THREE.WebGLRenderTarget,threshold:number,radius:number){
  const w=Math.max(1,Math.ceil(input.width/4)),h=Math.max(1,Math.ceil(input.height/4))
  if(a.width!==w||a.height!==h){a.setSize(w,h);b.setSize(w,h)}
  const previous=renderer.getRenderTarget()
  try{
   extract.uniforms.inputMap.value=input.texture;extract.uniforms.threshold.value=threshold;extract.uniforms.exposure.value=renderer.toneMappingExposure;extract.uniforms.texel.value.set(1/input.width,1/input.height)
   quad.material=extract;renderer.setRenderTarget(a);renderer.render(scene,camera)
   quad.material=blur;blur.uniforms.inputMap.value=a.texture;blur.uniforms.stepUv.value.set(radius/w,0);renderer.setRenderTarget(b);renderer.render(scene,camera)
   blur.uniforms.inputMap.value=b.texture;blur.uniforms.stepUv.value.set(0,radius/h);renderer.setRenderTarget(a);renderer.render(scene,camera)
   return a.texture
  }finally{renderer.setRenderTarget(previous)}
 },dispose(){a.dispose();b.dispose();extract.dispose();blur.dispose();geometry.dispose()}}
}
