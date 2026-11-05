import { useState } from 'react'
import { ArrowLeft,ArrowUpRight,Layers3,Pencil } from 'lucide-react'
import type { Block,Project } from '../../data/projects'
import { AssetImage } from '../ui/asset-image'
function BeforeAfter({block,title}:{block:Block;title:string}){
 const [percent,setPercent]=useState(50)
 return <div className="comparison-block"><div className="comparison-images"><AssetImage src={block.media} alt={title+' antes'}/><div className="comparison-after" style={{clipPath:'inset(0 '+(100-percent)+'% 0 0)'}}><AssetImage src={block.after} alt={title+' depois'}/></div><span className="compare-label left">Before</span><span className="compare-label right">After</span><div className="compare-line" style={{left:percent+'%'}}><span>↔</span></div><input type="range" min="0" max="100" value={percent} onChange={e=>setPercent(Number(e.target.value))} aria-label="Comparar antes e depois"/></div>{block.content&&<p className="media-caption">{block.content}</p>}</div>
}
function StoryBlock({block,projectTitle}:{block:Block;projectTitle:string}){
 if(block.type==='heading')return <section className="story-block block-heading"><h2>{block.content}</h2></section>
 if(block.type==='text')return <section className="story-block block-text"><p>{block.content}</p></section>
 if(block.type==='image')return <section className="story-block block-image"><AssetImage src={block.content} alt={'Arte de '+projectTitle} loading="lazy"/></section>
 if(block.type==='image-left'||block.type==='image-right')return <section className={'story-block story-split '+block.type}><AssetImage src={block.media} alt={'Etapa de '+projectTitle} loading="lazy"/><p>{block.content}</p></section>
 if(block.type==='before-after')return <section className="story-block"><BeforeAfter block={block} title={projectTitle}/></section>
 if(block.type==='gallery')return <section className="story-block story-multi-images">{(block.gallery??[]).filter(Boolean).map((source,i)=><AssetImage key={source+i} src={source} alt={projectTitle+' — imagem '+(i+1)} loading="lazy"/>)}</section>
 return null
}
export function ProjectPage({project,onBack,editing,onEdit}:{project:Project;onBack:()=>void;editing:boolean;onEdit:()=>void}){
 return <main className="project-page"><button className="back-link" onClick={onBack}><ArrowLeft size={18}/> Back to portfolio</button><div className="project-hero"><AssetImage src={project.image} alt={project.title}/><div className="project-hero-content"><span className="eyebrow">✦ {project.category} / {project.year}</span><h1>{project.title}</h1><p>{project.description}</p><div className="tools">{project.tools.map(t=><span key={t}>{t}</span>)}</div>{editing&&<button className="primary-action" onClick={onEdit}><Pencil size={16}/>Editar projeto</button>}</div></div><div className="case-study"><div className="case-meta"><Layers3 size={24}/><span>PROJECT BREAKDOWN</span><p>Every detail tells a story.</p></div><div className="story-blocks">{project.blocks.map(b=><StoryBlock key={b.id} block={b} projectTitle={project.title}/>)}</div></div><button className="project-end" onClick={onBack}>Explore more projects <ArrowUpRight size={18}/></button></main>
}
