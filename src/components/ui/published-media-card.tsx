import {useState} from 'react'
import {Box,ExternalLink,FileImage,Film,ImageOff,Music2} from 'lucide-react'
import {repositoryMediaPreviewUrl,type RepositoryMedia} from '../../lib/github-media'

type Props={item:RepositoryMedia;selected:boolean;disabled:boolean;onToggle:(path:string,value:boolean)=>void}
const fmt=(n:number)=>n>=1048576?(n/1048576).toFixed(2)+' MB':n>=1024?Math.round(n/1024)+' KB':n+' B'
export function PublishedMediaCard({item,selected,disabled,onToggle}:Props){
 const [broken,setBroken]=useState(false)
 const url=repositoryMediaPreviewUrl(item.path)
 const filename=item.path.split('/').pop()||item.path
 const folder=item.path.replace(/^public\//,'').split('/').slice(0,-1).join('/')
 const locked=item.used||item.protected
 const icon=item.kind==='Áudio'?<Music2 size={32}/>:item.kind==='Vídeo'?<Film size={32}/>:item.kind==='Modelo 3D'?<Box size={32}/>:<FileImage size={32}/>
 return <article className={'github-media-card'+(selected?' is-selected':'')}>
  <div className="github-media-card-preview">
   {item.kind==='Imagem'&&url&&!broken?
    <a href={url} className="github-media-card-image" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={'Abrir imagem '+filename} title="Abrir imagem original">
     <img src={url} alt={'Prévia de '+filename} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setBroken(true)}/>
     <ExternalLink className="github-media-preview-link" size={16}/>
    </a>:
    <div className="github-media-card-symbol">{broken?<ImageOff size={32}/>:icon}<span>{broken?'Prévia indisponível':item.kind}</span>
     {url&&<a href={url} target="_blank" rel="noopener noreferrer">Abrir arquivo</a>}
    </div>}
   <label className="github-media-select" title={locked?'Arquivo em uso ou protegido':'Selecionar para exclusão'}>
    <input type="checkbox" checked={selected} disabled={locked||disabled} onChange={e=>onToggle(item.path,e.target.checked)} aria-label={'Excluir '+filename}/>
   </label>
   <span className="github-media-usage">{item.protected?'Protegido':item.used?'Em uso':'Sem uso identificado'}</span>
  </div>
  <div className="github-media-card-details">
   <strong>{item.kind} · {fmt(item.bytes)}</strong>
   <small title={folder}>{folder||'Arquivos publicados'}</small>
   <details><summary>Nome e caminho técnico</summary><code>{item.path.replace(/^public\//,'')}</code></details>
  </div>
 </article>
}
