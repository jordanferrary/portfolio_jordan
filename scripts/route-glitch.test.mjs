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
test('The transition draws fewer subtle fragments without stepped animations',()=>{
 assert.match(component,/fragments=Array\.from\(\{length:12\}/)
 assert.match(component,/bands=Array\.from\(\{length:4\}/)
 assert.match(component,/<GlitchSignalArt\/>/)
 assert.match(css,/jf-glitch-cover 100ms ease-in both/)
 assert.match(css,/jf-glitch-reveal 160ms ease-out both/)
 assert.match(css,/jf-glitch-drift 1800ms ease-in-out infinite alternate/)
 assert.doesNotMatch(css,/steps\(|mix-blend-mode:screen/)
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
 assert.match(component,/event\.animationName==='jf-glitch-cover'/)
 assert.match(component,/event\.animationName==='jf-glitch-reveal'/)
 assert.match(component,/role="status"/)
 assert.doesNotMatch(app,/Loading (?:project|portfolio|page)…/)
 assert.doesNotMatch(component,/setInterval|fetch\(/)
 assert.match(component,/window.setTimeout/)
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

test('Visual comfort: muted palette, capped color channels and no loading pulse',()=>{
 assert.match(palette,/intensity:\.55/)
 assert.match(palette,/Math\.max\(\.15,Math\.min\(1,i\)\)/)
 assert.match(css,/--jf-glitch-magenta:#79519C;/)
 assert.match(css,/color-mix\(in srgb,var\(--jf-glitch-magenta\) 28%,var\(--jf-signal-base\)\)/)
 assert.match(css,/\.jf-route-glitch-pending\{opacity:1\}/)
 assert.match(css,/\.jf-route-glitch-pending :is\(\.jf-glitch-block,\.jf-glitch-band\)\{animation:none\}/)
 assert.doesNotMatch(css,/jf-glitch-pending-fade|brightness\(|steps\(/)
 assert.match(palette,/noise:normalizeHexColor\(raw\.noise\)\?\?DEFAULT_GLITCH_PALETTE\.noise/)
 assert.match(store,/glitchPalette=normalizeGlitchPalette\(obj\.glitchPalette\)/)
})
test('Desktop and mobile route changes use a two-phase transition rather than relying on loading',()=>{
 assert.match(app,/pendingPage\.current=next/)
 assert.match(app,/const commitRoute=\(hash:string\)=>/)
 assert.match(app,/if\(routeRef\.current!==hash\)return/)
 assert.match(app,/setVisibleRouteHash\(hash\)/)
 assert.match(app,/const projectId=visibleRouteHash\./)
 assert.match(app,/const customPageId=visibleRouteHash\./)
 assert.match(app,/<RouteGlitchTransition routeKey=\{routeIdentity\} onCovered=\{commitRoute\} motion=\{controls.motion\}\/>/)
 assert.match(component,/onCovered:\(key:string\)=>void/)
 assert.match(component,/onCovered\(active\.key\)/)
 assert.match(component,/data-phase=\{active\.phase\}/)
 assert.match(css,/\.jf-route-glitch\[data-phase="cover"\]/)
 assert.match(css,/\.jf-route-glitch\[data-phase="reveal"\]/)
 assert.match(css,/@keyframes jf-glitch-cover/)
 assert.match(css,/@keyframes jf-glitch-reveal/)
 assert.doesNotMatch(css,/jf-glitch-entrance/)
 assert.match(css,/\.jf-route-glitch,\.jf-route-glitch-pending\{[\s\S]*?position:fixed;inset:0;/)
 assert.match(css,/pointer-events:none/)
 assert.match(component,/prefers-reduced-motion: reduce/)
})
