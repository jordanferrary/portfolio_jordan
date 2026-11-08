import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repoParts=(process.env.GITHUB_REPOSITORY||'jordanferrary/portfolio_jordan').split('/')
const repositoryName=repoParts[1]||'portfolio_jordan'
const accountName=repoParts[0]||'jordanferrary'
const base=process.env.GITHUB_PAGES==='true'?'/'+repositoryName+'/':'/'
const buildRevision=(process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||process.env.VITE_BUILD_SHA||'local').slice(0,40)
const publicSiteUrl=(process.env.PUBLIC_SITE_URL||'https://'+accountName+'.github.io/'+repositoryName+'/').replace(/\/?$/,'/')

function escapeHtml(text:string):string{
 return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

/**
 * Social crawlers do not render the React application. Populate Open Graph
 * and Twitter tags in the static HTML using the content published by GitHub Studio.
 * The version parameter changes on every content publication to help invalidate
 * image caches on sharing platforms.
 */
function socialMetadata(){
 return {
  name:'jf-social-metadata',
  transformIndexHtml:{
   order:'pre' as const,
   handler(html:string){
    let revision='default'
    let title='Jordan Ferrary — Creative Portfolio'
    let description='Jordan Ferrary — 3D artist, illustrator and motion designer. Explore selected artwork and creative projects.'
    try{
     const data=JSON.parse(readFileSync(new URL('./src/data/published-portfolio.json',import.meta.url),'utf8')) as {revision?:string;store?:{seoTitle?:string;seoDescription?:string}}
     revision=data.revision||revision
     title=data.store?.seoTitle?.trim()||title
     description=data.store?.seoDescription?.trim()||description
    }catch{/* No published content yet; use professional defaults */}
    const version=encodeURIComponent(revision)
    const tags:Record<string,string>={
     '{{SEO_TITLE}}':escapeHtml(title),
     '{{SEO_DESCRIPTION}}':escapeHtml(description),
     '{{SITE_URL}}':escapeHtml(publicSiteUrl),
     '{{SOCIAL_IMAGE_URL}}':escapeHtml(publicSiteUrl+'social-preview.jpg?v='+version),
     '{{CACHE_VERSION}}':version,
     '{{BUILD_COMMIT}}':escapeHtml(buildRevision.slice(0,12))
    }
    return Object.entries(tags).reduce((result,[key,value])=>result.replaceAll(key,value),html)
   }
  }
 }
}


function buildDiagnostic(){
 return {
  name:'jf-build-diagnostic',
  generateBundle(){
   this.emitFile({
    type:'asset',
    fileName:'build-info.json',
    source:JSON.stringify({
     commit:buildRevision,
     branch:process.env.CF_PAGES_BRANCH||process.env.GITHUB_REF_NAME||'local'
    },null,2)+'\n'
   })
  }
 }
}

export default defineConfig({
 plugins:[react(),tailwindcss(),socialMetadata(),buildDiagnostic()],
 define:{'import.meta.env.VITE_BUILD_SHA':JSON.stringify(buildRevision)},
 base,
 server:{host:'0.0.0.0'}
})
