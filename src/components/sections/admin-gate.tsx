import { useEffect,useRef,useState,type FormEvent } from 'react'
import { KeyRound,LockKeyhole,X } from 'lucide-react'
import {hasGitHubLogin,readGitHubSession,beginGitHubLogin,isAuthCompletion} from '../../lib/github-auth'
// UX-only PIN. This is not secure authentication in a publicly readable frontend.
const LOCAL_DEMO_PIN='020802'
function LocalGate({onUnlock,onClose}:{onUnlock:()=>void;onClose:()=>void}){
 const [pin,setPin]=useState('')
 const [error,setError]=useState('')
 const input=useRef<HTMLInputElement>(null)
 useEffect(()=>input.current?.focus(),[])
 const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(pin===LOCAL_DEMO_PIN){onUnlock();return}setError('Código incorreto.');setPin('');input.current?.focus()}
 return <div className="gate-overlay" lang="pt-BR"><form className="gate-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="gate-title"><button type="button" className="gate-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button><div className="gate-icon"><LockKeyhole size={28}/></div><p className="eyebrow">✦ ACESSO DO CRIADOR</p><h2 id="gate-title">Local Studio</h2><p>Informe o PIN para liberar os controles visuais deste navegador.</p><label htmlFor="admin-pin">Código de acesso</label><input id="admin-pin" ref={input} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="off" value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setError('')}} placeholder="••••••"/>{error&&<p role="alert" className="gate-error">{error}</p>}<button className="gate-submit" type="submit"><KeyRound size={17}/>Entrar no Studio</button><small>Proteção visual local, não autenticação de servidor. Não use este PIN para proteger dados ou publicar no GitHub.</small></form></div>
}

function AuthenticatedGate({onUnlock,onClose}:{onUnlock:()=>void;onClose:()=>void}){
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const active=useRef(true)
 const verify=async()=>{
  setBusy(true);setError('')
  try{
   const session=await readGitHubSession()
   if(!active.current)return
   if(session.authenticated){onUnlock();return}
   setError('Sessão não confirmada. Entre na conta proprietária e verifique novamente.')
  }catch{if(active.current)setError('Serviço de autenticação indisponível.')}
  finally{if(active.current)setBusy(false)}
 }
 const verifyRef=useRef(verify)
 verifyRef.current=verify
 useEffect(()=>{
  active.current=true
  const completed=(event:MessageEvent)=>{if(isAuthCompletion(event))void verifyRef.current()}
  window.addEventListener('message',completed)
  return()=>{active.current=false;window.removeEventListener('message',completed)}
 },[])
 return <div className="gate-overlay" lang="pt-BR"><section className="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-title"><button type="button" className="gate-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button><div className="gate-icon"><LockKeyhole size={28}/></div><h2 id="gate-title">Local Studio</h2><p>Acesso pela sessão GitHub verificada no servidor. O PIN local não é aceito quando o serviço está configurado.</p><button type="button" className="gate-submit" disabled={busy} onClick={()=>{setError('');if(!beginGitHubLogin())setError('Login indisponível.')}}><KeyRound size={17}/>Entrar com GitHub</button><button type="button" className="subtle-action" disabled={busy} onClick={()=>void verify()}>{busy?'Verificando…':'Verificar sessão'}</button>{error&&<p className="gate-error" role="alert">{error}</p>}<small>Esta sessão libera o editor; a publicação continua exigindo autorização explícita. Dados armazenados neste navegador não são tornados privados por esta tela.</small></section></div>
}
export function AdminGate(props:{onUnlock:()=>void;onClose:()=>void}){
 return hasGitHubLogin()?<AuthenticatedGate {...props}/>:<LocalGate {...props}/>
}
