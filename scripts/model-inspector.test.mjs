import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
const compiled=await build({entryPoints:['src/lib/model-presentation.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
const {normalizeModelPresentation,MODEL_MODES,DEFAULT_MODEL_PRESENTATION}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
test('old blocks get defaults and invalid settings are clamped',()=>{
 assert.deepEqual(normalizeModelPresentation(),DEFAULT_MODEL_PRESENTATION)
 const p=normalizeModelPresentation({exposure:99,zoom:0,background:'bad',rotationSpeed:NaN,autoRotate:false})
 assert.equal(p.exposure,3);assert.equal(p.zoom,.2);assert.equal(p.background,DEFAULT_MODEL_PRESENTATION.background);assert.equal(p.rotationSpeed,1);assert.equal(p.autoRotate,false)
 for(const id of ['material','clay','wireframe','shaded-wire','clay-wire','flat-wire','normals','uv','bones','metalness','roughness'])assert.ok(MODEL_MODES.some(m=>m.id===id))
})
test('project models activate on entry and material inspection persists per block',async()=>{
 const [view,runtime,editor,page]=await Promise.all(['src/components/ui/project-model.tsx','src/lib/model-inspector-stage.ts','src/components/sections/admin-editor.tsx','src/components/sections/project-page.tsx'].map(p=>readFile(p,'utf8')))
 assert.match(view,/if\(!activated\|\|!parsed\)return/)
 assert.match(view,/import\('\.\.\/\.\.\/lib\/model-inspector-stage'\)/)
 const debug=await readFile('src/lib/model-debug-materials.ts','utf8')
 assert.match(debug,/wireframe:true/);assert.match(debug,/flatShading:mode==='flat'/);assert.match(debug,/MeshNormalMaterial/)
 assert.match(runtime,/isWireOverlay\(mode\)/);assert.match(runtime,/releaseWireGeometries\(\)/);assert.match(runtime,/attachSolidWireShader\(next,wireUniforms\)/)
 assert.doesNotMatch(runtime,/gl_Position\.z -=|makeOverlay|overlayMaterial/)
 assert.match(runtime,/shouldOrbit\(rotate,interacting,controls.enabled,performance.now\(\),idleUntil\)/);assert.match(runtime,/renderer\.dispose\(\)/)
 assert.match(editor,/modelPresentation=>updateBlock/);assert.match(page,/presentation=\{block\.modelPresentation\}/);assert.match(page,/<ProjectModel startActive url=/);assert.match(view,/setRetry\(n=>n\+1\)/);assert.match(view,/project-model-error-poster/);assert.match(runtime,/if\(!visible\|\|document.hidden\|\|!model\)return/)
 const app=await readFile('src/app.tsx','utf8');assert.match(app,/!shouldCoverProject\(project,revealedProjects\)&&<AppErrorBoundary compact>/)
})

test('solid topology expands indexed triangles without changing original geometry or material groups',async()=>{
 const {BufferGeometry,Float32BufferAttribute,MeshStandardMaterial}=await import('three')
 const result=await build({entryPoints:['src/lib/model-solid-wireframe.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {makeWireGeometry,attachSolidWireShader,createWireUniforms}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const source=new BufferGeometry()
 source.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,1,0],3))
 source.setAttribute('uv',new Float32BufferAttribute([0,0,1,0,1,1,0,1],2))
 source.setIndex([0,1,2,0,2,3]);source.addGroup(0,3,0);source.addGroup(3,3,1)
 const expanded=makeWireGeometry(source)
 assert.equal(source.index.count,6);assert.equal(source.getAttribute('position').count,4)
 assert.equal(source.getAttribute('jfBarycentric'),undefined)
 assert.equal(expanded.index,null);assert.equal(expanded.getAttribute('position').count,6)
 assert.equal(expanded.getAttribute('uv').count,6)
 assert.deepEqual(expanded.groups,source.groups)
 assert.deepEqual([...expanded.getAttribute('jfBarycentric').array],[255,0,0,0,255,0,0,0,255,255,0,0,0,255,0,0,0,255])
 const mat=new MeshStandardMaterial(),uniforms=createWireUniforms('#0055ff',.75)
 attachSolidWireShader(mat,uniforms)
 const mock={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <colorspace_fragment>'}
 mat.onBeforeCompile(mock,{})
 assert.match(mock.vertexShader,/jfEdgeDistance = jfBarycentric/)
 assert.match(mock.fragmentShader,/fwidth\(jfEdgeDistance\)/)
 assert.match(mock.fragmentShader,/gl_FragColor\.rgb = mix/)
 assert.doesNotMatch(mock.vertexShader,/gl_Position\.z/)
 assert.equal(mock.uniforms.jfWireOpacity,uniforms.opacity)
 assert.equal(mat.depthWrite,true);assert.equal(mat.depthTest,true)
 expanded.dispose();source.dispose();mat.dispose()
})

test('dedicated 3D editor saves independent light rigs and camera settings',async()=>{
 const p=normalizeModelPresentation({fov:200,targetX:9,usePresetRig:false,lights:Array.from({length:12},(_,i)=>({id:'same',name:'Light '+i,type:'spot',intensity:50,angle:110,distance:2}))})
 assert.equal(p.fov,80);assert.equal(p.targetX,5);assert.equal(p.usePresetRig,false);assert.equal(p.lights.length,8);assert.equal(new Set(p.lights.map(l=>l.id)).size,8);assert.equal(p.lights[0].intensity,10);assert.equal(p.lights[0].angle,89)
 const [editor,runtime,view]=await Promise.all(['src/components/sections/model-presentation-editor.tsx','src/lib/model-inspector-stage.ts','src/components/ui/project-model.tsx'].map(path=>readFile(path,'utf8')))
 assert.match(editor,/showModal\(\)/);assert.match(editor,/startActive/);assert.match(editor,/onChange\(normalizeModelPresentation\(draft\)\)/)
 assert.match(runtime,/new THREE\.PointLight/);assert.match(runtime,/new THREE\.SpotLight/);assert.match(runtime,/captureCamera/);assert.match(runtime,/customLights\.clear\(\)/)
 assert.match(view,/stage\.current\?\.captureCamera\(\)/)
})

test('light authoring helpers are Studio-only and solo isolates the light',async()=>{
 const [stage,gizmos,view,editor,page]=await Promise.all(['src/lib/model-inspector-stage.ts','src/lib/model-light-gizmos.ts','src/components/ui/project-model.tsx','src/components/sections/model-presentation-editor.tsx','src/components/sections/project-page.tsx'].map(p=>readFile(p,'utf8')))
 assert.match(stage,/lightEditing\?createLightGizmos/)
 assert.match(stage,/scene\.environmentIntensity=solo\?0/)
 assert.match(stage,/next\.relightUnlit!==presentation\.relightUnlit/)
 assert.match(gizmos,/new TransformControls/);assert.match(gizmos,/orbit\.enabled=!dragging/)
 assert.match(gizmos,/callbacks\.onChange\(id,patch\)/);assert.match(gizmos,/transform\.dispose\(\)/)
 assert.match(editor,/lightCallbacks=\{\{onSelect:selectLight,onChange:changeLight\}\}/)
 assert.match(view,/lightCallbacksRef\.current\?/)
 assert.doesNotMatch(page,/lightEditing=|lightCallbacks=/)
 const p=normalizeModelPresentation({relightUnlit:true,useEmbeddedLights:false})
 assert.equal(p.relightUnlit,true);assert.equal(p.useEmbeddedLights,false)
})

test('scene lighting adapts unlit materials without replacing textures or PBR channels',async()=>{
 const defaults=normalizeModelPresentation({relightUnlit:false})
 assert.equal(defaults.relightUnlit,true)
 assert.equal(normalizeModelPresentation({materialLighting:'original'}).relightUnlit,false)
 assert.equal(normalizeModelPresentation({emissionScale:-1}).emissionScale,0)
 const {MeshBasicMaterial,MeshPhysicalMaterial,Texture}=await import('three')
 const compiled=await build({entryPoints:['src/lib/model-debug-materials.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {createPresentationMaterial,applyPresentationEmission}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
 const texture=new Texture(),source=new MeshBasicMaterial({map:texture,color:0x44aaff,transparent:true,opacity:.6,alphaTest:.3})
 const lit=createPresentationMaterial('material',source,defaults)
 assert.equal(lit.isMeshStandardMaterial,true);assert.equal(lit.map,texture);assert.equal(lit.color.getHex(),source.color.getHex());assert.equal(lit.opacity,.6);assert.equal(lit.alphaTest,.3)
 assert.equal(source.isMeshBasicMaterial,true)
 const preserved=createPresentationMaterial('material',source,{relightUnlit:false})
 assert.equal(preserved.isMeshBasicMaterial,true)
 const physical=new MeshPhysicalMaterial({map:texture,metalness:.8,roughness:.2,emissiveIntensity:3})
 const clone=createPresentationMaterial('material',physical,defaults)
 applyPresentationEmission(clone,physical,.25)
 assert.equal(clone.isMeshPhysicalMaterial,true);assert.equal(clone.metalness,.8);assert.equal(clone.roughness,.2);assert.equal(clone.map,texture);assert.equal(clone.emissiveIntensity,.75);assert.equal(physical.emissiveIntensity,3)
 lit.dispose();preserved.dispose();source.dispose();clone.dispose();physical.dispose();texture.dispose()
})

test('art shaders are opt-in, persist and update uniforms without replacing materials',async()=>{
 const settings=normalizeModelPresentation({artShader:{preset:'toon',strength:8,bands:99,rimPower:-2}})
 assert.equal(settings.artShader.preset,'toon');assert.equal(settings.artShader.strength,1);assert.equal(settings.artShader.bands,8);assert.equal(settings.artShader.rimPower,.5)
 assert.equal(normalizeModelPresentation().artShader.preset,'original')
 const {MeshStandardMaterial,MeshBasicMaterial}=await import('three')
 const result=await build({entryPoints:['src/lib/model-art-shaders.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {createArtUniforms,updateArtUniforms,attachArtShader}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const uniforms=createArtUniforms(settings.artShader)
 const mat=new MeshStandardMaterial(),mock={uniforms:{},fragmentShader:'#include <tonemapping_fragment>'}
 attachArtShader(mat,uniforms);mat.onBeforeCompile(mock,{})
 assert.match(mock.fragmentShader,/normalize\(normal\)/);assert.match(mock.fragmentShader,/mix\(originalArt,colorArt,jfArtStrength\)/)
 assert.equal(mock.uniforms.jfArtMode,uniforms.jfArtMode)
 const key=mat.customProgramCacheKey()
 updateArtUniforms(uniforms,{...settings.artShader,preset:'hologram',strength:.3})
 assert.equal(mock.uniforms.jfArtMode.value,5);assert.equal(mock.uniforms.jfArtStrength.value,.3);assert.equal(mat.customProgramCacheKey(),key)
 const basic=new MeshBasicMaterial(),plain={uniforms:{},fragmentShader:'#include <tonemapping_fragment>'}
 attachArtShader(basic,uniforms);basic.onBeforeCompile(plain,{})
 assert.doesNotMatch(plain.fragmentShader,/normalize\(normal\)/)
 const runtime=await readFile('src/lib/model-inspector-stage.ts','utf8')
 assert.match(runtime,/attachArtShader\(next,uniforms\)/);assert.match(runtime,/updateArtUniforms\(uniforms,style\)/)
 mat.dispose();basic.dispose()
})

test('illustration surfaces and optional RGB camera pass preserve technical modes',async()=>{
 const p=normalizeModelPresentation({artShader:{preset:'crosshatch',patternScale:99,patternAngle:-1,chromaticAberration:50}})
 assert.equal(p.artShader.preset,'crosshatch');assert.equal(p.artShader.patternScale,24);assert.equal(p.artShader.patternAngle,0);assert.equal(p.artShader.chromaticAberration,12)
 assert.equal(normalizeModelPresentation().artShader.chromaticAberration,0)
 const [art,stage,post,ui]=await Promise.all(['src/lib/model-art-shaders.ts','src/lib/model-inspector-stage.ts','src/lib/model-chromatic-pass.ts','src/components/sections/model-presentation-editor.tsx'].map(path=>readFile(path,'utf8')))
 assert.match(art,/hatch:8,crosshatch:9,stipple:10,halftone:11/)
 assert.match(art,/jfInkColor/);assert.match(art,/smoothstep/);assert.match(stage,/lit\.flatShading=flat/)
 assert.match(stage,/mode==='material'&&\(presentation.artShader.chromaticAberration>0/);assert.match(stage,/!editState.helpers/)
 assert.match(stage,/chromaticPass.dispose\(\)/);assert.match(post,/vec3\(red.r,middle.g,blue.b\)/)
 assert.match(post,/target.dispose\(\)/);assert.match(ui,/CameraEffectCard/)
})

test('material overrides have isolated layers and retain global defaults',async()=>{
 const p=normalizeModelPresentation({materialLooks:{'mat-glb-0':{surface:{preset:'hologram'},shadow:{preset:'crosshatch',strength:4},shadowThreshold:2},'mat-glb-1':{surface:{preset:'watercolor'},light:{preset:'toon'}}}})
 assert.equal(p.materialLooks['mat-glb-0'].surface.preset,'hologram')
 assert.equal(p.materialLooks['mat-glb-0'].shadow.strength,1);assert.equal(p.materialLooks['mat-glb-0'].shadow.patternScale,7);assert.equal(p.materialLooks['mat-glb-0'].roughness,1)
 assert.equal(p.materialLooks['mat-glb-0'].shadowThreshold,.95)
 assert.equal(p.materialLooks['mat-glb-1'].light.preset,'toon')
 assert.equal(p.artShader.preset,'original')
 const result=await build({entryPoints:['src/lib/model-art-shaders.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {createArtUniforms,updateMaterialLayers,attachArtShader}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const a=createArtUniforms(p.materialLooks['mat-glb-0'].surface),b=createArtUniforms(p.materialLooks['mat-glb-1'].surface)
 updateMaterialLayers(a,p.materialLooks['mat-glb-0']);updateMaterialLayers(b,p.materialLooks['mat-glb-1'])
 assert.equal(a.jfShadowMode.value,9);assert.equal(b.jfShadowMode.value,0);assert.equal(b.jfLightMode.value,1)
 const {MeshStandardMaterial}=await import('three'),mat=new MeshStandardMaterial()
 const mock={uniforms:{},fragmentShader:'void main() {\n#include <tonemapping_fragment>\n}'}
 attachArtShader(mat,a);mat.onBeforeCompile(mock,{})
 assert.match(mock.fragmentShader,/vec3 jfStyle/);assert.match(mock.fragmentShader,/outgoingLight-totalEmissiveRadiance/);assert.match(mock.fragmentShader,/jfShadowStrength/)
 mat.dispose()
})

test('emission stays independent from artistic shading and can use the base map',async()=>{
 const p=normalizeModelPresentation({artShader:{bloom:20,bloomThreshold:0,bloomRadius:30},materialLooks:{'mat-glb-0':{emissionMode:'base',emission:7,emissionColor:'#55aaff'}}})
 assert.equal(p.artShader.bloom,2);assert.equal(p.artShader.bloomThreshold,.1);assert.equal(p.artShader.bloomRadius,8)
 assert.equal(p.materialLooks['mat-glb-0'].emission,7)
 const {MeshStandardMaterial,Texture}=await import('three')
 const compiled=await build({entryPoints:['src/lib/model-debug-materials.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {createPresentationMaterial,applyPresentationEmission}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
 const baseMap=new Texture(),emissiveMap=new Texture(),source=new MeshStandardMaterial({color:'#66aaff',map:baseMap,emissive:'#ff0055',emissiveMap,emissiveIntensity:4})
 const target=createPresentationMaterial('material',source,p)
 applyPresentationEmission(target,source,1)
 assert.equal(target.emissiveMap,emissiveMap);assert.equal(target.emissive.getHex(),source.emissive.getHex());assert.equal(target.emissiveIntensity,4)
 applyPresentationEmission(target,source,7,p.materialLooks['mat-glb-0'])
 assert.equal(target.emissiveMap,baseMap);assert.equal(target.emissiveIntensity,7)
 applyPresentationEmission(target,source,1)
 assert.equal(target.emissiveMap,emissiveMap);assert.equal(target.emissiveIntensity,4);assert.equal(source.emissiveMap,emissiveMap)
 const [art,stage,post,bloom]=await Promise.all(['src/lib/model-art-shaders.ts','src/lib/model-inspector-stage.ts','src/lib/model-chromatic-pass.ts','src/lib/model-bloom-pass.ts'].map(path=>readFile(path,'utf8')))
 assert.match(art,/gl_FragColor\.rgb-emissionArt/);assert.match(art,/\+emissionArt;/)
 assert.match(stage,/presentation.artShader.bloom>0/);assert.match(post,/bloomPass\?\.dispose/);assert.match(bloom,/input.width\/4/)
 target.dispose();source.dispose();baseMap.dispose();emissiveMap.dispose()
})

test('model background settings survive normalization and publish local images',async()=>{
 const p=normalizeModelPresentation({background:'#112233',backdrop:{mode:'radial',secondary:'#334455',centerX:150,centerY:-1,image:'media://model-backgrounds/test.webp'}})
 assert.equal(p.backdrop.mode,'radial');assert.equal(p.backdrop.centerX,100);assert.equal(p.backdrop.centerY,0);assert.equal(p.backdrop.image,'media://model-backgrounds/test.webp')
 assert.equal(normalizeModelPresentation({backdrop:{image:'javascript:alert(1)'}}).backdrop.image,'')
 assert.equal(normalizeModelPresentation().backdrop.mode,'solid')
 for(const preset of ['pearl','foil','opal','velvet','chrome','xray'])assert.equal(normalizeModelPresentation({artShader:{preset}}).artShader.preset,preset)
 const [view,publish,art]=await Promise.all(['src/components/ui/project-model.tsx','src/lib/github-publish.ts','src/lib/model-art-shaders.ts'].map(path=>readFile(path,'utf8')))
 assert.match(view,/model-scene-backdrop/);assert.match(view,/backdropFill\(settings.background,settings.backdrop\)/);assert.match(publish,/block.modelPresentation.backdrop.image=await stage/)
 assert.match(art,/pearl:17,foil:18,opal:19/);assert.match(art,/jfSurfaceNormal/)
})

test('Studio shares visual shader samples across global and per-material controls',async()=>{
 const [ui,materials,library,renderer,admin]=await Promise.all(['src/components/sections/model-presentation-editor.tsx','src/components/sections/model-material-editor.tsx','src/components/sections/model-look-library.tsx','src/lib/model-preview-renderer.ts','src/components/sections/admin-editor.tsx'].map(path=>readFile(path,'utf8')))
 assert.match(ui,/model-studio-rail/);assert.match(ui,/CameraEffectCard/);assert.match(ui,/useLookPreviews/)
 assert.match(materials,/ShaderPicker compact/);assert.match(library,/filterShaders/);assert.match(renderer,/attachArtShader/);assert.match(renderer,/createChromaticPass/);assert.match(renderer,/renderer\?\.forceContextLoss/)
 assert.doesNotMatch(admin,/Capa representativa do modelo/)
 const output=await build({entryPoints:['src/lib/model-preview-library.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {PREVIEW_STYLES,filterShaders,CAMERA_EFFECTS}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))
 assert.equal(PREVIEW_STYLES.length,28);assert.equal(CAMERA_EFFECTS.length,5)
 assert.ok(filterShaders('holo','pearl').some(p=>p.id==='pearl'));assert.ok(!filterShaders('all','flat',false).length)
})

test('camera capture uses a fixed reference composition and portrait contains its horizontal view',async()=>{
 const result=await build({entryPoints:['src/lib/model-camera-framing.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {responsiveCameraFov,referenceFitDistance,cameraZoomForDistance,MODEL_REFERENCE_ASPECT,MODEL_MOBILE_ASPECT,wrapCameraAzimuth}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const fov=38,rad=angle=>angle*Math.PI/180
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9)
 near(responsiveCameraFov(fov,MODEL_REFERENCE_ASPECT),fov)
 near(responsiveCameraFov(fov,2.4),fov)
 near(Math.tan(rad(responsiveCameraFov(fov,MODEL_MOBILE_ASPECT)/2))*MODEL_MOBILE_ASPECT,Math.tan(rad(fov/2))*MODEL_REFERENCE_ASPECT)
 const distance=referenceFitDistance(3,fov)/1.7
 near(cameraZoomForDistance(3,fov,distance),1.7)
 assert.equal(wrapCameraAzimuth(370),10);assert.equal(wrapCameraAzimuth(-190),170)
 const [stage,ui,css]=await Promise.all(['src/lib/model-inspector-stage.ts','src/components/sections/model-presentation-editor.tsx','src/styles/project-model.css'].map(p=>readFile(p,'utf8')))
 assert.match(stage,/fov:presentation.fov/);assert.match(stage,/cameraZoomForDistance\(radius,presentation.fov,controls.getDistance\(\)\)/)
 assert.match(stage,/settleOrbit\(\)/);assert.match(stage,/idleUntil=0/)
 assert.match(ui,/Desktop 16:10/);assert.match(ui,/Celular 4:5/);assert.match(css,/format-mobile .project-model-frame\{aspect-ratio:4\/5/)
})

test('shader angles and artistic colors are independently persisted and uploaded per layer',async()=>{
 const p=normalizeModelPresentation({artShader:{preset:'hologram',patternAngle:90,scanSpeed:0},materialLooks:{'mat-glb-0':{surface:{preset:'hologram',patternAngle:15},light:{preset:'hologram',patternAngle:75,scanSpeed:-12},shadow:{preset:'crosshatch',patternAngle:135,inkColor:'#ff0000',paperColor:'#00ff00'},metalnessOverride:.9}}})
 const look=p.materialLooks['mat-glb-0']
 assert.equal(p.artShader.scanSpeed,0);assert.equal(look.light.patternAngle,75);assert.equal(look.shadow.inkColor,'#ff0000');assert.equal(look.metalnessOverride,.9)
 const result=await build({entryPoints:['src/lib/model-art-shaders.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {createArtUniforms,updateMaterialLayers,updateArtUniforms,attachArtShader}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const uniforms=createArtUniforms(look.surface)
 updateMaterialLayers(uniforms,look);updateArtUniforms(uniforms,p.artShader)
 assert.equal(uniforms.jfScanSpeed.value,0);assert.equal(uniforms.jfLightAngleSpeed.value.y,-12)
 assert.ok(Math.abs(uniforms.jfLightAngleSpeed.value.x-Math.PI*75/180)<1e-8)
 assert.ok(Math.abs(uniforms.jfShadowAngleSpeed.value.x-Math.PI*135/180)<1e-8)
 assert.equal(uniforms.jfShadowInk.value.getHexString(),'ff0000')
 const {MeshStandardMaterial}=await import('three'),mat=new MeshStandardMaterial()
 const mock={uniforms:{},fragmentShader:'void main() {\n#include <tonemapping_fragment>\n}'}
 attachArtShader(mat,uniforms);mat.onBeforeCompile(mock,{})
 assert.match(mock.fragmentShader,/patternPx.y-jfTime\*angleSpeed.y/)
 assert.match(mock.fragmentShader,/jfLightAngleSpeed,jfLightInk,jfLightPaper/)
 assert.match(mock.fragmentShader,/jfShadowAngleSpeed,jfShadowInk,jfShadowPaper/)
 assert.match(mock.fragmentShader,/rotatedNormal=mat2\(c,-s,s,c\)\*jfN.xy/)
 mat.dispose()
 const module=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
 assert.equal(module.resolvePbrFactor(0,1,.9),.9);assert.equal(module.resolvePbrFactor(.4,1,null),.4)
 const editor=await readFile('src/components/sections/model-material-editor.tsx','utf8')
 assert.match(editor,/custom\?\?newMaterialLook\(global\)/);assert.match(editor,/ShaderParameters value=\{look.surface\}/)
})

test('material selection stays outside scrolling properties and handles material loading',async()=>{
 const [editor,material,view,css]=await Promise.all(['src/components/sections/model-presentation-editor.tsx','src/components/sections/model-material-editor.tsx','src/components/ui/project-model.tsx','src/styles/project-model.css'].map(path=>readFile(path,'utf8')))
 assert.match(editor,/<MaterialSelector materials=\{materials\} selected=\{selectedMaterial\} onSelect=\{selectMaterial\}/)
 assert.ok(editor.indexOf('<MaterialSelector')<editor.indexOf('<div className="model-studio-controls">'))
 assert.match(material,/aria-label="Selecionar material para editar"/)
 assert.match(material,/materials.map\(\(item,index\)=>/)
 assert.match(material,/onSelect\(event.target.value\)/)
 assert.match(editor,/onMaterialSelect=\{selectMaterial\}/)
 assert.match(view,/onMaterials\?\.\(null\)/);assert.match(view,/onMaterials\?\.\(value.materials\)/)
 assert.match(css,/model-material-selector\{flex:0 0 auto/);assert.match(css,/model-studio-controls>\*\{flex-shrink:0\}/)
})

test('mesh statistics are a passive overlay inside the viewer with no instruction footer',async()=>{
 const [view,css]=await Promise.all(['src/components/ui/project-model.tsx','src/styles/project-model.css'].map(path=>readFile(path,'utf8')))
 assert.doesNotMatch(view,/className="model-inspector-meta"|Rotate · Zoom · Pan/)
 assert.match(view,/<dl className="model-geometry-readout"[^>]*>/)
 assert.match(view,/<dt>Tris<\/dt><dd>\{stats\.triangles\.toLocaleString\(\)\}/)
 assert.match(view,/<dt>Verts<\/dt><dd>\{stats\.vertices\.toLocaleString\(\)\}/)
 assert.match(css,/\.project-model-frame>\.model-geometry-readout\{[^}]*position:absolute[^}]*pointer-events:none/)
})

test('animation clips are visible and initial playback settings persist',async()=>{
 const config=normalizeModelPresentation({animation:{clip:3,autoplay:false,loop:false,speed:5}}).animation
 assert.deepEqual(config,{clip:3,autoplay:false,loop:false,speed:3})
 assert.equal(normalizeModelPresentation().animation.clip,-1)
 const [stage,view,studio]=await Promise.all(['src/lib/model-inspector-stage.ts','src/components/ui/project-model.tsx','src/components/sections/model-presentation-editor.tsx'].map(path=>readFile(path,'utf8')))
 assert.match(stage,/animationClips:clips.map/);assert.match(stage,/THREE.LoopRepeat:THREE.LoopOnce/);assert.match(stage,/setEffectiveTimeScale\(speed\)/);assert.match(stage,/mixer.addEventListener\('finished'/)
 assert.match(view,/onAnimations\?\.\(value.animationClips\)/);assert.match(view,/model-playback-toolbar/);assert.match(view,/if\(ready\)stage.current\?\.setAnimation/)
 assert.match(studio,/tab==='animations'/);assert.match(studio,/patchAnimation\(\{clip:index\}\)/);assert.match(studio,/animationClips.length/)
})

test('automatic orbit is opt-in and separate from GLB animation playback',async()=>{
 assert.equal(normalizeModelPresentation().autoRotate,false)
 const [view,stage,studio,css]=await Promise.all(['src/components/ui/project-model.tsx','src/lib/model-inspector-stage.ts','src/components/sections/model-presentation-editor.tsx','src/styles/project-model.css'].map(path=>readFile(path,'utf8')))
 assert.match(view,/const \[visitorRotate,setVisitorRotate\]=useState\(false\)/)
 assert.match(view,/aria-label="Auto rotation" aria-pressed=\{rotate\}/)
 assert.match(view,/<RefreshCw size=\{17\}/)
 assert.match(view,/<SkipBack size=\{15\}/)
 assert.doesNotMatch(view,/Pause rotation|Resume rotation|setRotate\(settings.autoRotate\)/)
 assert.match(stage,/rotate=false,interacting=false/)
 assert.match(studio,/previewRotation=\{previewRotate\} onPreviewRotationChange=\{setPreviewRotate\}/)
 assert.match(css,/model-orbit-toggle\[aria-pressed=true\]/)
})

test('opt-in horizontal orbit preserves distance and elevation and ignores passive hover',async()=>{
 const output=await build({entryPoints:['src/lib/model-camera-framing.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {horizontalOrbitStep,shouldOrbit}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))
 const [x,z]=horizontalOrbitStep(0,5,15,1)
 assert.ok(Math.abs(x+5)<1e-9);assert.ok(Math.abs(z)<1e-9)
 const [x2,z2]=horizontalOrbitStep(x,z,45,1)
 assert.ok(Math.abs(x2)<1e-9);assert.ok(Math.abs(z2-5)<1e-9)
 assert.ok(shouldOrbit(true,false,true,0,0))
 assert.ok(!shouldOrbit(false,false,true,100,0))
 assert.ok(!shouldOrbit(true,true,true,100,0))
 assert.ok(!shouldOrbit(true,false,false,100,0))
 assert.ok(!shouldOrbit(true,false,true,100,900))
 assert.ok(shouldOrbit(true,false,true,900,900))
 const stage=await readFile('src/lib/model-inspector-stage.ts','utf8')
 assert.match(stage,/camera.position.set\(controls.target.x\+x,camera.position.y,controls.target.z\+z\)/)
 assert.doesNotMatch(stage,/hovered|pointerenter|pointerleave/)
})

test('orbit fitting contains elongated models at every angle and reserves room for effects',async()=>{
 const output=await build({entryPoints:['src/lib/model-camera-framing.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {safeTurntableDistance,orbitEdgeMargin}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))
 for(const aspect of [.8,1.6,2.4])for(const elevation of [-1.2,-.4,0,.3,1.2])for(const [r,h] of [[5,.3],[.5,4],[3,2]]){
  const fov=38,margin=.12,d=safeTurntableDistance(r,h,elevation,fov,aspect,margin)
  const tv=Math.tan(fov*Math.PI/360)*(1-2*margin),th=tv*aspect
  const c=Math.cos(elevation),s=Math.sin(elevation)
  for(let i=0;i<360;i+=2)for(const y of [-h,h]){
   const a=i*Math.PI/180,x=r*Math.sin(a),z=r*Math.cos(a),depth=d-(z*c+y*s),vertical=y*c-z*s
   assert.ok(depth>0);assert.ok(Math.abs(x)<=depth*th+1e-8);assert.ok(Math.abs(vertical)<=depth*tv+1e-8)
  }
 }
 assert.ok(orbitEdgeMargin(1000,600,1,5,.5,3,.3,0,0)>orbitEdgeMargin(1000,600,1,0,0,3,0,0,0))
 assert.ok(safeTurntableDistance(5,.3,0,38,1.6,.08)<safeTurntableDistance(5,5,0,38,1.6,.08))
 const [stage,post]=await Promise.all(['src/lib/model-inspector-stage.ts','src/lib/model-chromatic-pass.ts'].map(path=>readFile(path,'utf8')))
 assert.match(stage,/distance<safeDistance/);assert.match(stage,/camera.position.copy\(controls.target\).addScaledVector\(orbitOffset,safeDistance\/distance\)/)
 assert.match(post,/sampleScene\(uv\+separation\)/)
})

test('padded compositor retains CRT corners, RGB offsets and bloom beyond original viewport UVs',async()=>{
 const output=await build({entryPoints:['src/lib/model-camera-framing.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {compositorGuardBand}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))
 for(const [w,h] of [[320,400],[1200,750],[2560,1440],[4000,2000]])for(const dpr of [1,1.5]){
  const guard=compositorGuardBand(w,h,dpr,1,1,12,12,2,8,4096)
  assert.ok(guard.width<=4096&&guard.height<=4096)
  for(let x=0;x<=1;x+=.05)for(let y=0;y<=1;y+=.05){
   const cx=x-.5,cy=y-.5,r2=cx*cx+cy*cy
   const u=x+cx*r2*.12,v=y+cy*r2*.12
   const shiftX=.0025+(12*dpr+1.8+6*dpr)/w,shiftY=(12*dpr+6*dpr)/h
   for(const sign of [-1,1]){
    const px=(u+sign*shiftX-.5)*guard.scaleX+.5,py=(v+sign*shiftY-.5)*guard.scaleY+.5
    assert.ok(px>=0&&px<=1&&py>=0&&py<=1)
   }
  }
 }
 const post=await readFile('src/lib/model-chromatic-pass.ts','utf8')
 assert.match(post,/paddedUv\(uv\)/)
 assert.match(post,/texture2D\(bloomMap,clamp\(paddedUv\(uv\)/)
 assert.match(post,/view.projectionMatrix.copy\(originalProjection\)/)
 assert.match(post,/view.projectionMatrixInverse.copy\(originalInverse\)/)
 assert.doesNotMatch(post,/rgb=vec3\(0\.0\);alpha=0\.0/)
})
