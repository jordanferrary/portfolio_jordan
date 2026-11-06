import { useRef,useState } from 'react'
import { Bold,Eye,Heading2,Heading3,Italic,Palette,RemoveFormatting,Type } from 'lucide-react'
import { RichText } from './rich-text'
interface Props {value:string;onChange:(value:string)=>void;label:string;rows?:number;heading?:boolean}
export function TextComposer({value,onChange,label,rows=5,heading=false}:Props){
 const input=useRef<HTMLTextAreaElement>(null)
 const [preview,setPreview]=useState(false)
 const apply=(command:'bold'|'italic'|'accent'|'h2'|'h3'|'normal')=>{
  const el=input.current
  if(!el)return
  const start=el.selectionStart,end=el.selectionEnd
  let next=''
  let focusFrom=start,focusTo=end
  if(command==='bold'||command==='italic'||command==='accent'){
   const wrap=command==='bold'?'**':command==='accent'?'==':'*'
   const selected=value.slice(start,end)||'texto'
   next=value.slice(0,start)+wrap+selected+wrap+value.slice(end)
   focusFrom=start+wrap.length;focusTo=focusFrom+selected.length
  }else{
   const begin=value.lastIndexOf('\n',start-1)+1
   const endLine=value.indexOf('\n',start)
   const finish=endLine===-1?value.length:endLine
   const oldLine=value.slice(begin,finish)
   const plain=oldLine.replace(/^#{1,3}\s*/,'')
   const prefix=command==='h2'?'## ':command==='h3'?'### ':''
   next=value.slice(0,begin)+prefix+plain+value.slice(finish)
   focusFrom=begin+prefix.length;focusTo=focusFrom+plain.length
  }
  onChange(next)
  requestAnimationFrame(()=>{el.focus();el.setSelectionRange(focusFrom,focusTo)})
 }
 return <div className="text-composer">
  <div className="composer-toolbar" role="toolbar" aria-label={'Formatação: '+label}>
   <button type="button" title="Negrito" aria-label="Negrito" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('bold')}><Bold size={16}/></button>
   <button type="button" title="Itálico" aria-label="Itálico" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('italic')}><Italic size={16}/></button>
   <button type="button" title="Destacar palavras em roxo" aria-label="Destaque roxo" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('accent')}><Palette size={16}/></button>
   <button type="button" title="Subtítulo" aria-label="Subtítulo grande" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('h2')}><Heading2 size={18}/></button>
   <button type="button" title="Subtítulo menor" aria-label="Subtítulo menor" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('h3')}><Heading3 size={18}/></button>
   <button type="button" title="Texto comum" aria-label="Texto comum" onMouseDown={e=>e.preventDefault()} onClick={()=>apply('normal')}><RemoveFormatting size={16}/></button>
   <button type="button" className={preview?'active':''} aria-pressed={preview} onClick={()=>setPreview(p=>!p)} title="Mostrar prévia">{preview?<Type size={16}/>:<Eye size={16}/>}</button>
  </div>
  {preview?<div className="composer-preview"><RichText value={value} heading={heading}/><button type="button" onClick={()=>setPreview(false)}>Voltar à edição</button></div>:<textarea ref={input} value={value} onChange={e=>onChange(e.target.value)} rows={rows} aria-label={label} placeholder={heading?'Título ou subtítulo. Selecione palavras para formatar.':'Escreva seu texto. Selecione um trecho e clique no estilo desejado.'}/>}
  <small>Use **negrito**, *itálico* ou ==destaque roxo==. H2/H3 criam subtítulos; Prévia mostra o resultado.</small>
 </div>
}
