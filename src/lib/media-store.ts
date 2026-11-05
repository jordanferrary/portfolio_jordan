const DB = 'jf-portfolio-media'
const STORE = 'assets'
const PREFIX = 'media://'
let connection:Promise<IDBDatabase>|null = null
function db():Promise<IDBDatabase>{
 if(!connection)connection=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)}
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
 })
 return connection
}
export const isLocalMedia=(src:string)=>src.startsWith(PREFIX)
export const mediaKey=(src:string)=>src.slice(PREFIX.length)
export async function readMedia(src:string):Promise<Blob|undefined>{
 if(!isLocalMedia(src))return undefined
 return new Promise(async(resolve,reject)=>{try{const database=await db();const txn=database.transaction(STORE,'readonly');const req=txn.objectStore(STORE).get(mediaKey(src));req.onsuccess=()=>resolve(req.result as Blob|undefined);req.onerror=()=>reject(req.error)}catch(err){reject(err)}})
}
export async function saveMediaBlob(ref:string,file:Blob):Promise<void>{
 if(!isLocalMedia(ref))throw new Error('Caminho de mídia inválido.')
 return new Promise(async(resolve,reject)=>{try{const database=await db();const txn=database.transaction(STORE,'readwrite');txn.objectStore(STORE).put(file,mediaKey(ref));txn.oncomplete=()=>resolve();txn.onerror=()=>reject(txn.error)}catch(err){reject(err)}})
}
export async function saveUploadedMedia(file:File,folder:string,slot:string):Promise<string>{
 if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type))throw new Error('Use PNG, JPG, WEBP ou AVIF.')
 if(file.size>12_000_000)throw new Error('Imagem acima de 12 MB. Otimize antes de importar.')
 const ext=file.type==='image/jpeg'?'jpg':file.type==='image/avif'?'avif':file.type==='image/png'?'png':'webp'
 const clean=(value:string)=>value.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,70)
 const folderPath=folder.split('/').map(clean).filter(Boolean).join('/')
 const ref=PREFIX+folderPath+'/'+clean(slot)+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+ext
 await saveMediaBlob(ref,file)
 return ref
}
export function mediaRefs(projects:{image:string;blocks:{media?:string;after?:string;gallery?:string[];content:string;type:string}[]}[],categories:{image?:string}[]){
 const all=new Set<string>()
 for(const project of projects){all.add(project.image);for(const b of project.blocks){if(b.media)all.add(b.media);if(b.after)all.add(b.after);for(const a of b.gallery??[])all.add(a);if(b.type==='image')all.add(b.content)}}
 for(const c of categories)if(c.image)all.add(c.image)
 return [...all].filter(isLocalMedia)
}
