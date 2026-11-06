import {useCallback,useEffect,useState,type FormEvent} from 'react'
import {Bell,CheckCheck,Inbox,KeyRound,RefreshCw,Trash2,X} from 'lucide-react'
import {contactApi,deleteMessage,listMessages,markMessage,unreadCount,type ContactMessage} from '../../lib/contact-api'
export function AdminInboxBell(){
 const [open,setOpen]=useState(false)
 const [token,setToken]=useState('')
 const [inputToken,setInputToken]=useState('')
 const [messages,setMessages]=useState<ContactMessage[]>([])
 const [count,setCount]=useState(0)
 const [pending,setPending]=useState(false)
 const [error,setError]=useState('')
 const [active,setActive]=useState<string|null>(null)
 const load=useCallback(async(key:string)=>{
  const [list,unread]=await Promise.all([listMessages(key),unreadCount(key)])
  setMessages(list);setCount(unread)
 },[])
 useEffect(()=>{
  if(!token||!contactApi)return
  const timer=window.setInterval(()=>{void unreadCount(token).then(setCount).catch(()=>setError('Não foi possível atualizar as notificações.'))},60000)
  return ()=>window.clearInterval(timer)
 },[token])
 const login=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  setPending(true);setError('')
  try{await load(inputToken.trim());setToken(inputToken.trim());setInputToken('')}
  catch(e){setError(e instanceof Error?e.message:'Falha de autenticação.')}
  finally{setPending(false)}
 }
 const refresh=async()=>{if(!token)return;setPending(true);try{await load(token);setError('')}catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar.')}finally{setPending(false)}}
 const toggleRead=async(item:ContactMessage)=>{
  if(!token)return
  try{await markMessage(token,item.id,!item.isRead);await load(token)}catch(e){setError(e instanceof Error?e.message:'Erro ao marcar mensagem.')}
 }
 const remove=async(item:ContactMessage)=>{
  if(!token||!window.confirm('Excluir esta mensagem permanentemente?'))return
  try{await deleteMessage(token,item.id);setActive(null);await load(token)}catch(e){setError(e instanceof Error?e.message:'Não foi possível excluir.')}
 }
 const selected=messages.find(m=>m.id===active)
 return <div className="admin-inbox-container"><button type="button" className="admin-inbox-bell" onClick={()=>{setOpen(v=>!v);if(!open&&token)void refresh()}} aria-label={count?count+' mensagens não lidas':'Abrir caixa de entrada'} aria-expanded={open}><Bell size={21}/>{count>0&&<span className="inbox-badge">{count>99?'99+':count}</span>}</button>
  {open&&<div className="admin-inbox-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="admin-inbox-panel" role="dialog" aria-modal="true" aria-label="Mensagens recebidas"><header><div><span className="eyebrow">✦ LOCAL STUDIO</span><h2>Caixa de entrada</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={20}/></button></header>
    {!contactApi?<div className="inbox-setup"><Inbox size={30}/><h3>Mensagens ainda não ativadas</h3><p>Para receber mensagens de qualquer visitante, configure o Worker e o banco de dados indicados em <code>server/likes-worker</code> e publique o site com <code>VITE_CONTACT_API_URL</code>.</p><p>O PIN do Local Studio não protege mensagens privadas. A caixa de entrada utiliza uma chave separada do servidor.</p></div>
    :!token?<form className="inbox-login" onSubmit={event=>void login(event)}><KeyRound size={27}/><h3>Acesso privado</h3><p>Informe a chave do administrador configurada no servidor. Ela será mantida apenas na memória desta página.</p><label>Chave privada<input type="password" required autoComplete="off" minLength={32} value={inputToken} onChange={e=>setInputToken(e.target.value)} placeholder="Chave do servidor"/></label><button className="save-action" type="submit" disabled={pending}>Acessar mensagens</button></form>
    :<div className="inbox-content"><div className="inbox-toolbar"><strong>{count} não lidas · {messages.length} recebidas</strong><button type="button" onClick={()=>void refresh()} disabled={pending}><RefreshCw size={15}/>Atualizar</button><button type="button" onClick={()=>{setToken('');setMessages([]);setCount(0);setActive(null)}}>Sair</button></div>
      <div className="inbox-list">{messages.length?messages.map(item=><button type="button" key={item.id} className={item.id===active?'inbox-item active':item.isRead?'inbox-item':'inbox-item unread'} onClick={()=>setActive(item.id)}><span><b>{item.name||'Visitante'}</b><small>{item.createdAt?.replace('T',' ').slice(0,16)}</small></span><span className="inbox-item-subject">{item.interests.join(', ')}</span>{!item.isRead&&<span className="inbox-unread-dot"/>}</button>):<div className="inbox-empty">Nenhuma mensagem recebida ainda.</div>}</div>
      {selected&&<article className="inbox-detail"><div className="inbox-detail-heading"><h3>{selected.name||'Visitante'}</h3><a href={'mailto:'+selected.email}>{selected.email}</a></div><div className="inbox-topics">{selected.interests.map(x=><span key={x}>{x}</span>)}</div><p>{selected.message}</p><div className="inbox-detail-actions"><button type="button" onClick={()=>void toggleRead(selected)}><CheckCheck size={16}/>{selected.isRead?'Marcar como não lida':'Marcar como lida'}</button><button type="button" onClick={()=>void remove(selected)}><Trash2 size={16}/>Excluir</button></div></article>}
    </div>}
    {error&&<p className="inbox-error" role="alert">{error}</p>}
   </section></div>}
 </div>
}
