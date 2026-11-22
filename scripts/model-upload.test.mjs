import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
const built=await build({entryPoints:['src/lib/model-embed.ts'],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'})
const {parseModelUrl,validateGlb,MAX_MODEL_BYTES}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))
function fixture(data){
 const encoded=Buffer.from(JSON.stringify(data))
 const length=Math.ceil(encoded.length/4)*4
 const bytes=Buffer.alloc(20+length,0x20)
 bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8)
 bytes.writeUInt32LE(length,12);bytes.writeUInt32LE(0x4e4f534a,16);encoded.copy(bytes,20)
 return new Blob([bytes])
}
test('GLB validates header, size and embedded assets',async()=>{
 await validateGlb(fixture({asset:{version:'2.0'},images:[{uri:'data:image/png;base64,AA=='}]}))
 await assert.rejects(validateGlb(fixture({asset:{version:'2.0'},images:[{uri:'external.png'}]})),/externos/)
 await assert.rejects(validateGlb(new Blob(['not glb'])),/inválido/)
 await assert.rejects(validateGlb(new Blob([new Uint8Array(MAX_MODEL_BYTES+1)])),/24 MiB/)
})
test('local and published model refs retain external URL compatibility',()=>{
 const hash='a'.repeat(64)
 assert.equal(parseModelUrl('media://models/'+hash+'.glb')?.format,'glb')
 assert.equal(parseModelUrl('site://models/studio/'+hash+'.glb')?.format,'glb')
 assert.equal(parseModelUrl('https://example.org/model.gltf')?.format,'gltf')
 assert.equal(parseModelUrl('https://example.org/model.fbx'),null)
 assert.equal(parseModelUrl('media://images/no.glb'),null)
})
test('Studio backup and publishing preserve binary model assets',async()=>{
 const [media,publish,viewer,refs]=await Promise.all(['src/lib/media-store.ts','src/lib/github-publish.ts','src/components/ui/project-model.tsx','src/lib/published-assets.ts'].map(p=>readFile(p,'utf8')))
 assert.match(media,/b\.type==='image'\|\|b\.type==='model'/)
 assert.match(publish,/block\.type==='model'\)\{block\.content=await stage\(block\.content,'model'\)/)
 assert.match(viewer,/URL\.revokeObjectURL/)
 assert.match(viewer,/if\(!activated\|\|!parsed\)return/)
 assert.match(refs,/images\|audio\|models/)
})
