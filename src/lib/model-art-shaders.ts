import * as THREE from 'three'
import type {ArtShader,ArtShaderPreset} from './model-presentation'
const STYLE_INDEX:Record<ArtShaderPreset,number>={original:0,toon:1,noir:2,rim:3,iridescent:4,hologram:5,blueprint:6}
export function createArtUniforms(style:ArtShader){
 return {jfArtMode:{value:STYLE_INDEX[style.preset]},jfArtStrength:{value:style.strength},jfArtTint:{value:new THREE.Color(style.tint)},jfArtBands:{value:style.bands},jfArtRimPower:{value:style.rimPower},jfArtScanSpacing:{value:style.scanSpacing}}
}
export type ArtUniforms=ReturnType<typeof createArtUniforms>
export function updateArtUniforms(uniforms:ArtUniforms,style:ArtShader){
 uniforms.jfArtMode.value=STYLE_INDEX[style.preset]
 uniforms.jfArtStrength.value=style.strength
 uniforms.jfArtTint.value.set(style.tint)
 uniforms.jfArtBands.value=style.bands
 uniforms.jfArtRimPower.value=style.rimPower
 uniforms.jfArtScanSpacing.value=style.scanSpacing
}
const DECLARATIONS=[
 'uniform int jfArtMode;',
 'uniform float jfArtStrength;',
 'uniform vec3 jfArtTint;',
 'uniform float jfArtBands;',
 'uniform float jfArtRimPower;',
 'uniform float jfArtScanSpacing;'
].join('\n')
/** One surface pass, applied to the existing light response before tone mapping.
 * No additional geometry, scene pass, texture allocation, or animation loop. */
export function attachArtShader(material:THREE.Material,uniforms:ArtUniforms){
 const standard=(material as THREE.MeshStandardMaterial).isMeshStandardMaterial===true
 const prior=material.onBeforeCompile,priorKey=material.customProgramCacheKey()
 material.onBeforeCompile=function(shader,renderer){
  prior.call(this,shader,renderer)
  Object.assign(shader.uniforms,uniforms)
  shader.fragmentShader=DECLARATIONS+'\n'+shader.fragmentShader
  const facing=standard?'clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0)':'1.0'
  const code=[
   'if (jfArtMode != 0 && jfArtStrength > 0.0) {',
   ' vec3 originalArt = max(gl_FragColor.rgb, vec3(0.0));',
   ' float lumArt = dot(originalArt, vec3(0.2126, 0.7152, 0.0722));',
   ' float facingArt = '+facing+';',
   ' float rimArt = pow(max(0.0,1.0-facingArt), jfArtRimPower);',
   ' vec3 colorArt = originalArt;',
   ' if (jfArtMode == 1) {',
   '   float compressed = lumArt / (1.0 + lumArt);',
   '   float level = floor(compressed * jfArtBands + 0.5) / jfArtBands;',
   '   level = min(level,0.95);',
   '   float quantized = level / max(1.0-level,0.05);',
   '   colorArt = originalArt * clamp(quantized/max(lumArt,0.0001),0.0,3.0) * jfArtTint;',
   ' } else if (jfArtMode == 2) {',
   '   colorArt = vec3(pow(lumArt,1.32)*1.15) * jfArtTint;',
   ' } else if (jfArtMode == 3) {',
   '   colorArt = originalArt + jfArtTint * rimArt * 2.2;',
   ' } else if (jfArtMode == 4) {',
   '   vec3 spectrum = 0.55 + 0.45*cos(6.2831853*(facingArt*1.5 + vec3(0.0,0.333333,0.666667)));',
   '   colorArt = originalArt * (0.75 + spectrum*0.5) + spectrum*jfArtTint*(0.15+rimArt*1.3);',
   ' } else if (jfArtMode == 5) {',
   '   float scan = 0.6+0.4*cos(gl_FragCoord.y*6.2831853/max(jfArtScanSpacing,1.0));',
   '   colorArt = jfArtTint * ((0.13+lumArt*0.75)*scan + rimArt*1.55);',
   ' } else if (jfArtMode == 6) {',
   '   colorArt = mix(jfArtTint*0.14,jfArtTint*(0.6+lumArt),clamp(lumArt,0.0,1.0)) + jfArtTint*rimArt*0.85;',
   ' }',
   ' gl_FragColor.rgb = mix(originalArt,colorArt,jfArtStrength);',
   '}',
   '#include <tonemapping_fragment>'
  ].join('\n')
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',code)
 }
 material.customProgramCacheKey=()=>priorKey+'|jf-art-v1-'+(standard?'pbr':'basic')
 material.needsUpdate=true
 return material
}
