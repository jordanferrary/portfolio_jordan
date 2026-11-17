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
 assert.match(css,/--jf-page-layout-max:1470px/)
 assert.match(css,/max-width:var\(--jf-page-layout-max\)!important/)
 assert.match(css,/\.site-shell \.gallery-heading\{margin-left:0!important\}/)
 assert.match(css,/\.site-shell\.contact-route \.contact-social-page\{padding-inline:0!important\}/)
 assert.match(css,/\.site-shell\.about-route \.about-page\{padding-inline:0!important\}/)
 assert.match(css,/max-width:1330px/)
})
test('contact no longer uses oversized headlines, including phones and narrow laptops',()=>{
 assert.match(css,/--jf-page-display:clamp\(39px,3\.45vw,60px\)/)
 assert.match(css,/\.site-shell \.contact-social-intro h1/)
 assert.match(css,/font-size:clamp\(24px,2vw,32px\)!important/)
 assert.match(css,/@media\(max-width:750px\)/)
 assert.match(css,/font-size:clamp\(34px,8\.4vw,48px\)!important/)
 assert.match(css,/@media\(min-width:751px\) and \(max-width:1099px\)/)
 assert.match(css,/overflow:visible!important/)
 assert.match(contact,/className="contact-social-intro"/)
 assert.match(about,/className="about-page-header"/)
 assert.match(gallery,/className="gallery-heading"/)
 assert.match(home,/className="home-intro"/)
})
test('gallery banner still bleeds right and fades after shared-width changes',()=>{
 assert.match(css,/--gallery-hero-bleed:calc\(34px \+ max\(0px,\(100vw - 1679px\) \/ 2\)\)/)
 const idx=entry.indexOf("import './styles/gallery-hero-refinement.css'")
 const late=entry.indexOf("import './styles/page-layout-consistency.css'")
 assert.ok(idx>=0&&late>idx,'Shared content width must override the earlier gallery bleed calculation')
 assert.match(css,/\.site-shell \.gallery-page\{padding-top:clamp\(88px,8\.7vh,108px\)\}/)
})
