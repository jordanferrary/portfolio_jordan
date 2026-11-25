import { lazy,Suspense,useState,type CSSProperties } from 'react'
import { ArrowLeft,ArrowUpRight,Pencil,Search } from 'lucide-react'
import type {BlockAppearancePreview} from '../../lib/component-settings'
import type { Block,Project,ProcessStep } from '../../data/projects'
import { AssetImage } from '../ui/asset-image'
import { ZoomableArt } from '../ui/zoomable-art'
const ArtLightbox=lazy(()=>import('../ui/art-lightbox').then(m=>({default:m.ArtLightbox})))
import { RichText } from '../ui/rich-text'
import { ProjectVideo } from '../ui/project-video'
import { ProjectModel } from '../ui/project-model'
import { ArtistShowcase,PageSlideshow } from './page-media-blocks'
import { ProjectLike } from './project-like'
import { ProjectProcess } from './project-process'
import { ProjectDivider } from '../ui/project-divider'
import {HeadingSymbol} from '../ui/heading-symbol'
import type {HeadingSymbolStyle} from '../../lib/heading-symbol'
import { framingStyle } from '../../lib/image-framing'
function BeforeAfter({block,title}:{block:Block;title:string}){
 const [percent,setPercent]=useState(50)
 const [expanded,setExpanded]=useState<'before'|'after'|null>(null)
 const [ratio,setRatio]=useState(1)
 return <div className="comparison-block"><div className="comparison-images" style={{aspectRatio:ratio}}><AssetImage src={block.media} alt={title+' before'} draggable={false} onLoad={e=>{const image=e.currentTarget;if(image.naturalWidth&&image.naturalHeight)setRatio(Math.min(4,Math.max(.33,image.naturalWidth/image.naturalHeight)))}}/><div className="comparison-after" style={{clipPath:'inset(0 0 0 '+percent+'%)'}}><AssetImage src={block.after} alt={title+' after'} draggable={false}/></div><div className="compare-line" style={{left:percent+'%'}}><span>↔</span></div><input type="range" min="0" max="100" value={percent} onChange={e=>setPercent(Number(e.target.value))} aria-label="Compare before and after"/><button type="button" className="compare-label left" onClick={()=>setExpanded('before')} aria-label={'Inspect '+(block.beforeLabel??'Before')}><Search size={14} strokeWidth={1.9} aria-hidden="true"/><span>{block.beforeLabel??'Before'}</span></button><button type="button" className="compare-label right" onClick={()=>setExpanded('after')} aria-label={'Inspect '+(block.afterLabel??'After')}><span>{block.afterLabel??'After'}</span><Search size={14} strokeWidth={1.9} aria-hidden="true"/></button></div>{block.content&&<RichText className="media-caption" value={block.content}/>} {expanded&&<Suspense fallback={null}><ArtLightbox src={expanded==='before'?(block.media??''):(block.after??'')} alt={title+' '+expanded} onClose={()=>setExpanded(null)}/></Suspense>}</div>
}
/** Justified pairs: use each source's own aspect ratio rather than cropping it
 * into identical columns. The existing odd leading image stays full-width. */
function GalleryPair({sources,title,start}:{sources:string[];title:string;start:number}){
 const [ratios,setRatios]=useState<Record<number,number>>({})
 const first=ratios[0]??1,second=ratios[1]??1
 const total=first+second
 return <div className="story-gallery-row" style={{'--jf-gallery-first-share':first/total,'--jf-gallery-row-ratio':total} as CSSProperties}>
  {sources.map((source,i)=><ZoomableArt key={source+i} src={source} alt={title+', image '+(start+i+1)} loading="lazy" sizes="(max-width: 600px) 100vw, (max-width: 1100px) 80vw, 1000px" onLoad={event=>{
   const {naturalWidth,naturalHeight}=event.currentTarget
   if(naturalWidth>0&&naturalHeight>0){const ratio=naturalWidth/naturalHeight;setRatios(previous=>previous[i]===ratio?previous:{...previous,[i]:ratio})}
  }}/>)}
 </div>
}
function ProjectImageGallery({sources,title}:{sources:string[];title:string}){
 const start=sources.length%2
 const rows=Array.from({length:Math.floor(sources.length/2)},(_,i)=>start+i*2)
 return <section className="story-block story-multi-images">
  {start===1&&<ZoomableArt src={sources[0]} alt={title+', image 1'} loading="lazy" sizes="(max-width: 800px) 100vw, 1100px"/>}
  {rows.map(i=><GalleryPair key={JSON.stringify([i,...sources.slice(i,i+2)])} sources={sources.slice(i,i+2)} title={title} start={i}/>)}
 </section>
}
export function StoryBlock({block,projectTitle,processSteps=[]}:{block:Block;projectTitle:string;processSteps?:ProcessStep[]}){
 if(block.type==='process')return <ProjectProcess steps={processSteps} heading={block.content} projectTitle={projectTitle}/>
 if(block.type==='heading')return <section className="story-block block-heading"><RichText heading value={block.content}/></section>
 if(block.type==='text')return <section className="story-block block-text"><RichText value={block.content}/></section>
 if(block.type==='image')return <section className="story-block block-image"><ZoomableArt src={block.content} alt={'Artwork from '+projectTitle} loading="lazy" sizes="(max-width: 800px) 100vw, 900px"/></section>
 if(block.type==='image-left'||block.type==='image-right')return <section className={'story-block story-split '+block.type}><ZoomableArt src={block.media} alt={'Creative stage of '+projectTitle} loading="lazy" sizes="(max-width: 800px) 100vw, 500px"/><RichText value={block.content}/></section>
 if(block.type==='before-after')return <section className="story-block"><BeforeAfter block={block} title={projectTitle}/></section>
 if(block.type==='model')return <section className="story-block block-model"><ProjectModel startActive url={block.content} poster={block.media} presentation={block.modelPresentation} title={projectTitle+' 3D model'}/></section>
 if(block.type==='video')return <section className="story-block block-video"><ProjectVideo url={block.content} poster={block.media} title={block.videoTitle?.trim()||projectTitle}/></section>
 if(block.type==='divider')return <ProjectDivider icon={block.dividerIcon} variant={block.dividerStyle}/>
 if(block.type==='gallery'&&block.galleryMode==='artists')return <section className="story-block story-linked-gallery"><ArtistShowcase block={{...block,type:'showcase',showcaseFit:'contain',showcaseItems:(block.galleryEntries??[]).map(item=>({id:item.id,image:item.image,name:item.title||item.artist,description:[item.artist,item.description].filter(Boolean).join(' · '),portfolioUrl:item.portfolioUrl,linkLabel:'View portfolio',showLink:Boolean(item.portfolioUrl)}))}}/></section>
 if(block.type==='slideshow')return <section className="story-block story-project-slideshow"><PageSlideshow block={{...block,type:'slideshow',slideItems:(block.slides??[]).map(item=>({id:item.id,image:item.image,caption:item.caption||item.title})),slideTransition:block.slideEffect==='none'?'none':(block.slideEffect??'fade'),slideInterval:block.slideInterval,slideHeight:block.slideHeight,slideShowPauseButton:block.slideShowPauseButton,slideAutoplay:block.slideAutoplay}}/></section>
 if(block.type==='gallery')return <ProjectImageGallery sources={(block.gallery??[]).filter(Boolean)} title={projectTitle}/>
 return null
}
export function ProjectPage({project,onBack,editing,onEdit,onEditBlock,appearancePreview,showLikeCounts,headingSymbol}:{project:Project;onBack:()=>void;editing:boolean;onEdit:()=>void;onEditBlock?:(id:string)=>void;appearancePreview?:BlockAppearancePreview;showLikeCounts:boolean;headingSymbol?:HeadingSymbolStyle}){
 const hasDetailedArtwork=project.blocks.some(block=>['image','image-left','image-right','before-after','gallery','video','model','slideshow'].includes(block.type))
 const needsArtworkShowcase=!hasDetailedArtwork
 return <main data-alquimago-project={project.title} data-alquimago-category={project.category} data-alquimago-year={String(project.year??'')} data-alquimago-tools={project.tools?.join(', ')??''} className={'project-page'+(needsArtworkShowcase?' project-page-artwork-only':'')}><button className="back-link" onClick={onBack}><ArrowLeft size={18}/> Back to portfolio</button><div className="project-hero"><AssetImage src={project.image} alt={project.title} style={framingStyle(project.heroFocus)}/><div className="project-hero-content"><span className="eyebrow"><HeadingSymbol symbol={headingSymbol}/> {project.category} / {project.year}</span><h1>{project.title}</h1><RichText className="project-hero-description" value={project.description}/><div className="tools">{project.tools.map(t=><span key={t}>{t}</span>)}</div>{editing&&<button className="primary-action" onClick={onEdit}><Pencil size={16}/>Editar projeto</button>}</div></div><div className="project-engagement"><ProjectLike projectId={project.id} showCount={showLikeCounts}/></div><div className="case-study">
  {project.blocks.length>0&&<div className="story-blocks">{project.blocks.map(b=>{
   const node=<StoryBlock key={b.id} block={b} projectTitle={project.title} processSteps={project.processSteps}/>,a=editing&&appearancePreview?.id===b.id?appearancePreview.appearance:b.appearance
   if(!a&&!editing)return node
   return <div key={b.id} className={'studio-component'+(a?.surface==='panel'?' component-panel':a?.surface==='glass'?' component-glass':'')+(a?.border?' component-border':'')+(a?.hideMobile?' hide-mobile':'')+(a?.hideDesktop?' hide-desktop':'')+(editing?' component-editing':'')} data-studio-block={editing?b.id:undefined} data-align={a?.align??'center'} style={{'--jf-block-width':(a?.width??100)+'%','--jf-block-space':(a?.space??0)+'px','--jf-block-padding':a?.padding===undefined?undefined:a.padding+'px','--jf-block-corner':a?.corner===undefined?undefined:a.corner+'px','--jf-block-opacity':(a?.opacity??100)/100} as CSSProperties}>
    {editing&&onEditBlock&&<button type="button" className="studio-component-edit" aria-label="Editar este bloco" onClick={()=>onEditBlock(b.id)}><Pencil size={14}/></button>}{node}
   </div>
  })}</div>}
  {needsArtworkShowcase&&<section className="project-artwork-showcase" aria-label={'Artwork from '+project.title}>
   <div className="project-artwork-heading"><span><HeadingSymbol symbol={headingSymbol}/> FEATURED ARTWORK</span><h2>{project.title}</h2><p>{project.category}{project.year?' · '+project.year:''}</p></div>
   <figure className="project-artwork-frame"><ZoomableArt src={project.image} alt={'Full artwork: '+project.title} loading="lazy" sizes="(max-width: 800px) 100vw, 1000px"/></figure>

  </section>}
 </div>
  <button className="project-end" onClick={onBack}>Explore more projects <ArrowUpRight size={18}/></button></main>
}
