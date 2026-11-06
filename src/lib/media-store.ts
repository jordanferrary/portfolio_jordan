const DB='jf-portfolio-media'
const STORE='assets'
const LIBRARY='library'
const PREFIX='media://'
export interface LibraryAsset {ref:string;name:string;folders:string[];hash?:string;size?:number;createdAt:number;mime?:string}
let connection:Promise<IDBDatabase>|null=null
function db():Promise<IDBDatabase>{
 if(!connection)connection=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,2)
  req.onupgradeneeded=()=>{
   const database=req.result
   if(!database.objectStoreNames.contains(STORE))database.createObjectStore(STORE)
   if(!database.objectStoreNames.contains(LIBRARY))database.createObjectStore(LIBRARY,{keyPath:'ref'})
  }
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
 })
 return connection
}
export const isLocalMedia=(src:string)=>src.startsWith(PREFIX)
export const mediaKey=(src:string)=>src.slice(PREFIX.length)
export async function readMedia(src:string):Promise<Blob|undefined>{
 if(!isLocalMedia(src))return undefined
 const database=await db()
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,'readonly')
  const request=tx.objectStore(STORE).get(mediaKey(src))
  request.onsuccess=()=>resolve(request.result as Blob|undefined)
  request.onerror=()=>reject(request.error)
 })
}
export async function saveMediaBlob(ref:string,file:Blob):Promise<void>{
 if(!isLocalMedia(ref))throw new Error('Caminho de mídia inválido.')
 const database=await db()
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,'readwrite')
  tx.objectStore(STORE).put(file,mediaKey(ref))
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
 })
}
function folderFromRef(ref:string):string {
 const value=isLocalMedia(ref)?mediaKey(ref):ref
 const pieces=value.split('/')
 return pieces.slice(0,-1).join('/')
}
function filename(ref:string):string{
 const end=ref.split(/[/?#]/).filter(Boolean).pop()??'Imagem'
 try{return decodeURIComponent(end)}catch{return end}
}
async function fingerprint(blob:Blob):Promise<string>{
 const buffer=await blob.arrayBuffer()
 if(!crypto?.subtle)throw new Error('Este navegador não permite verificação segura de duplicatas.')
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
}
async function getCatalog():Promise<LibraryAsset[]>{
 const database=await db()
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(LIBRARY,'readonly')
  const req=tx.objectStore(LIBRARY).getAll()
  req.onsuccess=()=>resolve(req.result as LibraryAsset[])
  req.onerror=()=>reject(req.error)
 })
}
async function updateCatalog(item:LibraryAsset):Promise<void>{
 const database=await db()
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(LIBRARY,'readwrite')
  tx.objectStore(LIBRARY).put(item)
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
 })
}
export async function saveCatalogItems(items:LibraryAsset[]):Promise<void>{
 const database=await db()
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(LIBRARY,'readwrite')
  const store=tx.objectStore(LIBRARY)
  for(const item of items)if(typeof item.ref==='string'&&Array.isArray(item.folders))store.put(item)
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
 })
}
export async function linkAssetToFolder(ref:string,folder:string):Promise<void>{
 if(!ref.trim())return
 const catalog=await getCatalog()
 const existing=catalog.find(x=>x.ref===ref)
 const cleanFolder=folder.split('/').filter(Boolean).join('/')
 await updateCatalog(existing?{...existing,folders:[...new Set([...existing.folders,cleanFolder])]}:{ref,name:filename(ref),folders:[cleanFolder],createdAt:Date.now()})
}
export async function listMediaAssets():Promise<LibraryAsset[]>{
 const database=await db()
 const [catalog,keys]=await Promise.all([getCatalog(),new Promise<IDBValidKey[]>((resolve,reject)=>{
  const tx=database.transaction(STORE,'readonly')
  const req=tx.objectStore(STORE).getAllKeys()
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
 })])
 // Migrate image blobs saved by earlier Studio versions, including unused assets.
 const known=new Set(catalog.map(a=>a.ref))
 for(const key of keys){
  const ref=PREFIX+String(key)
  if(known.has(ref)||!/\.(png|jpg|jpeg|webp|avif)$/i.test(ref))continue
  const blob=await readMedia(ref)
  if(!blob)continue
  const item:LibraryAsset={ref,name:filename(ref),folders:[folderFromRef(ref)],hash:await fingerprint(blob),size:blob.size,mime:blob.type,createdAt:Date.now()}
  await updateCatalog(item)
  catalog.push(item)
 }
 return catalog.sort((a,b)=>b.createdAt-a.createdAt)
}
export async function saveUploadedMedia(file:File,folder:string,slot:string):Promise<string>{
 if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type))throw new Error('Use PNG, JPG, WEBP ou AVIF.')
 if(file.size>12_000_000)throw new Error('Imagem acima de 12 MB. Otimize antes de importar.')
 const hash=await fingerprint(file)
 const catalog=await listMediaAssets()
 const same=catalog.find(a=>a.hash===hash&&a.size===file.size&&isLocalMedia(a.ref))
 if(same){await linkAssetToFolder(same.ref,folder);return same.ref}
 const ext=file.type==='image/jpeg'?'jpg':file.type==='image/avif'?'avif':file.type==='image/png'?'png':'webp'
 const clean=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').slice(0,70)
 const folderPath=folder.split('/').map(clean).filter(Boolean).join('/')
 const ref=PREFIX+folderPath+'/'+clean(slot)+'-'+Date.now()+'-'+hash.slice(0,10)+'.'+ext
 await saveMediaBlob(ref,file)
 await updateCatalog({ref,name:file.name,folders:[folderPath],hash,size:file.size,mime:file.type,createdAt:Date.now()})
 return ref
}
export function mediaRefs(projects:{image:string;blocks:{media?:string;after?:string;gallery?:string[];content:string;type:string}[];processSteps?:{image:string}[]}[],categories:{image?:string}[]){
 const all=new Set<string>()
 for(const project of projects){all.add(project.image);for(const step of project.processSteps??[])all.add(step.image);for(const b of project.blocks){if(b.media)all.add(b.media);if(b.after)all.add(b.after);for(const a of b.gallery??[])all.add(a);if(b.type==='image')all.add(b.content)}}
 for(const c of categories)if(c.image)all.add(c.image)
 return [...all].filter(isLocalMedia)
}
export async function saveUploadedAudio(file:File):Promise<string>{
 const valid=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg']
 if(!valid.includes(file.type)&&!/\.(mp3|wav|ogg)$/i.test(file.name))throw new Error('Envie MP3, WAV ou OGG.')
 if(file.size>25_000_000)throw new Error('Áudio acima de 25 MB; compacte antes de adicionar.')
 const ext=file.name.toLowerCase().match(/\.(mp3|wav|ogg)$/)?.[1]??'mp3'
 const ref='media://music/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext
 await saveMediaBlob(ref,file)
 return ref
}
