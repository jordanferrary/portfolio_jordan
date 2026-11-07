import { lazy,Suspense,useState } from 'react'
import { ArrowLeft,ArrowUpRight,Pencil,Sparkles,Star,Diamond,Circle,ScanSearch } from 'lucide-react'
import type { Block,Project } from '../../data/projects'
import { AssetImage } from '../ui/asset-image'
import { ZoomableArt } from '../ui/zoomable-art'
const ArtLightbox=lazy(()=>import('../ui/art-lightbox').then(m=>({default:m.ArtLightbox})))
import { RichText } from '../ui/rich-text'
import { ProjectVideo } from '../ui/project-video'
import { ProjectModel } from '../ui/project-model'
import { ArtistShowcase,PageSlideshow } from './page-media-blocks'
import { ProjectLike } from './project-like'
import { framingStyle } from '../../lib/image-framing'
function BeforeAfter({block,title}:{block:Block;title:string}){
 const [percent,setPercent]=useState(50)
 const [expanded,setExpanded]=useState<'before'|'after'|null>(null)
 const [ratio,setRatio]=useState(1)
 return <div className="comparison-block"><div className="comparison-images" style={{aspectRatio:ratio}}><AssetImage src={block.media} alt={title+' before'} onLoad={e=>{const image=e.currentTarget;if(image.naturalWidth&&image.naturalHeight)setRatio(Math.min(4,Math.max(.33,image.naturalWidth/image.naturalHeight)))}}/><div className="comparison-after" style={{clipPath:'inset(0 '+(100-percent)+'% 0 0)'}}><AssetImage src={block.after} alt={title+' after'}/></div><span className="compare-label left">{block.beforeLabel??'Before'}</span><span className="compare-label right">{block.afterLabel??'After'}</span><div className="compare-line" style={{left:percent+'%'}}><span>↔</span></div><input type="range" min="0" max="100" value={percent} onChange={e=>setPercent(Number(e.target.value))} aria-label="Compare before and after"/></div><div className="comparison-zoom-actions"><button type="button" onClick={()=>setExpanded('before')}><ScanSearch size={13}/>Inspect {block.beforeLabel??'Before'}</button><button type="button" onClick={()=>setExpanded('after')}><ScanSearch size={13}/>Inspect {block.afterLabel??'After'}</button></div>{block.content&&<RichText className="media-caption" value={block.content}/>} {expanded&&<Suspense fallback={null}><ArtLightbox src={expanded==='before'?(block.media??''):(block.after??'')} alt={title+' '+expanded} onClose={()=>setExpanded(null)}/></Suspense>}</div>
}
export function StoryBlock({block,projectTitle}:{block:Block;projectTitle:string}){
 if(block.type==='heading')return <section className="story-block block-heading"><RichText heading value={block.content}/></section>
 if(block.type==='text')return <section className="story-block block-text"><RichText value={block.content}/></section>
 if(block.type==='image')return <section className="story-block block-image"><ZoomableArt src={block.content} alt={'Artwork from '+projectTitle} loading="lazy" sizes="(max-width: 800px) 100vw, 900px"/></section>
 if(block.type==='image-left'||block.type==='image-right')return <section className={'story-block story-split '+block.type}><ZoomableArt src={block.media} alt={'Creative stage of '+projectTitle} loading="lazy" sizes="(max-width: 800px) 100vw, 500px"/><RichText value={block.content}/></section>
 if(block.type==='before-after')return <section className="story-block"><BeforeAfter block={block} title={projectTitle}/></section>
 if(block.type==='model')return <section className="story-block block-model"><ProjectModel url={block.content} poster={block.media} title={projectTitle+' 3D model'}/></section>
 if(block.type==='video')return <section className="story-block block-video"><ProjectVideo url={block.content} poster={block.media} title={block.videoTitle?.trim()||projectTitle}/></section>
 if(block.type==='divider'){const icons={sparkles:Sparkles,star:Star,diamond:Diamond,circle:Circle};const Icon=icons[block.dividerIcon as keyof typeof icons]??Sparkles;return <section className={'story-block art-divider art-divider-'+(block.dividerStyle??'glow')} role="separator" aria-label="Section divider"><span className="art-divider-line"/>{block.dividerIcon!=='none'&&<span className="art-divider-symbol"><Icon size={17}/></span>}<span className="art-divider-line"/></section>}
 if(block.type==='gallery'&&block.galleryMode==='artists')return <section className="story-block story-linked-gallery"><ArtistShowcase block={{...block,type:'showcase',showcaseFit:'contain',showcaseItems:(block.galleryEntries??[]).map(item=>({id:item.id,image:item.image,name:item.title||item.artist,description:[item.artist,item.description].filter(Boolean).join(' · '),portfolioUrl:item.portfolioUrl,linkLabel:'View portfolio',showLink:Boolean(item.portfolioUrl)}))}}/></section>
 if(block.type==='slideshow')return <section className="story-block story-project-slideshow"><PageSlideshow block={{...block,type:'slideshow',slideItems:(block.slides??[]).map(item=>({id:item.id,image:item.image,caption:item.caption||item.title})),slideTransition:block.slideEffect==='none'?'none':(block.slideEffect??'fade'),slideInterval:block.slideInterval,slideHeight:block.slideHeight,slideShowPauseButton:block.slideShowPauseButton,slideAutoplay:block.slideAutoplay}}/></section>
 if(block.type==='gallery')return <section className="story-block story-multi-images">{(block.gallery??[]).filter(Boolean).map((source,i)=><ZoomableArt key={source+i} src={source} alt={projectTitle+' — image '+(i+1)} loading="lazy" sizes="(max-width: 800px) 100vw, 500px"/>)}</section>
 return null
}
export function ProjectPage({project,onBack,editing,onEdit,showLikeCounts}:{project:Project;onBack:()=>void;editing:boolean;onEdit:()=>void;showLikeCounts:boolean}){
 const hasDetailedArtwork=project.blocks.some(block=>['image','image-left','image-right','before-after','gallery','video','model','slideshow'].includes(block.type))
 const processImages=(project.processSteps??[]).filter(step=>step.image.trim().length>0)
 const needsArtworkShowcase=!hasDetailedArtwork
 return <main data-alquimago-project={project.title} data-alquimago-category={project.category} data-alquimago-year={String(project.year??'')} data-alquimago-tools={project.tools?.join(', ')??''} className={'project-page'+(needsArtworkShowcase?' project-page-artwork-only':'')}><button className="back-link" onClick={onBack}><ArrowLeft size={18}/> Back to portfolio</button><div className="project-hero"><AssetImage src={project.image} alt={project.title} style={framingStyle(project.heroFocus)}/><div className="project-hero-content"><span className="eyebrow">✦ {project.category} / {project.year}</span><h1>{project.title}</h1><RichText className="project-hero-description" value={project.description}/><div className="tools">{project.tools.map(t=><span key={t}>{t}</span>)}</div>{editing&&<button className="primary-action" onClick={onEdit}><Pencil size={16}/>Editar projeto</button>}</div></div><div className="project-engagement"><ProjectLike projectId={project.id} showCount={showLikeCounts}/></div><div className="case-study">
  {project.blocks.length>0&&<div className="story-blocks">{project.blocks.map(b=><StoryBlock key={b.id} block={b} projectTitle={project.title}/>)}</div>}
  {needsArtworkShowcase&&<section className="project-artwork-showcase" aria-label={'Artwork from '+project.title}>
   <div className="project-artwork-heading"><span>✦ FEATURED ARTWORK</span><h2>{project.title}</h2><p>{project.category}{project.year?' · '+project.year:''}</p></div>
   <figure className="project-artwork-frame"><ZoomableArt src={project.image} alt={'Full artwork: '+project.title} loading="lazy" sizes="(max-width: 800px) 100vw, 1000px"/></figure>
   {processImages.length>0&&<div className="project-artwork-process"><div className="project-artwork-process-heading"><h3>Creative process</h3><p>Images shared with this project</p></div><div className="project-artwork-process-grid">{processImages.map(step=><figure key={step.id}><ZoomableArt src={step.image} alt={step.label||project.title} loading="lazy" sizes="(max-width: 800px) 100vw, 450px"/><figcaption>{step.label}</figcaption></figure>)}</div></div>}
  </section>}
 </div><button className="project-end" onClick={onBack}>Explore more projects <ArrowUpRight size={18}/></button></main>
}
