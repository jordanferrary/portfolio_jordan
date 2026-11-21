import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
const built=await build({entryPoints:['src/lib/sensitive-themes.ts'],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'})
const {isSensitiveTheme,projectMatchesVisibility,shouldCoverProject}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))
const safe={id:'safe',category:'Characters'}
const horror={id:'horror',category:'NSFW'}
const flagged={id:'flagged',category:'Characters',sensitiveTheme:true}
test('legacy category and independent flag both hide sensitive work from SFW',()=>{
 for(const project of [horror,flagged,{...horror,category:' nsfw ',sensitiveTheme:false}]){
  assert.equal(isSensitiveTheme(project),true)
  assert.equal(projectMatchesVisibility(project,'SFW'),false)
  assert.equal(projectMatchesVisibility(project,'All'),true)
  assert.equal(projectMatchesVisibility(project,'NSFW'),true)
 }
 assert.equal(projectMatchesVisibility(safe,'SFW'),true)
 assert.equal(projectMatchesVisibility(safe,'Characters'),true)
 assert.equal(projectMatchesVisibility(flagged,'Characters'),false)
})
test('cover remains until the individual project is acknowledged',()=>{
 assert.equal(shouldCoverProject(horror,new Set()),true)
 assert.equal(shouldCoverProject(flagged,new Set(['horror'])),true)
 assert.equal(shouldCoverProject(horror,new Set(['horror'])),false)
 assert.equal(shouldCoverProject(safe,new Set()),false)
})
test('gallery and project route share the cover rule without Studio bypass',async()=>{
 const gallery=await readFile('src/components/sections/gallery.tsx','utf8')
 const app=await readFile('src/app.tsx','utf8')
 assert.match(gallery,/const covered=shouldCoverProject\(p,revealedProjects\)/)
 assert.match(app,/project&&shouldCoverProject\(project,revealedProjects\)/)
})
