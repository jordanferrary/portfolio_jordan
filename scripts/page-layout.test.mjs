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
test('public pages share one responsive semantic type scale',()=>{
 assert.match(css,/--jf-page-display:clamp\(38px,3\.45vw,60px\)/)
 assert.match(css,/--jf-page-display:clamp\(34px,8\.4vw,48px\)/)
 assert.match(css,/--jf-page-section:clamp\(24px,2\.05vw,34px\)/)
 assert.match(css,/--jf-page-description:clamp\(15px,1vw,17px\)/)
 assert.match(css,/\.home-intro,\.gallery-heading,\.about-page-header,\.contact-social-intro,\.custom-page-hero-content,\.project-hero-content\)>h1/)
 assert.match(css,/font-size:var\(--jf-page-display\)!important/)
 assert.match(css,/font-size:var\(--jf-page-section\)!important/)
 assert.match(css,/font-size:var\(--jf-page-description\)!important/)
 assert.match(css,/@media\(max-width:750px\)/)
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
