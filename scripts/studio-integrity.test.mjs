import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const [hook,publish,dialog,app,dock,home,contact,editor,layout,lightbox,asset,model,manifest,typography]=await Promise.all([
 'src/hooks/use-portfolio.ts','src/lib/github-publish.ts','src/components/sections/github-publish-editor.tsx','src/app.tsx',
 'src/components/sections/studio-dock.tsx','src/components/sections/home-page.tsx','src/components/sections/contact-editor.tsx',
 'src/components/sections/theme-palette-editor.tsx','src/styles/page-layout-consistency.css','src/styles/art-lightbox.css',
 'src/styles/music-library.css','src/styles/project-model.css','src/data/published-portfolio.json','src/lib/typography.ts'
].map(read))
const js=ts.transpileModule(typography,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {normalizeTypography,DEFAULT_TYPOGRAPHY}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js))
test('typography defaults preserve old layouts and custom values are bounded',()=>{
 assert.deepEqual(normalizeTypography(undefined),DEFAULT_TYPOGRAPHY)
 assert.deepEqual(normalizeTypography({headingScale:9,bodyScale:-1,headingFont:'bad',bodyFont:'manrope'}),{headingScale:1.15,bodyScale:.9,headingFont:'manrope',bodyFont:'manrope'})
 assert.deepEqual(normalizeTypography({headingScale:NaN,bodyScale:Infinity}),DEFAULT_TYPOGRAPHY)
 assert.match(hook,/typography=normalizeTypography\(obj.typography\)/)
 assert.match(publish,/typography:store.typography/)
 assert.match(app,/applyTypography\(portfolio.typography\)/)
 assert.match(editor,/onSave\(draft,draftSymbol,draftType\)/)
 assert.match(editor,/applyTypography\(originalType.current\)/)
 assert.match(layout,/var\(--jf-heading-scale,1\)/)
 assert.match(layout,/var\(--jf-body-scale,1\)/)
})
test('Studio keeps media viewers themeable and preserves document artwork',()=>{
 assert.match(lightbox,/\.art-lightbox\{[^}]*var\(--jf-background\)[^}]*var\(--jf-text\)/)
 assert.match(lightbox,/\.art-lightbox-help\{[^}]*color:var\(--jf-muted\)/)
 assert.match(asset,/\.asset-modal\{[^}]*var\(--jf-border\)[^}]*var\(--jf-studio-panel\)/)
 assert.match(model,/\.project-model-loading\{[^}]*var\(--jf-surface-deep\)[^}]*var\(--jf-text\)/)
})
test('backup is reachable without opening or creating a project',()=>{
 assert.match(app,/onImport=\{portfolio.importData\}/)
 assert.match(dock,/Importar backup/)
 assert.match(dock,/await action\(\)/)
 assert.match(hook,/rawCatalog/)
 assert.match(hook,/Backup incompleto/)
 assert.match(hook,/uma mídia local está ausente/)
})
test('publication records the draft captured at the beginning, not after upload',()=>{
 assert.match(dialog,/localSnapshot=localStorage.getItem/)
 assert.match(dialog,/onPublished\(finished.revision,localSnapshot\)/)
 assert.match(hook,/JSON.stringify\(\{revision,snapshot\}\)/)
 assert.match(hook,/pending\?\.revision===currentPublishedRevision&&pending.snapshot===snapshot/)
 assert.match(app,/onLock=\{lockStudio\}/)
 assert.match(app,/if\(githubPublishOpen\)return/)
 assert.match(app,/setThemePaletteOpen\(false\);setGlitchPaletteOpen\(false\)/)
})
test('Home identity follows the About editor and Contact accepts optional copy',()=>{
 assert.match(app,/profileName=\{portfolio.about.name\}/)
 assert.match(home,/\{profileName\}/)
 assert.match(contact,/if\(!draft.titleFirst.trim\(\)\)/)
 assert.doesNotMatch(contact,/\|\|!draft.titleAccent.trim\(\)/)
})
test('published package has unique project and page IDs and valid seven-color palette',()=>{
 const {schema,revision,store}=JSON.parse(manifest)
 assert.equal(schema,1)
 assert.ok(revision)
 for(const list of [store.projects,store.customPages,store.categories])assert.equal(new Set(list.map(x=>x.id)).size,list.length)
 for(const key of ['primary','secondary','background','surface','text','muted','border'])assert.match(store.themePalette[key],/^#[0-9a-f]{6}$/i)
 for(const project of store.projects)assert.ok(Array.isArray(project.blocks))
})
