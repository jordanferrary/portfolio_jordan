import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
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
 assert.match(view,/<button type="button" className="artist-showcase-document-preview" onClick=\{\(\)=>setZoom\(true\)\}/)
 assert.match(view,/<PdfZoomViewer url=\{documentUrl\}/)
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
