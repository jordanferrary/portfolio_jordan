import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
const built=await build({entryPoints:['src/lib/sensitive-themes.ts'],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'})
const {isSensitiveTheme,projectMatchesVisibility,shouldCoverProject,sensitiveCopy}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))
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

test('localized notice describes sensitivity without making unsupported claims about the artwork',()=>{
 assert.equal(sensitiveCopy('pt').warningText,"Este projeto aborda temas sensíveis e pode não ser adequado para todos os públicos.")
 assert.equal(sensitiveCopy('en').warningText,"This project explores sensitive themes and may not be suitable for all audiences.")
 assert.equal(sensitiveCopy('es').warningText,"Este proyecto aborda temas sensibles y puede no ser adecuado para todos los públicos.")
 for(const lang of ['pt','en','es'])assert.doesNotMatch(sensitiveCopy(lang).warningText,/expl[ií]cit/i)
})

test('unlisted ordinary projects stay out of every public listing and featured slots',async()=>{
 const result=await build({stdin:{contents:"export * from './src/lib/project-listing'; export * from './src/lib/featured-projects'",resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'})
 const {isUnlisted,projectInListing,normalizeProjectListing,UNLISTED_FILTER,UNLISTED_SEARCH,getFeaturedProjects,applyFeaturedSelection}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const hidden={...safe,id:'unlisted',unlisted:true,featured:true,featuredOrder:0}
 const publicProject={...safe,featured:true,featuredOrder:1}
 const sensitive={...horror,unlisted:true,featured:true}
 assert.equal(isUnlisted(hidden),true)
 for(const filter of ['All','SFW','Characters','NSFW'])assert.equal(projectInListing(hidden,filter,false,''),false)
 for(const code of ['02080','020802 ',' 020802','0208020'])assert.equal(projectInListing(hidden,'All',false,code),false)
 assert.equal(UNLISTED_SEARCH,'020802')
 assert.equal(projectInListing(hidden,'NSFW',false,UNLISTED_SEARCH),true)
 assert.equal(projectInListing(publicProject,'All',false,UNLISTED_SEARCH),false)
 assert.equal(projectInListing(sensitive,'All',false,UNLISTED_SEARCH),false)
 assert.equal(projectInListing(hidden,UNLISTED_FILTER,true,''),true)
 assert.equal(projectInListing(hidden,UNLISTED_FILTER,false,''),false)
 assert.equal(projectInListing(sensitive,'SFW',false,''),false)
 assert.equal(projectInListing(sensitive,'NSFW',false,''),true)
 assert.deepEqual(getFeaturedProjects([hidden,publicProject,sensitive]).map(p=>p.id),[safe.id])
 assert.equal(applyFeaturedSelection([hidden,publicProject],[hidden.id,safe.id])[0].featured,false)
 assert.equal(normalizeProjectListing(hidden).featured,false)
 assert.equal(normalizeProjectListing(sensitive).unlisted,false)
 const [gallery,app,admin]=await Promise.all(['src/components/sections/gallery.tsx','src/app.tsx','src/components/sections/admin-editor.tsx'].map(path=>readFile(path,'utf8')))
 assert.match(gallery,/editing&&<button type="button" className=\{filter===UNLISTED_FILTER/)
 assert.match(gallery,/galleryFilterSummary\(filtered.length,listingTotal/)
 assert.match(app,/portfolio.projects.find\(p=>p.id===projectId\)/)
 assert.match(admin,/Visibilidade do projeto/)
})
