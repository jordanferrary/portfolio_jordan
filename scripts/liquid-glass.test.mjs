import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {transform} from 'esbuild'

const file=async path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const [css,main,palette,editor]=await Promise.all([
 file('src/styles/liquid-glass-buttons.css'),
 file('src/main.tsx'),
 file('src/lib/theme-palette.ts'),
 file('src/components/sections/theme-palette-editor.tsx')
])
test('glass stylesheet is syntactically valid and minifies',async()=>{
 const output=await transform(css,{loader:'css',minify:true,logLevel:'silent'})
 assert.ok(output.code.length>200)
 assert.ok(output.code.length<20000,'Do not add a large runtime or inline images for decorative glass')
})
test('glass layers depend only on configurable palette colors',()=>{
 for(const key of ['primary','secondary','background','surface','text','border'])
  assert.ok(css.includes('var(--jf-'+key+')'),'Missing live palette token '+key)
 assert.match(css,/--jf-liquid-clear:/)
 assert.match(css,/--jf-liquid-tinted:/)
 assert.match(css,/color-mix\(/)
 assert.doesNotMatch(css,/url\(\s*["']?data:/)
 assert.doesNotMatch(css,/#[a-fA-F0-9]{3,8}\b/,'Avoid hard-coded colors in glass material')
})
test('glass styles load after palette coverage and reflect all Studio palette changes',()=>{
 const paletteImport=main.indexOf("import './styles/theme-coverage.css'")
 const glassImport=main.indexOf("import './styles/liquid-glass-buttons.css'")
 assert.ok(paletteImport>=0&&glassImport>paletteImport)
 assert.match(palette,/for\(const field of PALETTE_FIELDS\)target\.setProperty\('--jf-'\+field\.key,palette\[field\.key\]\)/)
 assert.match(editor,/theme-mini-glass-primary/)
 assert.match(editor,/theme-mini-glass-secondary/)
 assert.doesNotMatch(editor,/theme-mini-action" style=\{\{background:draft\.primary\}\}/)
})
test('material is scoped to controls, responsive, and honors accessibility',()=>{
 assert.match(css,/\.site-shell :is\(/)
 assert.match(css,/\.studio-dock /)
 assert.match(css,/\.site-shell \.side-link\.current \.side-icon/)
 assert.match(css,/@supports not \(\(backdrop-filter:/)
 assert.match(css,/@media\(max-width:640px\)/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/@media \(prefers-reduced-transparency:reduce\)/)
 assert.match(css,/:focus-visible/)
 assert.match(css,/:disabled/)
 assert.doesNotMatch(css,/^\s*button\s*\{/m,'Never style every button globally')
})
