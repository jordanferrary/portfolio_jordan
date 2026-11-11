import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {transform} from 'esbuild'

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8')
const [player,sidebar,drawerCss,config,app,main,mobileNavCss]=await Promise.all([
 read('src/components/layout/music-player.tsx'),
 read('src/components/layout/sidebar.tsx'),
 read('src/styles/mobile-music-drawer.css'),
 read('public/alquimago/config.json'),
 read('src/app.tsx'),
 read('src/main.tsx'),
 read('src/styles/mobile-nav-alignment.css')
])
test('mobile music starts collapsed with opening and closing controls',async()=>{
 await transform(player,{loader:'tsx'})
 assert.match(player,/useState\(false\)\s*\n const \[mobile,setMobile\]/)
 assert.match(player,/drawerOpen\?'《':'》'/)
 assert.match(player,/aria-expanded=\{drawerOpen\}/)
 assert.match(player,/aria-controls="jf-music-drawer-content"/)
 assert.match(player,/inert=\{mobile&&!drawerOpen\}/)
 assert.match(player,/aria-hidden=\{mobile&&!drawerOpen\}/)
 assert.match(player,/setDrawerOpen\(value=>!value\)/)
})
test('repeat button switches between full and broken infinity icons',async()=>{
 await transform(player,{loader:'tsx'})
 assert.match(player,/function BrokenInfinityIcon\(\)/)
 assert.match(player,/repeatOne\?<InfinityIcon size=\{17\}\/\>:<BrokenInfinityIcon\/>/)
 assert.match(player,/className=\{repeatOne\?'music-repeat is-on':'music-repeat is-off'\}/)
 assert.match(player,/aria-pressed=\{repeatOne\}/)
 assert.match(player,/loop=\{repeatOne\}/)
 assert.match(player,/onEnded=\{\(\)=>\{setPlaying\(false\);if\(!repeatOne\)next\(\)\}\}/)
 assert.match(player,/localStorage\.setItem\('jf-music-repeat',repeatOne\?'one':'next'\)/)
})
test('outside taps, Escape, and route changes close mobile drawer',()=>{
 assert.match(player,/document\.addEventListener\('pointerdown',onPointer\)/)
 assert.match(player,/!card\.current\.contains\(event\.target as Node\)/)
 assert.match(player,/setOpen\(false\);setVolumeOpen\(false\);setDrawerOpen\(false\)/)
 assert.match(player,/event\.key==='Escape'/)
 assert.match(player,/window\.addEventListener\('hashchange',onRoute\)/)
 assert.match(player,/window\.removeEventListener\('hashchange',onRoute\)/)
})
test('player is attached to site shell on phones, never trapped inside navigation bar',async()=>{
 await transform(sidebar,{loader:'tsx'})
 assert.match(sidebar,/createPortal\(<MusicPlayer tracks=\{tracks\}\/>,mobilePortal\)/)
 assert.match(sidebar,/window\.matchMedia\('\(max-width:750px\)'\)/)
 assert.match(sidebar,/document\.querySelector<HTMLElement>\('\.site-shell'\)/)
 assert.match(drawerCss,/\.site-shell>\.music-widget\.music-drawer-open/)
 assert.match(drawerCss,/translate3d\(-144px,0,0\)/)
 assert.match(drawerCss,/left:0!important/)
 assert.match(drawerCss,/--jf-secondary/)
 assert.match(drawerCss,/prefers-reduced-motion/)
 await transform(drawerCss,{loader:'css'})
 assert.ok(main.indexOf("import './styles/mobile-music-drawer.css'")>main.indexOf("import './styles/liquid-glass-buttons.css'"))
})
test('public familiar is opt-in; independent Studio visibility stays available',()=>{
 const published=JSON.parse(config)
 assert.equal(published.appearance.visible,false)
 assert.match(app,/let published=false/)
 assert.match(app,/const show=editing\?studioFamiliarVisible:publishedAlquimagoVisible/)
 assert.match(app,/if\(!editing&&publishedAlquimagoVisible!==true\)return/)
 assert.match(app,/localStorage\.getItem\('jf-alquimago-studio-visible'\)!=='false'/)
})

test('mobile navigation keeps the logo left and groups page links to the right',async()=>{
 await transform(mobileNavCss,{loader:'css'})
 assert.match(mobileNavCss,/@media \(max-width:600px\)/)
 assert.match(mobileNavCss,/\.site-shell \.sidebar \.brand-wrap\{/)
 assert.match(mobileNavCss,/margin:0 auto 0 0/)
 assert.match(mobileNavCss,/\.site-shell \.sidebar \.side-nav\{/)
 assert.match(mobileNavCss,/margin:0 0 0 auto/)
 assert.match(mobileNavCss,/justify-content:space-between/)
 assert.match(mobileNavCss,/overflow-x:auto/)
 assert.match(mobileNavCss,/\.side-link-label\{/)
 assert.match(mobileNavCss,/text-overflow:ellipsis/)
 assert.match(mobileNavCss,/@media \(max-width:350px\)/)
 assert.ok(main.indexOf("import './styles/mobile-nav-alignment.css'")>main.indexOf("import './styles/visitor-language.css'"))
})
