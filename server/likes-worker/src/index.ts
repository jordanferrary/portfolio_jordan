// Optional Cloudflare Workers + D1 service for public likes and private contact inbox.
// SERVER-ONLY secrets: COOKIE_SECRET and ADMIN_TOKEN (never exposed to React).
interface Environment{
 LIKES_DB:D1Database
 ATTACHMENTS?:R2Bucket
 COOKIE_SECRET:string
 ADMIN_TOKEN:string
 ALLOWED_ORIGIN:string
}
type MessageInput={name?:string;email?:string;interests?:unknown;message?:string;website?:string;avatar?:string}
type AttachmentRecord={id:string;name:string;size:number;type:string;key:string}
const COOKIE='jfvisitor'
const encoder=new TextEncoder()
function cors(origin:string):HeadersInit{
 return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Credentials':'true','Vary':'Origin','Cache-Control':'no-store'}
}
function reply(data:object,status:number,origin:string,cookie?:string):Response{
 const headers=new Headers(cors(origin))
 headers.set('Content-Type','application/json; charset=utf-8')
 if(cookie)headers.append('Set-Cookie',cookie)
 return new Response(JSON.stringify(data),{status,headers})
}
function textCookie(request:Request):string|undefined{
 const raw=request.headers.get('Cookie')??''
 return raw.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)
}
function b64(bytes:Uint8Array):string{
 let binary=''
 for(const n of bytes)binary+=String.fromCharCode(n)
 return btoa(binary).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
}
async function signature(id:string,secret:string):Promise<string>{
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HMAC',false,['sign'])
 return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(id))))
}
function constantTime(a:string,b:string):boolean{
 if(a.length!==b.length)return false
 let changed=0
 for(let i=0;i<a.length;i++)changed|=a.charCodeAt(i)^b.charCodeAt(i)
 return changed===0
}
async function visitor(req:Request,env:Environment):Promise<{id:string;cookie?:string}>{
 const raw=textCookie(req)
 if(raw){
  const [id,sig]=raw.split('.')
  if(id&&sig&&/^[a-f0-9-]{36}$/.test(id)){
   const expected=await signature(id,env.COOKIE_SECRET)
   if(constantTime(expected,sig))return {id}
  }
 }
 const id=crypto.randomUUID()
 const sig=await signature(id,env.COOKIE_SECRET)
 return {id,cookie:COOKIE+'='+id+'.'+sig+'; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=None'}
}
async function authorized(req:Request,env:Environment):Promise<boolean>{
 if(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<32)return false
 const provided=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'')
 if(provided.length<32)return false
 const [given,correct]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(provided)),crypto.subtle.digest('SHA-256',encoder.encode(env.ADMIN_TOKEN))])
 const a=new Uint8Array(given),b=new Uint8Array(correct)
 let diff=0
 for(let i=0;i<a.length;i++)diff|=a[i]^b[i]
 return diff===0
}
async function checkRate(req:Request,env:Environment):Promise<boolean>{
 const ip=req.headers.get('CF-Connecting-IP')??'unknown'
 const fingerprint=await signature(ip,env.COOKIE_SECRET)
 const hour=Math.floor(Date.now()/3600000)
 await env.LIKES_DB.prepare('INSERT INTO contact_limits (visitor_hash,hour_bucket,attempts) VALUES (?,?,1) ON CONFLICT(visitor_hash,hour_bucket) DO UPDATE SET attempts=attempts+1').bind(fingerprint,hour).run()
 const row=await env.LIKES_DB.prepare('SELECT attempts FROM contact_limits WHERE visitor_hash=? AND hour_bucket=?').bind(fingerprint,hour).first<{attempts:number}>()
 return (row?.attempts??100)<=4
}
export default {
 async fetch(request:Request,env:Environment):Promise<Response>{
  const origin=request.headers.get('Origin')
  const allowed=env.ALLOWED_ORIGIN.replace(/\/$/,'')
  const sameOrigin=new URL(request.url).origin===allowed
  if(origin!==allowed&&!(origin===null&&sameOrigin))return new Response('Origin not allowed',{status:403})
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(allowed)})
  const url=new URL(request.url)
  const path=url.pathname
  if(!env.COOKIE_SECRET||env.COOKIE_SECRET.length<32)return reply({error:'server_not_configured'},503,allowed)
  try{
   // Public contact form: no storage in visitor browser, no admin token exposure.
   if(path==='/contact'&&request.method==='POST'){
    if(Number(request.headers.get('Content-Length')??'0')>9_000_000)return reply({error:'too_large'},413,allowed)
    const mime=request.headers.get('Content-Type')??''
    let data:MessageInput
    let uploads:File[]=[]
    if(mime.includes('multipart/form-data')){
     const body=await request.formData()
     const payload=body.get('payload')
     if(typeof payload!=='string'||payload.length>60000)return reply({error:'invalid_message'},400,allowed)
     data=JSON.parse(payload) as MessageInput
     const files=body.getAll('attachments')
     if(files.some(value=>!(value instanceof File)))return reply({error:'invalid_attachment'},400,allowed)
     uploads=files as File[]
    }else{
     const raw=await request.text()
     if(raw.length>60000)return reply({error:'too_large'},413,allowed)
     data=JSON.parse(raw) as MessageInput
    }
    const bytes=uploads.reduce((total,file)=>total+file.size,0)
    if(uploads.length>3||bytes>8*1024*1024||uploads.some(file=>file.size>4*1024*1024))return reply({error:'attachment_too_large'},413,allowed)
    if(uploads.some(file=>!(['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type)&&/\.(png|jpg|jpeg|webp|pdf)$/i.test(file.name))))return reply({error:'invalid_attachment'},400,allowed)
    if(uploads.length&&!env.ATTACHMENTS)return reply({error:'attachments_unavailable'},503,allowed)
    if(typeof data.website==='string'&&data.website.trim())return reply({ok:true},200,allowed)
    const email=typeof data.email==='string'?data.email.trim():''
    const name=typeof data.name==='string'?data.name.trim():''
    const message=typeof data.message==='string'?data.message.trim():''
    const interests=Array.isArray(data.interests)?data.interests.filter((x):x is string=>typeof x==='string'&&x.length<=45).slice(0,10):[]
    const avatar=typeof data.avatar==='string'?data.avatar:''
    if(avatar&&(!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(avatar)||avatar.length>45000))return reply({error:'invalid_avatar'},400,allowed)
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>150||name.length>90||message.length<10||message.length>2500||!interests.length)return reply({error:'invalid_message'},400,allowed)
    if(!await checkRate(request,env))return reply({error:'rate_limited'},429,allowed)
    const id=crypto.randomUUID()
    const attachments:AttachmentRecord[]=uploads.map(file=>{
     const name=(file.name.split(/[\\/]/).pop()??'anexo').replace(/[\x00-\x1f]/g,'').slice(0,130)
     const fileId=crypto.randomUUID()
     return {id:fileId,name,size:file.size,type:file.type,key:'contact/'+id+'/'+fileId}
    })
    try{
     for(let i=0;i<uploads.length;i++)await env.ATTACHMENTS!.put(attachments[i].key,await uploads[i].arrayBuffer(),{httpMetadata:{contentType:uploads[i].type}})
     await env.LIKES_DB.prepare('INSERT INTO contact_messages (id,name,email,interests,message,avatar,attachments) VALUES (?,?,?,?,?,?,?)').bind(id,name,email,JSON.stringify(interests),message,avatar,JSON.stringify(attachments)).run()
    }catch(error){
     if(env.ATTACHMENTS)for(const item of attachments)await env.ATTACHMENTS.delete(item.key).catch(()=>{})
     throw error
    }
    return reply({ok:true},201,allowed)
   }
   // Protected admin routes require a separate long server secret.
   if(path.startsWith('/admin/')){
    if(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<32)return reply({error:'admin_not_configured'},503,allowed)
    if(!await authorized(request,env))return reply({error:'unauthorized'},401,allowed)
    if(path==='/admin/summary'&&request.method==='GET'){
     const row=await env.LIKES_DB.prepare('SELECT COUNT(*) AS unread FROM contact_messages WHERE is_read=0').first<{unread:number}>()
     return reply({unread:row?.unread??0},200,allowed)
    }
    if(path==='/admin/messages'&&request.method==='GET'){
     const list=await env.LIKES_DB.prepare('SELECT id,name,email,interests,message,avatar,attachments,is_read AS isRead,created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 150').all<{id:string;name:string;email:string;interests:string;message:string;avatar:string|null;attachments:string;isRead:number;createdAt:string}>()
     return reply({messages:(list.results??[]).map(item=>({...item,isRead:!!item.isRead,interests:JSON.parse(item.interests) as string[],attachments:(JSON.parse(item.attachments) as AttachmentRecord[]).map(({id,name,size,type})=>({id,name,size,type}))}))},200,allowed)
    }
    const downloadMatch=path.match(/^\/admin\/messages\/([a-f0-9-]{36})\/attachments\/([a-f0-9-]{36})$/)
    if(downloadMatch&&request.method==='GET'){
     if(!env.ATTACHMENTS)return reply({error:'attachments_unavailable'},503,allowed)
     const row=await env.LIKES_DB.prepare('SELECT attachments FROM contact_messages WHERE id=?').bind(downloadMatch[1]).first<{attachments:string}>()
     if(!row)return reply({error:'not_found'},404,allowed)
     const attachment=(JSON.parse(row.attachments) as AttachmentRecord[]).find(file=>file.id===downloadMatch[2])
     if(!attachment)return reply({error:'not_found'},404,allowed)
     const file=await env.ATTACHMENTS.get(attachment.key)
     if(!file)return reply({error:'not_found'},404,allowed)
     const headers=new Headers(cors(allowed))
     headers.set('Content-Type',attachment.type)
     headers.set('X-Content-Type-Options','nosniff')
     headers.set('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(attachment.name))
     return new Response(file.body,{headers})
    }
    const match=path.match(/^\/admin\/messages\/([a-f0-9-]{36})$/)
    if(match&&request.method==='PATCH'){
     const data=await request.json() as {isRead?:unknown}
     if(typeof data.isRead!=='boolean')return reply({error:'invalid_status'},400,allowed)
     await env.LIKES_DB.prepare('UPDATE contact_messages SET is_read=? WHERE id=?').bind(data.isRead?1:0,match[1]).run()
     return reply({ok:true},200,allowed)
    }
    if(match&&request.method==='DELETE'){
     const row=await env.LIKES_DB.prepare('SELECT attachments FROM contact_messages WHERE id=?').bind(match[1]).first<{attachments:string}>()
     const attachments:AttachmentRecord[]=row?JSON.parse(row.attachments) as AttachmentRecord[]:[]
     if(env.ATTACHMENTS)for(const file of attachments)await env.ATTACHMENTS.delete(file.key)
     await env.LIKES_DB.prepare('DELETE FROM contact_messages WHERE id=?').bind(match[1]).run()
     return reply({ok:true},200,allowed)
    }
    return reply({error:'not_found'},404,allowed)
   }
   // Existing likes API unchanged.
   const match=path.match(/^\/projects\/([a-zA-Z0-9_-]{1,128})\/likes$/)
   if(match&&['GET','POST'].includes(request.method)){
    const projectId=match[1]
    const identity=await visitor(request,env)
    if(request.method==='POST'){
     const data=await request.json() as {liked?:unknown}
     if(typeof data.liked!=='boolean')return reply({error:'invalid_vote'},400,allowed,identity.cookie)
     if(data.liked)await env.LIKES_DB.prepare('INSERT OR IGNORE INTO likes (project_id, visitor_id) VALUES (?, ?)').bind(projectId,identity.id).run()
     else await env.LIKES_DB.prepare('DELETE FROM likes WHERE project_id=? AND visitor_id=?').bind(projectId,identity.id).run()
    }
    const tally=await env.LIKES_DB.prepare('SELECT COUNT(*) AS count FROM likes WHERE project_id=?').bind(projectId).first<{count:number}>()
    const own=await env.LIKES_DB.prepare('SELECT 1 AS liked FROM likes WHERE project_id=? AND visitor_id=? LIMIT 1').bind(projectId,identity.id).first<{liked:number}>()
    return reply({count:tally?.count??0,liked:!!own},200,allowed,identity.cookie)
   }
   return reply({error:'not_found'},404,allowed)
  }catch{return reply({error:'internal_error'},500,allowed)}
 }
} satisfies ExportedHandler<Environment>
