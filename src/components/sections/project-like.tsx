import {useEffect,useState} from 'react'
import {Heart} from 'lucide-react'
const KEY='jf-project-likes-v1'
const API=import.meta.env.VITE_LIKES_API_URL as string|undefined
type RemoteAnswer={count:number;liked:boolean}
function storageLiked(projectId:string):boolean{
 try{const data=JSON.parse(localStorage.getItem(KEY)||'{}') as Record<string,boolean>;return data[projectId]===true}catch{return false}
}
function persist(projectId:string,liked:boolean){
 try{const data=JSON.parse(localStorage.getItem(KEY)||'{}') as Record<string,boolean>;data[projectId]=liked;localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('jf-like-update',{detail:{projectId,liked}}))}catch{/* storage may be blocked */}
}
function isReply(x:unknown):x is RemoteAnswer{
 if(!x||typeof x!=='object')return false
 const data=x as Partial<RemoteAnswer>
 return typeof data.count==='number'&&Number.isFinite(data.count)&&data.count>=0&&typeof data.liked==='boolean'
}
/** With VITE_LIKES_API_URL the backend must enforce visitor identity & anti-abuse. */
export function ProjectLike({projectId,showCount=false}:{projectId:string;showCount?:boolean}){
 const [liked,setLiked]=useState(()=>storageLiked(projectId))
 const [count,setCount]=useState(()=>storageLiked(projectId)?1:0)
 const [remote,setRemote]=useState(false)
 const [pending,setPending]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{
  setLiked(storageLiked(projectId));setCount(storageLiked(projectId)?1:0);setRemote(false);setError('')
  if(!API)return
  const controller=new AbortController()
  const endpoint=API.replace(/\/$/,'')+'/projects/'+encodeURIComponent(projectId)+'/likes'
  void fetch(endpoint,{method:'GET',credentials:'include',signal:controller.signal})
   .then(async res=>{if(!res.ok)throw new Error();return res.json() as Promise<unknown>})
   .then(data=>{if(!controller.signal.aborted&&isReply(data)){setCount(data.count);setLiked(data.liked);setRemote(true)}})
   .catch(()=>{if(!controller.signal.aborted)setError('Contagem compartilhada indisponível. Curtidas locais continuam funcionando.')})
  return ()=>controller.abort()
 },[projectId])
 useEffect(()=>{
  const update=(event:Event)=>{const detail=(event as CustomEvent<{projectId:string;liked:boolean}>).detail;if(detail?.projectId===projectId&&!remote){setLiked(detail.liked);setCount(detail.liked?1:0)}}
  const sync=()=>{if(!remote){const next=storageLiked(projectId);setLiked(next);setCount(next?1:0)}}
  window.addEventListener('jf-like-update',update)
  window.addEventListener('storage',sync)
  return ()=>{window.removeEventListener('jf-like-update',update);window.removeEventListener('storage',sync)}
 },[projectId,remote])
 const toggle=async()=>{
  if(pending)return
  setError('')
  const next=!liked
  if(!remote||!API){setLiked(next);setCount(next?1:0);persist(projectId,next);return}
  setPending(true)
  try{
   const endpoint=API.replace(/\/$/,'')+'/projects/'+encodeURIComponent(projectId)+'/likes'
   const res=await fetch(endpoint,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({liked:next})})
   if(!res.ok)throw new Error()
   const data:unknown=await res.json()
   if(!isReply(data))throw new Error()
   setLiked(data.liked);setCount(data.count)
  }catch{setError('Não foi possível registrar a curtida compartilhada. Tente novamente.')}
  finally{setPending(false)}
 }
 return <div className="project-like-wrap"><button type="button" className={liked?'project-like is-liked':'project-like'} onClick={()=>void toggle()} disabled={pending} aria-pressed={liked} aria-label={liked?'Remover curtida deste projeto':'Curtir este projeto'}><Heart size={18} fill={liked?'currentColor':'none'}/><span>{liked?'Curtido':'Curtir projeto'}</span>{showCount&&<span className="like-count" title={remote?'Curtidas compartilhadas':'Contagem somente deste navegador'}>{count}{!remote&&<small>local</small>}</span>}</button>{error&&<span className="like-error" role="status">{error}</span>}</div>
}
