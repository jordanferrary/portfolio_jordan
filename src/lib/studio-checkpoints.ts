import type {PortfolioStore} from '../hooks/use-portfolio'
import {readMedia,saveMediaBlob,listMediaAssets,saveCatalogItems,type LibraryAsset} from './media-store'
export type CheckpointInfo={id:string;time:number;label:string;bytes:number}
type Checkpoint=CheckpointInfo&{store:PortfolioStore;media:{ref:string;blob:Blob}[];catalog:LibraryAsset[]}
const DB='jf-studio-checkpoints-v1',STORE='snapshots',LIMIT=5,MAX_BYTES=100*1024*1024
let writes:Promise<unknown>=Promise.resolve()
function db():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})}
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
  req.onblocked=()=>reject(new Error('Feche outras abas do Studio e tente novamente.'))
 })
}
async function access<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const database=await db()
 try{return await new Promise<T>((resolve,reject)=>{
  const tx=database.transaction(STORE,mode),req=run(tx.objectStore(STORE))
  let result:T
  req.onsuccess=()=>{result=req.result}
  tx.oncomplete=()=>resolve(result)
  tx.onerror=()=>reject(tx.error??req.error)
  tx.onabort=()=>reject(tx.error??new Error('Falha no armazenamento de checkpoints.'))
 })}finally{database.close()}
}
async function listRecords():Promise<Checkpoint[]>{return (await access('readonly',s=>s.getAll()) as Checkpoint[]).sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id))}
export async function listCheckpoints():Promise<CheckpointInfo[]>{return (await listRecords()).map(({id,time,label,bytes})=>({id,time,label,bytes}))}
export async function removeCheckpoint(id:string){await access('readwrite',s=>s.delete(id))}
export function createCheckpoint(store:PortfolioStore,refs:string[],label:string):Promise<CheckpointInfo>{
 const snapshot=JSON.parse(JSON.stringify(store)) as PortfolioStore
 const run=async()=>{
  const media:Checkpoint['media']=[]
  let bytes=new Blob([JSON.stringify(snapshot)]).size
  for(const ref of new Set(refs)){
   const blob=await readMedia(ref)
   if(!blob?.size)throw new Error('Não foi possível criar checkpoint: mídia local ausente.')
   bytes+=blob.size
   if(bytes>MAX_BYTES)throw new Error('O rascunho supera 100 MB. Use o backup ZIP completo.')
   media.push({ref,blob})
  }
  const catalog=(await listMediaAssets()).filter(a=>media.some(m=>m.ref===a.ref))
  const info={id:crypto.randomUUID(),time:Date.now(),label:label.slice(0,100),bytes}
  const entry:Checkpoint={...info,store:snapshot,media,catalog}
  const database=await db()
  try{await new Promise<void>((resolve,reject)=>{
   const tx=database.transaction(STORE,'readwrite'),items=tx.objectStore(STORE)
   const req=items.getAll()
   req.onsuccess=()=>{
    const existing=(req.result as Checkpoint[]).sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id))
    for(const old of existing.slice(LIMIT-1))items.delete(old.id)
    items.put(entry)
   }
   tx.oncomplete=()=>resolve()
   tx.onerror=()=>reject(tx.error)
   tx.onabort=()=>reject(tx.error??new Error('Checkpoint não salvo.'))
  })}finally{database.close()}
  return info
 }
 const job=writes.catch(()=>{}).then(run);writes=job;return job
}
export async function restoreCheckpoint(id:string):Promise<PortfolioStore>{
 const entry=await access('readonly',s=>s.get(id)) as Checkpoint|undefined
 if(!entry)throw new Error('Checkpoint não encontrado.')
 // Restore local media before the manifest. Published URLs remain external.
 for(const item of entry.media)await saveMediaBlob(item.ref,item.blob)
 if(entry.catalog.length)await saveCatalogItems(entry.catalog)
 return entry.store
}
