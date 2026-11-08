import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from './assistant.js';

const url='https://portfolio.example/api/assistant';
const secret={GEMINI_API_KEY:'test-only-not-real'};
const photo=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1]).toString('base64');
function request(body,origin='https://portfolio.example'){
 return new Request(url,{method:'POST',headers:{Origin:origin,'X-Alquimago-Request':'1','Content-Type':'application/json'},body:JSON.stringify(body)});
}
test('rejects wrong origin and malicious image formats',async()=>{
 assert.equal((await onRequestPost({request:request({message:'Oi'},'https://evil.example'),env:secret})).status,403);
 assert.equal((await onRequestPost({request:request({message:'Analise',mode:'image-feedback',image:{mimeType:'image/svg+xml',data:photo}}),env:secret})).status,400);
 assert.equal((await onRequestPost({request:request({message:'Analise',mode:'image-feedback',image:{mimeType:'image/jpeg',data:'YWJjZA=='}}),env:secret})).status,400);
});
test('validates the image and forwards its inlineData only after an explicit POST',async()=>{
 const original=globalThis.fetch;
 let sent=null;
 globalThis.fetch=async (target,options)=>{
  assert.match(target,/generativelanguage\.googleapis\.com/);
  sent=JSON.parse(options.body);
  return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'O contraste poderia melhorar.'}]}}]})};
 };
 try{
  const response=await onRequestPost({request:request({message:'Avalie minha arte',mode:'image-feedback',image:{mimeType:'image/jpeg',data:photo}}),env:secret});
  assert.equal(response.status,200);
  assert.match((await response.json()).reply,/contraste/);
  const last=sent.contents.at(-1);
  assert.equal(last.parts[1].inlineData.mimeType,'image/jpeg');
  assert.equal(last.parts[1].inlineData.data,photo);
  assert.equal(sent.systemInstruction.parts[0].text.includes('crítica visual'),true);
 }finally{globalThis.fetch=original;}
});
