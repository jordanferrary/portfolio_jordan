// Private, owner-scoped ZIP sync. The caller must verify the owner session first.
// The only public endpoint is the authenticated Worker, never the R2 bucket.
const LIMIT=32*1024*1024
const response=(body,status,headers)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
const metadata=obj=>obj?{revision:obj.etag,bytes:obj.size,updatedAt:obj.uploaded.toISOString()}:null
async function boundedBody(request){
 if(Number(request.headers.get('Content-Length')||0)>LIMIT||!request.body)return null
 const reader=request.body.getReader(),chunks=[]
 let total=0
 try{
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>LIMIT){await reader.cancel();return null}chunks.push(value)}
 }finally{reader.releaseLock()}
 const body=new Uint8Array(total);let offset=0
 for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength}
 return body
}
export async function studioDraftRoute(request,env,session,headers){
 if(!session||session.value.login?.toLowerCase()!==env.GH_OWNER.toLowerCase()||session.value.repository!==env.GH_OWNER+'/'+env.GH_REPO)return response({error:'Sessão não autorizada.'},401,headers)
 if(request.headers.get('X-Alquimago-Request')!=='1')return response({error:'Requisição não autorizada.'},403,headers)
 if(!env.STUDIO_DRAFTS)return response({error:'Armazenamento privado ainda não configurado.'},503,headers)
 const key='drafts/'+env.GH_OWNER.toLowerCase()+'/'+env.GH_REPO+'/current.zip'
 const mode=new URL(request.url).searchParams.get('mode')
 const revision=request.headers.get('X-Studio-Revision')||''
 if(request.method==='GET'&&mode==='meta')return response({draft:metadata(await env.STUDIO_DRAFTS.head(key))},200,headers)
 if(request.method==='GET'&&mode==='download'){
  if(!/^[a-f0-9]{32}(?:-\d+)?$/i.test(revision))return response({error:'Revisão inválida.'},400,headers)
  const obj=await env.STUDIO_DRAFTS.get(key,{onlyIf:new Headers({'If-Match':'"'+revision+'"'})})
  if(!obj||!obj.body)return response({error:'O rascunho mudou. Atualize a lista.'},409,headers)
  return new Response(obj.body,{headers:{...headers,'Content-Type':'application/zip','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'attachment; filename="studio-draft.zip"'}})
 }
 if(request.method==='POST'&&mode==='upload'){
  if(revision!=='none'&&!/^[a-f0-9]{32}(?:-\d+)?$/i.test(revision))return response({error:'Revisão obrigatória.'},400,headers)
  if(request.headers.get('Content-Type')!=='application/zip')return response({error:'Envie um backup ZIP.'},415,headers)
  const body=await boundedBody(request)
  if(!body)return response({error:'Limite de 32 MB por backup.'},413,headers)
  if(body.length<4||body[0]!==80||body[1]!==75||body[2]!==3||body[3]!==4)return response({error:'Arquivo ZIP inválido.'},400,headers)
  const condition=new Headers(revision==='none'?{'If-None-Match':'*'}:{'If-Match':'"'+revision+'"'})
  const saved=await env.STUDIO_DRAFTS.put(key,body,{onlyIf:condition,httpMetadata:{contentType:'application/zip',cacheControl:'no-store'}})
  if(!saved)return response({error:'Outro dispositivo alterou o rascunho. Atualize antes de substituir.'},409,headers)
  return response({draft:metadata(saved)},200,headers)
 }
 return response({error:'Operação inválida.'},405,headers)
}
