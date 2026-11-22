import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [picker,sidebar,icons,options,css,workflow]=await Promise.all([
 read('src/components/sections/custom-page-editor.tsx'),
 read('src/components/layout/sidebar.tsx'),
 read('src/lib/custom-page-icons.ts'),
 read('src/data/custom-pages.ts'),
 read('src/styles/custom-pages.css'),
 read('.github/workflows/deploy.yml')
])
test('visual icon chooser replaces native text-only select in page identity',()=>{
 assert.doesNotMatch(picker,/<label>Ícone da navegação<select/)
 assert.match(picker,/custom-page-icon-current-preview/)
 assert.match(picker,/<CurrentPageIcon size=\{22\}\/>/)
 assert.match(picker,/custom-page-icon-grid/)
 assert.match(picker,/custom-page-icon-choice/)
 assert.match(picker,/<Icon size=\{24\}\/>/)
 assert.match(picker,/Pesquisar ícones/)
 assert.match(picker,/normalize\('NFD'\)/)
 assert.match(picker,/aria-pressed=\{selected\}/)
 assert.match(picker,/aria-expanded=\{iconPickerOpen\}/)
 assert.match(picker,/if\(e\.key==='Escape'\)/)
})
test('picker and sidebar use one icon registry, retaining all 12 stored values',()=>{
 assert.match(picker,/import \{customPageIcons\} from '\.\.\/\.\.\/lib\/custom-page-icons'/)
 assert.match(sidebar,/import \{customPageIcons\} from '\.\.\/\.\.\/lib\/custom-page-icons'/)
 assert.match(sidebar,/customPageIcons\[item\.icon\]/)
 const values=[...options.matchAll(/\{value:'([^']+)',label:'[^']+'\}/g)].map(x=>x[1])
 assert.equal(values.length,12)
 for(const name of values)assert.match(icons,new RegExp('\\b'+name+':'))
 assert.match(options,/icon:iconSet\.has\(value\.icon\?\?''\)\?value\.icon!:'sparkles'/)
 assert.match(picker,/patch\(\{icon\}\)/)
 assert.match(picker,/setIconPickerOpen\(false\)/)
})
test('icon choices have responsive visual layout and use palette tokens',()=>{
 assert.match(css,/\.custom-page-settings \.custom-page-icon-grid/)
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/)
 assert.match(css,/@media\(max-width:440px\)/)
 assert.match(css,/--jf-primary/)
 assert.match(css,/--jf-secondary/)
 assert.match(workflow,/npm run test:page-icons/)
})

test('custom page order uses stable ids and remains editable from the sidebar and manager',async()=>{
 const [app,manager,store]=await Promise.all([
  read('src/app.tsx'),
  read('src/components/sections/custom-page-editor.tsx'),
  read('src/hooks/use-portfolio.ts')
 ])
 assert.match(options,/export function reorderCustomPages\(/)
 assert.match(options,/next\.splice\(to,0,moved\)/)
 assert.match(sidebar,/draggable=\{sortable\}/)
 assert.match(sidebar,/onReorderCustomPages\?\.\(from,item\.id\)/)
 assert.match(app,/portfolio\.setCustomPages\(reorderCustomPages\(portfolio\.customPages,fromId,toId\)\)/)
 assert.match(manager,/custom-pages-drag-handle/)
 assert.match(manager,/onPointerMove=\{movePagePointer\}/)
 assert.match(manager,/onDrop=\{event=>/)
 assert.match(manager,/onClick=\{\(\)=>movePage\(index,-1\)\}/)
 assert.match(store,/setCustomPages=\(customPages:CustomPage\[\]\)=>save/)
 assert.match(css,/\.custom-pages-entry\.page-sort-target/)
})

test('PDF certificates keep image covers optional and render safe external previews',async()=>{
 const [view,editor,helpers]=await Promise.all([
  read('src/components/sections/page-media-blocks.tsx'),
  read('src/components/sections/custom-page-editor.tsx'),
  read('src/lib/showcase-pdf.ts')
 ])
 assert.match(options,/documentUrl\?:string/)
 assert.match(options,/isShowcasePdfLink\(entry\.image\)/)
 assert.match(view,/<PdfPagePreview url=\{item\.documentUrl\|\|''\}/)
 assert.match(view,/artist-showcase-document-preview/)
 assert.doesNotMatch(view,/View full PDF/)
 assert.match(view,/<PdfZoomViewer key=\{zoomed.id\} url=\{zoomDocumentUrl\}/)
 assert.match(view,/className="artist-showcase-document-preview" onClick=\{\(\)=>setZoomedId\(current.id\)\}/)
 assert.match(view,/if\(!showcaseHasDetails\(item\)\)/)
 assert.match(view,/setZoomedId\(item.id\)/)
 assert.match(editor,/Link público do certificado PDF/)
 assert.match(editor,/custom-page-pdf-editor-preview/)
 assert.match(editor,/<PdfPagePreview url=\{item\.documentUrl\}/)
 assert.match(editor,/isShowcasePdfLink\(image\)/)
 assert.match(helpers,/drive\.google\.com/)
 assert.match(css,/\.artist-showcase-pdf-card/)
})
