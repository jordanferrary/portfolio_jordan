import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const [css,entry,about,contact,gallery,home]=await Promise.all([
 read('src/styles/page-layout-consistency.css'),
 read('src/main.tsx'),
 read('src/components/sections/about-page.tsx'),
 read('src/components/sections/contact-page.tsx'),
 read('src/components/sections/gallery.tsx'),
 read('src/components/sections/home-page.tsx')
])
test('all four visitor routes share one page-width baseline',()=>{
 assert.match(entry,/import '\.\/styles\/page-layout-consistency\.css'/)
 for(const name of ['home-dashboard','gallery-page','about-page','contact-social-page'])
  assert.ok(css.includes('.'+name),'Missing page baseline: '+name)
 assert.match(css,/--jf-page-layout-max:var\(--jf-desktop-width,1470px\)/)
 assert.match(css,/max-width:var\(--jf-page-layout-max\)!important/)
 assert.match(css,/\.site-shell \.gallery-heading\{margin-left:0!important\}/)
 assert.match(css,/\.site-shell\.contact-route \.contact-social-page\{padding-inline:0!important\}/)
 assert.match(css,/\.site-shell\.about-route \.about-page\{padding-inline:0!important\}/)
 assert.match(css,/max-width:1330px/)
})
test('public pages share one responsive semantic type scale',()=>{
 assert.match(css,/--jf-page-display:clamp\(38px,3\.45vw,60px\)/)
 assert.match(css,/--jf-page-display:clamp\(34px,8\.4vw,48px\)/)
 assert.match(css,/--jf-page-section:clamp\(24px,2\.05vw,34px\)/)
 assert.match(css,/--jf-page-description:clamp\(15px,1vw,17px\)/)
 assert.match(css,/\.home-intro,\.gallery-heading,\.about-page-header,\.contact-social-intro,\.custom-page-hero-content,\.project-hero-content\)>h1/)
 assert.match(css,/font-size:calc\(var\(--jf-page-display\) \* var\(--jf-heading-scale,1\)\)!important/)
 assert.match(css,/font-size:calc\(var\(--jf-page-section\) \* var\(--jf-heading-scale,1\)\)!important/)
 assert.match(css,/font-size:calc\(var\(--jf-page-description\) \* var\(--jf-body-scale,1\)\)!important/)
 assert.match(css,/@media\(max-width:750px\)/)
 assert.match(css,/@media\(min-width:751px\) and \(max-width:1099px\)/)
 assert.match(css,/overflow:visible!important/)
 assert.match(contact,/className="contact-social-intro"/)
 assert.match(about,/className="about-page-header"/)
 assert.match(gallery,/className="gallery-heading"/)
 assert.match(home,/className="home-intro"/)
})
test('gallery banner still bleeds right and fades after shared-width changes',()=>{
 assert.match(css,/--gallery-hero-bleed:calc\(34px \+ max\(0px,\(100vw - \(var\(--jf-page-layout-max\) \+ 209px\)\) \/ 2\)\)/)
 const idx=entry.indexOf("import './styles/gallery-hero-refinement.css'")
 const late=entry.indexOf("import './styles/page-layout-consistency.css'")
 assert.ok(idx>=0&&late>idx,'Shared content width must override the earlier gallery bleed calculation')
 assert.match(css,/\.site-shell \.gallery-page\{padding-top:clamp\(88px,8\.7vh,108px\)\}/)
})

test('About uses one editorial grid and keeps the secondary artwork outside the portrait',()=>{
 assert.match(about,/<header className="about-page-header">/)
 assert.match(about,/<div className="about-identity">[\s\S]*?className="about-art-secondary"/)
 assert.doesNotMatch(about,/The person behind the art/)
 assert.match(css,/grid-template-areas:"portrait header" "portrait information"/)
 assert.match(css,/grid-template-areas:"header" "portrait" "information"/)
 assert.match(css,/\.about-art-secondary\{\s*position:static/)
 // The original about-image skin must not introduce a 1px line on the identity mark.
 const identity=css.slice(css.indexOf('.site-shell.about-route .about-art-secondary{'))
 const identityRule=identity.slice(0,identity.indexOf('}'))
 assert.match(identityRule,/object-fit:cover;object-position:center;border:0!important;background:transparent;/)
 assert.doesNotMatch(identityRule,/object-fit:contain/)
 assert.doesNotMatch(identityRule,/border-width:\s*[12]px/)
 assert.match(css,/\.about-information\{\s*grid-area:information;[\s\S]*?border:0!important/)
})

test('Contact centers its complete grid, retains social links and equalizes card accents',()=>{
 assert.match(css,/\.contact-social-layout\{\s*flex:0 0 auto;display:grid;\s*grid-template-columns:minmax\(0,1\.05fr\) minmax\(0,\.95fr\);\s*width:100%;max-width:1330px;margin-inline:auto;/)
 assert.match(css,/\.contact-social-card-featured:before\{display:none\}/)
 assert.match(css,/\.contact-social-directory \.contact-social-card-icon\{[\s\S]*?background:var\(--jf-primary-soft\)/)
 assert.match(contact,/channels\.map/)
 assert.match(contact,/target="_blank" rel="noopener noreferrer"/)
 assert.doesNotMatch(contact,/contact-social-atmosphere/)
})

test('custom pages use one width baseline and PDF captions do not darken documents',async()=>{
 const view=await read('src/components/sections/custom-page.tsx')
 const galleryView=await read('src/components/sections/page-media-blocks.tsx')
 assert.match(view,/cleanHeadingText\(page.eyebrow\)&&/)
 assert.doesNotMatch(view,/page.eyebrow\|\|'CREATIVE SPACE'/)
 assert.match(css,/\.site-main>\.custom-page-wide\{--jf-custom-width:var\(--jf-page-layout-max\)\}/)
 assert.match(css,/\.custom-page>\.custom-page-body\{\s*max-width:none;padding:clamp/)
 assert.match(css,/\.artist-showcase-card:has\(\.artist-showcase-pdf-card\)::after\{display:none\}/)
 assert.match(css,/\.artist-showcase-card:has\(\.artist-showcase-pdf-card\)>span\{\s*position:relative/)
 assert.match(galleryView,/--showcase-columns/)
 assert.match(galleryView,/--showcase-open-columns/)
 assert.match(galleryView,/<PdfZoomViewer key=\{zoomed.id\} url=\{zoomDocumentUrl\}/)
})

test('mobile gallery banner starts at the top with floating social controls and a single fade mask',async()=>{
 const hero=await read('src/styles/gallery-hero-refinement.css')
 const mobile=hero.slice(hero.indexOf('@media(max-width:600px)'))
 assert.match(mobile,/\.site-main:has\(>\.gallery-page\)>\.socials\{\s*position:absolute;/)
 assert.match(mobile,/\.gallery-banner\{\s*top:0;left:calc\(-1 \* var\(--gallery-hero-bleed\)\);/)
 assert.match(mobile,/right:calc\(-1 \* var\(--gallery-hero-bleed\)\);width:auto;/)
 assert.match(mobile,/mask-image:linear-gradient\(180deg,#000 0%,#000 45%,transparent 100%\);/)
 assert.doesNotMatch(mobile,/mask-composite:intersect|mask-composite:source-in/)
 assert.match(mobile,/\.gallery-heading\{\s*height:auto;min-height:220px;/)
 assert.match(gallery,/sizes="\(max-width: 600px\) 100vw/)
 assert.match(gallery,/distributeMasonry\(filtered,columnCount\)/)
})

test('gallery search keeps focus feedback on the rounded outer field only',()=>{
 assert.match(css,/\.search input:focus,\s*\.site-shell \.gallery-page \.search input:focus-visible\{\s*outline:none;outline-offset:0;box-shadow:none;/)
 assert.match(css,/\.gallery-page \.search:focus-within\{\s*border-color:var\(--jf-primary\)!important;/)
 assert.match(css,/\.search:has\(input:focus-visible\)\{\s*outline:2px solid var\(--jf-secondary\)/)
})

test('Home feature grid fills available space for fewer projects without changing selection',()=>{
 assert.match(home,/data-featured-count=\{featured.length\}/)
 assert.match(home,/getFeaturedProjects\(/)
 assert.match(css,/\.home-featured-cards\[data-featured-count="2"\]\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
 assert.match(css,/\.home-featured-cards\[data-featured-count="1"\]\{grid-template-columns:minmax\(0,1fr\)/)
 assert.match(css,/\.home-featured-cards\[data-featured-count="3"\]\{\s*grid-template-columns:none;grid-auto-flow:column;/)
 assert.doesNotMatch(home,/focus-heading-icon/)
})
