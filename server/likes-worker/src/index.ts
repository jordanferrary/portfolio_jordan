// Optional Cloudflare Workers + D1 backend for shared project likes.
// Deploy separately, then build the React app with VITE_LIKES_API_URL.
// The browser never receives the signing secret or database credentials.
interface Environment {
 LIKES_DB:D1Database
 COOKIE_SECRET:string
 ALLOWED_ORIGIN:string
}
interface VoteBody {liked:boolean}
const COOKIE='jfvisitor'
const encoder=new TextEncoder()
function cors(origin:string):HeadersInit{return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Credentials':'true','Vary':'Origin','Cache-Control':'no-store'}}
function reply(body:object,status:number,origin:string,cookie?:string):Response{
 const headers=new Headers(cors(origin))
 headers.set('Content-Type','application/json; charset=utf-8')
 if(cookie)headers.append('Set-Cookie',cookie)
 return new Response(JSON.stringify(body),{status,headers})
}
function textCookie(request:Request):string|undefined{
 const raw=request.headers.get('Cookie')??''
 return raw.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)
}
function toB64Url(bytes:Uint8Array):string{
 let binary=''
 for(const n of bytes)binary+=String.fromCharCode(n)
 return btoa(binary).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
}
async function signature(id:string,secret:string):Promise<string>{
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HMAC',false,['sign'])
 const result=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(id)))
 return toB64Url(result)
}
async function visitor(req:Request,env:Environment):Promise<{id:string;cookie?:string}>{
 const raw=textCookie(req)
 if(raw){
  const [id,sig]=raw.split('.')
  if(id&&sig&&/^[a-f0-9-]{36}$/.test(id)){
   const expected=await signature(id,env.COOKIE_SECRET)
   // Constant-time comparison of fixed-size signature.
   if(expected.length===sig.length){
    let diff=0
    for(let i=0;i<sig.length;i++)diff|=expected.charCodeAt(i)^sig.charCodeAt(i)
    if(diff===0)return {id}
   }
  }
 }
 const id=crypto.randomUUID()
 const sig=await signature(id,env.COOKIE_SECRET)
 return {id,cookie:COOKIE+'='+id+'.'+sig+'; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=None'}
}
export default {
 async fetch(request:Request,env:Environment):Promise<Response>{
  const origin=request.headers.get('Origin')
  const allowed=env.ALLOWED_ORIGIN.replace(/\/$/,'')
  const sameOrigin=new URL(request.url).origin===allowed
  if(origin!==allowed&&!(origin===null&&sameOrigin))return new Response('Origin not allowed',{status:403})
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(allowed)})
  if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405,allowed)
  if(!env.COOKIE_SECRET||env.COOKIE_SECRET.length<32)return reply({error:'server_not_configured'},503,allowed)
  const url=new URL(request.url)
  const match=url.pathname.match(/^\/projects\/([a-zA-Z0-9_-]{1,128})\/likes$/)
  if(!match)return reply({error:'not_found'},404,allowed)
  const projectId=match[1]
  const identity=await visitor(request,env)
  try{
   if(request.method==='POST'){
    const payload=await request.json() as Partial<VoteBody>
    if(typeof payload.liked!=='boolean')return reply({error:'invalid_vote'},400,allowed,identity.cookie)
    if(payload.liked)await env.LIKES_DB.prepare('INSERT OR IGNORE INTO likes (project_id, visitor_id) VALUES (?, ?)').bind(projectId,identity.id).run()
    else await env.LIKES_DB.prepare('DELETE FROM likes WHERE project_id = ? AND visitor_id = ?').bind(projectId,identity.id).run()
   }
   const tally=await env.LIKES_DB.prepare('SELECT COUNT(*) AS count FROM likes WHERE project_id = ?').bind(projectId).first<{count:number}>()
   const own=await env.LIKES_DB.prepare('SELECT 1 AS liked FROM likes WHERE project_id = ? AND visitor_id = ? LIMIT 1').bind(projectId,identity.id).first<{liked:number}>()
   return reply({count:tally?.count??0,liked:!!own},200,allowed,identity.cookie)
  }catch{return reply({error:'internal_error'},500,allowed)}
 }
} satisfies ExportedHandler<Environment>
