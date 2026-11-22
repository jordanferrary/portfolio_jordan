import type {PortfolioStore} from '../hooks/use-portfolio'
export type HistoryEntry={store:PortfolioStore;time:number;label:string}
export type DraftHistory={past:HistoryEntry[];future:HistoryEntry[]}
export type HistoryRecord={id:'current';revision:string;snapshot:string;history:DraftHistory}
const DB='jf-studio-history-v1',STORE='history',LIMIT=30,MAX_BYTES=8*1024*1024
export const emptyHistory=():DraftHistory=>({past:[],future:[]})
const validEntry=(value:unknown):value is HistoryEntry=>{
 if(!value||typeof value!=='object')return false
 const v=value as Partial<HistoryEntry>
 return typeof v.time==='number'&&Number.isFinite(v.time)&&typeof v.label==='string'&&!!v.store&&typeof v.store==='object'&&Array.isArray(v.store.projects)&&Array.isArray(v.store.customPages)
}
const bytes=(value:unknown)=>new Blob([JSON.stringify(value)]).size
/** Retain the nearest undo/redo entries while keeping a bounded disk budget. */
export function limitHistory(value:DraftHistory,available=MAX_BYTES):DraftHistory{
 const past=value.past.filter(validEntry).slice(-LIMIT),future=value.future.filter(validEntry).slice(-LIMIT)
 let used=0
 const result=emptyHistory()
 for(let i=past.length-1;i>=0;i--){const size=bytes(past[i]);if(used+size>available)break;result.past.unshift(past[i]);used+=size}
 for(let i=future.length-1;i>=0;i--){if(result.past.length+result.future.length>=LIMIT)break;const size=bytes(future[i]);if(used+size>available)break;result.future.unshift(future[i]);used+=size}
 return result
}
export function makeHistoryRecord(revision:string,snapshot:string,history:DraftHistory):HistoryRecord{
 return {id:'current',revision,snapshot,history:limitHistory(history,Math.max(0,MAX_BYTES-bytes(snapshot)-4096))}
}
export function recoverHistory(value:unknown,revision:string,snapshot:string):DraftHistory|null{
 if(!value||typeof value!=='object')return null
 const v=value as Partial<HistoryRecord>
 if(v.revision!==revision||v.snapshot!==snapshot||!Array.isArray(v.history?.past)||!Array.isArray(v.history?.future))return null
 return limitHistory(v.history,Math.max(0,MAX_BYTES-bytes(snapshot)-4096))
}
function openDB():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})}
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
  req.onblocked=()=>reject(new Error('Histórico indisponível: banco bloqueado.'))
 })
}
async function transaction<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await openDB()
 try{return await new Promise<T>((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),request=operation(tx.objectStore(STORE))
  let result:T
  request.onsuccess=()=>{result=request.result}
  tx.oncomplete=()=>resolve(result)
  tx.onerror=()=>reject(tx.error??request.error)
  tx.onabort=()=>reject(tx.error??new Error('Histórico não salvo.'))
 })}finally{db.close()}
}
let pending:Promise<unknown>=Promise.resolve()
export function loadDraftHistory(revision:string,snapshot:string):Promise<DraftHistory|null>{
 return pending.catch(()=>{}).then(async()=>recoverHistory(await transaction('readonly',s=>s.get('current')),revision,snapshot))
}
export function saveDraftHistory(revision:string,snapshot:string,value:DraftHistory):Promise<void>{
 // Never persist a history for a stale draft. Intentionally omit credentials and media blobs.
 const record=makeHistoryRecord(revision,snapshot,value)
 const job=pending.catch(()=>{}).then(async()=>{await transaction('readwrite',s=>s.put(record))})
 pending=job
 return job
}
