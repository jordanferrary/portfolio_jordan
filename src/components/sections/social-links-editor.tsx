import { useState } from 'react'
import { ArrowDown,ArrowUp,ImagePlus,Pencil,Plus,Save,Trash2,Upload,X } from 'lucide-react'
import { AssetClipButton } from '../ui/asset-picker'
import { SocialMark,safeSocialUrl } from '../ui/social-mark'
import { AssetImage } from '../ui/asset-image'
import { isLocalMedia,saveUploadedMedia } from '../../lib/media-store'
import type { SocialIcon,SocialLink } from '../../data/studio'
import { socialIconOptions } from '../../data/studio'
interface Props {links:SocialLink[];onChange:(links:SocialLink[])=>void}
const newDraft=():SocialLink=>({id:'social-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5),label:'',url:'',icon:'globe'})
export function SocialLinksEditor({links,onChange}:Props){
 const [draft,setDraft]=useState<SocialLink|null>(null)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const patch=(next:Partial<SocialLink>)=>setDraft(v=>v?{...v,...next}:null)
 const edit=(item:SocialLink)=>{setDraft({...item});setError('')}
 const save=()=>{
  if(!draft)return
  if(!draft.label.trim()){setError('Informe o nome da rede social.');return}
  if(draft.url.trim()&&!safeSocialUrl(draft.url)){setError('Informe um link completo começando com https://, ou um endereço mailto: válido.');return}
  const item={...draft,label:draft.label.trim(),url:draft.url.trim()}
  onChange(links.some(s=>s.id===item.id)?links.map(s=>s.id===item.id?item:s):[...links,item])
  setDraft(null);setError('')
 }
 const move=(index:number,to:number)=>{if(to<0||to>=links.length)return;const next=[...links];[next[index],next[to]]=[next[to],next[index]];onChange(next)}
 const remove=(id:string)=>{const item=links.find(s=>s.id===id);if(item&&window.confirm('Remover '+item.label+' do site neste navegador?'))onChange(links.filter(s=>s.id!==id))}
 const upload=async(file:File)=>{
  if(!draft)return
  setBusy(true);setError('')
  try{patch({iconImage:await saveUploadedMedia(file,'social-icons',draft.id)})}
  catch(e){setError(e instanceof Error?e.message:'Falha ao importar ícone.')}
  finally{setBusy(false)}
 }
 return <section className="social-links-manager" aria-label="Gerenciador de redes sociais"><div className="editor-section-title"><h3>Redes do canto superior direito</h3><p>Adicione, edite, reordene ou exclua os botões. O Behance está sem endereço porque não foi fornecido o URL do seu perfil; configure-o abaixo.</p></div>
  <div className="social-manager-list">{links.map((s,i)=><article className="social-manager-row" key={s.id}><div className="social-manager-mark"><SocialMark social={s}/></div><div className="social-manager-info"><b>{s.label}</b><small title={s.url}>{safeSocialUrl(s.url)?s.url:'Link não configurado'}</small></div><div className="social-manager-actions"><button onClick={()=>move(i,i-1)} disabled={i===0} aria-label={'Mover '+s.label+' para cima'}><ArrowUp size={15}/></button><button onClick={()=>move(i,i+1)} disabled={i===links.length-1} aria-label={'Mover '+s.label+' para baixo'}><ArrowDown size={15}/></button><button onClick={()=>edit(s)} aria-label={'Editar '+s.label}><Pencil size={15}/></button><button onClick={()=>remove(s.id)} aria-label={'Excluir '+s.label}><Trash2 size={15}/></button></div></article>)}</div>
  {!draft?<button className="social-manager-add" onClick={()=>{setDraft(newDraft());setError('')}}><Plus size={17}/>Adicionar rede social</button>:<div className="social-manager-form"><div className="social-manager-form-top"><h3>{links.some(s=>s.id===draft.id)?'Editar rede':'Nova rede social'}</h3><button onClick={()=>setDraft(null)} aria-label="Fechar cadastro"><X size={17}/></button></div>
   <label>Nome / plataforma<input value={draft.label} maxLength={50} placeholder="Behance, ArtStation, Bluesky..." onChange={e=>patch({label:e.target.value})}/></label>
   <label>Link completo<input value={draft.url} type="url" placeholder="https://www.behance.net/seu-perfil" onChange={e=>patch({url:e.target.value})}/></label>
   <label>Ícone predefinido<select value={draft.icon} onChange={e=>patch({icon:e.target.value as SocialIcon,iconImage:undefined})}>{socialIconOptions.map(icon=><option key={icon} value={icon}>{icon}</option>)}</select></label>
   <div className="social-icon-picker"><div className="social-preview"><SocialMark social={draft}/></div><div><b>Ícone personalizado (opcional)</b><div className="social-icon-actions"><label className="social-icon-upload"><Upload size={15}/>{busy?'Importando...':'Importar PNG / WEBP'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label><AssetClipButton folder="social-icons" onSelect={src=>patch({iconImage:src})}/>{draft.iconImage&&<button className="social-clear-image" onClick={()=>patch({iconImage:undefined})}><X size={13}/>Remover</button>}</div><small>Para plataformas sem ícone predefinido, importe o logotipo desejado.</small></div></div>
   {draft.iconImage&&<div className="social-image-info"><ImagePlus size={14}/>{isLocalMedia(draft.iconImage)?'Imagem local reutilizável':<AssetImage src={draft.iconImage} alt="Ícone escolhido"/>}</div>}
   {error&&<p role="alert" className="social-manager-error">{error}</p>}
   <div className="social-manager-save"><button onClick={()=>setDraft(null)}>Cancelar</button><button className="save-action" onClick={save}><Save size={16}/>Salvar rede</button></div>
  </div>}
 <p className="editor-help">Os botões sem URL permanecem visíveis como placeholders inativos. Um link só se torna clicável quando um endereço válido é cadastrado. As alterações do Studio ainda são locais.</p>
 </section>
}
