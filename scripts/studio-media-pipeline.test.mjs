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

test('creative process appears for editorial projects without replacing their gallery',async()=>{
 const [page,styles,editor,publishedRaw]=await Promise.all([
  text('src/components/sections/project-page.tsx'),
  text('src/styles/portfolio-review.css'),
  text('src/components/sections/admin-editor.tsx'),
  text('src/data/published-portfolio.json')
 ])
 const project=JSON.parse(publishedRaw).store.projects.find(item=>item.title==='Room of the Palhacito')
 assert.ok(project,'Published project fixture should exist')
 assert.ok(project.blocks.some(block=>block.type==='gallery'))
 assert.equal(project.processSteps?.filter(step=>step.image?.trim()).length,4)
 assert.match(page,/className="project-artwork-process project-process-section"/)
 assert.equal((page.match(/processImages\.length>0&&/g)||[]).length,1,'Process is rendered once only')
 assert.ok(page.indexOf('project-process-section')>page.indexOf('needsArtworkShowcase&&<section'),'Process must not be gated by the fallback artwork block')
 assert.match(page,/processImages\.map\(\(step,index\)=>/)
 assert.match(page,/typeof step\.image==='string'&&step\.image\.trim\(\)\.length>0/)
 assert.match(page,/<ZoomableArt src=\{step\.image\}/)
 assert.match(page,/project-process-index/)
 assert.match(styles,/\.site-shell \.project-process-section/)
 assert.match(styles,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
 assert.match(styles,/@media\(max-width:680px\)/)
 assert.match(editor,/mesmo quando houver galeria, vídeo ou comparador/)
})
