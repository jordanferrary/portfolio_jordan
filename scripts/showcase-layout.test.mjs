import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
import {fileURLToPath} from 'node:url'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [data,editor,view,pdf,zoom,css]=await Promise.all([
 read('src/data/custom-pages.ts'),read('src/components/sections/custom-page-editor.tsx'),
 read('src/components/sections/page-media-blocks.tsx'),read('src/components/ui/pdf-page-preview.tsx'),
 read('src/components/ui/pdf-zoom-viewer.tsx'),read('src/styles/custom-pages.css')
])
test('configurable columns are bounded, defaulted and persisted in custom page data',()=>{
 assert.match(data,/showcaseColumns\?:number/)
 assert.match(data,/showcaseExpandedColumns\?:number/)
 assert.match(data,/Math\.max\(1,Math\.min\(6,Math\.round\(block\.showcaseColumns\)\)\)/)
 assert.match(data,/Math\.max\(1,Math\.min\(3,Math\.round\(block\.showcaseExpandedColumns\)\)\)/)
 assert.match(editor,/Colunas com a galeria fechada/)
 assert.match(editor,/Colunas com detalhes abertos/)
 assert.match(view,/--showcase-columns/)
 assert.match(view,/--showcase-open-columns/)
 assert.match(css,/repeat\(var\(--showcase-columns,3\)/)
 assert.match(css,/repeat\(var\(--showcase-open-columns,2\)/)
})
test('portrait PDF previews fill the detail width and can be enlarged',()=>{
 assert.match(view,/<button type="button" className="artist-showcase-document-preview" onClick=\{\(\)=>setZoomedId\(current.id\)\}/)
 assert.match(view,/<PdfZoomViewer key=\{zoomed.id\} url=\{zoomDocumentUrl\}/)
 assert.doesNotMatch(view,/View full PDF/)
 assert.match(css,/\.artist-showcase\.is-open\{grid-template-columns:minmax\(0,1fr\) minmax\(265px,340px\)/)
 assert.match(css,/\.artist-showcase-document-preview\{display:block;width:100%/)
 assert.match(css,/\.artist-showcase-card:has\(\.artist-showcase-pdf-card\)/)
 assert.match(css,/\.pdf-page-preview-card\{background:#fff\}/)
 assert.match(pdf,/mode==='zoom'\?2400/)
 assert.match(zoom,/createPortal/)
 assert.match(zoom,/await pdf\.getPage\(pageNumber\)/)
 assert.match(zoom,/onPointerMove=\{pointerMove\}/)
 assert.match(zoom,/onWheel=\{wheel\}/)
 assert.match(zoom,/onDoubleClick/)
 assert.match(zoom,/setPageNumber\(n=>clamp/)
 assert.doesNotMatch(zoom,/Full PDF/)
})

test('custom page footer reaches the end without duplicate bottom spacing',()=>{
 assert.match(css,/\.site-main:has\(> \.custom-page\)\{\s*display:flex;\s*flex-direction:column;\s*min-height:100vh;\s*min-height:100dvh;/)
 assert.match(css,/\.site-main>\.custom-page\{[^}]*flex:1 0 auto;[^}]*padding-bottom:0;/)
 assert.match(css,/\.custom-page>\.custom-page-body\{width:100%;flex:1 0 auto\}/)
 assert.match(css,/\.custom-page>\.custom-page-footer\{[^}]*margin:clamp\(38px,5vh,65px\) 0 0;/)
 assert.match(css,/--jf-page-end-clearance:calc\(92px \+ env\(safe-area-inset-bottom,0px\)\)/)
})

test('showcase opens media directly unless the item has meaningful extra details',async()=>{
 const result=await build({entryPoints:[fileURLToPath(new URL('../src/data/custom-pages.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',define:{'import.meta.env.BASE_URL':'"/"'}})
 const {showcaseHasDetails}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
 const item={id:'test',image:'',name:'Certificate',description:'',portfolioUrl:'',documentUrl:'https://example.com/cert.pdf',showLink:false}
 for(const fields of [{},{description:'  '},{portfolioUrl:'https://example.com',showLink:false},{portfolioUrl:'javascript:alert(1)',showLink:true},{showLink:true}]){
  assert.equal(showcaseHasDetails({...item,...fields}),false)
 }
 for(const fields of [{description:'Course information'},{portfolioUrl:'https://example.com',showLink:true},{portfolioUrl:'#/portfolio',showLink:undefined}]){
  assert.equal(showcaseHasDetails({...item,...fields}),true)
 }
 assert.match(view,/if\(!showcaseHasDetails\(item\)\)\{\s*setSelectedId\(null\)\s*setZoomedId\(item.id\)\s*return/)
 assert.match(view,/aria-haspopup=\{hasDetails\?undefined:'dialog'\}/)
 assert.match(view,/\{zoomed&&<Suspense/)
 assert.match(view,/<ArtLightbox key=\{zoomed.id\} src=\{zoomed.image\}/)
 assert.match(view,/\{current&&<aside className="artist-showcase-detail"/)
 const published=JSON.parse(await read('src/data/published-portfolio.json'))
 const page=published.store.customPages.find(p=>p.navLabel==='Certifications')
 assert.ok(page)
 for(const entry of page.blocks.flatMap(b=>b.showcaseItems??[])){
  assert.equal(showcaseHasDetails(entry),false)
 }
})
