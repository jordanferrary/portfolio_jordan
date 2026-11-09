import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {build,transform} from 'esbuild'

const text=async name=>readFile(new URL('../'+name,import.meta.url),'utf8')
async function moduleFrom(entry){
 const built=await build({entryPoints:[entry],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'})
 const code=built.outputFiles[0].text
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
}
const [geo,translator,ui,app,social,style]=await Promise.all([
 text('src/lib/visitor-language.ts'),
 text('src/lib/public-page-translation.ts'),
 text('src/components/layout/language-switcher.tsx'),
 text('src/app.tsx'),
 text('src/components/layout/social-bar.tsx'),
 text('src/styles/visitor-language.css')
])
test('IP country chooses a supported visitor language with sensible fallback',async()=>{
 const lang=await moduleFrom('src/lib/visitor-language.ts')
 assert.equal(lang.languageFromCountry('BR'),'pt')
 assert.equal(lang.languageFromCountry('PT'),'pt')
 assert.equal(lang.languageFromCountry('MX'),'es')
 assert.equal(lang.languageFromCountry('AR'),'es')
 assert.equal(lang.languageFromCountry('US'),'en')
 assert.equal(lang.languageFromCountry('DE'),'en')
 assert.equal(lang.languageFromBrowser(['pt-BR','en-US']),'pt')
 assert.equal(lang.languageFromBrowser(['es-MX']),'es')
 assert.equal(lang.languageFromBrowser(['fr-FR','en-US']),'en')
})
test('no token, no IP collection, and manual language always has priority',()=>{
 assert.match(geo,/https:\/\/ipwho\.is\/\?fields=success,country_code/)
 assert.match(geo,/credentials:'omit'/)
 assert.match(geo,/referrerPolicy:'no-referrer'/)
 assert.match(geo,/const GEO_TTL=7\*24\*60\*60\*1000/)
 assert.match(geo,/saveLanguageChoice/)
 assert.match(app,/if\(savedLanguage\(\)\)return/)
 assert.match(app,/!savedLanguage\(\)\)setVisitorLanguage/)
 assert.doesNotMatch(geo,/navigator\.geolocation/)
})
test('human translations for existing public copy are available offline',async()=>{
 const t=await moduleFrom('src/lib/public-page-translation.ts')
 assert.equal(t.localPhrase('The artist','pt'),'O artista')
 assert.equal(t.localPhrase('Featured Projects','pt'),'Projetos em destaque')
 assert.equal(t.localPhrase('Explore the portfolio','es'),'Explorar el portafolio')
 assert.equal(t.localPhrase('Home','en'),'Home')
 assert.equal(t.localPhrase('Jordan Ferrary','pt'),null)
})
test('public-only translation respects Studio, safe DOM updates and free-service limits',()=>{
 assert.match(translator,/\.editor-overlay/)
 assert.match(translator,/\.studio-dock/)
 assert.match(translator,/\.notranslate/)
 assert.match(translator,/\.language-switcher/)
 assert.match(translator,/NodeFilter\.SHOW_TEXT/)
 assert.match(translator,/node\.nodeValue=replacement/)
 assert.match(translator,/MAX_DAY_CHARS=3900/)
 assert.match(translator,/MAX_DAY_CALLS=35/)
 assert.match(translator,/api\.mymemory\.translated\.net/)
 assert.match(translator,/setTimeout\(\(\)=>controller\.abort\(\),4200\)/)
 assert.doesNotMatch(translator,/\.innerHTML\s*=/)
})
test('language selector is part of the existing social controls and keeps the original theme',async()=>{
 await transform(ui,{loader:'tsx'})
 await transform(style,{loader:'css'})
 assert.match(ui,/aria-label=\{'Alterar idioma do portfólio/)
 assert.match(ui,/aria-expanded=\{open\}/)
 assert.match(ui,/aria-controls=\{menuId\}/)
 assert.match(ui,/aria-pressed=\{option.value===language\}/)
 assert.match(ui,/onChange\(option.value\)/)
 assert.match(ui,/onClick=\{\(\)=>setOpen\(value=>!value\)\}/)
 assert.doesNotMatch(ui,/<select\b/)
 assert.match(social,/<LanguageSwitcher language=\{language\}/)
 assert.match(app,/observePublicTranslation\(root,visitorLanguage\)/)
 assert.match(app,/document\.documentElement\.lang=/)
 assert.match(style,/var\(--jf-text\)/)
 assert.match(style,/@media\(max-width:750px\)/)
})

test('manual language dropdown is easy to dismiss on desktop and mobile',()=>{
 assert.match(ui,/document.addEventListener\('pointerdown',onPointer\)/)
 assert.match(ui,/document.addEventListener\('focusin',onFocus\)/)
 assert.match(ui,/document.addEventListener\('keydown',onKey\)/)
 assert.match(ui,/event.key==='Escape'/)
 assert.match(ui,/trigger.current\?\.focus\(\)/)
 assert.match(ui,/setOpen\(false\)/)
 assert.match(ui,/className="language-switcher-menu"/)
 assert.match(style,/border-radius:50%/)
 assert.match(style,/position:absolute/)
 assert.match(style,/right:0/)
 assert.match(style,/--jf-secondary/)
 assert.match(style,/prefers-reduced-motion:reduce/)
 assert.match(style,/prefers-reduced-transparency:reduce/)
 assert.doesNotMatch(style,/\.language-switcher select/)
})
