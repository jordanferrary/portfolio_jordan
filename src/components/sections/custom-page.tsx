import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {ArrowUpRight,Check,Copy,Pencil,FolderOpen} from 'lucide-react'
import type {BlockAppearancePreview} from '../../lib/component-settings'
import type {Block} from '../../data/projects'
import type {CustomPage,PageBlock} from '../../data/custom-pages'
import {resolvePageBlock} from '../../lib/page-composition'
import {safePageHref} from '../../data/custom-pages'
import {AssetImage} from '../ui/asset-image'
import {RichText} from '../ui/rich-text'
import {StoryBlock} from './project-page'
import {ArtistShowcase,PageSlideshow} from './page-media-blocks'
import {HeadingSymbol} from '../ui/heading-symbol'
import type {HeadingSymbolStyle} from '../../lib/heading-symbol'
import {cleanHeadingText} from '../../lib/heading-symbol'

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
export function CustomPageView({page,pages=[],editing,onEdit,onEditBlock,appearancePreview,headingSymbol}:{page:CustomPage;pages?:CustomPage[];editing:boolean;onEdit:()=>void;onEditBlock?:(id:string)=>void;appearancePreview?:BlockAppearancePreview;headingSymbol?:HeadingSymbolStyle}){
 return <main className={'custom-page custom-page-'+page.layout}>
  <header className={'custom-page-hero'+(page.heroImage?' has-image':'')}>
   {page.heroImage&&<AssetImage src={page.heroImage} className="custom-page-hero-image" alt="" style={{objectPosition:page.heroPositionX+'% '+page.heroPositionY+'%'}}/>}
   <div className="custom-page-hero-content">
    {cleanHeadingText(page.eyebrow)&&<span className="custom-page-eyebrow"><HeadingSymbol symbol={headingSymbol} size={15}/> {cleanHeadingText(page.eyebrow)}</span>}
    <h1>{page.title}</h1>
    {page.subtitle&&<RichText className="custom-page-subtitle" value={page.subtitle}/>}
    {editing&&<button className="custom-page-edit" type="button" onClick={onEdit}><Pencil size={16}/> Edit page</button>}
   </div>
  </header>
  <div className="custom-page-body">
   {page.blocks.length?<div className="story-blocks custom-page-story">{page.blocks.map(original=>{
    const block=resolvePageBlock(editing&&appearancePreview?.id===original.id?{...original,appearance:appearancePreview.appearance}:original,pages),appearance=block.appearance
    const node=block.type==='action'?<PageAction key={block.id} block={block}/>:block.type==='showcase'?<ArtistShowcase key={block.id} block={block}/>:block.type==='slideshow'?<PageSlideshow key={block.id} block={block}/>:<StoryBlock key={block.id} block={block as Block} projectTitle={page.title}/>
    if(!appearance&&!editing)return node
    const style={'--jf-block-width':(appearance?.width??100)+'%','--jf-block-space':(appearance?.space??0)+'px','--jf-block-padding':appearance?.padding===undefined?undefined:appearance.padding+'px','--jf-block-corner':appearance?.corner===undefined?undefined:appearance.corner+'px','--jf-block-opacity':(appearance?.opacity??100)/100} as CSSProperties
    return <div key={block.id} className={'studio-component'+(appearance?.surface==='panel'?' component-panel':appearance?.surface==='glass'?' component-glass':'')+(appearance?.border?' component-border':'')+(appearance?.hideMobile?' hide-mobile':'')+(appearance?.hideDesktop?' hide-desktop':'')+(editing?' component-editing':'')} data-studio-block={editing?block.id:undefined} data-align={appearance?.align??'center'} style={style}>
     {editing&&onEditBlock&&<button type="button" className="studio-component-edit" aria-label="Editar este componente" onClick={()=>onEditBlock(block.id)}><Pencil size={14}/></button>}{node}
    </div>
   })}</div>:
    <div className="custom-page-empty"><FolderOpen size={27}/><p>{editing?'This page is ready for your content. Open the editor to add sections.':'More content is coming soon.'}</p>{editing&&<button type="button" onClick={onEdit}>Add content</button>}</div>}
  </div>
  <footer className="custom-page-footer"><span>JORDAN FERRARY</span><a href="#/portfolio">Explore the portfolio <ArrowUpRight size={15}/></a></footer>
 </main>
}
