import type { PortfolioStore } from '../hooks/use-portfolio'
import { isLocalMedia,readMedia } from './media-store'

/**
 * Browser-only GitHub publishing.
 * The fine-grained token exists only in the caller's React state.
 * NEVER persist it, log it, send it anywhere other than api.github.com,
 * or embed it in the compiled public site.
 */
const OWNER='jordanferrary'
const REPO='portfolio_jordan'
const BRANCH='main'
const API='https://api.github.com'
const ROOT='/repos/'+OWNER+'/'+REPO
const CONTENT_PATH='src/data/published-portfolio.json'
const MAX_NEW_MEDIA_BYTES=80*1024*1024
type Kind='image'|'audio'
type TreeEntry={path:string;mode:'100644';type:'blob';sha?:string;content?:string}
export type GitHubPublishResult={revision:string;commitSha:string;commitUrl:string;newFiles:number}
export type GitHubPublishProgress=(status:string)=>void

async function api<T>(token:string,path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(API+path,{
  method,
  headers:{
   Authorization:'Bearer '+token,
   Accept:'application/vnd.github+json',
   'Content-Type':'application/json',
   'X-GitHub-Api-Version':'2022-11-28'
  },
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
  cache:'no-store',
  referrerPolicy:'no-referrer'
 })
 if(!response.ok){
  if(response.status===401)throw new Error('Token inválido ou expirado. Gere uma credencial com acesso somente a este repositório.')
  if(response.status===403)throw new Error('O GitHub recusou a operação. Confira o acesso ao repositório e a permissão Contents: Read and write.')
  if(response.status===404)throw new Error('Recurso não encontrado. Confira se o token tem acesso ao portfólio.')
  if(response.status===409||response.status===422)throw new Error('O repositório mudou durante a publicação ou a branch rejeitou o commit. Recarregue o site e tente novamente, sem forçar o histórico.')
  throw new Error('O GitHub retornou um erro (HTTP '+response.status+').')
 }
 return response.json() as Promise<T>
}
function decodeBase64Utf8(value:string):string{
 const bytes=Uint8Array.from(atob(value.replace(/\s/g,'')),char=>char.charCodeAt(0))
 return new TextDecoder().decode(bytes)
}
function encodeBinary(blob:Blob):Promise<string>{
 return new Promise((resolve,reject)=>{
  const reader=new FileReader()
  reader.onerror=()=>reject(new Error('Não foi possível ler um arquivo local para publicação.'))
  reader.onload=()=>{
   const content=String(reader.result??'')
   const split=content.indexOf(',')
   if(split<0){reject(new Error('Arquivo inválido para envio.'));return}
   resolve(content.slice(split+1))
  }
  reader.readAsDataURL(blob)
 })
}
async function fingerprint(blob:Blob):Promise<string>{
 const data=await blob.arrayBuffer()
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data))
 return Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('')
}
function extension(ref:string,blob:Blob,kind:Kind):string{
 const mime=blob.type.toLowerCase()
 if(kind==='image'){
  if(mime==='image/jpeg')return 'jpg'
  if(mime==='image/png')return 'png'
  if(mime==='image/webp')return 'webp'
  if(mime==='image/avif')return 'avif'
  throw new Error('Uma imagem local não tem um formato compatível (PNG, JPG, WEBP ou AVIF).')
 }
 if(mime==='audio/mpeg'||mime==='audio/mp3')return 'mp3'
 if(mime==='audio/ogg')return 'ogg'
 if(mime==='audio/wav'||mime==='audio/x-wav')return 'wav'
 if(['audio/mp4','audio/x-m4a','audio/m4a'].includes(mime))return 'm4a'
 // Some browsers saved imported audio without a MIME; rely on the original extension.
 const suffix=ref.match(/\.(mp3|wav|ogg|m4a)$/i)?.[1]?.toLowerCase()
 if(suffix&&(!mime||mime==='application/octet-stream'))return suffix
 throw new Error('Um áudio local tem formato incompatível. Use MP3, WAV, OGG ou M4A.')
}
function stageSnapshot(store:PortfolioStore){
 // Publish only explicitly approved public content, never incidental UI state.
 // Deep clone so the form keeps local media previews during deployment.
 const publicData:PortfolioStore={
  projects:store.projects,
  categories:store.categories,
  home:store.home,
  testimonials:store.testimonials,
  musicTracks:store.musicTracks,
  socialLinks:store.socialLinks,
  showLikeCounts:store.showLikeCounts,
  about:store.about,
  contact:store.contact,
  galleryBackground:store.galleryBackground,
  siteLogo:store.siteLogo,
  siteLogoHover:store.siteLogoHover,
  siteLogoSize:store.siteLogoSize,
  siteLogoHoverScale:store.siteLogoHoverScale,
  siteFavicon:store.siteFavicon,
  seoTitle:store.seoTitle,
  seoDescription:store.seoDescription
 }
 return JSON.parse(JSON.stringify(publicData)) as PortfolioStore
}

export async function publishPortfolioToGitHub(
 token:string,
 store:PortfolioStore,
 bundledRevision:string,
 onProgress:GitHubPublishProgress=()=>{}
):Promise<GitHubPublishResult>{
 const cleanToken=token.trim()
 if(!cleanToken)throw new Error('Informe um token GitHub para autorizar a publicação.')
 onProgress('Verificando sua conta e as permissões do repositório...')
 const account=await api<{login:string}>(cleanToken,'/user')
 if(account.login.toLowerCase()!==OWNER)throw new Error('Entre com um token pertencente à sua conta jordanferrary.')
 const ref=await api<{object:{sha:string}}>(cleanToken,ROOT+'/git/ref/heads/'+BRANCH)
 const parentSha=ref.object.sha
 const commit=await api<{tree:{sha:string}}>(cleanToken,ROOT+'/git/commits/'+parentSha)
 const tree=await api<{tree:{path:string}[];truncated?:boolean}>(cleanToken,ROOT+'/git/trees/'+commit.tree.sha+'?recursive=1')
 if(tree.truncated)throw new Error('O GitHub não retornou a lista completa de arquivos. Publicação interrompida por segurança.')
 const existing=new Set(tree.tree.map(item=>item.path))

 // Prevent overwriting newer remotely published content with a stale browser bundle.
 const publishedFile=await api<{content:string}>(cleanToken,ROOT+'/contents/'+CONTENT_PATH+'?ref='+BRANCH)
 let remoteRevision=''
 try{remoteRevision=(JSON.parse(decodeBase64Utf8(publishedFile.content)) as {revision?:string}).revision??''}
 catch{throw new Error('O arquivo de conteúdo publicado no GitHub está inválido. Verifique-o antes de publicar.')}
 if(remoteRevision!==bundledRevision)throw new Error('Há uma versão publicada mais recente que a carregada neste navegador. Atualize o site e revise suas alterações antes de tentar novamente.')

 const snapshot=stageSnapshot(store)
 const pending=new Map<string,Blob>()
 const refCache=new Map<string,string>()
 let totalBytes=0
 async function stage(value:string|undefined,kind:Kind):Promise<string>{
  if(!value||!isLocalMedia(value))return value??''
  const cached=refCache.get(value)
  if(cached)return cached
  const blob=await readMedia(value)
  if(!blob)throw new Error('Um arquivo do Studio não foi encontrado neste navegador ('+value.split('/').pop()+'). Importe-o novamente antes de publicar.')
  const ext=extension(value,blob,kind)
  const sha=await fingerprint(blob)
  const relative=(kind==='audio'?'audio':'images')+'/studio/'+sha+'.'+ext
  const filePath='public/'+relative
  const reference='site://'+relative
  if(!existing.has(filePath)&&!pending.has(filePath)){
   totalBytes+=blob.size
   if(totalBytes>MAX_NEW_MEDIA_BYTES)throw new Error('Os arquivos novos excedem 80 MB. Publique em lotes menores ou compacte as mídias.')
   pending.set(filePath,blob)
  }
  refCache.set(value,reference)
  return reference
 }
 onProgress('Preparando os projetos, capas, artes e trilhas...')
 for(const project of snapshot.projects){
  project.image=await stage(project.image,'image')
  for(const step of project.processSteps??[])step.image=await stage(step.image,'image')
  for(const block of project.blocks){
   if(block.type==='image')block.content=await stage(block.content,'image')
   if(block.media)block.media=await stage(block.media,'image')
   if(block.after)block.after=await stage(block.after,'image')
   if(block.gallery)for(let i=0;i<block.gallery.length;i++)block.gallery[i]=await stage(block.gallery[i],'image')
  }
 }
 for(const category of snapshot.categories)if(category.image)category.image=await stage(category.image,'image')
 snapshot.home.avatar=await stage(snapshot.home.avatar,'image')
 snapshot.home.background=await stage(snapshot.home.background,'image')
 snapshot.galleryBackground=await stage(snapshot.galleryBackground,'image')
 snapshot.siteLogo=await stage(snapshot.siteLogo,'image')
 snapshot.siteLogoHover=await stage(snapshot.siteLogoHover,'image')
 snapshot.siteFavicon=await stage(snapshot.siteFavicon,'image')
 snapshot.about.portrait=await stage(snapshot.about.portrait,'image')
 snapshot.about.secondaryImage=await stage(snapshot.about.secondaryImage,'image')
 for(const music of snapshot.musicTracks){
  music.src=await stage(music.src,'audio')
  if(music.cover)music.cover=await stage(music.cover,'image')
 }
 for(const social of snapshot.socialLinks)if(social.iconImage)social.iconImage=await stage(social.iconImage,'image')

 const revision=new Date().toISOString()+'-'+crypto.randomUUID()
 const manifest=JSON.stringify({schema:1,revision,store:snapshot},null,2)+'\n'
 const entries:TreeEntry[]=[{path:CONTENT_PATH,mode:'100644',type:'blob',content:manifest}]
 let progress=0
 for(const [path,blob] of pending){
  progress++
  onProgress('Enviando imagens e mídias ao GitHub ('+progress+'/'+pending.size+')...')
  const encoded=await encodeBinary(blob)
  const asset=await api<{sha:string}>(cleanToken,ROOT+'/git/blobs','POST',{content:encoded,encoding:'base64'})
  entries.push({path,mode:'100644',type:'blob',sha:asset.sha})
 }
 onProgress('Criando uma única versão com todas as mudanças...')
 const newTree=await api<{sha:string}>(cleanToken,ROOT+'/git/trees','POST',{base_tree:commit.tree.sha,tree:entries})
 const newCommit=await api<{sha:string}>(cleanToken,ROOT+'/git/commits','POST',{
  message:'Publish portfolio content from Local Studio',
  tree:newTree.sha,
  parents:[parentSha]
 })
 onProgress('Publicando a versão no branch principal...')
 await api(cleanToken,ROOT+'/git/refs/heads/'+BRANCH,'PATCH',{sha:newCommit.sha,force:false})
 return {
  revision,
  commitSha:newCommit.sha,
  commitUrl:'https://github.com/'+OWNER+'/'+REPO+'/commit/'+newCommit.sha,
  newFiles:pending.size
 }
}
