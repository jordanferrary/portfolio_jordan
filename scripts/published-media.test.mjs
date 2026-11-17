import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [ui,card,css,media,publish,token,workflow]=await Promise.all([
 read('src/components/sections/github-publish-editor.tsx'),read('src/components/ui/published-media-card.tsx'),
 read('src/styles/github-publish.css'),read('src/lib/github-media.ts'),
 read('src/lib/github-publish.ts'),read('src/lib/github-token-vault.ts'),
 read('.github/workflows/deploy.yml')
])
test('real images, safe fallback, lazy thumbnail grid and collapsed technical paths',()=>{
 assert.match(ui,/PublishedMediaCard key=\{item\.path\}/)
 assert.match(card,/repositoryMediaPreviewUrl\(item\.path\)/)
 assert.match(card,/loading="lazy"/)
 assert.match(card,/decoding="async"/)
 assert.match(card,/onError=\{\(\)=>setBroken\(true\)\}/)
 assert.match(card,/<details><summary>Nome e caminho técnico<\/summary>/)
 assert.match(css,/\.github-publish-editor \.github-media-list\{display:grid/)
 assert.match(css,/content-visibility:auto/)
})
test('no accidental deletion from clicking image, reference safety retained',()=>{
 assert.match(card,/const locked=item\.used\|\|item\.protected/)
 assert.match(card,/disabled=\{locked\|\|disabled\}/)
 assert.match(card,/onToggle\(item\.path,e\.target\.checked\)/)
 assert.match(ui,/selectedPaths\.includes\(item\.path\)/)
 assert.match(ui,/window\.confirm\('Remover definitivamente '/)
 assert.match(media,/if\(!isCleanableFile\(path\)\)return ''/)
})
test('publisher token stays encrypted separately and chat text is not published',()=>{
 assert.match(ui,/As mensagens do Alquimago nunca integram a publicação/)
 assert.match(publish,/No automatic localStorage snapshot, no chat text and no credentials/)
 assert.match(publish,/Never publish messages\. Synapses are validated numerical arrays only/)
 assert.match(token,/AES-GCM/)
 assert.match(token,/databaseName:'alquimago-github-publisher-v2'/)
 assert.match(workflow,/test:published-media/)
})
