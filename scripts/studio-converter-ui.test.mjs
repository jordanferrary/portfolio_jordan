import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
test('WebP converter workflow has accessible file selection and local output',async()=>{
 const code=await read('src/components/sections/image-converter.tsx')
 assert.match(code,/ref=\{inputRef\}/)
 assert.match(code,/onClick=\{\(\)=>inputRef.current\?\.click\(\)\}/)
 assert.match(code,/onDrop=\{dropFile\}/)
 assert.match(code,/ACCEPTED\.includes\(next.type\)/)
 assert.match(code,/URL\.revokeObjectURL\(url\)/)
 assert.match(code,/optimizeImage\(file,\{maxDimension:max===6144\?2048:max/)
 assert.match(code,/className="converter-footer"/)
 assert.match(code,/disabled=\{!file\|\|busy\}/)
})
test('the converter overrides generic form styles and remains scrollable',async()=>{
 const [css,main]=await Promise.all(['src/styles/studio-workflow-ui.css','src/main.tsx'].map(read))
 assert.match(css,/\.converter-workspace\{[\s\S]*?overflow-x:hidden/)
 assert.match(css,/\.converter-quality input\[type="range"\]\{[\s\S]*?appearance:none!important/)
 assert.match(css,/\.converter-file-input\{position:absolute!important/)
 assert.match(css,/\.converter-fields\{grid-template-columns:minmax\(0,1fr\)/)
 assert.match(css,/\.converter-footer\{justify-content:flex-end/)
 assert.match(main,/import '\.\/styles\/studio-workflow-ui\.css'/)
})
