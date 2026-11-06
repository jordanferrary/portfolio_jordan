import type { ReactNode } from 'react'
function inline(text:string):ReactNode[]{
 return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((segment,index)=>{
  if(segment.startsWith('**')&&segment.endsWith('**'))return <strong key={index}>{segment.slice(2,-2)}</strong>
  if(segment.startsWith('*')&&segment.endsWith('*'))return <em key={index}>{segment.slice(1,-1)}</em>
  return <span key={index}>{segment}</span>
 })
}
export function RichText({value,className=''}:{value:string;className?:string}){
 return <div className={'rich-text '+className}>{value.split(/\r?\n/).map((line,index)=>{
  const text=line.trimEnd()
  if(text.startsWith('### '))return <h4 key={index}>{inline(text.slice(4))}</h4>
  if(text.startsWith('## '))return <h3 key={index}>{inline(text.slice(3))}</h3>
  if(text.startsWith('# '))return <h2 key={index}>{inline(text.slice(2))}</h2>
  if(!text.trim())return <div className="rich-space" key={index}/>
  return <p key={index}>{inline(text)}</p>
 })}</div>
}
