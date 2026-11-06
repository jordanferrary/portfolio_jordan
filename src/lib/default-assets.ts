/**
 * Stock files are bundled in public/images. Earlier versions saved GitHub
 * Pages URLs with /reactteste/ in localStorage; after the repo was renamed,
 * those persisted paths stopped resolving.
 *
 * Rewrite ONLY files we ship. External/customer URLs and media:// uploads
 * must remain untouched.
 */
const bundledAssets=new Set([
 'hero/hero-character.webp',
 'profile/avatar.webp',
 'music/album-cover.webp',
 ...['void-wanderer','moonlit-cottage','deepwalker','astral-guardian','neon-armor','ancient-ruins'].map(id=>'projects/'+id+'/'+id+'.webp')
])
const oldFlatProjectNames=new Set(['void-wanderer','moonlit-cottage','deepwalker','astral-guardian','neon-armor','ancient-ruins'])
export const bundledAsset=(path:string)=>import.meta.env.BASE_URL+'images/'+path
export function normalizeBundledImage(source:string):string{
 if(!source)return source
 const value=source.trim()
 if(!value||/^(media:|blob:|data:)/i.test(value))return source
 let pathname=value
 if(/^https?:\/\//i.test(value)){
  try{
   const url=new URL(value)
   // Do not rewrite user-controlled or remote image hosts.
   if(!['jordanferrary.github.io','portfolio-jordan.pages.dev'].includes(url.hostname.toLowerCase()))return source
   pathname=url.pathname
  }catch{return source}
 }else if(/^\/\//.test(value))return source
 const flat=pathname.match(/(?:^|\/)images\/(void-wanderer|moonlit-cottage|deepwalker|astral-guardian|neon-armor|ancient-ruins)\.webp\/?$/i)
 if(flat&&oldFlatProjectNames.has(flat[1].toLowerCase()))return bundledAsset('projects/'+flat[1].toLowerCase()+'/'+flat[1].toLowerCase()+'.webp')
 const match=pathname.match(/(?:^|\/)images\/(.+)$/i)
 const file=match?.[1]
 return file&&bundledAssets.has(file)?bundledAsset(file):source
}
