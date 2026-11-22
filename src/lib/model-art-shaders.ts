import * as THREE from 'three'
import type {ArtShader,ArtShaderPreset} from './model-presentation'
const STYLE_INDEX:Record<ArtShaderPreset,number>={original:0,toon:1,noir:2,rim:3,iridescent:4,hologram:5,blueprint:6,flat:7,hatch:8,crosshatch:9,stipple:10,halftone:11}
export function createArtUniforms(style:ArtShader){
 return {jfArtMode:{value:STYLE_INDEX[style.preset]},jfArtStrength:{value:style.strength},jfArtTint:{value:new THREE.Color(style.tint)},jfArtBands:{value:style.bands},jfArtRimPower:{value:style.rimPower},jfArtScanSpacing:{value:style.scanSpacing},jfPatternScale:{value:style.patternScale},jfInkColor:{value:new THREE.Color(style.inkColor)},jfPaperColor:{value:new THREE.Color(style.paperColor)},jfPatternAngle:{value:THREE.MathUtils.degToRad(style.patternAngle)}}
}
export type ArtUniforms=ReturnType<typeof createArtUniforms>
export function updateArtUniforms(uniforms:ArtUniforms,style:ArtShader){
 uniforms.jfArtMode.value=STYLE_INDEX[style.preset]
 uniforms.jfArtStrength.value=style.strength
 uniforms.jfArtTint.value.set(style.tint)
 uniforms.jfArtBands.value=style.bands
 uniforms.jfArtRimPower.value=style.rimPower
 uniforms.jfArtScanSpacing.value=style.scanSpacing
 uniforms.jfPatternScale.value=style.patternScale;uniforms.jfInkColor.value.set(style.inkColor);uniforms.jfPaperColor.value.set(style.paperColor);uniforms.jfPatternAngle.value=THREE.MathUtils.degToRad(style.patternAngle)
}
const DECLARATIONS=[
 'uniform int jfArtMode;',
 'uniform float jfArtStrength;',
 'uniform vec3 jfArtTint;',
 'uniform float jfArtBands;',
 'uniform float jfArtRimPower;',
 'uniform float jfArtScanSpacing;',
 'uniform float jfPatternScale;', 'uniform vec3 jfInkColor;', 'uniform vec3 jfPaperColor;', 'uniform float jfPatternAngle;'
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
   '   float baseLumArt = '+(standard?'max(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)),0.05)':'1.0')+';',
   '   float lightArt = lumArt/baseLumArt;',
   '   float compressed = lightArt / (1.0 + lightArt);',
   '   float level = floor(compressed * jfArtBands + 0.5) / jfArtBands;',
   '   level = min(level,0.95);',
   '   float quantized = level / max(1.0-level,0.05);',
   '   colorArt = originalArt * clamp(quantized/max(lightArt,0.0001),0.0,3.0) * jfArtTint;',
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
   ' } else if (jfArtMode >= 8) {',
   '   float brightness = clamp(lumArt / (0.5 + lumArt),0.0,1.0);',
   '   float darkness = 1.0-brightness;',
   '   float c = cos(jfPatternAngle), s = sin(jfPatternAngle);',
   '   vec2 pattern = mat2(c,-s,s,c)*gl_FragCoord.xy / max(jfPatternScale,3.0);',
   '   float aa = min(0.24,max(0.015,0.7/max(jfPatternScale,3.0)));',
   '   float ink = 0.0;',
   '   if (jfArtMode == 8 || jfArtMode == 9) {',
   '     float a = abs(fract(pattern.x)-0.5);',
   '     float widthA = clamp((darkness-0.12)*0.44,0.0,0.42);',
   '     ink = (1.0-smoothstep(max(widthA-aa,0.0),widthA+aa,a))*smoothstep(0.12,0.23,darkness);',
   '     if (jfArtMode == 9) {',
   '       float b = abs(fract(pattern.y)-0.5);',
   '       float widthB = clamp((darkness-0.43)*0.6,0.0,0.37);',
   '       float second = (1.0-smoothstep(max(widthB-aa,0.0),widthB+aa,b))*smoothstep(0.43,0.55,darkness);',
   '       ink = max(ink,second);',
   '       float extra = abs(fract((pattern.x+pattern.y)*0.7071)-0.5);',
   '       ink = max(ink,(1.0-smoothstep(0.06,0.06+aa,extra))*smoothstep(0.78,0.91,darkness));',
   '     }',
   '   } else {',
   '     vec2 cell = floor(pattern);',
   '     vec2 local = fract(pattern)-0.5;',
   '     float random = fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);',
   '     float random2 = fract(sin(dot(cell,vec2(269.5,183.3)))*43758.5453);',
   '     if (jfArtMode == 10) local -= (vec2(random,random2)-0.5)*0.44;',
   '     float radiusArt = jfArtMode == 10 ? 0.12+darkness*0.15 : sqrt(darkness)*0.48;',
   '     ink = 1.0-smoothstep(max(radiusArt-aa,0.0),radiusArt+aa,length(local));',
   '     if (jfArtMode == 10) ink *= smoothstep(random-0.10,random+0.10,darkness);',
   '   }',
   '   vec3 paperArt = jfPaperColor * (0.75+brightness*0.48);',
   '   colorArt = mix(paperArt,jfInkColor,clamp(ink,0.0,1.0))*jfArtTint;',
   ' }',
   ' gl_FragColor.rgb = mix(originalArt,colorArt,jfArtStrength);',
   '}',
   '#include <tonemapping_fragment>'
  ].join('\n')
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',code)
 }
 material.customProgramCacheKey=()=>priorKey+'|jf-art-v2-'+(standard?'pbr':'basic')
 material.needsUpdate=true
 return material
}
