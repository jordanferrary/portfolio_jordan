import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {webcrypto} from 'node:crypto'
import {transform} from 'esbuild'

const source=await readFile(new URL('../src/lib/github-token-vault.ts',import.meta.url),'utf8')
const compiled=await transform(source,{loader:'ts',format:'esm',target:'es2022'})
const {createGitHubTokenVault}=await import('data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'))
const sample='t'.repeat(50)
function persistence(){
 const map=new Map()
 return {map,storage:{
  get:async k=>map.get(k),
  set:async(k,v)=>{map.set(k,v)},
  delete:async k=>{map.delete(k)}
 }}
}
function reply(status,body){return {status,ok:status>=200&&status<300,json:async()=>body}}
function fetcher(account=reply(200,{login:'jordanferrary'}),repo=reply(200,{permissions:{push:true}})){
 const calls=[]
 const fetch=async (url,opts)=>{calls.push({url,opts});return url.endsWith('/user')?account:repo}
 return {fetch,calls}
}
test('AES-GCM sealed token uses non-exportable key and survives reopening',async()=>{
 const p=persistence(),f=fetcher()
 const vault=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,fetcher:f.fetch})
 await vault.save(sample)
 assert.equal(await vault.load(),sample)
 const envelope=p.map.get('portfolio-token')
 assert.equal(envelope.version,1)
 assert.equal(envelope.iv.byteLength,12)
 assert.ok(envelope.cipher.byteLength>sample.length)
 assert.equal(Buffer.from(envelope.cipher).includes(Buffer.from(sample)),false)
 assert.equal(p.map.get('portfolio-key').extractable,false)
 await assert.rejects(webcrypto.subtle.exportKey('raw',p.map.get('portfolio-key')))
 assert.equal((await vault.inspect()).status,'ready')
 assert.equal(f.calls.length,2)
 assert.ok(f.calls.every(call=>call.opts.headers.Authorization==='Bearer '+sample))
 assert.ok(f.calls.every(call=>call.url.startsWith('https://api.github.com/')))
 const another=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,fetcher:f.fetch})
 assert.equal(await another.load(),sample)
})
test('expired token is flagged but discarded only after the user chooses to',async()=>{
 const p=persistence(),f=fetcher(reply(401,{}))
 const vault=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,fetcher:f.fetch})
 await vault.save(sample)
 assert.equal((await vault.inspect()).status,'expired')
 assert.equal(await vault.load(),sample)
 await vault.forget()
 assert.equal(await vault.load(),null)
 assert.equal((await vault.inspect()).status,'missing')
})
test('wrong account or missing write permission is never ready',async()=>{
 const p=persistence()
 const owner=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,
  fetcher:fetcher(reply(200,{login:'another-user'})).fetch})
 assert.equal((await owner.check(sample)).status,'forbidden')
 const permission=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,
  fetcher:fetcher(reply(200,{login:'jordanferrary'}),reply(200,{permissions:{push:false}})).fetch})
 assert.equal((await permission.check(sample)).status,'forbidden')
})
test('network failure does not erase stored authorization',async()=>{
 const p=persistence()
 const vault=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto,
  fetcher:async()=>{throw Error('network down')}})
 await vault.save(sample)
 assert.equal((await vault.inspect()).status,'offline')
 assert.equal(await vault.load(),sample)
})
test('crypto unavailable fails closed with no plaintext fallback',async()=>{
 const p=persistence()
 const vault=createGitHubTokenVault({storage:p.storage,cryptoProvider:null})
 await assert.rejects(vault.save(sample),/Criptografia indisponível/)
 assert.equal(p.map.size,0)
 const other=createGitHubTokenVault({storage:p.storage,cryptoProvider:webcrypto})
 await assert.rejects(other.save('bad'),/token GitHub válido/)
 assert.equal(p.map.size,0)
})
