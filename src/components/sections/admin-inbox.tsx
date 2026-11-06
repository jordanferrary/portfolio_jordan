import {useCallback,useEffect,useState,type FormEvent} from 'react'
import {Bell,CheckCheck,Download,Inbox,KeyRound,Paperclip,RefreshCw,Trash2,X} from 'lucide-react'
import {contactApi,deleteMessage,getRemoteAttachment,listMessages,markMessage,unreadCount,type ContactMessage,type AttachmentInfo} from '../../lib/contact-api'
import {getDemoAttachment,listDemoMessages,observeDemoChanges,removeDemoMessage,setDemoMessageRead} from '../../lib/contact-demo'

function ContactAvatar({message,large=false}:{message:ContactMessage;large?:boolean}){
 const name=(message.name.trim()||message.email.split('@')[0]||'?')
 const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()??'').join('').slice(0,2)
 let code=0
 for(const letter of message.email)code=(code*31+letter.charCodeAt(0))%360
 const style={background:'linear-gradient(140deg,hsl('+code+' 58% 34%),hsl('+((code+40)%360)+' 55% 19%))'}
 return <span className={large?'inbox-avatar large':'inbox-avatar'} style={!message.avatar?style:undefined} aria-label={'Avatar de '+name} role="img">{message.avatar?.startsWith('data:image/webp;base64,')?<img src={message.avatar} alt=""/>:<span>{initials}</span>}</span>
}
function readableError(error:unknown){return error instanceof Error?error.message:'Não foi possível atualizar as mensagens.'}
export function AdminInboxBell(){
 const localMode=!contactApi
 const [open,setOpen]=useState(false)
 const [token,setToken]=useState('')
 const [inputToken,setInputToken]=useState('')
 const [messages,setMessages]=useState<ContactMessage[]>([])
 const [count,setCount]=useState(0)
 const [pending,setPending]=useState(false)
 const [error,setError]=useState('')
 const [active,setActive]=useState<string|null>(null)
 const load=useCallback(async(key?:string)=>{
  if(!localMode&&!key)return
  const list=localMode?await listDemoMessages():await listMessages(key!)
  const unread=localMode?list.filter(item=>!item.isRead).length:await unreadCount(key!)
  setMessages(list);setCount(unread)
 },[localMode])
 useEffect(()=>{
  if(!localMode)return
  const reload=()=>{void load().catch(e=>setError(readableError(e)))}
  reload()
  return observeDemoChanges(reload)
 },[localMode,load])
 useEffect(()=>{
  if(localMode||!token)return
  const timer=window.setInterval(()=>{void unreadCount(token).then(setCount).catch(()=>setError('Não foi possível atualizar as notificações.'))},60000)
  return ()=>window.clearInterval(timer)
 },[localMode,token])
 const login=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  setPending(true);setError('')
  try{await load(inputToken.trim());setToken(inputToken.trim());setInputToken('')}
  catch(e){setError(readableError(e))}
  finally{setPending(false)}
 }
 const refresh=async()=>{
  if(!localMode&&!token)return
  setPending(true)
  try{await load(token);setError('')}
  catch(e){setError(readableError(e))}
  finally{setPending(false)}
 }
 const toggleRead=async(item:ContactMessage)=>{
  if(!localMode&&!token)return
  try{
   if(localMode)await setDemoMessageRead(item.id,!item.isRead)
   else await markMessage(token,item.id,!item.isRead)
   await load(token);setError('')
  }catch(e){setError(readableError(e))}
 }
 const remove=async(item:ContactMessage)=>{
  if(!window.confirm('Excluir permanentemente a mensagem de '+(item.name||item.email)+'?'))return
  try{
   if(localMode)await removeDemoMessage(item.id)
   else await deleteMessage(token,item.id)
   setActive(null);await load(token);setError('')
  }catch(e){setError(readableError(e))}
 }
 const clearRead=async()=>{
  if(pending)return
  const read=messages.filter(item=>item.isRead)
  if(!read.length||!window.confirm('Excluir '+read.length+' mensagens já lidas?'))return
  setPending(true)
  try{
   for(const item of read)if(localMode)await removeDemoMessage(item.id);else await deleteMessage(token,item.id)
   setActive(null);await load(token);setError('')
  }catch(e){setError(readableError(e))}
  finally{setPending(false)}
 }
 const download=async(item:ContactMessage,attachment:AttachmentInfo)=>{
  try{
   const blob=localMode?await getDemoAttachment(item.id,attachment.id):await getRemoteAttachment(token,item.id,attachment.id)
   const url=URL.createObjectURL(blob)
   const link=document.createElement('a')
   link.href=url;link.download=attachment.name;document.body.appendChild(link);link.click();link.remove()
   window.setTimeout(()=>URL.revokeObjectURL(url),3000)
   setError('')
  }catch(e){setError(readableError(e))}
 }
 const selected=messages.find(m=>m.id===active)
 return <div className="admin-inbox-container" lang="pt-BR">
  <button type="button" className="admin-inbox-bell" onClick={()=>{setOpen(v=>!v);if(!open&&(localMode||token))void refresh()}} aria-label={count?count+' mensagens não lidas':'Abrir caixa de entrada'} aria-expanded={open}><Bell size={21}/>{count>0&&<span className="inbox-badge">{count>99?'99+':count}</span>}</button>
  {open&&<div className="admin-inbox-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="admin-inbox-panel" role="dialog" aria-modal="true" aria-label="Mensagens recebidas">
    <header><div><span className="eyebrow">✦ LOCAL STUDIO {localMode?'· PRÉVIA LOCAL':''}</span><h2>Caixa de entrada</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={20}/></button></header>
    {!localMode&&!token?<form className="inbox-login" onSubmit={event=>void login(event)}><KeyRound size={27}/><h3>Acesso privado</h3><p>Digite a chave de administrador configurada no servidor para abrir as mensagens reais.</p><label>Chave privada<input type="password" required autoComplete="off" minLength={32} value={inputToken} onChange={e=>setInputToken(e.target.value)} placeholder="Chave do servidor"/></label><button className="save-action" type="submit" disabled={pending}>Acessar mensagens</button></form>:
    <div className="inbox-content"><div className="inbox-toolbar"><strong>{count} não lidas · {messages.length} mensagens</strong><button type="button" onClick={()=>void refresh()} disabled={pending}><RefreshCw size={15}/>Atualizar</button><button type="button" onClick={()=>void clearRead()} disabled={pending||!messages.some(item=>item.isRead)} title="Excluir mensagens já lidas"><Trash2 size={14}/>Limpar lidas</button>{!localMode&&<button type="button" onClick={()=>{setToken('');setMessages([]);setCount(0);setActive(null)}}>Sair</button>}</div>
     {localMode&&<div className="inbox-local-caption"><Inbox size={14}/>Mensagens de teste guardadas somente neste navegador. Anexos também são locais.</div>}
     <div className="inbox-list">{messages.length?messages.map(item=><button type="button" key={item.id} className={item.id===active?'inbox-item active':item.isRead?'inbox-item':'inbox-item unread'} onClick={()=>setActive(item.id)}><ContactAvatar message={item}/><span><b>{item.name||'Visitante'}</b><small>{item.createdAt?.replace('T',' ').slice(0,16)}</small></span><span className="inbox-item-subject">{item.interests.join(', ')}{(item.attachments?.length??0)>0&&<Paperclip size={13}/>}</span>{!item.isRead&&<span className="inbox-unread-dot"/>}</button>):<div className="inbox-empty">Nenhuma mensagem ainda. Faça um envio na página Contato para testar.</div>}</div>
     {selected&&<article className="inbox-detail"><div className="inbox-detail-heading"><ContactAvatar message={selected} large/><div className="inbox-detail-identity"><h3>{selected.name||'Visitante'}</h3><a href={'mailto:'+selected.email}>{selected.email}</a></div></div><div className="inbox-topics">{selected.interests.map(x=><span key={x}>{x}</span>)}</div><p>{selected.message}</p>{(selected.attachments?.length??0)>0&&<div className="inbox-attachments"><strong><Paperclip size={15}/> Anexos ({selected.attachments?.length})</strong>{selected.attachments?.map(file=><button type="button" key={file.id} onClick={()=>void download(selected,file)}><Download size={15}/><span title={file.name}>{file.name}</span><small>{(file.size/1024/1024).toFixed(1)} MB</small></button>)}</div>}<div className="inbox-detail-actions"><button type="button" onClick={()=>void toggleRead(selected)}><CheckCheck size={16}/>{selected.isRead?'Marcar como não lida':'Marcar como lida'}</button><button type="button" onClick={()=>void remove(selected)}><Trash2 size={16}/>Excluir</button></div></article>}
    </div>}
    {error&&<p className="inbox-error" role="alert">{error}</p>}
   </section>
  </div>}
 </div>
}
