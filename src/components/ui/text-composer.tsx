import { useRef,useState,type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Bold,Eye,Heading2,Heading3,Italic,Palette,RemoveFormatting,Type } from 'lucide-react'
import { RichText } from './rich-text'
interface Props {value:string;onChange:(value:string)=>void;label:string;rows?:number;heading?:boolean}
type Command='bold'|'italic'|'accent'|'h2'|'h3'|'normal'
export function TextComposer({value,onChange,label,rows=5,heading=false}:Props){
 const area=useRef<HTMLTextAreaElement>(null)
 const selection=useRef({start:0,end:0})
 const [previewOnly,setPreviewOnly]=useState(false)
 const remember=()=>{const el=area.current;if(el)selection.current={start:el.selectionStart,end:el.selectionEnd}}
 const restore=(start:number,end:number)=>{
  selection.current={start,end}
  requestAnimationFrame(()=>{area.current?.focus();area.current?.setSelectionRange(start,end)})
 }
 const apply=(command:Command)=>{
  const el=area.current
  if(!el){setPreviewOnly(false);return}
  const from=Math.min(selection.current.start,value.length)
  const to=Math.min(selection.current.end,value.length)
  if(command==='bold'||command==='italic'||command==='accent'){
   const wrap=command==='bold'?'**':command==='italic'?'*':'=='
   // Clicking a formatting button with no selected text inserts an editable marker.
   const text=value.slice(from,to)||'texto'
   if(from>=wrap.length&&value.slice(from-wrap.length,from)===wrap&&value.slice(to,to+wrap.length)===wrap){
    onChange(value.slice(0,from-wrap.length)+text+value.slice(to+wrap.length))
    restore(from-wrap.length,from-wrap.length+text.length)
    return
   }
   onChange(value.slice(0,from)+wrap+text+wrap+value.slice(to))
   restore(from+wrap.length,from+wrap.length+text.length)
   return
  }
  const start=value.lastIndexOf('\n',Math.max(0,from-1))+1
  const at=value.indexOf('\n',from)
  const finish=at<0?value.length:at
  const line=value.slice(start,finish)
  const plain=line.replace(/^#{1,3}\s*/,'')
  const prefix=command==='h2'?'## ':command==='h3'?'### ':''
  onChange(value.slice(0,start)+prefix+plain+value.slice(finish))
  restore(start+prefix.length,start+prefix.length+plain.length)
 }
 const shortcut=(event:ReactKeyboardEvent<HTMLTextAreaElement>)=>{
  if((event.ctrlKey||event.metaKey)&&!event.altKey){
   const key=event.key.toLowerCase()
   if(key==='b'||key==='i'){
    event.preventDefault()
    remember()
    apply(key==='b'?'bold':'italic')
   }
  }
 }
 const actions=[
  {key:'bold' as Command,name:'Negrito · Ctrl+B',icon:Bold,aria:'Negrito'},
  {key:'italic' as Command,name:'Itálico · Ctrl+I',icon:Italic,aria:'Itálico'},
  {key:'accent' as Command,name:'Destacar em roxo',icon:Palette,aria:'Destaque roxo'},
  {key:'h2' as Command,name:'Subtítulo grande',icon:Heading2,aria:'Subtítulo grande'},
  {key:'h3' as Command,name:'Subtítulo menor',icon:Heading3,aria:'Subtítulo menor'},
  {key:'normal' as Command,name:'Texto comum',icon:RemoveFormatting,aria:'Texto comum'}
 ]
 return <div className="text-composer">
  <div className="composer-toolbar" role="toolbar" aria-label={'Formatação: '+label}>
   {actions.map(({key,name,icon:Icon,aria})=><button key={key} type="button" title={name} aria-label={aria} onMouseDown={e=>e.preventDefault()} onClick={()=>apply(key)}><Icon size={16}/></button>)}
   <button type="button" className={previewOnly?'active':''} aria-label={previewOnly?'Voltar à edição':'Expandir visualização'} aria-pressed={previewOnly} onClick={()=>setPreviewOnly(v=>!v)} title="Alternar edição/prévia">{previewOnly?<Type size={16}/>:<Eye size={16}/>}</button>
  </div>
  {previewOnly?<div className="composer-preview"><RichText value={value} heading={heading}/><button type="button" onClick={()=>setPreviewOnly(false)}>Voltar à edição</button></div>:<>
   <textarea ref={area} value={value} rows={rows} onChange={e=>{onChange(e.target.value);selection.current={start:e.target.selectionStart,end:e.target.selectionEnd}}} onSelect={remember} onClick={remember} onKeyUp={remember} onKeyDown={shortcut} aria-label={label} placeholder={heading?'Escreva um título e selecione trechos para formatar.':'Escreva seu texto. Selecione palavras e clique em B, I ou na paleta roxa.'}/>
   {value.trim()&&<div className="composer-live-preview"><span className="composer-preview-label">Prévia formatada</span><RichText value={value} heading={heading}/></div>}
  </>}
  <small>Selecione palavras e clique em B (negrito), I (itálico) ou na paleta (roxo). Atalhos: Ctrl+B e Ctrl+I.</small>
 </div>
}
