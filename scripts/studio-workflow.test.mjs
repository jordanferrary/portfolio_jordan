import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const load=async p=>{const output=ts.transpileModule(await read(p),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;return import('data:text/javascript;charset=utf-8,'+encodeURIComponent(output))}
const {normalizeWorkflow,matchesTool,toggleFavorite,visitTool}=await load('src/lib/studio-workflow.ts')
const {normalizeBlockAppearance,moveStudioBlock,duplicateStudioBlock}=await load('src/lib/component-settings.ts')
test('workflow search ignores accents, supports multiple terms and bounds local preferences',()=>{
 assert.ok(matchesTool('edicao midia',['Edição de mídia','Conteúdo']))
 assert.ok(!matchesTool('edição projetos',['Edição de mídia']))
 let p=normalizeWorkflow({favorites:['palette','palette','INVALID!'],recent:['x','x']})
 assert.deepEqual(p,{favorites:['palette'],recent:['x']})
 p=toggleFavorite(p,'palette');assert.deepEqual(p.favorites,[])
 p=visitTool(p,'x');assert.deepEqual(p.recent,['x'])
})
test('component properties clamp input and preserve no-override defaults',()=>{
 assert.equal(normalizeBlockAppearance(undefined),undefined)
 assert.deepEqual(normalizeBlockAppearance({surface:'glass',padding:-5,corner:99,opacity:2,border:true,css:'bad'}),{surface:'glass',padding:0,corner:48,opacity:45,border:true})
})
test('moves and duplication preserve content and identity',()=>{
 const list=[{id:'a',content:'media://1',appearance:{width:80}},{id:'b',content:'test'}]
 assert.deepEqual(moveStudioBlock(list,'a',1).map(x=>x.id),['b','a'])
 assert.equal(moveStudioBlock(list,'a',-1),list)
 const next=duplicateStudioBlock(list,'a','c')
 assert.deepEqual(next.map(x=>x.id),['a','c','b'])
 assert.equal(next[1].content,list[0].content)
 assert.notEqual(next[1].appearance,list[0].appearance)
 assert.equal(duplicateStudioBlock(list,'a','b'),list)
})
test('inspector connects to current route and shared properties',async()=>{
 const [app,inspector,project,custom,dock]=await Promise.all(['src/app.tsx','src/components/sections/studio-inspector.tsx','src/components/sections/project-page.tsx','src/components/sections/custom-page.tsx','src/components/sections/studio-dock.tsx'].map(read))
 assert.match(app,/onSave=\{saveInspected\}/)
 assert.match(app,/onMove=\{moveInspected\}/)
 assert.match(inspector,/data-studio-selected/)
 assert.match(project,/data-studio-block=\{editing\?b.id:undefined\}/)
 assert.match(custom,/data-studio-block=\{editing\?block.id:undefined\}/)
 assert.match(dock,/matchesTool\(query/)
 assert.match(dock,/toggleFavorite\(value,action.id\)/)
})

test('temporary visual preview is separate from draft save and clean visitor mode hides dock',async()=>{
 const [app,inspector,project,custom,link]=await Promise.all(['src/app.tsx','src/components/sections/studio-inspector.tsx','src/components/sections/project-page.tsx','src/components/sections/custom-page.tsx','src/lib/page-composition.ts'].map(read))
 assert.match(app,/onPreview=\{setAppearancePreview\}/)
 assert.match(app,/viewEditing&&!inspectorOpen&&<AppErrorBoundary/)
 assert.match(inspector,/onPreview\(dirty&&current\?/)
 assert.match(inspector,/useEffect\(\(\)=>\(\)=>onPreview\(undefined\)/)
 assert.match(project,/appearancePreview\?\.id===b.id\?appearancePreview.appearance:b.appearance/)
 assert.match(custom,/appearancePreview\?\.id===original.id/)
 assert.match(link,/appearance:block.appearance\}/)
})

 test('inspector exposes searchable hierarchy, local appearance clipboard and reversible preview presets',async()=>{
 const [ins,props]=await Promise.all([read('src/components/sections/studio-inspector.tsx'),read('src/components/ui/block-properties.tsx')])
 assert.match(ins,/matchesTool\(query/)
 assert.match(ins,/onMove\(dragged,i-from\)/)
 assert.match(ins,/sessionStorage\.setItem\(styleClipboardKey/)
 assert.match(ins,/new ResizeObserver\(update\)/)
 assert.match(ins,/setDraft\(current.appearance\)/)
 assert.match(ins,/hideMobile:draft\?\.hideMobile,hideDesktop:draft\?\.hideDesktop/)
 assert.match(props,/step="1" value=\{value\?\.width/)
})
