import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [app,component,css,palette,editor,store,publish,entry,workflow]=await Promise.all([
 read('src/app.tsx'),
 read('src/components/ui/route-glitch-transition.tsx'),
 read('src/styles/route-glitch.css'),
 read('src/lib/glitch-palette.ts'),
 read('src/components/sections/glitch-palette-editor.tsx'),
 read('src/hooks/use-portfolio.ts'),
 read('src/lib/github-publish.ts'),
 read('src/main.tsx'),
 read('.github/workflows/deploy.yml')
])
test('The actual transition draws large neon rectangles, blocks and moving noise',()=>{
 assert.match(component,/fragments=Array\.from\(\{length:54\}/)
 assert.match(component,/bands=Array\.from\(\{length:14\}/)
 assert.match(component,/<GlitchSignalArt\/>/)
 assert.match(css,/jf-glitch-block-jump 820ms steps\(1,end\) infinite/)
 assert.match(css,/jf-glitch-band-tear 830ms steps\(1,end\) infinite/)
 assert.match(css,/jf-glitch-static-noise 670ms steps\(3,end\) infinite/)
 assert.match(css,/feTurbulence/)
 assert.match(css,/\.jf-glitch-grain/)
 assert.match(css,/\.jf-glitch-chroma/)
 assert.match(css,/image-rendering:pixelated/)
 assert.doesNotMatch(css,/::view-transition-old\(root\)/)
 assert.doesNotMatch(app,/startViewTransition|flushSync/)
})
test('Page switching and Suspense fallback are textless and do not block navigation',()=>{
 assert.match(app,/const navigate=\(next:Page\)=>switchRoute\('#\/'\+next,next,true\)/)
 assert.match(app,/const openProject=\(p:Project\)=>switchRoute\('#\/project\/'\+p\.id,'project',true\)/)
 assert.match(app,/const navigateCustomPage=\(id:string\)=>switchRoute\('#\/page\/'\+id,'custom',true\)/)
 assert.match(app,/const sync=\(\)=>switchRoute\(location\.hash\|\|'#\/inicio',route\(\),false\)/)
 assert.equal((app.match(/fallback=\{<RouteGlitchFallback\/>\}/g)||[]).length,3)
 assert.match(component,/createPortal\(<div className="jf-route-glitch"/)
 assert.match(component,/createPortal\(node,document\.body\)/)
 assert.match(component,/onAnimationEnd=\{finish\}/)
 assert.match(component,/animationName!=='jf-glitch-entrance'/)
 assert.match(component,/role="status"/)
 assert.doesNotMatch(app,/Loading (?:project|portfolio|page)…/)
 assert.doesNotMatch(component,/setTimeout|setInterval|fetch\(/)
 assert.match(css,/pointer-events:none/)
})
test('Independent glitch palette has five configurable hex channels and intensity',()=>{
 for(const name of ['magenta','cyan','lime','noise','dark','intensity']){
  assert.match(palette,new RegExp(name+':'))
 }
 assert.match(palette,/normalizeGlitchPalette/)
 assert.match(palette,/normalizeHexColor/)
 assert.match(palette,/glitchPaletteStyle/)
 assert.match(palette,/applyGlitchPalette/)
 assert.match(editor,/Paleta do glitch/)
 assert.match(editor,/type="color"/)
 assert.match(editor,/type="range"/)
 assert.match(editor,/Prévia animada/)
 assert.match(editor,/GLITCH_PRESETS\.map/)
 assert.match(editor,/GLITCH_COLORS\.map/)
 assert.match(app,/setGlitchPaletteOpen\(true\)/)
 assert.match(app,/applyGlitchPalette\(portfolio\.glitchPalette\)/)
 assert.match(app,/<GlitchPaletteEditor value=\{portfolio\.glitchPalette\} onSave=\{portfolio\.setGlitchPalette\}/)
 assert.match(store,/glitchPalette:GlitchPalette/)
 assert.match(store,/normalizeGlitchPalette\(obj\.glitchPalette\)/)
 assert.match(store,/setGlitchPalette/)
 assert.match(publish,/glitchPalette:store\.glitchPalette/)
 for(const name of ['magenta','cyan','lime','noise','dark'])
  assert.ok(css.includes('var(--jf-glitch-'+name),'Missing glitch color '+name)
 assert.match(css,/var\(--jf-glitch-intensity\)/)
})
test('Palette remains separate from original seven colors and reduced motion is respected',()=>{
 assert.doesNotMatch(palette,/setProperty\('--jf-primary'/)
 assert.match(palette,/--jf-glitch-magenta/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/animation:none!important/)
 assert.match(component,/prefers-reduced-motion: reduce/)
 assert.match(entry,/styles\/route-glitch\.css/)
 assert.match(workflow,/npm run test:route-glitch/)
})
