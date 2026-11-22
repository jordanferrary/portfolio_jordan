import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
import {build} from 'esbuild'
import {fileURLToPath} from 'node:url'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [source,hook,publisher,app,sidebar,home,transition,translator,dialog,library,pkg]=await Promise.all([
 'src/lib/studio-controls.ts','src/hooks/use-portfolio.ts','src/lib/github-publish.ts','src/app.tsx','src/components/layout/sidebar.tsx','src/components/sections/home-page.tsx','src/components/ui/route-glitch-transition.tsx','src/lib/public-page-translation.ts','src/components/sections/github-publish-editor.tsx','src/lib/design-themes.ts','package.json'
].map(read))
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {normalizeStudioControls,DEFAULT_CONTROLS,NAV_IDS,applyStudioControls}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js))
test('existing site migrates without changing original visual defaults',()=>{
 assert.deepEqual(normalizeStudioControls(undefined),DEFAULT_CONTROLS)
 assert.deepEqual(normalizeStudioControls(null),DEFAULT_CONTROLS)
 assert.equal(DEFAULT_CONTROLS.motion.duration,260)
 assert.equal(DEFAULT_CONTROLS.desktop.width,1470)
 assert.ok(Object.values(DEFAULT_CONTROLS.features).every(Boolean))
})
test('untrusted values clamp to supported controls and navigation remains reachable',()=>{
 const v=normalizeStudioControls({desktop:{width:99999,gap:-3,glassGlow:Infinity,radius:0},mobile:{gutter:99},motion:{mode:'bad',duration:0},features:{music:false},navigation:{order:['contato','contato','bad'],items:{inicio:{visible:false,icon:'bad'},portfolio:{label:'  Work  '}}}})
 assert.equal(v.desktop.width,1800);assert.equal(v.desktop.gap,75);assert.equal(v.desktop.glassGlow,100);assert.equal(v.desktop.radius,50);assert.equal(v.mobile.gutter,16)
 assert.equal(v.motion.mode,'glitch');assert.equal(v.motion.duration,120)
 assert.equal(v.features.music,false);assert.equal(v.features.profile,true)
 assert.equal(v.navigation.order[0],'contato');assert.deepEqual(new Set(v.navigation.order),new Set(NAV_IDS))
 assert.equal(v.navigation.items.inicio.visible,true);assert.equal(v.navigation.items.inicio.icon,'home');assert.equal(v.navigation.items.portfolio.label,'Work')
})
test('manual translations deduplicate source phrases and preserve language fallback',()=>{
 assert.deepEqual(normalizeStudioControls({translations:[{source:' Home ',pt:' Início ',es:''},{source:'Home',pt:'Outro'},{source:'Empty',pt:''}]}).translations,[{source:'Home',pt:'Início',es:''}])
 assert.match(translator,/manualPhrases.get\(text\)\?\.\[language\]/)
 assert.match(translator,/dataset.jfStudioActive==='true'\)return null/)
 assert.match(app,/setManualTranslations\(normalizeStudioControls\(portfolio.studioControls\).translations\)/)
})
test('design settings flow through draft, real components and published manifest',()=>{
 assert.match(hook,/studioControls=normalizeStudioControls\(obj.studioControls\)/)
 assert.match(hook,/setStudioControls=/)
 assert.match(publisher,/studioControls:store.studioControls/)
 assert.match(app,/applyStudioControls\(portfolio.studioControls\)/)
 assert.match(app,/onSave=\{portfolio.setStudioControls\}/)
 assert.match(sidebar,/settings.navigation.order.flatMap/)
 assert.match(sidebar,/musicEnabled&&mobilePortal/)
 assert.match(home,/features\?\.featured!==false/)
 assert.match(transition,/motion\?\.mode==='none'/)
 assert.match(transition,/active.duration\*/)
})
test('root variables are responsive and motion state is applied',()=>{
 const values=new Map()
 const prior=globalThis.document
 try{
  globalThis.document={documentElement:{style:{setProperty:(k,v)=>values.set(k,v)},dataset:{}}}
  applyStudioControls({desktop:{gap:125},mobile:{gutter:12},motion:{mode:'none'},features:{footer:false}})
  assert.equal(values.get('--jf-desktop-gap'),'1.25')
  assert.equal(values.get('--jf-mobile-gutter'),'12px')
  assert.equal(document.documentElement.dataset.jfMotion,'none')
  assert.equal(document.documentElement.dataset.jfFooter,'false')
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior}
})
test('history, preview and pre-publication audit use the current local draft',()=>{
 assert.match(hook,/history.current.past=\[[^\n]+\.slice\(-30\)/)
 assert.match(hook,/persist\(entry.store\)/)
 assert.match(app,/const viewEditing=editing&&!previewDraft/)
 assert.match(app,/onAudit=\{portfolio.runAudit\}/)
 assert.match(dialog,/await auditStudio\(store,refsFor\(store\)\)/)
 assert.match(dialog,/if\(blockers.length\)throw new Error/)
 assert.match(hook,/modelPresentation\?\.backdrop\?\.image/)
 assert.ok(JSON.parse(pkg).scripts['test:studio'].includes('studio-controls.test.mjs'))
})
test('theme export contains only validated design settings, not content or credentials',async()=>{
 const result=await build({entryPoints:[fileURLToPath(new URL('../src/lib/design-themes.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})
 const {normalizeDesignTheme}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const theme=normalizeDesignTheme({schema:1,name:'Test',palette:{primary:'#123456'},design:{features:{music:false},translations:[{source:'Home',pt:'Portal'}]},token:'not-exported',projects:[{id:'test'}]})
 assert.equal(theme.palette.primary,'#123456')
 assert.deepEqual(Object.keys(theme.design).sort(),['desktop','mobile','motion'])
 assert.ok(!Object.hasOwn(theme,'token')&&!Object.hasOwn(theme,'projects'))
 assert.throws(()=>normalizeDesignTheme({schema:99,name:'Test'}))
 assert.match(library,/saveDesignThemes/)
 assert.match(hook,/const applyDesignTheme=/)
})
