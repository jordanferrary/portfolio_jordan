import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const source=await read('src/lib/component-settings.ts')
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {normalizeHomeModuleOrder}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js))
test('native Home modules retain their exact defaults and reject duplicate or unknown modules',()=>{
 assert.deepEqual(normalizeHomeModuleOrder(undefined),{upper:['intro','profile'],lower:['featured','testimonials','focus']})
 assert.deepEqual(normalizeHomeModuleOrder({upper:['profile','profile','unknown'],lower:['focus','featured','focus']}),{upper:['profile','intro'],lower:['focus','featured','testimonials']})
})
test('composition order and project block properties are wired into the public manifest',async()=>{
 const [app,home,project,editor,hook,publisher]=await Promise.all(['src/app.tsx','src/components/sections/home-page.tsx','src/components/sections/project-page.tsx','src/components/sections/admin-editor.tsx','src/hooks/use-portfolio.ts','src/lib/github-publish.ts'].map(read))
 assert.match(home,/order.upper.map\(id=>upper\[id\]\)/)
 assert.match(home,/order.lower.map\(id=>lower\[id\]\)/)
 assert.match(app,/onSetHomeModuleOrder=\{portfolio.setHomeModuleOrder\}/)
 assert.match(publisher,/homeModuleOrder:store.homeModuleOrder/)
 assert.match(hook,/appearance:normalizeBlockAppearance\(b.appearance\)/)
 assert.match(project,/onEditBlock\(b.id\)/)
 assert.match(editor,/initialBlockId\?'composition':'project'/)
 assert.match(editor,/<BlockProperties value=\{b.appearance\}/)
})
test('cloud draft transfer uses a server session and existing backup format',async()=>{
 const [app,hook,client,worker]=await Promise.all(['src/app.tsx','src/hooks/use-portfolio.ts','src/lib/cloud-draft.ts','auth-worker/src/index.js'].map(read))
 assert.match(app,/onBackup=\{portfolio.buildBackup\} onImport=\{portfolio.importData\}/)
 assert.match(hook,/const result=await buildBackup\(\)/)
 assert.match(client,/credentials:'include'/)
 assert.match(client,/X-Studio-Revision/)
 assert.match(worker,/studioDraftRoute\(request,env,await readSession\(request,env\),headers\)/)
 assert.match(worker,/if\(!permittedOrigin\(request,env\)\)return error/)
})
