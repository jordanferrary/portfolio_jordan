import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile,readdir} from 'node:fs/promises'
import {join} from 'node:path'

const root=new URL('../',import.meta.url)
const text=path=>readFile(new URL(path,root),'utf8')
const [dock,publisher,app,custom,publish,store,picker,media,optimize,creator]=await Promise.all([
 text('src/components/sections/studio-dock.tsx'),
 text('src/components/sections/github-publish-editor.tsx'),
 text('src/app.tsx'),
 text('src/components/sections/custom-page-editor.tsx'),
 text('src/lib/github-publish.ts'),
 text('src/hooks/use-portfolio.ts'),
 text('src/components/ui/asset-picker.tsx'),
 text('src/lib/media-store.ts'),
 text('src/lib/image-optimize.ts'),
 text('src/lib/github-token-vault.ts')
])

test('one Studio dock publish entry and token-only authorization',()=>{
 assert.equal((dock.match(/invoke\(onPublish\)/g)||[]).length,1)
 assert.match(dock,/studio-dock-publish/)
 assert.doesNotMatch(dock,/studio-hub-footer-publish|Revisar publicação/)
 assert.match(publisher,/const credential=viaAlquimago\?\(vaultStatus\.status==='ready'\?savedToken:''\):token\.trim\(\)/)
 assert.doesNotMatch(publisher,/GITHUB_WORKER_SESSION|session\.authenticated|hasGitHubLogin/)
 assert.match(publisher,/const check=await vault\.check\(credential\)/)
 assert.match(publisher,/if\(!viaAlquimago\)\{setVaultBusy\(false\);return\}/)
 assert.match(publisher,/if\(!viaAlquimago\|\|!token\.trim\(\)\|\|vaultBusy\|\|busy\)return/)
 assert.match(publisher,/\{viaAlquimago&&<div className="github-token-vault-actions">/)
 assert.match(publisher,/setToken\(''\);onClose\(\)/)
 assert.match(publisher,/finally\{setToken\(''\);setBusy\(false\)\}/)
 assert.match(app,/retireStudioSavedTokens\(\)/)
 assert.match(creator,/export async function retireStudioSavedTokens\(\)/)
 assert.match(creator,/githubTokenVault\.purge\(\)/)
 assert.match(creator,/legacy\.purge\(\)/)
 assert.match(publisher,/viaAlquimago\?alquimagoPublishTokenVault:githubTokenVault/)
 assert.match(publisher,/confirmed/)
 assert.match(app,/window\.addEventListener\('alquimago:request-publish',onAlquimagoPublish\)/)
 assert.match(app,/event\.detail\?\.source!=='chat'/)
 assert.match(app,/event\.detail\?\.action!=='review-only'/)
 assert.match(app,/if\(!editing\)return/)
 assert.match(app,/setPublishSource\('alquimago'\)/)
 assert.match(app,/entryPoint=\{publishSource\}/)
 assert.match(app,/publishSource==='studio'\?stagedMediaDeletions:\[\]/)
 assert.match(app,/alquimago:publish-auth-status/)
 assert.match(creator,/jf-local-studio-publisher-v2/)
 assert.match(creator,/databaseName:'alquimago-github-publisher-v1'/) // legacy cleanup only
 assert.match(creator,/alquimago-github-publisher-v2/)
 assert.match(creator,/ALQ-PUBLISH-PAT-V2/)
})

test('Showcase supports upload, library clip, backup, and publication',()=>{
 assert.match(custom,/block\.type==='showcase'/)
 const showcase=custom.slice(custom.indexOf("{block.type==='showcase'&&<div className"))
 assert.match(showcase,/<PageMediaField value=\{item\.image\}/)
 assert.match(custom,/<AssetClipButton folder=\{folder\}/)
 assert.match(custom,/saveUploadedMedia\(file,folder,slot\)/)
 assert.match(publish,/for\(const item of block\.showcaseItems\)item\.image=await stage\(item\.image,'image'\)/)
 assert.match(store,/for\(const item of block\.showcaseItems\?\?\[\]\)if\(isLocalMedia\(item\.image\)\)refs\.add\(item\.image\)/)
 assert.match(picker,/for\(const item of block\.showcaseItems\?\?\[\]\)/)
})

test('new media is converted, never stores original JPG/PNG and avoids concurrent copies',()=>{
 assert.match(media,/const optimized=await optimizeImage\(file\)/)
 assert.match(media,/optimized\.type!=='image\/webp'/)
 assert.match(media,/const hash=await fingerprint\(optimized\)/)
 assert.match(media,/pendingImageWrite\.then\(persist,persist\)/)
 assert.match(media,/same\.ref/)
 assert.match(media,/uniqueRef=PREFIX\+folderPath/)
 assert.match(media,/\.webp'/)
 assert.match(media,/await saveMediaBlob\(uniqueRef,optimized\)/)
 assert.doesNotMatch(media,/await saveMediaBlob\(uniqueRef,file\)/)
 assert.match(optimize,/canvas\.toBlob\(/)
 assert.match(optimize,/'image\/webp'/)
 assert.match(publish,/if\(kind==='image'&&blob\.type!=='image\/webp'\)/)
 assert.match(publish,/const relative=\(kind==='audio'\?'audio':'images'\)\+'\/studio\/\'\+sha/)
})

test('every persistent image upload input routes through WebP path',async()=>{
 const folders=['src/components/sections','src/components/ui']
 for(const folder of folders){
  const entries=await readdir(new URL(folder+'/',root))
  for(const file of entries.filter(name=>name.endsWith('.tsx'))){
   const src=await text(folder+'/'+file)
   if(!src.includes('type="file"')||!src.includes('image/'))continue
   // Dedicated converter only downloads WebP and never persists its source file.
   if(file==='image-converter.tsx')continue
   assert.ok(src.includes('saveUploadedMedia('),folder+'/'+file+' bypasses WebP persistence')
  }
 }
})

test('creative process template migrates once and is freely movable or removable',async()=>{
 const {build}=await import('esbuild')
 const result=await build({
  entryPoints:[new URL('../src/data/projects.ts',import.meta.url).pathname],
  bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent',
  define:{'import.meta.env.BASE_URL':'"/"'}
 })
 const {upgradeProcessTemplate}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const published=JSON.parse(await text('src/data/published-portfolio.json')).store
 const legacy=published.projects.find(project=>project.title==='Room of the Palhacito')
 assert.ok(legacy)
 assert.ok(legacy.blocks.some(block=>block.type==='gallery'))
 assert.equal(legacy.processSteps?.filter(step=>step.image?.trim()).length,4)
 const migrated=upgradeProcessTemplate(legacy)
 assert.equal(migrated.processTemplateMigrated,true)
 assert.equal(migrated.blocks.filter(block=>block.type==='process').length,1)
 assert.ok(migrated.blocks.findIndex(block=>block.type==='process')<migrated.blocks.findIndex(block=>block.type==='before-after'))
 assert.deepEqual(migrated.processSteps,legacy.processSteps)
 assert.equal(upgradeProcessTemplate(migrated).blocks.length,migrated.blocks.length)
 const removed={...migrated,blocks:migrated.blocks.filter(block=>block.type!=='process')}
 assert.equal(upgradeProcessTemplate(removed).blocks.some(block=>block.type==='process'),false)
})

test('process is part of editable composition and forms one row / mobile carousel',async()=>{
 const [page,carousel,styles,editor,store]=await Promise.all([
  text('src/components/sections/project-page.tsx'),
  text('src/components/sections/project-process.tsx'),
  text('src/styles/portfolio-review.css'),
  text('src/components/sections/admin-editor.tsx'),
  text('src/hooks/use-portfolio.ts')
 ])
 assert.match(page,/if\(block\.type==='process'\)return <ProjectProcess/)
 assert.match(page,/processSteps=\{project\.processSteps\}/)
 assert.doesNotMatch(page,/processImages\.length>0&&/)
 assert.match(store,/projects:projects\.map\(upgradeProcessTemplate\)/)
 assert.match(editor,/type:'process',label:'Processo criativo'/)
 assert.match(editor,/t\.type==='process'&&draft\.blocks\.some/)
 assert.match(editor,/if\(type==='process'&&draft\.blocks\.some/)
 assert.match(editor,/data-block-id=\{b\.id\}/)
 assert.match(carousel,/process-count-'\+Math\.min\(images\.length,4\)/)
 assert.match(carousel,/ref=\{scroller\} onScroll=\{syncPosition\}/)
 assert.match(carousel,/scrollTo\(\{left:cards\[target\]\.offsetLeft-first/)
 assert.match(carousel,/aria-label="Next process image"/)
 assert.match(carousel,/<ZoomableArt src=\{step\.image\}/)
 assert.match(styles,/grid-auto-flow:column/)
 assert.match(styles,/scroll-snap-type:x mandatory/)
 assert.match(styles,/\.process-count-4\{grid-auto-columns:calc\(\(100% - 42px\)\/4\)\}/)
 assert.match(styles,/@media\(max-width:680px\)/)
 assert.match(styles,/grid-auto-columns:calc\(100% - 20px\)/)
 assert.match(styles,/\.project-process-navigation\{display:flex\}/)
})

test('comparison inspection controls use responsive glass group and preserve separate lightboxes',async()=>{
 const [page,css]=await Promise.all([
  text('src/components/sections/project-page.tsx'),
  text('src/styles/media-extras.css')
 ])
 assert.match(page,/className="comparison-zoom-actions" role="group"/)
 assert.match(page,/onClick=\{\(\)=>setExpanded\('before'\)\}/)
 assert.match(page,/onClick=\{\(\)=>setExpanded\('after'\)\}/)
 assert.match(page,/expanded==='before'\?\(block\.media\?\?''\):\(block\.after\?\?''\)/)
 assert.match(page,/aria-label=\{'Inspect '\+\(block\.beforeLabel\?\?'Before'\)\}/)
 assert.match(page,/aria-label=\{'Inspect '\+\(block\.afterLabel\?\?'After'\)\}/)
 assert.match(css,/\.site-shell \.comparison-zoom-actions\{/)
 assert.match(css,/backdrop-filter:blur\(16px\) saturate\(140%\)/)
 assert.match(css,/color-mix\(in srgb,var\(--jf-border/)
 assert.match(css,/@media\(max-width:560px\)/)
 assert.match(css,/flex:1 1 50%/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})
