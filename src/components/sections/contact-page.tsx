import {useState,type FormEvent} from 'react'
import {ArrowUpRight,CheckCircle2,MessageCircle,Paperclip,Pencil,Send,Sparkles,X} from 'lucide-react'
import type {SocialLink,ContactSettings} from '../../data/studio'
import {safeSocialUrl,SocialMark} from '../ui/social-mark'
import {contactApi,sendContact,validateAttachments} from '../../lib/contact-api'
import {createDemoMessage} from '../../lib/contact-demo'

type Props={socials:SocialLink[];settings:ContactSettings;demoEnabled:boolean;onEdit:()=>void}

export function ContactPage({socials,settings,demoEnabled,onEdit}:Props){
 const [name,setName]=useState('')
 const [email,setEmail]=useState('')
 const [subject,setSubject]=useState('')
 const [message,setMessage]=useState('')
 const [website,setWebsite]=useState('')
 const [files,setFiles]=useState<File[]>([])
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [sent,setSent]=useState<'remote'|'demo'|null>(null)

 const addFiles=(incoming:File[])=>{
  const next=[...files,...incoming]
  const errorMessage=validateAttachments(next)
  if(errorMessage){setError(errorMessage);return}
  setFiles(next);setError('')
 }
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  if(message.trim().length<10){setError('Please tell me a little more about your idea.');return}
  const attachments=settings.allowAttachments?files:[]
  const errorMessage=validateAttachments(attachments)
  if(errorMessage){setError(errorMessage);return}
  const payload={
   name:name.trim(),email:email.trim(),interests:[subject||'General inquiry'],
   message:message.trim(),website
  }
  setSending(true);setError('')
  try{
   if(contactApi){await sendContact(payload,attachments);setSent('remote')}
   else{await createDemoMessage(payload,attachments);setSent('demo')}
   setMessage('');setSubject('');setFiles([])
  }catch(e){setError(contactApi&&e instanceof Error?e.message:'Could not save this message locally. Please try again.')}
  finally{setSending(false)}
 }
 return <main className="contact-page contact-page-clean">
  <div className="contact-intro">
   <p className="eyebrow"><Sparkles size={17}/> LET'S CREATE</p>
   <h1>{settings.titleFirst}<br/><em>{settings.titleAccent}</em></h1>
   <p>{settings.introduction}</p>
   {demoEnabled&&<button type="button" lang="pt-BR" className="contact-dev-edit" onClick={onEdit}><Pencil size={15}/>Editar contato</button>}
   <div className="contact-alt-links"><span>Connect with me</span><div>{socials.filter(s=>safeSocialUrl(s.url)).map(s=><a key={s.id} href={safeSocialUrl(s.url)} target="_blank" rel="noopener noreferrer" title={s.label}><SocialMark social={s}/><span>{s.label}</span><ArrowUpRight size={13}/></a>)}</div></div>
  </div>
  <section className="contact-chat-panel" aria-label="Contact form">
   <div className="contact-chat-head">
    <span className="contact-chat-icon"><MessageCircle size={20}/></span>
    <div><strong>Send a message</strong><small>Tell me what you have in mind</small></div>
   </div>
   {sent?<div className="contact-success" role="status"><CheckCircle2 size={25}/><h2>{sent==='remote'?'Message sent!':'Message saved locally'}</h2><p>{sent==='remote'?'Your message has been received by the server.':'This message is only saved in your browser and was not delivered to the artist. Please reach out using the social links if you need a reply.'}</p><button type="button" onClick={()=>setSent(null)}>Write another message</button></div>:<form onSubmit={event=>void submit(event)}>
    <div className="contact-form-row">
     <label>Name<input maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>
     <label>Reply email<input required type="email" maxLength={150} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
    </div>
    <label className="contact-subject-label"><span className="contact-field-caption">Subject <small>(optional)</small></span>
     <select value={subject} onChange={e=>setSubject(e.target.value)}>
      <option value="">Choose a subject (optional)</option>
      {settings.interestOptions.map((item,index)=><option key={item+'-'+index} value={item}>{item}</option>)}
     </select>
    </label>
    <label className="contact-message-label">Your message<textarea required maxLength={2500} minLength={10} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell me about your idea, references, timeline or budget..." rows={6}/></label>
    {settings.allowAttachments&&<div className="contact-clean-attachment">
     <label className="contact-attach-action"><Paperclip size={15}/>Attach references<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf" onChange={e=>{addFiles(Array.from(e.target.files??[]));e.target.value=''}}/></label>
     <span>Up to 3 images or PDFs · 8 MB total</span>
     {files.length>0&&<div className="contact-file-list">{files.map((file,i)=><div className="contact-file" key={file.name+'-'+i}><Paperclip size={14}/><span title={file.name}>{file.name}</span><small>{(file.size/1024/1024).toFixed(1)} MB</small><button type="button" aria-label={'Remove '+file.name} onClick={()=>setFiles(v=>v.filter((_,n)=>i!==n))}><X size={14}/></button></div>)}</div>}
    </div>}
    <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    {error&&<p role="alert" className="contact-form-error">{error}</p>}
    <button className="contact-send-button" type="submit" disabled={sending}>{sending?'Sending...':'Send message'} <Send size={17}/></button>
   </form>}
  </section>
 </main>
}
