import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
const compiled=await build({entryPoints:['src/lib/model-presentation.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
const {normalizeModelPresentation,MODEL_MODES,DEFAULT_MODEL_PRESENTATION}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
test('old blocks get defaults and invalid settings are clamped',()=>{
 assert.deepEqual(normalizeModelPresentation(),DEFAULT_MODEL_PRESENTATION)
 const p=normalizeModelPresentation({exposure:99,zoom:0,background:'bad',rotationSpeed:NaN,autoRotate:false})
 assert.equal(p.exposure,3);assert.equal(p.zoom,.5);assert.equal(p.background,DEFAULT_MODEL_PRESENTATION.background);assert.equal(p.rotationSpeed,1);assert.equal(p.autoRotate,false)
 assert.deepEqual(MODEL_MODES.map(m=>m.id),['material','clay','wireframe','flat','normals','unlit'])
})
test('real material inspection loads only on request and persists per block',async()=>{
 const [view,runtime,editor,page]=await Promise.all(['src/components/ui/project-model.tsx','src/lib/model-inspector-stage.ts','src/components/sections/admin-editor.tsx','src/components/sections/project-page.tsx'].map(p=>readFile(p,'utf8')))
 assert.match(view,/if\(!activated\|\|!parsed\)return/)
 assert.match(view,/import\('\.\.\/\.\.\/lib\/model-inspector-stage'\)/)
 assert.match(runtime,/wireframe:true/);assert.match(runtime,/flatShading:mode==='flat'/);assert.match(runtime,/MeshNormalMaterial/)
 assert.match(runtime,/rotate&&!hovered&&!interacting/);assert.match(runtime,/renderer\.dispose\(\)/)
 assert.match(editor,/modelPresentation=>updateBlock/);assert.match(page,/presentation=\{block\.modelPresentation\}/)
})
