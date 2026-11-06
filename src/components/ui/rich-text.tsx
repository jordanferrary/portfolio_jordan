import type {ReactNode} from 'react'
/** Small, safe formatting syntax: **bold**, *italic*, ==purple==. React escapes user text. */
export function inlineFormat(value:string):ReactNode[]{
 const out:ReactNode[]=[]
 let cursor=0
 let key=0
 while(cursor<value.length){
  const pair=value.startsWith('**',cursor)?'**':value.startsWith('==',cursor)?'==':value[cursor]==='*'?'*':null
  if(pair){
   const end=value.indexOf(pair,cursor+pair.length)
   if(end>cursor+pair.length){
    const inner=inlineFormat(value.slice(cursor+pair.length,end))
    out.push(pair==='**'?<strong key={key++}>{inner}</strong>:pair==='=='?<span key={key++} className="rich-accent">{inner}</span>:<em key={key++}>{inner}</em>)
    cursor=end+pair.length
    continue
   }
  }
  const start=cursor
  cursor++
  while(cursor<value.length&&!value.startsWith('**',cursor)&&!value.startsWith('==',cursor)&&value[cursor]!=='*')cursor++
  out.push(<span key={key++}>{value.slice(start,cursor)}</span>)
 }
 return out
}
export function RichText({value,className='',heading=false}:{value:string;className?:string;heading?:boolean}){
 return <div className={'rich-text '+className}>{value.split(/\r?\n/).map((raw,index)=>{
  const line=raw.trimEnd()
  if(line.startsWith('### '))return <h4 key={index}>{inlineFormat(line.slice(4))}</h4>
  if(line.startsWith('## '))return <h3 key={index}>{inlineFormat(line.slice(3))}</h3>
  if(line.startsWith('# '))return <h2 key={index}>{inlineFormat(line.slice(2))}</h2>
  if(!line.trim())return <div className="rich-space" key={index}/>
  if(heading)return <h2 key={index}>{inlineFormat(line)}</h2>
  return <p key={index}>{inlineFormat(line)}</p>
 })}</div>
}
