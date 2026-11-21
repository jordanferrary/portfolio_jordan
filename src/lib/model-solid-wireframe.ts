import * as THREE from 'three'
/** A triangle-local attribute lets the surface shader draw its own edges.
 * Unlike a second GL_LINES draw, it uses exactly the same rasterized fragments
 * and depth as the solid surface, including skinned and morphed vertices.
 */
export const BARYCENTRIC_ATTRIBUTE='jfBarycentric'
export type WireUniforms={color:{value:THREE.Color};opacity:{value:number}}
export function createWireUniforms(color:string,opacity:number):WireUniforms{
 return {color:{value:new THREE.Color(color).convertLinearToSRGB()},opacity:{value:opacity}}
}
export function makeWireGeometry(source:THREE.BufferGeometry):THREE.BufferGeometry{
 const geometry=source.index?source.toNonIndexed():source.clone()
 const count=geometry.getAttribute('position').count
 // Three normalized bytes per vertex, rather than three 32-bit floats.
 const barycentric=new Uint8Array(count*3)
 for(let i=0;i<count;i++)barycentric[i*3+i%3]=255
 geometry.setAttribute(BARYCENTRIC_ATTRIBUTE,new THREE.BufferAttribute(barycentric,3,true))
 geometry.setDrawRange(source.drawRange.start,source.drawRange.count)
 geometry.name=source.name
 return geometry
}
export function attachSolidWireShader(material:THREE.Material,uniforms:WireUniforms){
 const originalCompile=material.onBeforeCompile
 const originalKey=material.customProgramCacheKey()
 material.onBeforeCompile=function(shader,renderer){
  originalCompile.call(this,shader,renderer)
  shader.uniforms.jfWireColor=uniforms.color
  shader.uniforms.jfWireOpacity=uniforms.opacity
  shader.vertexShader='attribute vec3 jfBarycentric; varying vec3 jfEdgeDistance;\n'+shader.vertexShader
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\njfEdgeDistance = jfBarycentric;')
  shader.fragmentShader='varying vec3 jfEdgeDistance; uniform vec3 jfWireColor; uniform float jfWireOpacity;\n'+shader.fragmentShader
  // The edge is blended after output color conversion, not as a transparent
  // mesh. Anti-alias its width in screen pixels, regardless of camera zoom.
  shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',[
   '#include <colorspace_fragment>',
   'vec3 jfWidth = max(fwidth(jfEdgeDistance), vec3(0.000001));',
   'vec3 jfCoverage = smoothstep(jfWidth * 0.25, jfWidth * 1.25, jfEdgeDistance);',
   'float jfEdge = 1.0 - min(min(jfCoverage.x, jfCoverage.y), jfCoverage.z);',
   'gl_FragColor.rgb = mix(gl_FragColor.rgb, jfWireColor, jfEdge * jfWireOpacity);'
  ].join('\n'))
 }
 material.customProgramCacheKey=()=>originalKey+'|jf-solid-wire-v1'
 material.needsUpdate=true
 return material
}
