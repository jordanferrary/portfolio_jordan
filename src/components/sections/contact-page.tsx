import {useState,type FormEvent} from 'react'
import {ArrowUpRight,CheckCircle2,ImagePlus,MessageCircle,Paperclip,Pencil,Send,Sparkles,Trash2,X} from 'lucide-react'
import type {SocialLink,ContactSettings} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {contactApi,prepareContactAvatar,sendContact,validateAttachments} from '../../lib/contact-api'
import {createDemoMessage} from '../../lib/contact-demo'

type Props={socials:SocialLink[];settings:ContactSettings;demoEnabled:boolean;onEdit:()=>void}
export function ContactPage({socials,settings,demoEnabled,onEdit}:Props){
 const [name,setName]=useState('')
 const [email,setEmail]=useState('')
 const [selected,setSelected]=useState<string[]>([])
 const [message,setMessage]=useState('')
 const [website,setWebsite]=useState('')
 const [avatar,setAvatar]=useState('')
 const [files,setFiles]=useState<File[]>([])
 const [avatarBusy,setAvatarBusy]=useState(false)
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [sent,setSent]=useState<'remote'|'demo'|null>(null)
 const mailFallback=socials.map(s=>safeSocialUrl(s.url)).find(url=>url?.startsWith('mailto:'))
 const previewMode=!contactApi&&demoEnabled
 const canSend=!!contactApi||demoEnabled||!!mailFallback
 const setFilesSafely=(incoming:File[])=>{
  const next=[...files,...incoming]
  const validation=validateAttachments(next)
  if(validation){setError(validation);return}
  setError('');setFiles(next)
 }
 const handleAvatar=async(file:File)=>{
  setAvatarBusy(true);setError('')
  try{setAvatar(await prepareContactAvatar(file))}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar a foto.')}
  finally{setAvatarBusy(false)}
 }
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  if(!selected.length){setError('Selecione ao menos um tipo de projeto.');return}
  if(message.trim().length<10){setError('Conte um pouco mais sobre a sua ideia.');return}
  const validation=validateAttachments(settings.allowAttachments?files:[])
  if(validation){setError(validation);return}
  const payload={name:name.trim(),email:email.trim(),interests:selected,message:message.trim(),website,avatar:settings.allowAvatar?(avatar||undefined):undefined}
  if(!contactApi&&!demoEnabled){
   if(mailFallback){
    const subject='Contato pelo portfólio - '+(name.trim()||'Novo cliente')
    const body=['Nome: '+(name.trim()||'Não informado'),'E-mail: '+email.trim(),'Interesses: '+selected.join(', '),'Mensagem:',message.trim()].join('\n')
    window.location.href=mailFallback+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)
   }
   return
  }
  setSending(true);setError('')
  try{
   if(contactApi){await sendContact(payload,settings.allowAttachments?files:[]);setSent('remote')}
   else{await createDemoMessage(payload,settings.allowAttachments?files:[]);setSent('demo')}
   setMessage('');setSelected([]);setAvatar('');setFiles([])
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar a mensagem.')}
  finally{setSending(false)}
 }
 return <main className="contact-page">
  <div className="contact-intro"><p className="eyebrow"><Sparkles size={17}/> LET'S CREATE</p>
   <h1>{settings.titleFirst}<br/><em>{settings.titleAccent}</em></h1>
   <p>{settings.introduction}</p>
   {demoEnabled&&<button type="button" className="contact-dev-edit" onClick={onEdit}><Pencil size={15}/>Editar formulário e serviços</button>}
   <div className="contact-alt-links"><span>Outras formas de contato</span><div>{socials.filter(s=>safeSocialUrl(s.url)).map(s=><a key={s.id} href={safeSocialUrl(s.url)} target="_blank" rel="noopener noreferrer" title={s.label}><SocialMark social={s}/><span>{s.label}</span><ArrowUpRight size={13}/></a>)}</div></div>
  </div>
  <section className="contact-chat-panel" aria-label="Enviar mensagem sobre seu projeto">
   <div className="contact-chat-head"><span className="contact-chat-icon"><MessageCircle size={22}/></span><div><strong>New conversation</strong><small>Vamos conversar sobre o seu projeto</small></div><span className="contact-chat-spark">✦</span></div>
   <div className="contact-bubble">{settings.greeting}</div>
   {sent?<div className="contact-success" role="status"><CheckCircle2 size={25}/><h2>{sent==='remote'?'Mensagem enviada!':'Teste registrado!'}</h2><p>{sent==='remote'?'Sua solicitação chegou à caixa de entrada.':'Esta mensagem foi salva apenas neste navegador. Abra o sininho do Local Studio para conferir.'}</p><button type="button" onClick={()=>setSent(null)}>Enviar outra mensagem</button></div>:<form onSubmit={event=>void submit(event)}>
    <div className="contact-form-row"><label>Nome (opcional)<input maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Como posso chamar você?"/></label><label>E-mail para resposta<input required type="email" maxLength={150} value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@exemplo.com"/></label></div>
    {settings.allowAvatar&&<div className="contact-avatar-field"><div className="contact-avatar-preview">{avatar?<img src={avatar} alt="Foto de perfil escolhida"/>:<ImagePlus size={21}/>}</div><div><b>Foto do contato <small>(opcional)</small></b><p>Se quiser, adicione uma foto para identificar sua mensagem.</p><div className="contact-avatar-actions"><label className="contact-avatar-upload">Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp" disabled={avatarBusy} onChange={e=>{const file=e.target.files?.[0];if(file)void handleAvatar(file);e.target.value=''}}/></label>{avatar&&<button type="button" onClick={()=>setAvatar('')} aria-label="Remover foto"><Trash2 size={14}/>Remover</button>}</div>{avatarBusy&&<small className="contact-avatar-loading">Preparando imagem...</small>}</div></div>}
    <fieldset><legend>Qual tipo de projeto interessa a você?</legend><div className="contact-chips">{settings.interestOptions.map(item=><button key={item} type="button" className={selected.includes(item)?'selected':''} aria-pressed={selected.includes(item)} onClick={()=>setSelected(v=>v.includes(item)?v.filter(x=>x!==item):[...v,item])}>{item}</button>)}</div></fieldset>
    <label className="contact-message-label">Sua mensagem<textarea required maxLength={2500} minLength={10} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Descreva sua ideia, o prazo e o que deseja criar..." rows={5}/></label>
    {settings.allowAttachments&&<div className="contact-attachments"><div className="contact-attachments-head"><Paperclip size={16}/><span>Referências para orçamento <small>(opcional)</small></span></div><label className="contact-attach-action"><Paperclip size={15}/>Adicionar arquivos<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf" onChange={e=>{setFilesSafely(Array.from(e.target.files??[]));e.target.value=''}}/></label><span className="contact-attachment-note">Até 3 arquivos JPG, PNG, WEBP ou PDF. Máximo de 8 MB no total.</span>{files.length>0&&<div className="contact-file-list">{files.map((file,i)=><div className="contact-file" key={file.name+'-'+i}><Paperclip size={14}/><span title={file.name}>{file.name}</span><small>{(file.size/1024/1024).toFixed(1)} MB</small><button type="button" aria-label={'Remover '+file.name} onClick={()=>setFiles(v=>v.filter((_,n)=>i!==n))}><X size={14}/></button></div>)}</div>}</div>}
    <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    {error&&<p role="alert" className="contact-form-error">{error}</p>}
    {previewMode&&<p className="contact-preview-note"><CheckCircle2 size={13}/>Prévia local: as mensagens de teste aparecem no sininho deste navegador.</p>}
    <button className="contact-send-button" type="submit" disabled={!canSend||sending||avatarBusy}>{sending?'Enviando...':contactApi||previewMode?'Enviar mensagem':mailFallback?'Abrir e-mail':'Contato pelas redes'} <Send size={17}/></button>
    <p className="contact-privacy-note">{canSend?'Seus dados serão usados apenas para identificar o contato e responder ao pedido.':'Use um dos links de contato acima para falar sobre seu projeto.'}</p>
   </form>}
  </section>
 </main>
}
