export const contactApi=(import.meta.env.VITE_CONTACT_API_URL as string|undefined)?.trim().replace(/\/$/,'')??''
export type ContactMessage={id:string;name:string;email:string;interests:string[];message:string;isRead:boolean;createdAt:string}
export type NewContact={name:string;email:string;interests:string[];message:string;website?:string}
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
