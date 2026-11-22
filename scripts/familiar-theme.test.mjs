import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const source=await read('src/lib/familiar-theme.ts')
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {themeFamiliarChrome,themeStudioModule,adaptFamiliarStyles}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js))
test('shadow chrome inherits live palette, robot art and semantic error remain unchanged',()=>{
 const css='.panel{background:linear-gradient(155deg,#302040,#161022);border:1px solid #ac80df99;color:#f6eeff}.chat-send{background:#6a3f9b;outline:2px solid var(--violet)}.character .orb-eye-glow{filter:drop-shadow(0 0 2px #83faffaf)}.affection-burst{color:#ffacd8}.panel .error{color:#ff4444}.content{scrollbar-color:#8a62ab #1b1426}'
 const result=themeFamiliarChrome(css)
 assert.match(result,/\.panel\{background:linear-gradient\(155deg,var\(--jf-studio-/)
 assert.match(result,/outline:2px solid var\(--jf-secondary,var\(--violet\)\)/)
 assert.match(result,/\.character \.orb-eye-glow\{filter:drop-shadow\(0 0 2px #83faffaf\)\}/)
 assert.match(result,/\.affection-burst\{color:#ffacd8\}/)
 assert.match(result,/\.panel \.error\{color:#ff4444\}/)
 assert.match(result,/scrollbar-color:var\(--jf-scroll-thumb\) var\(--jf-scroll-track\)/)
})
test('mount and remount adapt each shadow stylesheet only once',()=>{
 const style={textContent:'.thought{background:#2d1b42f5}',id:''}
 const root={querySelectorAll:()=>[style]}
 adaptFamiliarStyles(root)
 assert.match(style.textContent,/var\(--jf-studio-/)
 const previous=style.textContent
 adaptFamiliarStyles(root)
 assert.equal(style.textContent,previous)
 const next={textContent:'.panel{background:#241532}'}
 adaptFamiliarStyles({querySelectorAll:()=>[next]})
 assert.match(next.textContent,/var\(--jf-studio-/)
})
test('publisher and workbench inherit theme without changing authentication or status semantics',async()=>{
 const [publisher,workbench,integration]=await Promise.all(['src/styles/github-publish.css','src/styles/alquimago-studio-workbench.css','src/lib/alquimago-3d.ts'].map(read))
 assert.match(publisher,/\.github-publish-overview\{[^}]*var\(--jf-studio-/)
 assert.match(publisher,/\.github-token-vault\{[^}]*var\(--jf-studio-/)
 assert.match(publisher,/\.github-publish-progress-indicator\{[^}]*var\(--jf-primary\)/)
 assert.match(publisher,/\.github-publish-error\{[^}]*color:#ffd1e4/)
 assert.match(workbench,/\.jf-skin-tabs button\[aria-selected="true"\]\{[^}]*var\(--jf-/)
 assert.match(integration,/adaptFamiliarStyles\(root\)/)
 assert.match(integration,/new MutationObserver\(\(\)=>\{adaptFamiliarStyles\(root\)/)
 assert.match(integration,/scrollbar-color:var\(--jf-scroll-thumb\) var\(--jf-scroll-track\)!important/)
 assert.equal(themeStudioModule('.github-publish-error{background:#3d1930;color:#ffd1e4}'),'.github-publish-error{background:#3d1930;color:#ffd1e4}')
})
