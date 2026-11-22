import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const [publicCss,studio,scroll,base,home,compare,theme]=await Promise.all(['src/styles/theme-coverage.css','src/styles/studio-palette-coverage.css','src/styles/scroll-controls.css','src/styles/globals.css','src/styles/home-revision.css','src/styles/revision.css','src/lib/theme-palette.ts'].map(read))
test('category vectors and Home project arrow inherit palette without tinting custom art',()=>{
 assert.match(base,/\.chips svg\{[^}]*color:currentColor/)
 assert.match(publicCss,/\.category-badge\) svg\{\s*color:currentColor!important;/)
 assert.match(home,/\.work-arrow\{[^}]*background:color-mix\(in srgb,var\(--jf-surface-tint\)/)
 assert.match(publicCss,/\.home-work-link \.work-arrow\{[^}]*var\(--jf-border\)/)
})
test('comparison and Studio surfaces use the current palette',()=>{
 assert.match(compare,/\.compare-line span\{[^}]*background:var\(--jf-primary\)/)
 assert.match(publicCss,/\.compare-line span\{[^}]*var\(--jf-on-primary,var\(--jf-text\)\)/)
 assert.match(studio,/\.studio-hub-welcome\{[^}]*var\(--jf-studio-raised\)/)
 assert.match(studio,/\.studio-hub-nav-item.selected\{box-shadow:inset 3px 0 var\(--jf-secondary\)/)
 assert.match(studio,/\.studio-hub-footer\{background:var\(--jf-studio-deep\)/)
})
test('scrollbar chrome has no fixed violet and uses the same tokens inside Studio',()=>{
 const chrome=scroll.split('/* Explicitly remove native square range UI')[0]
 assert.doesNotMatch(chrome,/#[0-9a-f]{3,8}\b/i)
 assert.match(chrome,/::-webkit-scrollbar-thumb\{\s*background:var\(--jf-scroll-thumb\)/)
 assert.match(studio,/scrollbar-color:var\(--jf-scroll-thumb\) var\(--jf-scroll-track\)/)
})
test('comparison handle foreground contrasts against the editable primary color',async()=>{
 const js=ts.transpileModule(theme,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
 const {applyThemePalette,contrastRatio,DEFAULT_THEME}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js))
 const values=new Map(),previous=globalThis.document
 try{
  globalThis.document={documentElement:{style:{setProperty:(k,v)=>values.set(k,v)}}}
  for(const primary of ['#A234FA','#FF8145','#3D91FF','#000000','#FFFFFF','#777777']){
   applyThemePalette({...DEFAULT_THEME,primary})
   assert.ok(contrastRatio(values.get('--jf-on-primary'),primary)>=4.5)
  }
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}
})

test('access dialog, player hover, rich text and sidebar use live tokens',async()=>{
 const [coverage,studio,custom,polish,composer,about]=await Promise.all(['src/styles/theme-coverage.css','src/styles/studio-palette-coverage.css','src/styles/custom-pages.css','src/styles/polish.css','src/components/ui/text-composer.tsx','src/components/sections/about-editor.tsx'].map(read))
 assert.match(coverage,/\.gate-card\{[^}]*var\(--jf-studio-panel\)/)
 assert.match(coverage,/\.music-widget \.music-main-toggle:hover:not\(:disabled\)\{[^}]*var\(--jf-primary\)/)
 assert.match(coverage,/\.music-cover-button\{[^}]*var\(--jf-primary-glow\)/)
 assert.match(custom,/scrollbar-color:var\(--jf-scroll-thumb\) transparent/)
 assert.match(studio,/\.studio-hub-count\{[^}]*var\(--jf-studio-raised\)/)
 assert.match(studio,/\.composer-live-preview,[^{}]*\{[^}]*var\(--jf-studio-deep\)/)
 assert.match(studio,/\.local-warning\{[^}]*var\(--jf-studio-wash\)/)
 assert.match(studio,/\.about-editor-image-actions>button/)
 assert.doesNotMatch(composer,/roxo/i)
 assert.doesNotMatch(about,/roxo/i)
 assert.doesNotMatch(polish.match(/\.music-main-toggle:hover:not\(:disabled\)\{[^}]+\}/)?.[0]??'',/#[0-9a-f]{3,8}\b|rgba\(/i)
})

test('shared eyebrow icons inherit the current label color, including publication headers',()=>{
 assert.match(base,/\.eyebrow svg\{color:currentColor\}/)
 assert.match(studio,/\.editor-overlay \.eyebrow svg,\s*\.gate-card \.eyebrow svg\{color:currentColor;stroke:currentColor\}/)
})

test('JF logo uses the exact original Figma paths, editable theme colors and published settings',async()=>{
 const [source,mark,appearance,sidebar,editor,hook,app,publish,css]=await Promise.all([
  'public/images/logo/JF.svg',
  'src/components/ui/brand-mark.tsx',
  'src/lib/brand-logo-appearance.ts',
  'src/components/layout/sidebar.tsx',
  'src/components/sections/brand-logo-editor.tsx',
  'src/hooks/use-portfolio.ts',
  'src/app.tsx',
  'src/lib/github-publish.ts',
  'src/styles/brand-logo.css'
 ].map(read))
 const paths=value=>Array.from(value.matchAll(/<path d="([^"]+)"/g),match=>match[1])
 assert.deepEqual(paths(mark),paths(source),'the brand must retain both exact Figma vector shapes')
 assert.match(mark,/--jf-brand-primary/)
 assert.match(mark,/--jf-brand-secondary/)
 assert.match(appearance,/mode:'auto'/)
 assert.match(appearance,/normalizeHexColor/)
 assert.match(appearance,/--jf-brand-glow-strength/)
 assert.match(sidebar,/brandLogoStyle\(siteLogoAppearance\)/)
 assert.match(sidebar,/<BrandMark\/>/)
 assert.match(editor,/ChromaticPicker/)
 assert.ok(editor.includes('theme-palette-editor.css'))
 assert.match(editor,/patchAppearance\(\{mode:'auto'\}\)/)
 assert.match(editor,/patchAppearance\(\{mode:'custom'\}\)/)
 assert.match(hook,/siteLogoAppearance:normalizeBrandLogoAppearance\(values.siteLogoAppearance\)/)
 assert.match(app,/siteLogoAppearance=\{portfolio.siteLogoAppearance\}/)
 assert.match(publish,/siteLogoAppearance:store.siteLogoAppearance/)
 assert.match(css,/\.brand-logo-display \.brand-logo-vector/)
})

test('JF logo hover and focus preserve palette-driven glow including custom color and zero strength',async()=>{
 const css=await read('src/styles/brand-logo.css')
 const appearance=await read('src/lib/brand-logo-appearance.ts')
 assert.equal((css.match(/filter:drop-shadow\\(0 0 8px color-mix\\(in srgb,var\\(--jf-brand-glow/g)||[]).length,2)
 assert.doesNotMatch(css,/#b246ff78|#a132ff65|#9c2fff/i)
 assert.match(css,/--jf-brand-glow-strength/)
 assert.match(appearance,/--jf-brand-glow-strength/)
 assert.match(appearance,/value.mode==='auto'/)
})
