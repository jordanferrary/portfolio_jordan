import type {PortfolioStore} from '../hooks/use-portfolio'

export type RepositoryMedia={path:string;bytes:number;kind:'Imagem'|'Áudio'|'Vídeo'|'Modelo 3D';used:boolean;protected:boolean}
const SOURCE='https://api.github.com/repos/jordanferrary/portfolio_jordan'
const ALLOWED=/^public\/(images|audio|models|videos|assets)\/[a-zA-Z0-9/_ .-]+\.(png|jpe?g|webp|avif|gif|svg|mp3|wav|ogg|m4a|flac|mp4|webm|glb|gltf|fbx)$/i
const fallbackProtected=new Set([
 'public/images/hero/hero-character.webp',
 'public/images/profile/avatar.webp',
 'public/images/music/album-cover.webp',
 ...['void-wanderer','moonlit-cottage','deepwalker','astral-guardian','neon-armor','ancient-ruins'].map(id=>'public/images/projects/'+id+'/'+id+'.webp')
])
export function isCleanableFile(path:string){return ALLOWED.test(path)&&!path.includes('..')}
export function isProtectedAsset(path:string){return fallbackProtected.has(path)}
export function mediaPathFromRef(value:string):string|undefined{
 if(!value)return
 if(value.startsWith('site://')){const candidate='public/'+value.slice(7);return isCleanableFile(candidate)?candidate:undefined}
 if(value.startsWith('media://'))return
 try{
  const url=new URL(value,window.location.href)
  if(url.origin!==window.location.origin)return
  const match=url.pathname.match(/\/(images|audio|models|videos|assets)\/(.+)$/i)
  if(!match)return
  const path='public/'+match[1]+'/'+decodeURIComponent(match[2])
  return isCleanableFile(path)?path:undefined
 }catch{return}
}
export function referencedMediaPaths(store:PortfolioStore):Set<string>{
 const result=new Set<string>()
 const originals=new Set<string>()
 function walk(value:unknown):void{
  if(typeof value==='string'){originals.add(value);const path=mediaPathFromRef(value);if(path)result.add(path);return}
  if(Array.isArray(value)){value.forEach(walk);return}
  if(value&&typeof value==='object')Object.values(value).forEach(walk)
 }
 const {imageVariants,...content}=store
 walk(content)
 for(const [original,variants] of Object.entries(imageVariants??{})){
  if(!originals.has(original))continue
  for(const source of [variants.small,variants.medium]){
   const path=mediaPathFromRef(source)
   if(path)result.add(path)
  }
 }
 return result
}
export async function getRepositoryMedia(token:string,store:PortfolioStore):Promise<RepositoryMedia[]>{
 if(!token.trim())throw new Error('Informe o token para consultar o repositório.')
 const response=await fetch(SOURCE+'/git/trees/main?recursive=1',{
  headers:{Authorization:'Bearer '+token.trim(),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
  cache:'no-store',referrerPolicy:'no-referrer'
 })
 if(!response.ok)throw new Error('Não foi possível consultar os arquivos (HTTP '+response.status+'). Confira o token e seu acesso ao repositório.')
 const tree=await response.json() as {truncated?:boolean;tree?:{path:string;type:string;size?:number}[]}
 if(tree.truncated||!Array.isArray(tree.tree))throw new Error('A lista do GitHub está incompleta. Nenhum arquivo será excluído.')
 const used=referencedMediaPaths(store)
 return tree.tree.filter(entry=>entry.type==='blob'&&isCleanableFile(entry.path)).map(entry=>{
  const path=entry.path
  const kind:RepositoryMedia['kind']=/\.(mp3|wav|ogg|m4a|flac)$/i.test(path)?'Áudio':/\.(glb|gltf|fbx)$/i.test(path)?'Modelo 3D':/\.(mp4|webm)$/i.test(path)?'Vídeo':'Imagem'
  return {path,bytes:entry.size??0,kind,used:used.has(path),protected:isProtectedAsset(path)}
 }).sort((a,b)=>Number(a.used||a.protected)-Number(b.used||b.protected)||a.path.localeCompare(b.path))
}
