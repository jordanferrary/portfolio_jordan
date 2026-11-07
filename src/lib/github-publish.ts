import type { PortfolioStore } from '../hooks/use-portfolio'
import { isLocalMedia,readMedia } from './media-store'
import { isKnownDemoTestimonial } from './testimonial-safety'
import {resolvePublishedAsset} from './published-assets'
import {isCleanableFile,isProtectedAsset,referencedMediaPaths} from './github-media'

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
const ALQUIMAGO_MEMORY_PATH='public/alquimago/project-memory.json'
const ALQUIMAGO_CONTEXT_PATH='public/alquimago/project-context.json'
const MAX_NEW_MEDIA_BYTES=80*1024*1024
type Kind='image'|'audio'
type TreeEntry={path:string;mode:'100644';type:'blob';sha?:string|null;content?:string}
export type GitHubPublishResult={revision:string;commitSha:string;commitUrl:string;newFiles:number;deletedFiles:number}
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
  imageVariants:store.imageVariants??{},
  customPages:store.customPages??[],
  projects:store.projects,
  categories:store.categories,
  home:store.home,
  testimonials:store.testimonials.filter(review=>!isKnownDemoTestimonial(review)),
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
  themePalette:store.themePalette,
  seoTitle:store.seoTitle,
  seoDescription:store.seoDescription
 }
 return JSON.parse(JSON.stringify(publicData)) as PortfolioStore
}

export async function publishPortfolioToGitHub(
 token:string,
 store:PortfolioStore,
 bundledRevision:string,
 onProgress:GitHubPublishProgress=()=>{},
 deletePaths:string[]=[],
 familiarSnapshot:unknown=null
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
 async function stageBlob(blob:Blob,kind:Kind,sourceRef=''):Promise<string>{
  const ext=extension(sourceRef,blob,kind)
  const sha=await fingerprint(blob)
  const relative=(kind==='audio'?'audio':'images')+'/studio/'+sha+'.'+ext
  const filePath='public/'+relative
  if(!existing.has(filePath)&&!pending.has(filePath)){
   totalBytes+=blob.size
   if(totalBytes>MAX_NEW_MEDIA_BYTES)throw new Error('Os arquivos novos excedem 80 MB. Publique em lotes menores ou compacte as mídias.')
   pending.set(filePath,blob)
  }
  return 'site://'+relative
 }
 async function createVariants(reference:string,blob:Blob):Promise<void>{
  if(snapshot.imageVariants[reference]||!blob.type.startsWith('image/'))return
  if(typeof createImageBitmap!=='function')return
  let bitmap:ImageBitmap
  try{bitmap=await createImageBitmap(blob)}catch{return}
  const width=bitmap.width,height=bitmap.height
  bitmap.close()
  if(Math.max(width,height)<=1100)return
  onProgress('Gerando miniaturas WebP para a galeria e páginas dos projetos...')
  const {optimizeImage}=await import('./image-optimize')
  const original=new File([blob],'artwork.webp',{type:blob.type})
  const small=await optimizeImage(original,{maxDimension:480,quality:.76})
  const medium=await optimizeImage(original,{maxDimension:960,quality:.80})
  const [smallRef,mediumRef]=await Promise.all([stageBlob(small,'image'),stageBlob(medium,'image')])
  snapshot.imageVariants[reference]={
   small:smallRef,
   smallWidth:Math.max(1,Math.round(width*Math.min(1,480/Math.max(width,height)))),
   medium:mediumRef,
   mediumWidth:Math.max(1,Math.round(width*Math.min(1,960/Math.max(width,height)))),
   largeWidth:width
  }
 }
 async function stage(value:string|undefined,kind:Kind):Promise<string>{
  if(!value)return ''
  if(isLocalMedia(value)){
   const cached=refCache.get(value)
   if(cached)return cached
   const blob=await readMedia(value)
   if(!blob)throw new Error('Um arquivo do Studio não foi encontrado neste navegador ('+value.split('/').pop()+'). Importe-o novamente antes de publicar.')
   const reference=await stageBlob(blob,kind,value)
   refCache.set(value,reference)
   if(kind==='image')await createVariants(reference,blob)
   return reference
  }
  // Older already-published artwork can receive responsive versions at the next publication.
  // Fetch only assets hosted by this site, never arbitrary external image URLs.
  const ownSite=value.startsWith('site://images/studio/')||value.startsWith(import.meta.env.BASE_URL+'images/')
  if(kind==='image'&&ownSite&&!snapshot.imageVariants[value]&&!refCache.has(value)){
   refCache.set(value,value)
   try{
    const response=await fetch(resolvePublishedAsset(value),{credentials:'omit'})
    if(response.ok)await createVariants(value,await response.blob())
   }catch{/* Legacy or unavailable assets retain the original and continue publishing. */}
  }
  return value
 }
 onProgress('Preparando os projetos, capas, artes e trilhas...')
 for(const page of snapshot.customPages){
  page.heroImage=await stage(page.heroImage,'image')
  for(const block of page.blocks){
   if(block.type==='slideshow'&&block.slideItems)for(const slide of block.slideItems)slide.image=await stage(slide.image,'image')
   // Showcase images are remote URLs; preserve attribution and avoid storing participant artwork.
   if(block.type==='image')block.content=await stage(block.content,'image')
   if(block.media)block.media=await stage(block.media,'image')
   if(block.after)block.after=await stage(block.after,'image')
   if(block.gallery)for(let i=0;i<block.gallery.length;i++)block.gallery[i]=await stage(block.gallery[i],'image')
  }
 }
 for(const project of snapshot.projects){
  project.image=await stage(project.image,'image')
  for(const step of project.processSteps??[])step.image=await stage(step.image,'image')
  for(const block of project.blocks){
   if(block.type==='image')block.content=await stage(block.content,'image')
   if(block.media)block.media=await stage(block.media,'image')
   if(block.after)block.after=await stage(block.after,'image')
   if(block.gallery)for(let i=0;i<block.gallery.length;i++)block.gallery[i]=await stage(block.gallery[i],'image')
   if(block.galleryEntries)for(const item of block.galleryEntries)item.image=await stage(item.image,'image')
   if(block.slides)for(const slide of block.slides)slide.image=await stage(slide.image,'image')
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
 // Project metadata is public and versioned in the very same commit as the site.
 // Never include drafts, form contents, credentials, browser history or private file content.
 const context=JSON.stringify({
  schema:1,revision,updatedAt:new Date().toISOString(),
  site:{type:'react-portfolio',editor:'Local Studio'},
  counts:{projects:snapshot.projects.length,pages:snapshot.customPages.length,categories:snapshot.categories.length},
  description:'Resumo público do projeto gerado automaticamente durante a publicação.'
 },null,2)+'\n'
 entries.push({path:ALQUIMAGO_CONTEXT_PATH,mode:'100644',type:'blob',content:context})
 // Persist the live familiar ONLY inside this authenticated GitHub commit.
 // No automatic localStorage snapshot, no chat text and no credentials.
 if(familiarSnapshot&&typeof familiarSnapshot==='object'){
  const candidate=familiarSnapshot as {schema?:unknown;brain?:unknown;neural?:unknown}
  if(candidate.schema===2&&candidate.brain&&typeof candidate.brain==='object'){
   const brain=candidate.brain as Record<string,unknown>,safeBrain:Record<string,unknown>={}
   for(const key of ['energy','curiosity','focus','affinity','xp','interactions','lastSeen','sleepUntil','lastRewardAt']){
    const value=brain[key]
    if(typeof value==='number'&&Number.isFinite(value))safeBrain[key]=Math.max(0,Math.min(1e12,value))
   }
   const actions=['pet','stroke','play','brew','rest','focus','study','explore','publish','summon']
   if(typeof brain.lastAction==='string'&&actions.includes(brain.lastAction))safeBrain.lastAction=brain.lastAction
   if(typeof brain.lastRewardAction==='string'&&actions.includes(brain.lastRewardAction))safeBrain.lastRewardAction=brain.lastRewardAction
   if(brain.rewardedPages&&typeof brain.rewardedPages==='object'&&!Array.isArray(brain.rewardedPages)){
    const entries=Object.entries(brain.rewardedPages as Record<string,unknown>)
     .filter(([key,value])=>/^[A-Za-z0-9_.#%-]{1,120}$/.test(key)&&typeof value==='number'&&Number.isFinite(value)).slice(-80)
    safeBrain.rewardedPages=Object.fromEntries(entries)
   }
   // Never publish messages. Synapses are validated numerical arrays only.
   const n=candidate.neural&&typeof candidate.neural==='object'&&!Array.isArray(candidate.neural)
    ?candidate.neural as Record<string,unknown>:null
   const shapes:Record<string,number>={inputHidden:2304,hiddenBias:24,hiddenOutput:288,outputBias:12}
   const valid=!!n&&n.version===1&&Object.entries(shapes).every(([key,length])=>{
    const weights=n?.[key]
    return Array.isArray(weights)&&weights.length===length&&weights.every((v:unknown)=>
     typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=5)
   })
   const neural=valid?{
    version:1,inputHidden:n!.inputHidden,hiddenBias:n!.hiddenBias,
    hiddenOutput:n!.hiddenOutput,outputBias:n!.outputBias,
    learned:typeof n!.learned==='number'?Math.max(0,Math.min(1e6,n!.learned)):0,
    prototypes:Array.isArray(n!.prototypes)?n!.prototypes.slice(-24).filter((p:unknown)=>{
     if(!p||typeof p!=='object')return false
     const entry=p as {intent?:unknown;features?:unknown}
     return typeof entry.intent==='string'&&
      ['greeting','identity','status','pet','play','brew','rest','navigate','insight','help','mood','thanks'].includes(entry.intent)&&
      Array.isArray(entry.features)&&entry.features.length===96&&
      entry.features.every((x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1)
    }).map((p:unknown)=>{
     const entry=p as {intent:string;features:number[]}
     return {intent:entry.intent,features:entry.features}
    }):[]
   }:undefined
   // A confirmed new GitHub revision is one meaningful milestone. Include
   // its reward in the snapshot itself so a reload never loses publication XP.
   const rewardKey='pub-'+encodeURIComponent(revision).slice(0,100)
   const rewarded=safeBrain.rewardedPages&&typeof safeBrain.rewardedPages==='object'
    ?safeBrain.rewardedPages as Record<string,number>:{}
   rewarded[rewardKey]=Math.floor(Date.now()/86400000)
   safeBrain.rewardedPages=Object.fromEntries(Object.entries(rewarded).slice(-80))
   safeBrain.xp=Math.min(1e12,(typeof safeBrain.xp==='number'?safeBrain.xp:0)+10)
   safeBrain.interactions=Math.min(1e12,(typeof safeBrain.interactions==='number'?safeBrain.interactions:0)+1)
   safeBrain.lastAction='publish'
   safeBrain.lastRewardAction='publish'
   safeBrain.lastRewardAt=Date.now()
   entries.push({path:ALQUIMAGO_MEMORY_PATH,mode:'100644',type:'blob',
    content:JSON.stringify({schema:2,updatedAt:new Date().toISOString(),brain:safeBrain,
     ...(neural?{neural}:{}),
     description:'Memória numérica pública do familiar. Nenhuma mensagem ou token é incluído.'},null,2)+'\n'})
  }
 }
 
 const usedPaths=referencedMediaPaths(snapshot)
 const cleanups=[...new Set(deletePaths)]
 for(const path of cleanups){
  if(!isCleanableFile(path)||isProtectedAsset(path)||usedPaths.has(path)||pending.has(path)||!existing.has(path))throw new Error('Exclusão bloqueada: arquivo protegido, utilizado ou inexistente ('+path+').')
  entries.push({path,mode:'100644',type:'blob',sha:null})
 }
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
  newFiles:pending.size,
  deletedFiles:cleanups.length
 }
}
