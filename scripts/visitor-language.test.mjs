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
const [gallery,hero,phrases]=await Promise.all([
 text('src/components/sections/gallery.tsx'),
 text('src/styles/gallery-hero-refinement.css'),
 text('src/lib/visitor-phrases.ts')
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
test('multi-line gallery copy and dynamic labels translate offline in Portuguese and Spanish',async()=>{
 const mod=await moduleFrom('src/lib/public-page-translation.ts')
 assert.equal(mod.localPhrase('A world of art,\nin every','pt'),'Um mundo de arte,\nem cada')
 assert.equal(mod.localPhrase('A world of art,\nin every','es'),'Un mundo de arte,\nen cada')
 assert.equal(mod.localPhrase('Dive into my 3D creations and discover the stories\nbehind each project.','pt'),'Explore minhas criações 3D e descubra as histórias\npor trás de cada projeto.')
 assert.equal(mod.localPhrase('Dive into my 3D creations and discover the stories\nbehind each project.','es'),'Explora mis creaciones 3D y descubre las historias\ndetrás de cada proyecto.')
 assert.equal(mod.localPhrase('View project The Haunted Catch','pt'),'Ver projeto The Haunted Catch')
 assert.equal(mod.localPhrase('Open full project: The Haunted Catch','es'),'Abrir proyecto completo: The Haunted Catch')
 const helper=await moduleFrom('src/lib/gallery-language.ts')
 assert.equal(helper.galleryFilterSummary(2,5,'All','pt'),'2 de 5 projetos · Todas as categorias · Pesquise também por software ou técnica.')
 assert.equal(helper.galleryFilterSummary(1,3,'Stylized','es'),'1 de 3 proyectos · Estilizado · También puedes buscar por software o técnica.')
 assert.match(gallery,/galleryFilterSummary\(/)
 assert.match(gallery,/translate="no"/)
 assert.match(app,/language=\{visitorLanguage\}/)
})
test('recent public controls use local translations without relying on the free API',async()=>{
 const {localPhrase}=await moduleFrom('src/lib/public-page-translation.ts')
 for(const phrase of ["New page","Home page","Specialties","Featured projects","The person behind the art","Testimonials","Previous testimonial","Next testimonial","Inspect comparison versions","✦ BEHIND THE ARTWORK","A visual look at the stages behind this project.","Creative process images","Process carousel controls","Previous process image","Next process image","Scroll or pinch to zoom · Drag to inspect · Tap outside to close · Esc to close","Zoom controls","Zoom out","Zoom level","Zoom in","Reset view","Close viewer","3D model not available — GLB or glTF link required.","INTERACTIVE 3D","Explore model","Loading interactive 3D model…","Open model source","Rotate · Zoom · Pan — 3D assets load only on request","VIDEO","16:9 CINEMATIC","Zoom","✦ ITEM DETAILS","Interactive gallery","Close details","Enlarge selected image","Loop on · Repeat this track","Loop off · Play next track"]){
  assert.ok(localPhrase(phrase,'pt'),'Missing Portuguese translation: '+phrase)
  assert.ok(localPhrase(phrase,'es'),'Missing Spanish translation: '+phrase)
 }
 assert.equal(localPhrase('Volume: 55%','pt'),'Volume: 55%')
 assert.equal(localPhrase('Volume: 55%','es'),'Volumen: 55%')
})
test('gallery hero bleeds to the viewport on every breakpoint and fades at bottom',()=>{
 assert.match(hero,/--gallery-hero-bleed:max\(34px/)
 assert.match(hero,/right:calc\(-1 \* var\(--gallery-hero-bleed\)\)/)
 assert.match(hero,/width:calc\(57% \+ var\(--gallery-hero-bleed\)\)/)
 assert.match(hero,/mask-composite:intersect/)
 assert.match(hero,/84%,transparent 100%/)
 assert.match(hero,/@media\(max-width:900px\)/)
 assert.match(hero,/@media\(max-width:600px\)/)
 assert.match(phrases,/Pesquise também por software ou técnica/)
})
test('public-only translation respects Studio, safe DOM updates and free-service limits',()=>{
 assert.match(translator,/\.editor-overlay/)
 assert.match(translator,/\.studio-dock/)
 assert.match(translator,/\.notranslate/)
 assert.match(translator,/\.language-switcher/)
 assert.match(translator,/NodeFilter\.SHOW_TEXT/)
 assert.match(translator,/attributeFilter:\['placeholder','aria-label','title','alt'\]/)
 assert.match(translator,/record.type==='attributes'/)
 assert.match(translator,/Jordan Ferrary/)
 assert.match(translator,/\['placeholder','aria-label','title','alt'\]/)
 assert.match(translator,/node\.nodeValue=replacement/)
 assert.match(translator,/MAX_DAY_CHARS=18000/)
 assert.match(translator,/MAX_DAY_CALLS=100/)
 assert.match(translator,/api\.mymemory\.translated\.net/)
 assert.match(translator,/setTimeout\(\(\)=>controller\.abort\(\),4200\)/)
 assert.doesNotMatch(translator,/\.innerHTML\s*=/)
})
test('language selector is part of the existing social controls and keeps the original theme',async()=>{
 await transform(ui,{loader:'tsx'})
 await transform(style,{loader:'css'})
 assert.match(ui,/aria-label=\{selectionLabels\[language\]/)
 assert.match(ui,/aria-expanded=\{open\}/)
 assert.match(ui,/aria-controls=\{menuId\}/)
 assert.match(ui,/aria-pressed=\{option.value===language\}/)
 assert.match(ui,/onChange\(option.value\)/)
 assert.match(ui,/onClick=\{\(\)=>setOpen\(value=>!value\)\}/)
 assert.doesNotMatch(ui,/<select(?:\s|>)/i)
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

test('PDF viewer and other public React portals are translated without scanning private Studio UI',async()=>{
 const {localPhrase}=await moduleFrom('src/lib/public-page-translation.ts')
 const pdf=await text('src/components/ui/pdf-zoom-viewer.tsx')
 const preview=await text('src/components/ui/pdf-page-preview.tsx')
 for(const phrase of [
  'PDF viewing controls','Previous PDF page','Next PDF page','PDF page number','Close PDF',
  'Loading certificate…','Unable to display this PDF. Check that the document is publicly accessible.',
  'Mouse wheel or pinch to zoom · Drag to inspect · Arrow keys to change PDF pages · Esc to close',
  'Click to inspect PDF','Loading PDF…','Preview unavailable','Open this document from the details panel'
 ]){
  assert.ok(localPhrase(phrase,'pt'),'Missing Portuguese translation: '+phrase)
  assert.ok(localPhrase(phrase,'es'),'Missing Spanish translation: '+phrase)
 }
 assert.equal(localPhrase('PDF viewer: ZBrush — Character','pt'),'Visualizador de PDF: ZBrush — Character')
 assert.equal(localPhrase('View certificate: Character design','es'),'Ver certificado: Character design')
 assert.equal(localPhrase('First page of PDF: ZBrush','pt'),'Primeira página do PDF: ZBrush')
 assert.equal(localPhrase('Page 2 of 12','pt'),'Página 2 de 12')
 assert.equal(localPhrase('Page 2 of 12','es'),'Página 2 de 12')
 assert.match(translator,/export function observePublicOverlayTranslation\(/)
 assert.match(translator,/\.art-lightbox/)
 assert.match(translator,/observer\.observe\(document\.body,\{childList:true\}\)/)
 assert.match(translator,/observePublicTranslation\(root,language\)/)
 assert.doesNotMatch(translator,/observePublicTranslation\(document\.body,language\)/)
 assert.match(app,/observePublicOverlayTranslation\(visitorLanguage\)/)
 assert.match(pdf,/PDF viewing controls/)
 assert.match(pdf,/Mouse wheel or pinch to zoom/)
 assert.match(preview,/First page of PDF/)
})

test('concise visitor copy keeps automatic language detection and local translations',async()=>{
 assert.doesNotMatch(ui,/language-switcher-note|Detected automatically/)
 const contact=await text('src/components/sections/contact-page.tsx')
 assert.doesNotMatch(contact,/contact-social-directory-footer|Links open directly/)
 const t=await moduleFrom('src/lib/public-page-translation.ts')
 assert.equal(t.localPhrase('BEHIND THE ARTWORK','pt'),'POR TRÁS DA OBRA')
 assert.equal(t.localPhrase('ITEM DETAILS','es'),'DETALLES DEL ELEMENTO')
 assert.equal(t.localPhrase('Choose a social platform and send me a message.','pt'),'Escolha uma rede social e me envie uma mensagem.')
})
