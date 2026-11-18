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
