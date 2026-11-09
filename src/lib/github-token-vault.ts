/**
 * Dedicated Local Studio GitHub PAT vault, separate from the Alquimago's legacy
 * storage and assistant events. A non-extractable AES-GCM key reduces casual
 * exposure, but same-origin scripts can still use it: this is not isolation
 * from compromised JavaScript. Never send credentials through chat or events.
 */
const DATABASE='jf-local-studio-publisher-v2'
const RECORDS='credentials'
const KEY_NAME='portfolio-key'
const TOKEN_NAME='portfolio-token'
const AAD=new TextEncoder().encode('JF-LOCAL-STUDIO-PAT-V2:jordanferrary/portfolio_jordan')
const OWNER='jordanferrary'
const REPOSITORY='portfolio_jordan'

export type GitHubTokenCheck='ready'|'missing'|'expired'|'forbidden'|'offline'|'unavailable'
export type GitHubTokenStatus={status:GitHubTokenCheck;description:string}
type EncryptedToken={version:1;iv:Uint8Array;cipher:ArrayBuffer}
type CredentialStorage={
 get(key:string):Promise<unknown>
 set(key:string,value:unknown):Promise<void>
 delete(key:string):Promise<void>
}
const status=(kind:GitHubTokenCheck,description:string):GitHubTokenStatus=>({status:kind,description})

function indexedDbStorage():CredentialStorage{
 if(typeof indexedDB==='undefined')throw Error('Este navegador não oferece IndexedDB.')
 const open=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1)
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(RECORDS))
    request.result.createObjectStore(RECORDS)
  }
  request.onerror=()=>reject(Error('Não foi possível abrir o cofre de publicação.'))
  request.onsuccess=()=>resolve(request.result)
 })
 async function perform<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
  const db=await open
  return new Promise<T>((resolve,reject)=>{
   const tx=db.transaction(RECORDS,mode)
   let value:T,settled=false
   const fail=()=>{if(!settled){settled=true;reject(Error('Falha no armazenamento criptografado.'))}}
   tx.onabort=fail;tx.onerror=fail
   tx.oncomplete=()=>{if(!settled){settled=true;resolve(value)}}
   try{
    const request=operation(tx.objectStore(RECORDS))
    request.onsuccess=()=>{value=request.result}
    request.onerror=fail
   }catch{fail();try{tx.abort()}catch{/* the original failure is enough */}}
  })
 }
 return {
  get:key=>perform('readonly',store=>store.get(key)),
  set:async(key,value)=>{await perform('readwrite',store=>store.put(value,key))},
  delete:async key=>{await perform('readwrite',store=>store.delete(key))}
 }
}

export function createGitHubTokenVault({
 storage,indexedDb=()=>indexedDbStorage(),
 cryptoProvider=globalThis.crypto,
 fetcher=globalThis.fetch
}:{
 storage?:CredentialStorage
 indexedDb?:()=>CredentialStorage
 cryptoProvider?:Crypto
 fetcher?:typeof fetch
}={}){
 let store:CredentialStorage|undefined=storage
 const getStore=()=>{if(!store)store=indexedDb();return store}
 function ensureCrypto(){
  if(!cryptoProvider?.subtle||typeof cryptoProvider.getRandomValues!=='function')
   throw Error('Criptografia indisponível neste navegador. Não vou guardar o token.')
  return cryptoProvider
 }
 async function getKey(create:boolean):Promise<CryptoKey|null>{
  const crypto=ensureCrypto(),db=getStore()
  const saved=await db.get(KEY_NAME)
  if(saved){
   const key=saved as CryptoKey
   if(key.type!=='secret'||key.algorithm?.name!=='AES-GCM'||key.extractable!==false)
    throw Error('A chave de publicação está inválida.')
   return key
  }
  if(!create)return null
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])
  await db.set(KEY_NAME,key)
  return key
 }
 async function load():Promise<string|null>{
  const db=getStore(),record=await db.get(TOKEN_NAME) as EncryptedToken|undefined
  if(!record)return null
  if(record.version!==1||!(record.iv instanceof Uint8Array)||record.iv.length!==12||
   !(record.cipher instanceof ArrayBuffer))throw Error('Token guardado com formato incompatível.')
  const key=await getKey(false)
  if(!key)throw Error('A chave do token foi perdida. Descarte o registro antigo e configure outro.')
  try{
   const bytes=await ensureCrypto().subtle.decrypt(
    {name:'AES-GCM',iv:record.iv,additionalData:AAD},key,record.cipher)
   const token=new TextDecoder().decode(bytes)
   if(!validTokenShape(token))throw Error('Registro inválido.')
   return token
  }catch{throw Error('Não foi possível descriptografar o token. Descarte-o e configure outro.')}
 }
 async function save(token:string):Promise<void>{
  if(!validTokenShape(token))throw Error('Informe um token GitHub válido no campo protegido.')
  const crypto=ensureCrypto()
  const key=await getKey(true),iv=crypto.getRandomValues(new Uint8Array(12))
  const cipher=await crypto.subtle.encrypt(
   {name:'AES-GCM',iv,additionalData:AAD},key!,new TextEncoder().encode(token.trim()))
  await getStore().set(TOKEN_NAME,{version:1,iv,cipher} satisfies EncryptedToken)
 }
 async function forget():Promise<void>{
  await getStore().delete(TOKEN_NAME)
 }
 async function check(token:string):Promise<GitHubTokenStatus>{
  if(!validTokenShape(token))return status('expired','Token ausente ou com formato inválido.')
  try{
   const headers={
    Authorization:'Bearer '+token.trim(),Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'
   }
   const account=await fetcher('https://api.github.com/user',{
    method:'GET',headers,cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'
   })
   if(account.status===401)return status('expired','O GitHub rejeitou o token; ele pode estar expirado ou revogado.')
   if(account.status===403)return status('forbidden','O GitHub bloqueou a verificação; verifique permissões ou limite de requisições.')
   if(!account.ok)return status('offline','Não foi possível confirmar a autorização agora.')
   const identity=await account.json() as {login?:string}
   if(identity.login?.toLowerCase()!==OWNER)
    return status('forbidden','O token não pertence à conta autorizada do portfólio.')
   const repo=await fetcher('https://api.github.com/repos/'+OWNER+'/'+REPOSITORY,{
    method:'GET',headers,cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'
   })
   if(repo.status===401)return status('expired','O token expirou ou foi revogado.')
   if(repo.status===403||repo.status===404)
    return status('forbidden','O token não tem acesso suficiente ao repositório. Confira Contents: Read and write.')
   if(!repo.ok)return status('offline','Não foi possível confirmar o acesso ao repositório.')
   const permissions=await repo.json() as {permissions?:{push?:boolean;admin?:boolean}}
   if(permissions.permissions?.push!==true&&permissions.permissions?.admin!==true)
    return status('forbidden','O token precisa permitir gravação apenas no repositório do portfólio.')
   return status('ready','Autorização GitHub válida para publicar neste repositório.')
  }catch{
   return status('offline','Sem conexão com o GitHub. Mantive o token criptografado para tentar novamente.')
  }
 }
 async function inspect():Promise<GitHubTokenStatus>{
  try{
   const saved=await load()
   return saved?await check(saved):status('missing','Nenhum token foi guardado neste dispositivo.')
  }catch{
   return status('unavailable','O cofre não pôde ser aberto. Os dados não foram enviados a nenhum serviço.')
  }
 }
 return {load,save,forget,check,inspect}
}

function validTokenShape(value:unknown):value is string{
 return typeof value==='string'&&/^[A-Za-z0-9_]{20,450}$/.test(value.trim())
}

export const githubTokenVault=createGitHubTokenVault()
