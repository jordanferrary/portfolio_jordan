import {useEffect,useState} from 'react'
import {ArrowDown,ArrowUp,ClipboardPaste,Copy,Focus,GripVertical,MousePointer2,Pencil,RotateCcw,Save,Search,X} from 'lucide-react'
import {BlockProperties} from '../ui/block-properties'
import {normalizeBlockAppearance,type BlockAppearance,type BlockAppearancePreview} from '../../lib/component-settings'
import {matchesTool} from '../../lib/studio-workflow'
type Item={id:string;type:string;content:string;appearance?:BlockAppearance;linkedSource?:{pageId:string;blockId:string}}
type Props={title:string;blocks:Item[];onSave:(id:string,appearance?:BlockAppearance)=>void;onPreview:(value?:BlockAppearancePreview)=>void;onMove:(id:string,delta:number)=>void;onDuplicate:(id:string)=>void;onEdit:(id:string)=>void;onClose:()=>void}
const labels:Record<string,string>={heading:'Título',text:'Texto',image:'Imagem','image-left':'Imagem à esquerda','image-right':'Imagem à direita','before-after':'Comparador',gallery:'Galeria',divider:'Divisória',video:'Vídeo',model:'Modelo 3D',slideshow:'Slideshow',process:'Processo',action:'Botão',showcase:'Vitrine'}
const findBlock=(id:string)=>Array.from(document.querySelectorAll<HTMLElement>('[data-studio-block]')).find(node=>node.dataset.studioBlock===id)
const styleClipboardKey='jf-inspector-style-clipboard'
type StyleClipboard={appearance?:BlockAppearance}
function readStyleClipboard():StyleClipboard|undefined{
 try{const raw=sessionStorage.getItem(styleClipboardKey);if(!raw)return undefined;const data=JSON.parse(raw);if(!data||typeof data!=='object')return undefined;return {appearance:normalizeBlockAppearance(data.appearance)}}catch{return undefined}
}
const presets:{name:string;description:string;appearance?:BlockAppearance}[]=[
 {name:'Original',description:'Sem alterações individuais'},
 {name:'Editorial',description:'Conteúdo central com respiro',appearance:{width:85,space:24}},
 {name:'Painel',description:'Superfície e contorno do tema',appearance:{surface:'panel',padding:24,corner:20,border:true}},
 {name:'Glass',description:'Painel translúcido com reflexos',appearance:{surface:'glass',padding:24,corner:24}},
 {name:'Compacto',description:'Bloco central menor',appearance:{width:70,space:12}}
]
export function StudioInspector({title,blocks,onSave,onPreview,onMove,onDuplicate,onEdit,onClose}:Props){
 const [selected,setSelected]=useState(blocks[0]?.id??'')
 const current=blocks.find(b=>b.id===selected)
 const [draft,setDraft]=useState<BlockAppearance|undefined>(current?.appearance)
 const [picking,setPicking]=useState(false)
 const [notice,setNotice]=useState('')
 const [query,setQuery]=useState('')
 const [dragged,setDragged]=useState<string|null>(null)
 const [clipboard,setClipboard]=useState<StyleClipboard|undefined>(readStyleClipboard)
 const [measure,setMeasure]=useState<{width:number;height:number}|null>(null)
 const filtered=blocks.filter((b,i)=>matchesTool(query,[String(i+1),labels[b.type]??b.type,b.type,b.type==='heading'||b.type==='text'?b.content:'',b.linkedSource?'vinculado':'']))
 const copyStyle=()=>{const next={appearance:normalizeBlockAppearance(draft)};setClipboard(next);try{sessionStorage.setItem(styleClipboardKey,JSON.stringify(next))}catch{/* Clipboard remains available in this inspector. */}setNotice('Aparência copiada. Nenhum conteúdo ou mídia foi copiado.')}
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
  const node=findBlock(selected)
  if(!node){setMeasure(null);return}
  const update=()=>{const rect=node.getBoundingClientRect();setMeasure({width:Math.round(rect.width),height:Math.round(rect.height)})}
  update()
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)}
  const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()
 },[selected,blocks,draft])
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
   <label className="studio-inspector-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar título, tipo ou número" aria-label="Buscar blocos"/>{query&&<button type="button" aria-label="Limpar busca" onClick={()=>setQuery('')}><X size={14}/></button>}</label>
   {query&&<small>{filtered.length} de {blocks.length} blocos</small>}
   <div className="studio-inspector-tree">{filtered.map(b=>{const i=blocks.findIndex(item=>item.id===b.id);return <button key={b.id} type="button" aria-pressed={selected===b.id} data-dragging={dragged===b.id||undefined} draggable={!dirty&&!query} onDragStart={e=>{if(dirty||query){e.preventDefault();return}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',b.id);setDragged(b.id)}} onDragEnd={()=>setDragged(null)} onDragOver={e=>{if(dragged&&!dirty&&!query){e.preventDefault();e.dataTransfer.dropEffect='move'}}} onDrop={e=>{e.preventDefault();if(dragged&&!dirty&&!query){const from=blocks.findIndex(item=>item.id===dragged);if(from>=0&&from!==i)onMove(dragged,i-from)}setDragged(null)}} onClick={()=>choose(b.id,true)}><GripVertical size={15} className="studio-inspector-grip"/><small>{i+1}</small><span>{labels[b.type]??b.type}{b.linkedSource?' (vinculado)':''}{(b.type==='heading'||b.type==='text')&&<small>{b.content.slice(0,64)}</small>}</span>{(b.appearance?.hideMobile||b.appearance?.hideDesktop)&&<small title="Visibilidade personalizada">Oculto</small>}</button>})}</div>
   {query&&filtered.length===0&&<p>Nenhum bloco corresponde à busca.</p>}
   <small>Arraste para reorganizar a hierarquia ou use as setas. Aplique ou descarte alterações antes de mover.</small>
  </section>{current&&<section aria-label="Propriedades do bloco"><h3>{labels[current.type]??current.type}</h3>
   <div className="studio-inspector-tools"><button type="button" disabled={dirty||index===0} aria-label="Mover para cima" onClick={()=>onMove(current.id,-1)}><ArrowUp size={16}/></button><button type="button" disabled={dirty||index===blocks.length-1} aria-label="Mover para baixo" onClick={()=>onMove(current.id,1)}><ArrowDown size={16}/></button><button type="button" disabled={dirty||blocks.length>=250} onClick={()=>onDuplicate(current.id)}><Copy size={15}/>Duplicar</button><button type="button" onClick={()=>{if(allowLeave())onEdit(current.id)}}><Pencil size={15}/>Conteúdo</button></div>
   {measure&&<div className="studio-inspector-measure" aria-label="Dimensões atuais"><small>Dimensões na tela</small><strong>{measure.width} × {measure.height} px</strong></div>}
   <div className="studio-inspector-style-tools"><button type="button" onClick={copyStyle}><Copy size={15}/>Copiar estilo</button><button type="button" disabled={!clipboard} onClick={()=>{if(clipboard){setDraft(normalizeBlockAppearance({...clipboard.appearance,hideMobile:draft?.hideMobile,hideDesktop:draft?.hideDesktop}));setNotice('Estilo colado na prévia. Aplique para salvar.')}}}><ClipboardPaste size={15}/>Colar estilo</button></div>
   <details className="studio-inspector-presets"><summary>Presets de aparência</summary><div>{presets.map(p=><button type="button" key={p.name} title={p.description} onClick={()=>{setDraft(normalizeBlockAppearance({...p.appearance,hideMobile:draft?.hideMobile,hideDesktop:draft?.hideDesktop}));setNotice('Preset aplicado à prévia.')}}}>{p.name}</button>)}</div><small>Presets alteram a aparência, não o conteúdo nem a visibilidade.</small></details>
   <BlockProperties value={draft} onChange={setDraft} expanded/>
   <p className="studio-inspector-note">{current.linkedSource?'As propriedades são da instância; o conteúdo continua vinculado à origem. ':''}A prévia é temporária. Aplicar grava no rascunho local. A visibilidade por dispositivo é mantida durante a edição para permitir selecionar o bloco.</p>
   <div className="studio-inspector-footer"><button type="button" disabled={!dirty} onClick={()=>{setDraft(current.appearance);setNotice('Prévia descartada.')}}><RotateCcw size={15}/>Descartar</button><button type="button" className="studio-inspector-save" disabled={!dirty} onClick={()=>{onSave(current.id,draft);setNotice('Propriedades aplicadas ao rascunho.')}}><Save size={16}/>Aplicar</button></div>
   {notice&&<p role="status">{notice}</p>}
  </section>}</div>
 </aside>
}
