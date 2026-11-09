import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const bundled=await build({
 entryPoints:['src/lib/chunk-recovery.ts'],bundle:true,format:'esm',
 platform:'node',write:false,logLevel:'silent'
})
const source=bundled.outputFiles[0].text
const {isChunkLoadError,tryAutoRecoverChunk}=await import(
 'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
)

test('detects expired Vite imports, but not unrelated React errors',()=>{
 assert.equal(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/gallery-123.js')),true)
 assert.equal(isChunkLoadError(new Error('Importing a module script failed.')),true)
 assert.equal(isChunkLoadError(new Error('Unable to preload CSS for /assets/studio-abc.css')),true)
 assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')),false)
})

test('reloads only once per build and never automatically inside Studio or offline',()=>{
 const globals=['window','document','navigator']
 const previous=new Map(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]))
 const saved=new Map()
 let reloads=0
 try{
  const mockWindow={
   sessionStorage:{
    getItem:key=>saved.get(key)??null,
    setItem:(key,value)=>{saved.set(key,value)}
   },
   location:{reload(){reloads++}}
  }
  const mockDocument={
   documentElement:{dataset:{jfStudioActive:'false'}},
   querySelector:()=>({content:'build-2026'})
  }
  for(const [key,value] of [['window',mockWindow],['document',mockDocument],['navigator',{onLine:true}]]){
   Object.defineProperty(globalThis,key,{configurable:true,writable:true,value})
  }
  const error=new TypeError('Failed to fetch dynamically imported module: /assets/gallery.js')
  assert.equal(tryAutoRecoverChunk(error),true)
  assert.equal(reloads,1)
  assert.equal(tryAutoRecoverChunk(error),false)
  assert.equal(reloads,1)
  saved.clear()
  mockDocument.documentElement.dataset.jfStudioActive='true'
  assert.equal(tryAutoRecoverChunk(error),false)
  mockDocument.documentElement.dataset.jfStudioActive='false'
  globalThis.navigator.onLine=false
  assert.equal(tryAutoRecoverChunk(error),false)
  assert.equal(reloads,1)
 }finally{
  for(const key of globals){
   const descriptor=previous.get(key)
   if(descriptor)Object.defineProperty(globalThis,key,descriptor)
   else delete globalThis[key]
  }
 }
})

test('isolates route, Studio and root failures rather than blanking the whole site',async()=>{
 const [app,main,boundary]=await Promise.all([
  read('src/app.tsx'),read('src/main.tsx'),read('src/components/ui/app-error-boundary.tsx')
 ])
 assert.match(main,/vite:preloadError/)
 assert.match(main,/<AppErrorBoundary><App \/><\/AppErrorBoundary>/)
 assert.match(app,/page==='portfolio'&&<AppErrorBoundary compact>/)
 assert.match(app,/page==='project'&&project&&<AppErrorBoundary compact>/)
 assert.match(app,/editing&&<AppErrorBoundary compact>/)
 assert.match(app,/dataset\.jfStudioActive=/)
 assert.match(boundary,/window\.location\.reload\(\)/)
})
