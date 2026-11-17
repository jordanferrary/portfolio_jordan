import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [app,component,css,entry,workflow]=await Promise.all([
 read('src/app.tsx'),
 read('src/components/ui/route-glitch-transition.tsx'),
 read('src/styles/route-glitch.css'),
 read('src/main.tsx'),
 read('.github/workflows/deploy.yml')
])
test('Native View Transitions capture outgoing and incoming route frames',()=>{
 assert.match(app,/startViewTransition\?/)
 assert.match(app,/start\.call\(document,commit\)/)
 assert.match(app,/flushSync\(\(\)=>\{/)
 assert.match(app,/document\.documentElement\.classList\.add\('jf-native-route-glitch'\)/)
 assert.match(app,/document\.documentElement\.classList\.remove\('jf-native-route-glitch'\)/)
 assert.match(css,/::view-transition-old\(root\)/)
 assert.match(css,/::view-transition-new\(root\)/)
 assert.match(css,/jf-image-tear-out 470ms steps\(1,end\)/)
 assert.match(css,/jf-image-tear-in 470ms steps\(1,end\)/)
 assert.match(css,/clip-path:inset\(55% 0 21% 0\)/)
 assert.match(css,/transform:translate3d\(53px,0,0\)/)
})
test('Navigation and browser history share the same transition without fake delays',()=>{
 assert.match(app,/const navigate=\(next:Page\)=>switchRoute\('#\/'\+next,next,true\)/)
 assert.match(app,/const openProject=\(p:Project\)=>switchRoute\('#\/project\/'\+p\.id,'project',true\)/)
 assert.match(app,/const navigateCustomPage=\(id:string\)=>switchRoute\('#\/page\/'\+id,'custom',true\)/)
 assert.match(app,/const sync=\(\)=>switchRoute\(location\.hash\|\|'#\/inicio',route\(\),false\)/)
 assert.match(app,/window\.addEventListener\('hashchange',sync\)/)
 assert.match(app,/<RouteGlitchTransition routeKey=\{routeIdentity\}\/>/)
 assert.doesNotMatch(app,/setTimeout\([^\n]*switchRoute/)
})
test('Fallback corruption is animated pixel tearing, not a static line screen',()=>{
 assert.match(css,/jf-corrupt-fragment 740ms steps\(1,end\) infinite/)
 assert.match(css,/jf-corrupt-field 740ms steps\(1,end\) infinite/)
 assert.match(css,/jf-corrupt-pixels 740ms steps\(1,end\) infinite/)
 assert.match(css,/\.jf-glitch-fragment::before/)
 assert.match(css,/\.jf-glitch-fragment::after/)
 assert.match(css,/clip-path:polygon\(/)
 assert.match(component,/export function RouteGlitchFallback\(/)
 assert.match(component,/createPortal\(element,document\.body\)/)
 assert.match(component,/role="status"/)
 assert.match(component,/aria-label=\{description\}/)
 assert.equal((app.match(/fallback=\{<RouteGlitchFallback\/>\}/g)||[]).length,3)
 assert.doesNotMatch(app,/Loading (?:project|portfolio|page)…/)
})
test('Palette, reduced motion and cleanup apply without slowing navigations',()=>{
 for(const name of ['primary','secondary','background','text'])
  assert.ok(css.includes('var(--jf-'+name),'Missing live theme color '+name)
 assert.match(app,/prefers-reduced-motion: reduce/)
 assert.match(component,/prefers-reduced-motion: reduce/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/animation:none!important/)
 assert.match(component,/onAnimationEnd=\{finish\}/)
 assert.match(component,/if\(event\.target!==event\.currentTarget/)
 assert.doesNotMatch(component,/setTimeout|setInterval|fetch\(/)
 assert.match(entry,/styles\/route-glitch\.css/)
 assert.match(workflow,/npm run test:route-glitch/)
})
