import * as THREE from 'three'
import type {ArtShader,ArtShaderPreset,MaterialLook} from './model-presentation'
const STYLE_INDEX:Record<ArtShaderPreset,number>={original:0,toon:1,noir:2,rim:3,iridescent:4,hologram:5,blueprint:6,flat:7,hatch:8,crosshatch:9,stipple:10,halftone:11,pixel:12,outline:13,dither:14,watercolor:15,pencil:16}
export function createArtUniforms(style:ArtShader){
 return {jfArtMode:{value:STYLE_INDEX[style.preset]},jfArtStrength:{value:style.strength},jfArtTint:{value:new THREE.Color(style.tint)},jfArtBands:{value:style.bands},jfArtRimPower:{value:style.rimPower},jfArtScanSpacing:{value:style.scanSpacing},jfPatternScale:{value:style.patternScale},jfInkColor:{value:new THREE.Color(style.inkColor)},jfPaperColor:{value:new THREE.Color(style.paperColor)},jfPatternAngle:{value:THREE.MathUtils.degToRad(style.patternAngle)},jfLightMode:{value:0},jfShadowMode:{value:0},jfLightStrength:{value:0},jfShadowStrength:{value:0},jfLightTint:{value:new THREE.Color(0xffffff)},jfShadowTint:{value:new THREE.Color(0xffffff)},jfShadowThreshold:{value:.45},jfShadowSoftness:{value:.18},jfRimStrength:{value:0},jfRimTint:{value:new THREE.Color(0xffffff)},jfRimPower:{value:3},jfSelected:{value:0},jfTime:{value:0},jfLightParams:{value:new THREE.Vector4(7,4,3,7)},jfShadowParams:{value:new THREE.Vector4(7,4,3,7)}}
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
export function updateMaterialLayers(u:ArtUniforms,look?:MaterialLook,highlight=false){
 u.jfLightMode.value=look?STYLE_INDEX[look.light.preset]:0;u.jfShadowMode.value=look?STYLE_INDEX[look.shadow.preset]:0
 u.jfLightStrength.value=look?.light.strength??0;u.jfShadowStrength.value=look?.shadow.strength??0
 for(const [layer,params] of [[look?.light,u.jfLightParams],[look?.shadow,u.jfShadowParams]] as const)params.value.set(layer?.patternScale??7,layer?.bands??4,layer?.rimPower??3,layer?.scanSpacing??7)
 u.jfLightTint.value.set(look?.light.tint??'#ffffff');u.jfShadowTint.value.set(look?.shadow.tint??'#ffffff')
 u.jfShadowThreshold.value=look?.shadowThreshold??.45;u.jfShadowSoftness.value=look?.shadowSoftness??.18
 u.jfRimStrength.value=look?.rimStrength??0;u.jfRimTint.value.set(look?.rimTint??'#ffffff');u.jfRimPower.value=look?.rimPower??3;u.jfSelected.value=highlight?1:0
}
const DECLARATIONS=[
 'uniform int jfArtMode;',
 'uniform float jfArtStrength;',
 'uniform vec3 jfArtTint;',
 'uniform float jfArtBands;',
 'uniform float jfArtRimPower;',
 'uniform float jfArtScanSpacing;',
 'uniform float jfPatternScale;', 'uniform vec3 jfInkColor;', 'uniform vec3 jfPaperColor;', 'uniform float jfPatternAngle;',
 'uniform int jfLightMode; uniform int jfShadowMode; uniform vec4 jfLightParams; uniform vec4 jfShadowParams;', 'uniform float jfLightStrength; uniform float jfShadowStrength;', 'uniform vec3 jfLightTint; uniform vec3 jfShadowTint;', 'uniform float jfShadowThreshold; uniform float jfShadowSoftness;', 'uniform float jfRimStrength; uniform vec3 jfRimTint; uniform float jfRimPower; uniform float jfSelected; uniform float jfTime;'
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
  const functionCode=[
   'vec3 jfStyle(int styleMode, vec3 originalArt, vec3 styleTint, float facingArt, float lightArt, vec4 layerParams) {',
   ' if(styleMode==0 || styleMode==7) return originalArt;',
   ' float lumArt=dot(originalArt,vec3(0.2126,0.7152,0.0722));',
   ' float rimArt=pow(max(0.0,1.0-facingArt),layerParams.z);',
   ' vec3 colorArt=originalArt;',
   ' if (styleMode == 1) {',

   '   float compressed = lightArt / (1.0 + lightArt);',
   '   float level = floor(compressed * layerParams.y + 0.5) / layerParams.y;',
   '   level = min(level,0.95);',
   '   float quantized = level / max(1.0-level,0.05);',
   '   colorArt = originalArt * clamp(quantized/max(lightArt,0.0001),0.0,3.0) * styleTint;',
   ' } else if (styleMode == 2) {',
   '   colorArt = vec3(pow(lumArt,1.32)*1.15) * styleTint;',
   ' } else if (styleMode == 3) {',
   '   colorArt = originalArt + styleTint * rimArt * 2.2;',
   ' } else if (styleMode == 4) {',
   '   vec3 spectrum = 0.55 + 0.45*cos(6.2831853*(facingArt*1.5 + vec3(0.0,0.333333,0.666667)));',
   '   colorArt = originalArt * (0.75 + spectrum*0.5) + spectrum*styleTint*(0.15+rimArt*1.3);',
   ' } else if (styleMode == 5) {',
   '   float scan = 0.6+0.4*cos((gl_FragCoord.y-jfTime*14.0)*6.2831853/max(layerParams.w,1.0));',
   '   colorArt = styleTint * ((0.13+lumArt*0.75)*scan + rimArt*1.55);',
   ' } else if (styleMode == 6) {',
   '   colorArt = mix(styleTint*0.14,styleTint*(0.6+lumArt),clamp(lumArt,0.0,1.0)) + styleTint*rimArt*0.85;',
   ' } else if (styleMode >= 8 && styleMode <= 11) {',
   '   float brightness = clamp(lumArt / (0.5 + lumArt),0.0,1.0);',
   '   float darkness = 1.0-brightness;',
   '   float c = cos(jfPatternAngle), s = sin(jfPatternAngle);',
   '   vec2 pattern = mat2(c,-s,s,c)*gl_FragCoord.xy / max(layerParams.x,3.0);',
   '   float aa = min(0.24,max(0.015,0.7/max(layerParams.x,3.0)));',
   '   float ink = 0.0;',
   '   if (styleMode == 8 || styleMode == 9) {',
   '     float a = abs(fract(pattern.x)-0.5);',
   '     float widthA = clamp((darkness-0.12)*0.44,0.0,0.42);',
   '     ink = (1.0-smoothstep(max(widthA-aa,0.0),widthA+aa,a))*smoothstep(0.12,0.23,darkness);',
   '     if (styleMode == 9) {',
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
   '     if (styleMode == 10) local -= (vec2(random,random2)-0.5)*0.44;',
   '     float radiusArt = styleMode == 10 ? 0.12+darkness*0.15 : sqrt(darkness)*0.48;',
   '     ink = 1.0-smoothstep(max(radiusArt-aa,0.0),radiusArt+aa,length(local));',
   '     if (styleMode == 10) ink *= smoothstep(random-0.10,random+0.10,darkness);',
   '   }',
   '   vec3 paperArt = jfPaperColor * (0.75+brightness*0.48);',
   '   colorArt = mix(paperArt,jfInkColor,clamp(ink,0.0,1.0))*styleTint;',
   ' } else if (styleMode == 12) {',
   '   float stepsArt = max(layerParams.y,2.0);',
   '   vec3 compressed = originalArt/(1.0+originalArt);',
   '   vec3 q = min(floor(compressed*stepsArt+0.5)/stepsArt,vec3(0.95));',
   '   colorArt=q/max(vec3(0.05),1.0-q)*styleTint;',
   ' } else if (styleMode == 13) {',
   '   float outline = 1.0-smoothstep(0.10,0.10+0.35/max(layerParams.z,0.5),facingArt);',
   '   colorArt=mix(originalArt,styleTint,outline);',
   ' } else if (styleMode == 14) {',
   '   vec2 cell=mod(floor(gl_FragCoord.xy/max(layerParams.x*0.25,1.0)),4.0);',
   '   float threshold=mod(2.0*cell.x+3.0*cell.y+mod(cell.x+cell.y,2.0)*4.0,16.0)/16.0;',
   '   vec3 compressed=originalArt/(1.0+originalArt);',
   '   vec3 q=min(floor(compressed*layerParams.y+threshold)/layerParams.y,vec3(0.95));',
   '   colorArt=q/max(vec3(0.05),1.0-q)*styleTint;',
   ' } else if (styleMode == 15) {',
   '   vec2 p=gl_FragCoord.xy/max(layerParams.x,3.0);',
   '   float gran=fract(sin(dot(floor(p*4.0),vec2(127.1,311.7)))*43758.5453);',
   '   float wash=0.5+0.5*sin(p.x*0.65+sin(p.y*0.6))*cos(p.y*0.7);',
   '   colorArt=mix(jfPaperColor,originalArt*styleTint,clamp(0.65+wash*0.22,0.0,1.0))*(0.91+gran*0.12);',
   '   colorArt*=1.0-0.28*rimArt;',
   ' } else if (styleMode == 16) {',
   '   vec2 p=gl_FragCoord.xy/max(layerParams.x,3.0);',
   '   float gran=fract(sin(dot(floor(p*6.0),vec2(127.1,311.7)))*43758.5453);',
   '   float stroke=abs(fract(p.x+p.y+gran*0.25)-0.5);',
   '   float dark=1.0-clamp(lumArt/(0.5+lumArt),0.0,1.0);',
   '   float graphite=(1.0-smoothstep(dark*0.32,dark*0.32+0.12,stroke))*dark;',
   '   colorArt=mix(jfPaperColor,jfInkColor,clamp(graphite+rimArt*0.45,0.0,1.0))*styleTint;',
   ' }',
   ' return colorArt;',
   '}'
  ].join('\n')
  shader.fragmentShader=shader.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,match=>functionCode+'\n'+match)
  const light=standard?'dot(max(outgoingLight-totalEmissiveRadiance,vec3(0.0)),vec3(0.2126,0.7152,0.0722))/max(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)),0.05)':'1.0'
  const code=[
   'vec3 emissionArt='+(standard?'totalEmissiveRadiance':'vec3(0.0)')+';',
   'vec3 originalArt=max(gl_FragColor.rgb-emissionArt,vec3(0.0));',
   'float facingArt='+facing+';',
   'float lightArt=max(0.0,'+light+');',
   'vec3 colorArt=jfStyle(jfArtMode,originalArt,jfArtTint,facingArt,lightArt,vec4(jfPatternScale,jfArtBands,jfArtRimPower,jfArtScanSpacing));',
   'vec3 resultArt=mix(originalArt,colorArt,jfArtStrength);',
   'float maskArt=smoothstep(jfShadowThreshold-jfShadowSoftness*0.5,jfShadowThreshold+jfShadowSoftness*0.5,lightArt/(1.0+lightArt));',
   'if(jfLightMode!=0) resultArt=mix(resultArt,jfStyle(jfLightMode,resultArt,jfLightTint,facingArt,lightArt,jfLightParams),maskArt*jfLightStrength);',
   'if(jfShadowMode!=0) resultArt=mix(resultArt,jfStyle(jfShadowMode,resultArt,jfShadowTint,facingArt,lightArt,jfShadowParams),(1.0-maskArt)*jfShadowStrength);',
   'resultArt+=jfRimTint*pow(1.0-facingArt,jfRimPower)*jfRimStrength;',
   'gl_FragColor.rgb=mix(resultArt,resultArt+vec3(0.22,0.12,0.36),jfSelected*0.65)+emissionArt;',
   '#include <tonemapping_fragment>'
  ].join('\n')
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',code)
 }
 material.customProgramCacheKey=()=>priorKey+'|jf-art-v4-'+(standard?'pbr':'basic')
 material.needsUpdate=true
 return material
}
