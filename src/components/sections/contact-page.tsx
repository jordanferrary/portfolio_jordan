import {useState,type FormEvent} from 'react'
import {ArrowUpRight,CheckCircle2,ImagePlus,Mail,MessageCircle,Send,Sparkles,Trash2} from 'lucide-react'
import type {SocialLink} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {contactApi,prepareContactAvatar,sendContact} from '../../lib/contact-api'
const interests=['Personagens 3D','Modelagem e sculpt','Cenários','Game Art','Motion Design','Ilustração','Outros']
export function ContactPage({socials}:{socials:SocialLink[]}){
 const [name,setName]=useState('')
 const [email,setEmail]=useState('')
 const [selected,setSelected]=useState<string[]>([])
 const [message,setMessage]=useState('')
 const [website,setWebsite]=useState('')
 const [avatar,setAvatar]=useState('')
 const [avatarBusy,setAvatarBusy]=useState(false)
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [sent,setSent]=useState(false)
 const mailFallback=socials.map(s=>safeSocialUrl(s.url)).find(url=>url?.startsWith('mailto:'))
 const handleAvatar=async(file:File)=>{
  setAvatarBusy(true);setError('')
  try{setAvatar(await prepareContactAvatar(file))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar a foto.')}
  finally{setAvatarBusy(false)}
 }
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  if(!contactApi&&!mailFallback)return
  if(!selected.length){setError('Selecione pelo menos um interesse.');return}
  if(message.trim().length<10){setError('Conte um pouco mais sobre a sua ideia.');return}
  if(!contactApi&&mailFallback){
   const subject='Contato pelo portfólio - '+(name.trim()||'Novo cliente')
   const body=['Nome: '+(name.trim()||'Não informado'),'E-mail: '+email.trim(),'Interesses: '+selected.join(', '),'Mensagem:',message.trim()].join('\n')
   window.location.href=mailFallback+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)
   setError('O aplicativo de e-mail será aberto. Confirme o envio por lá; a foto opcional não é anexada neste modo.')
   return
  }
  setSending(true);setError('')
  try{
   await sendContact({name:name.trim(),email:email.trim(),interests:selected,message:message.trim(),website,avatar:avatar||undefined})
   setSent(true);setMessage('');setSelected([]);setAvatar('')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar a mensagem.')}
  finally{setSending(false)}
 }
 return <main className="contact-page">
  <div className="contact-intro"><p className="eyebrow"><Sparkles size={17}/> LET'S CREATE</p><h1>Have a project<br/><em>in mind?</em></h1><p>Conte sua ideia, seus objetivos e o que procura em um artista 3D. Assim podemos encontrar a melhor direção criativa para o projeto.</p>
   <div className="contact-alt-links"><span>Outras formas de contato</span><div>{socials.filter(s=>safeSocialUrl(s.url)).map(s=><a key={s.id} href={safeSocialUrl(s.url)} target="_blank" rel="noreferrer" title={s.label}><SocialMark social={s}/><span>{s.label}</span><ArrowUpRight size={13}/></a>)}</div></div>
  </div>
  <section className="contact-chat-panel" aria-label="Enviar mensagem sobre seu projeto">
   <div className="contact-chat-head"><span className="contact-chat-icon"><MessageCircle size={22}/></span><div><strong>New conversation</strong><small>Vamos conversar sobre o seu projeto</small></div><span className="contact-chat-spark">✦</span></div>
   <div className="contact-bubble">Olá! Compartilhe seus interesses e os detalhes do trabalho. Sua mensagem ficará em uma caixa de entrada privada quando o serviço estiver ativado.</div>
   {sent?<div className="contact-success" role="status"><CheckCircle2 size={25}/><h2>Mensagem enviada!</h2><p>Obrigado pelo contato. Sua solicitação foi recebida pelo servidor.</p><button type="button" onClick={()=>setSent(false)}>Enviar outra mensagem</button></div>:<form onSubmit={event=>void submit(event)}>
    <div className="contact-form-row"><label>Nome (opcional)<input maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Como posso chamar você?"/></label><label>E-mail para resposta<input required type="email" maxLength={150} value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@exemplo.com"/></label></div>
    <div className="contact-avatar-field"><div className="contact-avatar-preview">{avatar?<img src={avatar} alt="Foto de perfil escolhida"/>:<ImagePlus size={21}/>}</div><div><b>Foto do contato <small>(opcional)</small></b><p>Se quiser, adicione uma foto para facilitar sua identificação na caixa de entrada.</p><div className="contact-avatar-actions"><label className="contact-avatar-upload">Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp" disabled={avatarBusy} onChange={e=>{const file=e.target.files?.[0];if(file)void handleAvatar(file);e.target.value=''}}/></label>{avatar&&<button type="button" onClick={()=>setAvatar('')} aria-label="Remover foto"><Trash2 size={14}/> Remover</button>}</div>{avatarBusy&&<small className="contact-avatar-loading">Preparando imagem...</small>}</div></div>
    <fieldset><legend>Qual tipo de projeto interessa a você?</legend><div className="contact-chips">{interests.map(item=><button key={item} type="button" className={selected.includes(item)?'selected':''} aria-pressed={selected.includes(item)} onClick={()=>setSelected(v=>v.includes(item)?v.filter(x=>x!==item):[...v,item])}>{item}</button>)}</div></fieldset>
    <label className="contact-message-label">Sua mensagem<textarea required maxLength={2500} minLength={10} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Descreva o conceito, o prazo e o que deseja criar..." rows={5}/></label>
    <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    {error&&<p role="alert" className="contact-form-error">{error}</p>}
    {!contactApi&&<p className="contact-setup-warning"><Mail size={15}/>{mailFallback?'O envio pela caixa de entrada do site ainda não foi ativado. Você pode abrir seu aplicativo de e-mail para enviar a mensagem.':'O formulário ainda não está conectado a um servidor. Para entrar em contato, utilize as redes acima ou configure um endereço de e-mail no Local Studio.'}</p>}
    <button className="contact-send-button" type="submit" disabled={(!contactApi&&!mailFallback)||sending||avatarBusy}>{sending?'Enviando...':contactApi?'Enviar mensagem':'Abrir e-mail para enviar'} <Send size={17}/></button><p className="contact-privacy-note">As informações, incluindo a foto opcional, serão utilizadas apenas para identificar sua mensagem e responder ao contato. Não compartilhe informações sensíveis.</p>
   </form>}
  </section>
 </main>
}
