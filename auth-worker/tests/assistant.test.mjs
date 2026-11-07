import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const env={
 GH_OWNER:'jordanferrary',GH_REPO:'portfolio_jordan',
 GH_CLIENT_ID:'test-client',GH_CLIENT_SECRET:'test-secret',
 SESSION_ENCRYPTION_KEY:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
 FRONTEND_URL:'https://studio.example.com/',
 SESSIONS:{get:async()=>null,put:async()=>{},delete:async()=>{}},
 AI:{run:async()=>{throw Error('Unauthorized user should never reach AI');}}
};
test('owner-only generative endpoint does not accept unauthenticated requests',async()=>{
 const request=new Request('https://auth.example.com/api/assistant',{
  method:'POST',
  headers:{Origin:'https://studio.example.com','X-Alquimago-Request':'1','Content-Type':'application/json'},
  body:JSON.stringify({message:'Oi, Alquimago'})
 });
 const result=await worker.fetch(request,env);
 assert.equal(result.status,401);
});
test('cross-site requests cannot invoke the generative model',async()=>{
 const request=new Request('https://auth.example.com/api/assistant',{
  method:'POST',
  headers:{Origin:'https://unknown.example.com','X-Alquimago-Request':'1'},
  body:JSON.stringify({message:'Oi'})
 });
 const result=await worker.fetch(request,env);
 assert.equal(result.status,403);
});
test('CORS preflight rejects unknown origins and allows the configured site',async()=>{
 const bad=await worker.fetch(new Request('https://auth.example.com/api/assistant',{method:'OPTIONS',headers:{Origin:'https://evil.example.com'}}),env);
 assert.equal(bad.status,403);
 const good=await worker.fetch(new Request('https://auth.example.com/api/assistant',{method:'OPTIONS',headers:{Origin:'https://studio.example.com'}}),env);
 assert.equal(good.status,204);
 assert.equal(good.headers.get('Access-Control-Allow-Origin'),'https://studio.example.com');
});
