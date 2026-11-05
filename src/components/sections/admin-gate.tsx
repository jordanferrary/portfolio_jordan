import { useEffect,useRef,useState,type FormEvent } from 'react'
import { KeyRound,LockKeyhole,X } from 'lucide-react'
// UX-only PIN. This is not secure authentication in a publicly readable frontend.
const LOCAL_DEMO_PIN='020802'
export function AdminGate({onUnlock,onClose}:{onUnlock:()=>void;onClose:()=>void}){
 const [pin,setPin]=useState('')
 const [error,setError]=useState('')
 const input=useRef<HTMLInputElement>(null)
 useEffect(()=>input.current?.focus(),[])
 const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(pin===LOCAL_DEMO_PIN){onUnlock();return}setError('Código incorreto.');setPin('');input.current?.focus()}
 return <div className="gate-overlay"><form className="gate-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="gate-title"><button type="button" className="gate-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button><div className="gate-icon"><LockKeyhole size={28}/></div><p className="eyebrow">✦ CREATOR ACCESS</p><h2 id="gate-title">Local Studio</h2><p>Informe o PIN para liberar os controles visuais deste navegador.</p><label htmlFor="admin-pin">Código de acesso</label><input id="admin-pin" ref={input} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="off" value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setError('')}} placeholder="••••••"/>{error&&<p role="alert" className="gate-error">{error}</p>}<button className="gate-submit" type="submit"><KeyRound size={17}/>Entrar no Studio</button><small>Proteção visual local, não autenticação de servidor. Não use este PIN para proteger dados ou publicar no GitHub.</small></form></div>
}
