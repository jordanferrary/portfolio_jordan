import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
test('compact dock exposes contextual editor, inspector, preview and accessible shortcuts',async()=>{
 const [dock,css]=await Promise.all(['src/components/sections/studio-dock.tsx','src/styles/studio-dock.css'].map(read))
 assert.match(dock,/className="studio-current-page"/)
 assert.match(dock,/className="studio-dock-inspect"/)
 assert.match(dock,/className="studio-dock-view"/)
 assert.match(dock,/choose\('favorites'\)/)
 assert.match(dock,/choose\('recent'\)/)
 assert.match(dock,/matching\[activeResult\]/)
 assert.doesNotMatch(dock,/studio-hub-overview-areas/)
 assert.match(css,/grid-column:1\/-1;display:flex/)
})
test('global controls separate geometry from material and preserve real preview',async()=>{
 const [editor,css]=await Promise.all(['src/components/sections/studio-controls-editor.tsx','src/styles/studio-workflow-ui.css'].map(read))
 assert.match(editor,/layoutGroup==='material'\?field.key.startsWith\('glass'\)/)
 assert.match(editor,/className="studio-layout-columns"/)
 assert.match(editor,/applyStudioControls\(draft\)/)
 assert.match(editor,/if\(!saved.current\)applyStudioControls\(original.current\)/)
 assert.match(css,/\.studio-layout-columns>\.studio-material-preview\{position:sticky/)
})
test('page editors keep unsaved draft controls while switching sections',async()=>{
 const [about,contact,css]=await Promise.all(['src/components/sections/about-editor.tsx','src/components/sections/contact-editor.tsx','src/styles/studio-workflow-ui.css'].map(read))
 assert.match(about,/hidden=\{tab!=='copy'\}/)
 assert.match(about,/hidden=\{tab!=='media'\}/)
 assert.match(contact,/hidden=\{tab!=='networks'\}/)
 assert.match(contact,/<SocialLinksEditor links=\{draftLinks\}/)
 assert.match(css,/\[hidden\]\{display:none!important\}/)
})
