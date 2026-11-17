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
test('Only route identity changes trigger transition, including browser history',()=>{
 assert.match(app,/useState\(\(\)=>location\.hash\|\|'#\/inicio'\)/)
 assert.match(app,/setRouteIdentity\(hash\)/)
 assert.match(app,/setRouteIdentity\(location\.hash\|\|'#\/inicio'\)/)
 assert.match(app,/window\.addEventListener\('hashchange',sync\)/)
 assert.match(app,/<RouteGlitchTransition routeKey=\{routeIdentity\}\/>/)
 assert.match(component,/const previous=useRef\(routeKey\)/)
 assert.match(component,/if\(previous\.current===routeKey\)return/)
})
test('Animation is brief, text-free, nonblocking and self-cleaning',()=>{
 assert.match(css,/pointer-events:none/)
 assert.match(css,/340ms steps\(1,end\)/)
 assert.match(component,/onAnimationEnd=\{onEnd\}/)
 assert.match(component,/setActiveId\(current=>current===activeId\?null:current\)/)
 assert.doesNotMatch(component,/<(?:h[1-6]|p|button|img)\b/)
 assert.doesNotMatch(component,/setTimeout|fetch\(|import\(/)
})
test('Seven-token palette drives color effects and reduced motion is honored',()=>{
 for(const key of ['primary','secondary','background','text'])
  assert.ok(css.includes('var(--jf-'+key),'Missing palette token '+key)
 assert.match(component,/prefers-reduced-motion: reduce/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/animation:none!important/)
 assert.match(entry,/styles\/route-glitch\.css/)
 assert.match(workflow,/npm run test:route-glitch/)
})

test('Suspense never shows text saying a project or page is loading',()=>{
 assert.doesNotMatch(app,/Loading (?:project|portfolio|page)…/)
 assert.equal((app.match(/fallback=\{<RouteGlitchFallback\/>\}/g)||[]).length,3)
 assert.match(component,/export function RouteGlitchFallback\(/)
 assert.match(component,/createPortal\(element,document\.body\)/)
 assert.match(component,/role="status"/)
 assert.match(component,/aria-label=\{description\}/)
})
test('Suspense stays on glitch until real content is ready, without a timer',()=>{
 assert.match(css,/\.jf-route-glitch-pending\{/)
 assert.match(css,/jf-route-pending-pulse 760ms steps\(1,end\) infinite/)
 assert.match(css,/\.jf-route-glitch-pending \.jf-route-glitch-slice/)
 assert.match(css,/background:var\(--jf-background/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.doesNotMatch(component,/setTimeout|setInterval/)
})
