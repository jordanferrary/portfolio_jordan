import {useState,type FormEvent} from 'react'
import {ArrowUpRight,CheckCircle2,Mail,MessageCircle,Send,Sparkles} from 'lucide-react'
import type {SocialLink} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {contactApi,sendContact} from '../../lib/contact-api'
const interests=['Personagens 3D','Modelagem e sculpt','Cenários','Game Art','Motion Design','Ilustração','Outros']
export function ContactPage({socials}:{socials:SocialLink[]}){
 const [name,setName]=useState('')
 const [email,setEmail]=useState('')
 const [selected,setSelected]=useState<string[]>([])
 const [message,setMessage]=useState('')
 const [website,setWebsite]=useState('')
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [sent,setSent]=useState(false)
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  if(!contactApi)return
  if(!selected.length){setError('Selecione pelo menos um interesse.');return}
  if(message.trim().length<10){setError('Conte um pouco mais sobre a sua ideia.');return}
  setSending(true);setError('')
  try{
   await sendContact({name:name.trim(),email:email.trim(),interests:selected,message:message.trim(),website})
   setSent(true);setMessage('');setSelected([])
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
    <fieldset><legend>Qual tipo de projeto interessa a você?</legend><div className="contact-chips">{interests.map(item=><button key={item} type="button" className={selected.includes(item)?'selected':''} aria-pressed={selected.includes(item)} onClick={()=>setSelected(v=>v.includes(item)?v.filter(x=>x!==item):[...v,item])}>{item}</button>)}</div></fieldset>
    <label className="contact-message-label">Sua mensagem<textarea required maxLength={2500} minLength={10} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Descreva o conceito, o prazo e o que deseja criar..." rows={5}/></label>
    <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    {error&&<p role="alert" className="contact-form-error">{error}</p>}
    {!contactApi&&<p className="contact-setup-warning"><Mail size={15}/> Formulário ainda não conectado a um servidor. Para entrar em contato, utilize as redes acima.</p>}
    <button className="contact-send-button" type="submit" disabled={!contactApi||sending}>{sending?'Enviando...':'Enviar mensagem'} <Send size={17}/></button><p className="contact-privacy-note">As informações fornecidas serão utilizadas apenas para responder ao seu contato. Não compartilhe senhas nem informações sensíveis.</p>
   </form>}
  </section>
 </main>
}
