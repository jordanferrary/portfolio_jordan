import {useEffect,useRef,useState} from 'react'
import {ArrowUpRight,Check,Copy,Pencil,Sparkles} from 'lucide-react'
import type {Block} from '../../data/projects'
import type {CustomPage,PageBlock} from '../../data/custom-pages'
import {safePageHref} from '../../data/custom-pages'
import {AssetImage} from '../ui/asset-image'
import {RichText} from '../ui/rich-text'
import {StoryBlock} from './project-page'

function PageAction({block}: {block:PageBlock}){
 const [message,setMessage]=useState('')
 const timeout=useRef<number|null>(null)
 useEffect(()=>()=>{if(timeout.current!==null)window.clearTimeout(timeout.current)},[])
 const action=block.buttonAction??'copy'
 const destination=action==='copy'?null:safePageHref(block.content)
 const enabled=action==='copy'?!!block.content.trim():!!destination
 const label=block.buttonLabel?.trim()||(action==='copy'?'Copy content':'Open link')
 const show=(text:string)=>{
  setMessage(text)
  if(timeout.current!==null)window.clearTimeout(timeout.current)
  timeout.current=window.setTimeout(()=>setMessage(''),3500)
 }
 const copy=async()=>{
  if(!enabled||action!=='copy')return
  try{
   await navigator.clipboard.writeText(block.content)
   show('Copied to clipboard')
  }catch{show('Could not copy automatically. Check clipboard permission.')}
 }
 const cls='custom-page-cta'+(block.buttonStyle==='outline'?' outline':'')+(block.buttonWidth==='full'?' full':'')
 return <section className={'custom-page-action align-'+(block.buttonAlign??'left')}>
  {block.buttonNote&&<p className="custom-page-action-note">{block.buttonNote}</p>}
  {action==='copy'?<button type="button" className={cls} onClick={()=>void copy()} disabled={!enabled}>{message==='Copied to clipboard'?<Check size={18}/>:<Copy size={18}/>}<span>{label}</span></button>:
   destination?<a className={cls} href={destination} target={action==='url-new'?'_blank':undefined} rel={action==='url-new'?'noopener noreferrer':undefined}><span>{label}</span><ArrowUpRight size={18}/></a>:
   <span className={cls+' disabled'} aria-disabled="true">{label}<ArrowUpRight size={18}/></span>}
  {message&&<span className="custom-page-action-feedback" role="status">{message}</span>}
 </section>
}
export function CustomPageView({page,editing,onEdit}:{page:CustomPage;editing:boolean;onEdit:()=>void}){
 return <main className={'custom-page custom-page-'+page.layout}>
  <header className={'custom-page-hero'+(page.heroImage?' has-image':'')}>
   {page.heroImage&&<AssetImage src={page.heroImage} className="custom-page-hero-image" alt="" style={{objectPosition:page.heroPositionX+'% '+page.heroPositionY+'%'}}/>}
   <div className="custom-page-hero-content">
    <span className="custom-page-eyebrow"><Sparkles size={15}/> {page.eyebrow||'CREATIVE SPACE'}</span>
    <h1>{page.title}</h1>
    {page.subtitle&&<RichText className="custom-page-subtitle" value={page.subtitle}/>}
    {editing&&<button className="custom-page-edit" type="button" onClick={onEdit}><Pencil size={16}/> Edit page</button>}
   </div>
   <span className="custom-page-hero-watermark" aria-hidden="true">✦</span>
  </header>
  <div className="custom-page-body">
   {page.blocks.length?<div className="story-blocks custom-page-story">{page.blocks.map(block=>block.type==='action'?<PageAction key={block.id} block={block}/>:<StoryBlock key={block.id} block={block as Block} projectTitle={page.title}/>)}</div>:
    <div className="custom-page-empty"><Sparkles size={27}/><p>{editing?'This page is ready for your content. Open the editor to add sections.':'More content is coming soon.'}</p>{editing&&<button type="button" onClick={onEdit}>Add content</button>}</div>}
  </div>
  <footer className="custom-page-footer"><span>✦ JORDAN FERRARY</span><a href="#/portfolio">Explore the portfolio <ArrowUpRight size={15}/></a></footer>
 </main>
}
