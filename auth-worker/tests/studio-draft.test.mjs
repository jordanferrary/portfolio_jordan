import test from 'node:test'
import assert from 'node:assert/strict'
import {studioDraftRoute} from '../src/studio-draft.js'
const owner={value:{login:'owner',repository:'owner/repo'}}
const env={GH_OWNER:'owner',GH_REPO:'repo'}
const revision='a'.repeat(32),nextRevision='b'.repeat(32)
const zip=Uint8Array.from([80,75,3,4,1,2,3,4])
const req=(mode,method='GET',rev='',body,authorized=true)=>new Request('https://worker.example/api/studio/draft?mode='+mode,{method,headers:{...(authorized?{'X-Alquimago-Request':'1'}:{}),...(rev?{'X-Studio-Revision':rev}:{}),...(body?{'Content-Type':'application/zip'}:{})},body})
function bucket(){
 let current=null
 return {
  async head(){return current},
  async put(key,body,options){
   assert.equal(key,'drafts/owner/repo/current.zip')
   const only=options.onlyIf
   if(only.get('If-None-Match')==='*'&&current)return null
   if(only.has('If-Match')&&only.get('If-Match')!=='"'+current?.etag+'"')return null
   current={etag:current?nextRevision:revision,size:body.byteLength,uploaded:new Date('2026-01-01T00:00:00Z'),data:body}
   return current
  },
  async get(key,options){return current&&options.onlyIf.get('If-Match')==='"'+current.etag+'"'?{...current,body:current.data}:null}
 }
}
test('private drafts require owner, request header and configured storage',async()=>{
 const e={...env,STUDIO_DRAFTS:bucket()}
 assert.equal((await studioDraftRoute(req('meta'),e,null,{})).status,401)
 assert.equal((await studioDraftRoute(req('meta'),e,{value:{login:'other',repository:'owner/repo'}},{})).status,401)
 assert.equal((await studioDraftRoute(req('meta','GET','',undefined,false),e,owner,{})).status,403)
 assert.equal((await studioDraftRoute(req('meta'),env,owner,{})).status,503)
})
test('create, conflict, restore, update, stale read',async()=>{
 const e={...env,STUDIO_DRAFTS:bucket()}
 const initial=await studioDraftRoute(req('meta'),e,owner,{})
 assert.equal(initial.headers.get('cache-control'),'no-store')
 assert.deepEqual(await initial.json(),{draft:null})
 const created=await studioDraftRoute(req('upload','POST','none',zip),e,owner,{})
 assert.equal(created.status,200);assert.equal((await created.json()).draft.revision,revision)
 assert.equal((await studioDraftRoute(req('upload','POST','none',zip),e,owner,{})).status,409)
 const result=await studioDraftRoute(req('download','GET',revision),e,owner,{})
 assert.equal(result.status,200);assert.deepEqual(new Uint8Array(await result.arrayBuffer()),zip)
 const updated=await studioDraftRoute(req('upload','POST',revision,zip),e,owner,{})
 assert.equal(updated.status,200);assert.equal((await updated.json()).draft.revision,nextRevision)
 assert.equal((await studioDraftRoute(req('download','GET',revision),e,owner,{})).status,409)
})
test('invalid revisions, malformed ZIP and oversized upload are rejected',async()=>{
 const e={...env,STUDIO_DRAFTS:bucket()}
 assert.equal((await studioDraftRoute(req('upload','POST','invalid',zip),e,owner,{})).status,400)
 assert.equal((await studioDraftRoute(req('upload','POST','none',Uint8Array.of(1,2,3,4)),e,owner,{})).status,400)
 const huge=new Request('https://worker.example/api/studio/draft?mode=upload',{method:'POST',headers:{'Content-Type':'application/zip','X-Alquimago-Request':'1','X-Studio-Revision':'none','Content-Length':String(33*1024*1024)},body:zip})
 assert.equal((await studioDraftRoute(huge,e,owner,{})).status,413)
})
