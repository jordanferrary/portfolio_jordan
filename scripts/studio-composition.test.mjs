import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const bundle=async p=>{
 const result=await build({entryPoints:[fileURLToPath(new URL('../'+p,import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',define:{'import.meta.env.BASE_URL':'"/"'}})
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
}
const {normalizeNativeLayouts,normalizeBlockAppearance,normalizeBlockLink}=await bundle('src/lib/component-settings.ts')
const {resolvePageBlock,refreshLinkedBlocks,instantiatePage,normalizePageTemplate}=await bundle('src/lib/page-composition.ts')
const sample=(id,blocks=[])=>({id,navLabel:'Sample',title:'Sample',icon:'book',showInNav:true,eyebrow:'',subtitle:'',heroImage:'',heroPositionX:50,heroPositionY:50,layout:'standard',blocks})
test('component appearance and native composition values are bounded',()=>{
 assert.equal(normalizeBlockAppearance(null),undefined)
 assert.deepEqual(normalizeBlockAppearance({width:9,space:999,surface:'panel',hideMobile:true,align:'left',css:'invalid'}),{width:50,space:64,align:'left',surface:'panel',hideMobile:true})
 assert.deepEqual(normalizeNativeLayouts({inicio:'page-abcdefgh',portfolio:'invalid',other:'page-abcdefgh'}),{inicio:'page-abcdefgh'})
 assert.equal(normalizeBlockLink({pageId:'not-a-page',blockId:'b'}),undefined)
})
test('linked blocks propagate the original content without replacing identity or override',()=>{
 const original={id:'source',type:'text',content:'New text',appearance:{width:80}}
 const linked={id:'instance',type:'text',content:'Fallback',appearance:{width:60},linkedSource:{pageId:'page-abcdefgh',blockId:'source'}}
 const pages=[sample('page-abcdefgh',[original]),sample('page-ijklmnop',[linked])]
 assert.equal(resolvePageBlock(linked,pages).content,'New text')
 assert.equal(resolvePageBlock(linked,pages).id,'instance')
 assert.equal(resolvePageBlock(linked,pages).appearance.width,60)
 assert.equal(resolvePageBlock(linked,[]).content,'Fallback')
 assert.equal(refreshLinkedBlocks(pages)[1].blocks[0].content,'New text')
 const loop=[sample('page-abcdefgh',[{...original,linkedSource:{pageId:'page-ijklmnop',blockId:'instance'}}])]
 assert.equal(resolvePageBlock(linked,loop).content,'Fallback')
})
test('new page templates use new identities without linked instances',()=>{
 const p=sample('page-abcdefgh',[{id:'a',type:'text',content:'Text'}])
 const copy=instantiatePage(p,[p])
 assert.notEqual(copy.id,p.id);assert.notEqual(copy.blocks[0].id,p.blocks[0].id)
 assert.equal(copy.showInNav,false);assert.equal(copy.blocks[0].content,'Text')
 assert.equal(normalizePageTemplate({schema:1,name:' My template ',page:copy}).name,'My template')
 assert.throws(()=>normalizePageTemplate({schema:2,name:'Test',page:p}))
})
test('composition and checkpoint features are wired to the persistence and publisher',async()=>{
 const [app,hook,publish,dialog,checkpoint,gate,pkg]=await Promise.all(['src/app.tsx','src/hooks/use-portfolio.ts','src/lib/github-publish.ts','src/components/sections/github-publish-editor.tsx','src/lib/studio-checkpoints.ts','src/components/sections/admin-gate.tsx','package.json'].map(read))
 assert.match(app,/nativeComposition&&<AppErrorBoundary/)
 assert.match(app,/onEditBlock=/)
 assert.match(hook,/nativeLayouts=normalizeNativeLayouts\(obj.nativeLayouts\)/)
 assert.match(publish,/nativeLayouts:store.nativeLayouts/)
 assert.match(publish,/refreshLinkedBlocks\(store.customPages/)
 assert.match(hook,/checkpointBefore\('Antes de importar ZIP'/)
 assert.match(dialog,/await createCheckpoint\(store,refsFor\(store\),'Antes de publicar'\)/)
 assert.match(checkpoint,/items.put\(entry\)/)
 assert.match(checkpoint,/await saveMediaBlob\(item.ref,item.blob\)/)
 assert.match(checkpoint,/protectedId/)
 assert.match(gate,/hasGitHubLogin\(\)\?<AuthenticatedGate/)
 assert.match(gate,/await readGitHubSession\(\)/)
 assert.ok(JSON.parse(pkg).scripts['test:studio'].includes('studio-composition.test.mjs'))
})
