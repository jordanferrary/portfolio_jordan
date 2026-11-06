import {useState} from 'react'
import {ArrowDown,ArrowUp,Eye,Plus,Save,Trash2,X} from 'lucide-react'
import type {ContactSettings} from '../../data/studio'
type Props={settings:ContactSettings;onSave:(settings:ContactSettings)=>void;onClose:()=>void}
export function ContactEditor({settings,onSave,onClose}:Props){
 const [draft,setDraft]=useState<ContactSettings>({...settings,interestOptions:[...settings.interestOptions]})
 const [newOption,setNewOption]=useState('')
 const [message,setMessage]=useState('')
 const patch=(changes:Partial<ContactSettings>)=>setDraft(prev=>({...prev,...changes}))
 const move=(index:number,direction:number)=>{
  const next=[...draft.interestOptions],to=index+direction
  if(to<0||to>=next.length)return
  ;[next[index],next[to]]=[next[to],next[index]]
  patch({interestOptions:next})
 }
 const remove=(index:number)=>patch({interestOptions:draft.interestOptions.filter((_,i)=>i!==index)})
 const add=()=>{
  const value=newOption.trim()
  if(!value){setMessage('Digite o nome do serviço.');return}
  if(draft.interestOptions.some(s=>s.toLowerCase()===value.toLowerCase())){setMessage('Esse serviço já existe.');return}
  if(draft.interestOptions.length>=18){setMessage('Limite de 18 serviços para manter o formulário legível.');return}
  patch({interestOptions:[...draft.interestOptions,value]});setNewOption('');setMessage('')
 }
 const save=()=>{
  const options=draft.interestOptions.map(s=>s.trim()).filter(Boolean)
  if(!options.length){setMessage('Mantenha pelo menos uma opção de serviço.');return}
  onSave({...draft,allowAvatar:false,interestOptions:options})
  onClose()
 }
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel contact-editor" role="dialog" aria-modal="true" aria-label="Editar formulário de contato">
 <header><div><span className="eyebrow">✦ LOCAL STUDIO</span><h2>Editar Contato</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
 <div className="editor-scroll">
  <div className="contact-editor-head"><p>Personalize os serviços que oferece, o convite ao cliente e as opções do formulário. As mudanças são aplicadas à prévia.</p></div>
  <label>Primeira linha do título<input value={draft.titleFirst} maxLength={80} onChange={e=>patch({titleFirst:e.target.value})}/></label>
  <label>Destaque roxo no título<input value={draft.titleAccent} maxLength={80} onChange={e=>patch({titleAccent:e.target.value})}/></label>
  <label>Texto de apresentação<textarea rows={3} value={draft.introduction} maxLength={600} onChange={e=>patch({introduction:e.target.value})}/></label>
  <div className="contact-editor-categories"><h3>Serviços e interesses</h3><p>Exclua o que não oferece mais e acrescente serviços novos. As opções aparecerão em um único seletor discreto no formulário.</p>
   <div className="contact-services-list">{draft.interestOptions.map((item,index)=><div key={index} className="contact-service-row"><input aria-label={'Serviço '+(index+1)} maxLength={45} value={item} onChange={e=>patch({interestOptions:draft.interestOptions.map((s,i)=>i===index?e.target.value:s)})}/><button title="Mover para cima" aria-label={'Subir '+item} disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp size={16}/></button><button title="Mover para baixo" aria-label={'Descer '+item} disabled={index===draft.interestOptions.length-1} onClick={()=>move(index,1)}><ArrowDown size={16}/></button><button title="Remover" aria-label={'Excluir '+item} onClick={()=>remove(index)}><Trash2 size={15}/></button></div>)}</div>
   <div className="contact-service-add"><input aria-label="Novo serviço" value={newOption} placeholder="Novo serviço, ex.: Texturização" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add()}}} onChange={e=>setNewOption(e.target.value)}/><button type="button" onClick={add}><Plus size={16}/>Adicionar</button></div>
  </div>
  <div className="contact-editor-options"><h3>Opções do formulário</h3><label><input type="checkbox" checked={draft.allowAttachments} onChange={e=>patch({allowAttachments:e.target.checked})}/> Permitir anexar referências (até 3 imagens ou PDFs)</label></div>
  {message&&<p className="editor-status" role="alert">{message}</p>}
 </div>
 <footer><button type="button" className="subtle-action" onClick={onClose}><Eye size={16}/>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={16}/>Salvar formulário</button></footer>
 </section></div>
}
