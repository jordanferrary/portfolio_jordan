import {useMemo,useState} from 'react'
import {ArrowDown,ArrowUp,Check,Plus,RefreshCw,Search,Trash2,X} from 'lucide-react'
import type {Project} from '../../data/projects'
import {AssetImage} from '../ui/asset-image'
import {framingStyle} from '../../lib/image-framing'
import {FEATURED_LIMIT,getFeaturedProjects} from '../../lib/featured-projects'

type Props={projects:Project[];onChange:(ids:string[])=>void}

/** Choose, replace, and order the Home slots without touching gallery priority. */
export function FeaturedProjectsEditor({projects,onChange}:Props){
 const selected=getFeaturedProjects(projects)
 const ids=selected.map(p=>p.id)
 const [search,setSearch]=useState('')
 const [replaceIndex,setReplaceIndex]=useState<number|null>(null)
 const candidates=useMemo(()=>projects.filter(p=>!ids.includes(p.id)&&
  (p.title+' '+p.category+' '+p.year+' '+p.tools.join(' ')).toLocaleLowerCase('pt-BR')
   .includes(search.toLocaleLowerCase('pt-BR').trim())),[projects,ids.join('|'),search])
 const commit=(next:string[])=>{onChange(next);setReplaceIndex(null)}
 const choose=(id:string)=>{
  if(replaceIndex!==null&&replaceIndex<ids.length)commit(ids.map((current,i)=>i===replaceIndex?id:current))
  else if(ids.length<FEATURED_LIMIT)commit([...ids,id])
 }
 const swap=(index:number,delta:number)=>{
  const target=index+delta
  if(target<0||target>=ids.length)return
  const next=[...ids]
  ;[next[index],next[target]]=[next[target],next[index]]
  commit(next)
 }
 return <section className="studio-featured-manager" aria-label="Gerenciar projetos em destaque">
  <div className="studio-featured-heading">
   <div><span className="studio-featured-kicker">VITRINE DA HOME</span><h3>Projetos em destaque</h3>
    <p>Escolha até três obras e defina a ordem de exibição. A galeria não muda.</p></div>
   <span className="studio-featured-count">{selected.length} / {FEATURED_LIMIT}</span>
  </div>
  <div className="studio-featured-slots">
   {Array.from({length:FEATURED_LIMIT},(_,index)=>{
    const project=selected[index]
    return <div key={index} className={'studio-featured-slot'+(replaceIndex===index?' is-replacing':'')}>
     {project?<><div className="studio-featured-thumbnail"><AssetImage src={project.image} alt="" style={framingStyle(project.homeFocus??project.coverFocus)}/></div>
      <div className="studio-featured-slot-info"><small>Destaque {index+1}</small><strong title={project.title}>{project.title}</strong><span>{project.category}</span></div>
      <div className="studio-featured-slot-actions">
       <button type="button" onClick={()=>swap(index,-1)} disabled={index===0} aria-label={'Mover '+project.title+' para cima'} title="Mover para cima"><ArrowUp size={15}/></button>
       <button type="button" onClick={()=>swap(index,1)} disabled={index===selected.length-1} aria-label={'Mover '+project.title+' para baixo'} title="Mover para baixo"><ArrowDown size={15}/></button>
       <button type="button" className={replaceIndex===index?'active':''} onClick={()=>setReplaceIndex(v=>v===index?null:index)} aria-label={'Substituir '+project.title} title="Substituir projeto"><RefreshCw size={15}/></button>
       <button type="button" onClick={()=>commit(ids.filter(id=>id!==project.id))} aria-label={'Remover '+project.title+' dos destaques'} title="Remover destaque"><Trash2 size={15}/></button>
      </div></>:<div className="studio-featured-empty"><Plus size={20}/><span>Espaço {index+1} disponível</span></div>}
    </div>
   })}
  </div>
  <div className="studio-featured-library">
   <div className="studio-featured-library-head">
    <div><strong>{replaceIndex===null?'Escolher projetos':'Escolha o substituto do destaque '+(replaceIndex+1)}</strong>
    <small>{replaceIndex===null?'Selecione uma obra disponível abaixo.':'O projeto atual só será substituído ao escolher outro.'}</small></div>
    {replaceIndex!==null&&<button type="button" onClick={()=>setReplaceIndex(null)} aria-label="Cancelar substituição"><X size={15}/>Cancelar</button>}
   </div>
   <label className="studio-featured-search"><Search size={16}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar projeto, categoria ou ferramenta…" aria-label="Buscar projetos para destacar"/></label>
   <div className="studio-featured-candidates">
    {candidates.map(project=><button type="button" key={project.id} className="studio-featured-candidate" disabled={ids.length>=FEATURED_LIMIT&&replaceIndex===null} onClick={()=>choose(project.id)}>
      <span className="studio-featured-candidate-thumb"><AssetImage src={project.image} alt="" style={framingStyle(project.homeFocus??project.coverFocus)}/></span>
      <span className="studio-featured-candidate-label"><strong>{project.title}</strong><small>{project.category} · {project.year}</small></span>
      {ids.length>=FEATURED_LIMIT&&replaceIndex===null?<span className="studio-featured-at-limit">3/3</span>:<Plus size={17} aria-hidden="true"/>}
     </button>)}
    {candidates.length===0&&<p className="studio-featured-none">Nenhum projeto disponível com essa busca.</p>}
   </div>
   <p className="studio-featured-tip"><Check size={14}/> As alterações são salvas como rascunho. Use <b>Publicar</b> no Studio para atualizar os visitantes.</p>
  </div>
 </section>
}
