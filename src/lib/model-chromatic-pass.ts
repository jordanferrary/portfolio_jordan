import * as THREE from 'three'
/** Allocated only when RGB separation is enabled. Technical views bypass this pass. */
export function createChromaticPass(renderer:THREE.WebGLRenderer){
 const size=new THREE.Vector2()
 const target=new THREE.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter})
 const uniforms={sceneMap:{value:target.texture},offsetUv:{value:new THREE.Vector2()}}
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,toneMapped:true,transparent:false,
 vertexShader:'varying vec2 jfUv; void main(){ jfUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
 fragmentShader:[
 'uniform sampler2D sceneMap; uniform vec2 offsetUv; varying vec2 jfUv;',
 'void main(){',
 ' vec4 middle=texture2D(sceneMap,jfUv);',
 ' vec4 red=texture2D(sceneMap,clamp(jfUv+offsetUv,0.0,1.0));',
 ' vec4 blue=texture2D(sceneMap,clamp(jfUv-offsetUv,0.0,1.0));',
 ' float alpha=max(middle.a,max(red.a,blue.a));',
 ' vec3 rgb=vec3(red.r,middle.g,blue.b);',
 ' gl_FragColor=vec4(rgb/max(alpha,0.00001),alpha);',
 ' #include <tonemapping_fragment>',
 ' #include <colorspace_fragment>',
 ' gl_FragColor.rgb *= gl_FragColor.a;',
 '}'
 ].join('\n')})
 const geometry=new THREE.PlaneGeometry(2,2),quad=new THREE.Mesh(geometry,material),scene=new THREE.Scene(),camera=new THREE.Camera()
 quad.frustumCulled=false;scene.add(quad)
 return {render(source:THREE.Scene,view:THREE.Camera,amount:number,angle:number){
  renderer.getDrawingBufferSize(size)
  const w=Math.max(1,size.x),h=Math.max(1,size.y)
  if(target.width!==w||target.height!==h)target.setSize(w,h)
  const rad=THREE.MathUtils.degToRad(angle),pixelRatio=renderer.getPixelRatio()
  uniforms.offsetUv.value.set(Math.cos(rad)*amount*pixelRatio/w,Math.sin(rad)*amount*pixelRatio/h)
  const previous=renderer.getRenderTarget()
  try{renderer.setRenderTarget(target);renderer.render(source,view);renderer.setRenderTarget(previous);renderer.render(scene,camera)}
  finally{renderer.setRenderTarget(previous)}
 },dispose(){target.dispose();geometry.dispose();material.dispose()}}
}
