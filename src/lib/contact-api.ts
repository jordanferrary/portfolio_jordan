export const contactApi=(import.meta.env.VITE_CONTACT_API_URL as string|undefined)?.trim().replace(/\/$/,'')??''
export type ContactMessage={id:string;name:string;email:string;interests:string[];message:string;isRead:boolean;createdAt:string;avatar?:string|null}
export type NewContact={name:string;email:string;interests:string[];message:string;website?:string;avatar?:string}
async function jsonOrThrow(response:Response):Promise<unknown>{
 const data:unknown=await response.json().catch(()=>({}))
 if(!response.ok){
  if(response.status===401)throw new Error('Chave de acesso inválida.')
  if(response.status===429)throw new Error('Muitas mensagens enviadas. Tente novamente mais tarde.')
  if(response.status===503)throw new Error('Servidor ainda não configurado.')
  throw new Error('Não foi possível completar a solicitação.')
 }
 return data
}
export async function sendContact(data:NewContact):Promise<void>{
 if(!contactApi)throw new Error('O envio de mensagens ainda não está configurado.')
 const response=await fetch(contactApi+'/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
 await jsonOrThrow(response)
}
async function adminRequest(path:string,token:string,method='GET',body?:object):Promise<unknown>{
 if(!contactApi)throw new Error('Caixa de entrada indisponível: configure o servidor primeiro.')
 const response=await fetch(contactApi+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})
 return jsonOrThrow(response)
}
export async function listMessages(token:string):Promise<ContactMessage[]>{
 const result=await adminRequest('/admin/messages',token) as {messages?:ContactMessage[]}
 if(!Array.isArray(result.messages))throw new Error('O servidor retornou mensagens inválidas.')
 return result.messages
}
export async function unreadCount(token:string):Promise<number>{
 const result=await adminRequest('/admin/summary',token) as {unread?:number}
 return typeof result.unread==='number'?result.unread:0
}
export async function markMessage(token:string,id:string,isRead:boolean):Promise<void>{
 await adminRequest('/admin/messages/'+encodeURIComponent(id),token,'PATCH',{isRead})
}
export async function deleteMessage(token:string,id:string):Promise<void>{
 await adminRequest('/admin/messages/'+encodeURIComponent(id),token,'DELETE')
}

/** Compresses an optional self-supplied photo to a small WEBP avatar without metadata. */
export async function prepareContactAvatar(file:File):Promise<string>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Escolha uma imagem PNG, JPG ou WEBP.')
 if(file.size>3_000_000)throw new Error('Imagem acima de 3 MB. Use uma foto menor.')
 const url=URL.createObjectURL(file)
 try{
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{
   const el=new Image()
   el.onload=()=>resolve(el)
   el.onerror=()=>reject(new Error('A foto escolhida não pôde ser aberta.'))
   el.src=url
  })
  const canvas=document.createElement('canvas')
  canvas.width=96;canvas.height=96
  const ctx=canvas.getContext('2d')
  if(!ctx)throw new Error('Seu navegador não permite preparar a foto.')
  const side=Math.min(img.naturalWidth,img.naturalHeight)
  ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,96,96)
  const avatar=canvas.toDataURL('image/webp',.68)
  if(!avatar.startsWith('data:image/webp;base64,')||avatar.length>45000)throw new Error('Não foi possível otimizar esta foto.')
  return avatar
 }finally{URL.revokeObjectURL(url)}
}
