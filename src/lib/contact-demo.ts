import type {AttachmentInfo,ContactMessage,NewContact} from './contact-api'

const DB='jf-contact-test-inbox'
const MESSAGES='messages'
const FILES='files'
const SIGNAL='jf-contact-demo-signal'
let instance:Promise<IDBDatabase>|undefined
function openDatabase():Promise<IDBDatabase>{
 if(!instance)instance=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1)
  request.onupgradeneeded=()=>{
   const database=request.result
   if(!database.objectStoreNames.contains(MESSAGES))database.createObjectStore(MESSAGES,{keyPath:'id'})
   if(!database.objectStoreNames.contains(FILES))database.createObjectStore(FILES,{keyPath:'id'})
  }
  request.onsuccess=()=>resolve(request.result)
  request.onerror=()=>{instance=undefined;reject(request.error??new Error('Armazenamento local indisponível.'))}
 })
 return instance
}
function updated(){
 try{localStorage.setItem(SIGNAL,String(Date.now()))}catch{/* storage blocked */}
 window.dispatchEvent(new Event('jf-contact-demo-changed'))
}
export function observeDemoChanges(onChange:()=>void):()=>void{
 const onStorage=(event:StorageEvent)=>{if(event.key===SIGNAL)onChange()}
 window.addEventListener('jf-contact-demo-changed',onChange)
 window.addEventListener('storage',onStorage)
 return ()=>{window.removeEventListener('jf-contact-demo-changed',onChange);window.removeEventListener('storage',onStorage)}
}
export async function listDemoMessages():Promise<ContactMessage[]>{
 const database=await openDatabase()
 return new Promise((resolve,reject)=>{
  const req=database.transaction(MESSAGES,'readonly').objectStore(MESSAGES).getAll()
  req.onsuccess=()=>resolve((req.result as ContactMessage[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
  req.onerror=()=>reject(req.error)
 })
}
export async function demoUnreadCount():Promise<number>{
 return (await listDemoMessages()).filter(item=>!item.isRead).length
}
export async function createDemoMessage(data:NewContact,attachments:File[]):Promise<void>{
 const database=await openDatabase()
 const id=crypto.randomUUID()
 const descriptors:AttachmentInfo[]=attachments.map(file=>({id:crypto.randomUUID(),name:file.name,size:file.size,type:file.type}))
 const message:ContactMessage={
  id,name:data.name,email:data.email,interests:data.interests,message:data.message,
  avatar:data.avatar??null,isRead:false,createdAt:new Date().toISOString(),attachments:descriptors
 }
 await new Promise<void>((resolve,reject)=>{
  const tx=database.transaction([MESSAGES,FILES],'readwrite')
  tx.objectStore(MESSAGES).add(message)
  for(let i=0;i<attachments.length;i++){
   tx.objectStore(FILES).put({id:id+':'+descriptors[i].id,blob:attachments[i]})
  }
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error??new Error('Falha ao gravar o teste.'))
 })
 updated()
}
export async function setDemoMessageRead(id:string,isRead:boolean):Promise<void>{
 const database=await openDatabase()
 await new Promise<void>((resolve,reject)=>{
  const tx=database.transaction(MESSAGES,'readwrite')
  const store=tx.objectStore(MESSAGES)
  const req=store.get(id)
  req.onsuccess=()=>{const found=req.result as ContactMessage|undefined;if(found)store.put({...found,isRead})}
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
 })
 updated()
}
export async function removeDemoMessage(id:string):Promise<void>{
 const database=await openDatabase()
 const message=(await listDemoMessages()).find(m=>m.id===id)
 await new Promise<void>((resolve,reject)=>{
  const tx=database.transaction([MESSAGES,FILES],'readwrite')
  tx.objectStore(MESSAGES).delete(id)
  for(const file of message?.attachments??[])tx.objectStore(FILES).delete(id+':'+file.id)
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
 })
 updated()
}
export async function getDemoAttachment(messageId:string,attachmentId:string):Promise<Blob>{
 const database=await openDatabase()
 return new Promise((resolve,reject)=>{
  const req=database.transaction(FILES,'readonly').objectStore(FILES).get(messageId+':'+attachmentId)
  req.onsuccess=()=>req.result?.blob?resolve(req.result.blob as Blob):reject(new Error('Anexo não encontrado neste navegador.'))
  req.onerror=()=>reject(req.error)
 })
}
