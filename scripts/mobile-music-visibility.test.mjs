import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {transform} from 'esbuild'

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8')
const [player,sidebar,drawerCss,config,app,main]=await Promise.all([
 read('src/components/layout/music-player.tsx'),
 read('src/components/layout/sidebar.tsx'),
 read('src/styles/mobile-music-drawer.css'),
 read('public/alquimago/config.json'),
 read('src/app.tsx'),
 read('src/main.tsx')
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
