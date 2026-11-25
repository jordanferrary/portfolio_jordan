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

test('Material sliders use shared real CSS paint and separate icon radius',async()=>{
 const [controls,editor,style]=await Promise.all(['src/lib/studio-controls.ts','src/components/sections/studio-controls-editor.tsx','src/styles/studio-controls.css'].map(p=>readFile(new URL('../'+p,import.meta.url),'utf8')))
 assert.match(controls,/iconRadius:integer\(v.iconRadius,0,200,100\)/)
 assert.match(editor,/studio-material-preview/)
 assert.match(editor,/draft\[device\].glassOpacity\/100/)
 assert.match(style,/\.side-link \.side-icon\{border-radius:calc\(22px \* var\(--jf-control-icon-radius,1\)\)!important/)
 assert.match(style,/\.studio-material-icon,.studio-material-pill\{[^}]*background:var\(--jf-liquid-clear\)/)
 assert.match(style,/--jf-control-opacity:var\(--jf-mobile-glassOpacity,1\)/)
 const material=await readFile(new URL('../src/styles/liquid-glass-buttons.css',import.meta.url),'utf8')
 assert.match(material,/:root,.studio-material-preview\{/)
 assert.match(material,/--jf-liquid-fill:clamp\(0%,calc\(62% \* var\(--jf-control-opacity,1\)\),93%\)/)
 assert.match(material,/--jf-liquid-tint-fill:clamp\(0%,calc\(66% \* var\(--jf-control-opacity,1\)\),99%\)/)
 assert.match(material,/color-mix\(in srgb,var\(--jf-surface\) var\(--jf-liquid-fill\),transparent\)/)
 assert.match(material,/color-mix\(in srgb,var\(--jf-primary\) var\(--jf-liquid-tint-fill\),transparent\)/)
 assert.match(style,/\.studio-material-pattern\{[^}]*24% 45%/)
 assert.doesNotMatch(style,/\.studio-material-sample\{[^}]*isolation:isolate/)
 assert.match(material,/calc\(47% \* var\(--jf-control-sheen,1\)\)/)
})

test('scrollable sidebar reserves glow space without shifting icons or changing mobile layout',async()=>{
 const content=await readFile(new URL('../src/styles/custom-pages.css',import.meta.url),'utf8')
 assert.match(content,/\.sidebar \.side-nav\{[\s\S]*?width:calc\(100% \+ 48px\);/)
 assert.match(content,/margin:6px -24px 0;/)
 assert.match(content,/padding:22px 24px 26px;/)
 assert.match(content,/overflow-y:auto;overflow-x:hidden;/)
 assert.match(content,/@media\(max-width:600px\)\{\.sidebar \.side-nav\{[^}]*width:auto;margin:0 5px;[^}]*overflow-x:auto;overflow-y:hidden;/)
})

 test('material design preview is independent from the visitor transparency preference',async()=>{
 const [style,editor,controls]=await Promise.all([file('src/styles/studio-controls.css'),file('src/components/sections/studio-controls-editor.tsx'),file('src/lib/studio-controls.ts')])
 assert.doesNotMatch(style,/@media\(prefers-reduced-transparency:reduce\)\{\s*\.studio-material-preview/)
 assert.match(style,/:root:not\(\[data-jf-glass-override="true"\]\)/)
 assert.match(css,/:root:not\(\[data-jf-glass-override="true"\]\)/)
 assert.match(editor,/matchMedia\('\(prefers-reduced-transparency: reduce\)'\)/)
 assert.match(editor,/setLocalGlassOverride\(e.target.checked\)/)
 assert.match(controls,/localStorage\.setItem\(LOCAL_GLASS_OVERRIDE,String\(enabled\)\)/)
 assert.doesNotMatch(controls,/glassOverride:boolean/)
})
