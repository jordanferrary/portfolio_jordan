import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'

const source=await readFile(new URL('../src/lib/showcase-pdf.ts',import.meta.url),'utf8')
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {safeShowcaseDocumentHref,pdfFetchHref,isShowcasePdfLink,pdfPreviewHref}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(transpiled))

test('GitHub blob links become public raw PDF downloads for local canvas rendering',()=>{
 const blob='https://github.com/jordanferrary/Imagens_do_site/blob/main/Certificados/Zbrush%20-%20Fundamentos.pdf'
 assert.equal(pdfFetchHref(blob),'https://raw.githubusercontent.com/jordanferrary/Imagens_do_site/main/Certificados/Zbrush%20-%20Fundamentos.pdf')
 assert.equal(pdfFetchHref(blob+'?raw=1'),'https://raw.githubusercontent.com/jordanferrary/Imagens_do_site/main/Certificados/Zbrush%20-%20Fundamentos.pdf')
 assert.equal(pdfFetchHref('https://raw.githubusercontent.com/jordanferrary/Imagens_do_site/main/Certificados/Zbrush%20-%20Fundamentos.pdf'),'https://raw.githubusercontent.com/jordanferrary/Imagens_do_site/main/Certificados/Zbrush%20-%20Fundamentos.pdf')
 assert.equal(pdfFetchHref('https://jordanferrary.github.io/Imagens_do_site/Certificados/Zbrush%20-%20Fundamentos.pdf'),'https://jordanferrary.github.io/Imagens_do_site/Certificados/Zbrush%20-%20Fundamentos.pdf')
 assert.equal(isShowcasePdfLink(blob),true)
})
test('Drive links retain a non-GitHub iframe fallback, malicious schemes are rejected',()=>{
 assert.equal(pdfPreviewHref('https://drive.google.com/file/d/example123/view?usp=sharing'),'https://drive.google.com/file/d/example123/preview')
 assert.equal(pdfFetchHref('https://drive.google.com/file/d/example123/view'),null)
 assert.equal(pdfPreviewHref('https://github.com/user/repo/blob/main/certificate.pdf'),'')
 assert.equal(pdfFetchHref('javascript:alert(1)'),null)
 assert.equal(safeShowcaseDocumentHref('data:application/pdf;base64,abc'),null)
 assert.equal(pdfFetchHref('https://github.com/user/repo/blob/main/README.md'),null)
})
