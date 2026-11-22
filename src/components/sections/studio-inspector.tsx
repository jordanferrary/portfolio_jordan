import {useEffect,useState} from 'react'
import {ArrowDown,ArrowUp,Copy,Focus,MousePointer2,Pencil,Save,X} from 'lucide-react'
import {BlockProperties} from '../ui/block-properties'
import type {BlockAppearance,BlockAppearancePreview} from '../../lib/component-settings'
type Item={id:string;type:string;content:string;appearance?:BlockAppearance;linkedSource?:{pageId:string;blockId:string}}
type Props={title:string;blocks:Item[];onSave:(id:string,appearance?:BlockAppearance)=>void;onPreview:(value?:BlockAppearancePreview)=>void;onMove:(id:string,delta:number)=>void;onDuplicate:(id:string)=>void;onEdit:(id:string)=>void;onClose:()=>void}
const labels:Record<string,string>={heading:'Título',text:'Texto',image:'Imagem','image-left':'Imagem à esquerda','image-right':'Imagem à direita','before-after':'Comparador',gallery:'Galeria',divider:'Divisória',video:'Vídeo',model:'Modelo 3D',slideshow:'Slideshow',process:'Processo',action:'Botão',showcase:'Vitrine'}
const findBlock=(id:string)=>Array.from(document.querySelectorAll<HTMLElement>('[data-studio-block]')).find(node=>node.dataset.studioBlock===id)
export function StudioInspector({title,blocks,onSave,onPreview,onMove,onDuplicate,onEdit,onClose}:Props){
 const [selected,setSelected]=useState(blocks[0]?.id??'')
 const current=blocks.find(b=>b.id===selected)
 const [draft,setDraft]=useState<BlockAppearance|undefined>(current?.appearance)
 const [picking,setPicking]=useState(false)
 const [notice,setNotice]=useState('')
 const dirty=JSON.stringify(draft??null)!==JSON.stringify(current?.appearance??null)
 const allowLeave=()=>!dirty||window.confirm('Descartar as propriedades ainda não aplicadas?')
 const choose=(id:string,locate=false)=>{
  if(id===selected){if(locate)findBlock(id)?.scrollIntoView({block:'center',behavior:'auto'});return}
  if(!allowLeave())return
  setSelected(id);setDraft(blocks.find(b=>b.id===id)?.appearance);setNotice('')
  if(locate)findBlock(id)?.scrollIntoView({block:'center',behavior:'auto'})
 }
 useEffect(()=>{onPreview(dirty&&current?{id:selected,appearance:draft}:undefined)},[dirty,selected,draft,current,onPreview])
 useEffect(()=>()=>onPreview(undefined),[onPreview])
 useEffect(()=>{
  const node=findBlock(selected)
  node?.setAttribute('data-studio-selected','true')
  return()=>node?.removeAttribute('data-studio-selected')
 },[selected,blocks])
 useEffect(()=>{
  if(!picking)return
  const select=(event:MouseEvent)=>{
   if(!(event.target instanceof Element)||event.target.closest('.studio-inspector,.editor-overlay,[aria-modal=true]'))return
   const node=event.target.closest<HTMLElement>('[data-studio-block]')
   const id=node?.dataset.studioBlock
   if(!id||!blocks.some(b=>b.id===id))return
   event.preventDefault();event.stopPropagation();setPicking(false);choose(id)
  }
  document.addEventListener('click',select,true)
  return()=>document.removeEventListener('click',select,true)
 },[picking,blocks,selected,draft])
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('.editor-overlay,[aria-modal=true]')){if(picking)setPicking(false);else if(allowLeave())onClose()}}
  document.addEventListener('keydown',key)
  return()=>document.removeEventListener('keydown',key)
 },[picking,dirty,onClose])
 const index=blocks.findIndex(b=>b.id===selected)
 return <aside className="studio-inspector" lang="pt-BR" aria-label="Inspetor visual" data-jf-studio-ui>
  <header><div><strong>Inspetor visual</strong><small>{title}</small></div><button type="button" aria-label="Fechar inspetor" onClick={()=>{if(allowLeave())onClose()}}><X size={19}/></button></header>
  <div className="studio-inspector-tools"><button type="button" aria-pressed={picking} onClick={()=>setPicking(p=>!p)}><MousePointer2 size={16}/>{picking?'Clique em um bloco':'Selecionar no site'}</button><button type="button" disabled={!current} onClick={()=>findBlock(selected)?.scrollIntoView({block:'center',behavior:'auto'})}><Focus size={16}/>Localizar</button></div>
  <div className="studio-inspector-body"><section aria-label="Hierarquia de blocos"><h3>Hierarquia <small>{blocks.length} blocos</small></h3>
   {blocks.length===0&&<p>Esta página ainda não possui blocos. Abra o editor de conteúdo para adicionar.</p>}
   <div className="studio-inspector-tree">{blocks.map((b,i)=><button key={b.id} type="button" aria-pressed={selected===b.id} onClick={()=>choose(b.id,true)}><small>{i+1}</small><span>{labels[b.type]??b.type}{b.linkedSource?' (vinculado)':''}{(b.type==='heading'||b.type==='text')&&<small>{b.content.slice(0,64)}</small>}</span></button>)}</div>
  </section>{current&&<section aria-label="Propriedades do bloco"><h3>{labels[current.type]??current.type}</h3>
   <div className="studio-inspector-tools"><button type="button" disabled={dirty||index===0} aria-label="Mover para cima" onClick={()=>onMove(current.id,-1)}><ArrowUp size={16}/></button><button type="button" disabled={dirty||index===blocks.length-1} aria-label="Mover para baixo" onClick={()=>onMove(current.id,1)}><ArrowDown size={16}/></button><button type="button" disabled={dirty||blocks.length>=250} onClick={()=>onDuplicate(current.id)}><Copy size={15}/>Duplicar</button><button type="button" onClick={()=>{if(allowLeave())onEdit(current.id)}}><Pencil size={15}/>Conteúdo</button></div>
   <BlockProperties value={draft} onChange={setDraft} expanded/>
   <p className="studio-inspector-note">{current.linkedSource?'As propriedades são da instância; o conteúdo continua vinculado à origem. ':''}A prévia é temporária. Aplicar grava no rascunho local. A visibilidade por dispositivo é mantida durante a edição para permitir selecionar o bloco.</p>
   <button type="button" className="studio-inspector-save" disabled={!dirty} onClick={()=>{onSave(current.id,draft);setNotice('Propriedades aplicadas ao rascunho.')}}><Save size={16}/>Aplicar propriedades</button>
   {notice&&<p role="status">{notice}</p>}
  </section>}</div>
 </aside>
}
