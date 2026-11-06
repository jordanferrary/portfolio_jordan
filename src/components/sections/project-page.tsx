import { useState } from 'react'
import { ArrowLeft,ArrowUpRight,Pencil,Sparkles,Star,Diamond,Circle } from 'lucide-react'
import type { Block,Project } from '../../data/projects'
import { AssetImage } from '../ui/asset-image'
import { RichText } from '../ui/rich-text'
import { ProjectLike } from './project-like'
function BeforeAfter({block,title}:{block:Block;title:string}){
 const [percent,setPercent]=useState(50)
 const [ratio,setRatio]=useState(1)
 return <div className="comparison-block"><div className="comparison-images" style={{aspectRatio:ratio}}><AssetImage src={block.media} alt={title+' antes'} onLoad={e=>{const image=e.currentTarget;if(image.naturalWidth&&image.naturalHeight)setRatio(Math.min(4,Math.max(.33,image.naturalWidth/image.naturalHeight)))}}/><div className="comparison-after" style={{clipPath:'inset(0 '+(100-percent)+'% 0 0)'}}><AssetImage src={block.after} alt={title+' depois'}/></div><span className="compare-label left">Before</span><span className="compare-label right">After</span><div className="compare-line" style={{left:percent+'%'}}><span>↔</span></div><input type="range" min="0" max="100" value={percent} onChange={e=>setPercent(Number(e.target.value))} aria-label="Comparar antes e depois"/></div>{block.content&&<RichText className="media-caption" value={block.content}/>}</div>
}
function StoryBlock({block,projectTitle}:{block:Block;projectTitle:string}){
 if(block.type==='heading')return <section className="story-block block-heading"><RichText heading value={block.content}/></section>
 if(block.type==='text')return <section className="story-block block-text"><RichText value={block.content}/></section>
 if(block.type==='image')return <section className="story-block block-image"><AssetImage src={block.content} alt={'Arte de '+projectTitle} loading="lazy"/></section>
 if(block.type==='image-left'||block.type==='image-right')return <section className={'story-block story-split '+block.type}><AssetImage src={block.media} alt={'Etapa de '+projectTitle} loading="lazy"/><RichText value={block.content}/></section>
 if(block.type==='before-after')return <section className="story-block"><BeforeAfter block={block} title={projectTitle}/></section>
 if(block.type==='divider'){const icons={sparkles:Sparkles,star:Star,diamond:Diamond,circle:Circle};const Icon=icons[block.dividerIcon as keyof typeof icons]??Sparkles;return <section className={'story-block art-divider art-divider-'+(block.dividerStyle??'glow')} role="separator" aria-label="Separador de seção"><span className="art-divider-line"/>{block.dividerIcon!=='none'&&<span className="art-divider-symbol"><Icon size={17}/></span>}<span className="art-divider-line"/></section>}
 if(block.type==='gallery')return <section className="story-block story-multi-images">{(block.gallery??[]).filter(Boolean).map((source,i)=><AssetImage key={source+i} src={source} alt={projectTitle+' — imagem '+(i+1)} loading="lazy"/>)}</section>
 return null
}
export function ProjectPage({project,onBack,editing,onEdit,showLikeCounts}:{project:Project;onBack:()=>void;editing:boolean;onEdit:()=>void;showLikeCounts:boolean}){
 return <main className="project-page"><button className="back-link" onClick={onBack}><ArrowLeft size={18}/> Back to portfolio</button><div className="project-hero"><AssetImage src={project.image} alt={project.title}/><div className="project-hero-content"><span className="eyebrow">✦ {project.category} / {project.year}</span><h1>{project.title}</h1><RichText className="project-hero-description" value={project.description}/><div className="tools">{project.tools.map(t=><span key={t}>{t}</span>)}</div>{editing&&<button className="primary-action" onClick={onEdit}><Pencil size={16}/>Editar projeto</button>}</div></div><div className="project-engagement"><ProjectLike projectId={project.id} showCount={showLikeCounts}/></div><div className="case-study"><div className="story-blocks">{project.blocks.map(b=><StoryBlock key={b.id} block={b} projectTitle={project.title}/>)}</div></div><button className="project-end" onClick={onBack}>Explore more projects <ArrowUpRight size={18}/></button></main>
}
