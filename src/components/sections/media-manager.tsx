import {useEffect,useMemo,useState} from 'react'
import {Database,ExternalLink,FolderOpen,Image as ImageIcon,Music,RefreshCw,Search,Trash2,X,Box,Film,CloudUpload} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {deleteStoredMedia,isLocalMedia,listMediaAssets,type LibraryAsset} from '../../lib/media-store'
import {getPublicRepositoryMedia,repositoryMediaPreviewUrl,type RepositoryMedia} from '../../lib/github-media'
import type {PortfolioStore} from '../../hooks/use-portfolio'

type Tab='published'|'local'
type View='all'|'unused'
type Props={
 store:PortfolioStore
 onClose:()=>void
 onOpenPublished:()=>void
 onPreparePublished:(paths:string[])=>void
}
function references(store:PortfolioStore):Set<string>{
 const refs=new Set<string>()
 const walk=(value:unknown):void=>{
  if(typeof value==='string'){if(isLocalMedia(value))refs.add(value);return}
  if(Array.isArray(value)){value.forEach(walk);return}
  if(value&&typeof value==='object')Object.values(value).forEach(walk)
 }
 walk(store)
 return refs
}
const folderName=(path:string)=>path.replace(/^public\//,'').split('/').slice(0,-1).join('/')
const fileName=(path:string)=>path.split('/').pop()??path
const fileSize=(bytes:number)=>bytes>=1048576?(bytes/1048576).toFixed(2)+' MB':Math.max(1,Math.round(bytes/1024))+' KB'
function MediaSymbol({kind}:{kind:RepositoryMedia['kind']}){
 if(kind==='Áudio')return <Music size={31}/>
 if(kind==='Vídeo')return <Film size={31}/>
 if(kind==='Modelo 3D')return <Box size={31}/>
 return <ImageIcon size={31}/>
}
export function MediaManager({store,onClose,onOpenPublished,onPreparePublished}:Props){
 const [tab,setTab]=useState<Tab>('published')
 const [localItems,setLocalItems]=useState<LibraryAsset[]>([])
 const [localLoading,setLocalLoading]=useState(true)
 const [localSelected,setLocalSelected]=useState<string[]>([])
 const [publishedItems,setPublishedItems]=useState<RepositoryMedia[]>([])
 const [publishedLoading,setPublishedLoading]=useState(false)
 const [publishedLoaded,setPublishedLoaded]=useState(false)
 const [publishedSelected,setPublishedSelected]=useState<string[]>([])
 const [view,setView]=useState<View>('all')
 const [folder,setFolder]=useState('all')
 const [search,setSearch]=useState('')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const used=useMemo(()=>references(store),[store])
 useEffect(()=>{
  let active=true
  void listMediaAssets().then(items=>{if(active){setLocalItems(items);setLocalLoading(false)}}).catch(()=>{if(active){setLocalLoading(false);setError('Não foi possível carregar os arquivos deste navegador.')}})
  return ()=>{active=false}
 },[])
 const scanPublished=async()=>{
  if(publishedLoading)return
  setPublishedLoading(true);setError('')
  try{
   const files=await getPublicRepositoryMedia(store)
   setPublishedItems(files)
   setPublishedLoaded(true)
   setPublishedSelected(current=>current.filter(path=>files.some(file=>file.path===path&&!file.used&&!file.protected)))
  }catch(e){setPublishedLoaded(false);setError(e instanceof Error?e.message:'Não foi possível consultar as pastas públicas.')}
  finally{setPublishedLoading(false)}
 }
 useEffect(()=>{void scanPublished()},[])
 const folders=useMemo(()=>{
  const paths=new Set<string>()
  for(const item of publishedItems){
   const parts=folderName(item.path).split('/')
   for(let i=1;i<=parts.length;i++)paths.add(parts.slice(0,i).join('/'))
  }
  return [...paths].sort((a,b)=>a.localeCompare(b,'pt-BR'))
 },[publishedItems])
 const filteredPublished=publishedItems.filter(item=>{
  if(view==='unused'&&(item.used||item.protected))return false
  if(folder!=='all'&&folderName(item.path)!==folder&&!folderName(item.path).startsWith(folder+'/'))return false
  return !search||item.path.toLowerCase().includes(search.toLowerCase())
 })
 const filteredLocal=localItems.filter(item=>{
  if(view==='unused'&&used.has(item.ref))return false
  return !search||(item.name+' '+item.folders.join(' ')).toLowerCase().includes(search.toLowerCase())
 })
 const localOrphans=localItems.filter(item=>!used.has(item.ref))
 const publishedOrphans=publishedItems.filter(item=>!item.used&&!item.protected)
 const toggleLocal=(ref:string,checked:boolean)=>setLocalSelected(current=>checked?[...current,ref]:current.filter(item=>item!==ref))
 const togglePublished=(path:string,checked:boolean)=>setPublishedSelected(current=>checked?[...current,path]:current.filter(item=>item!==path))
 const removeLocal=async()=>{
  const targets=localSelected.filter(ref=>!used.has(ref))
  if(!targets.length||busy)return
  if(!window.confirm('Excluir '+targets.length+' arquivo(s) órfãos deste navegador? Faça um backup ZIP se precisar recuperá-los.'))return
  setBusy(true);setError('')
  try{
   for(const ref of targets)await deleteStoredMedia(ref)
   setLocalItems(current=>current.filter(item=>!targets.includes(item.ref)))
   setLocalSelected([])
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível excluir os arquivos locais.')}
  finally{setBusy(false)}
 }
 const preparePublished=()=>{
  const targets=publishedSelected.filter(path=>publishedItems.some(item=>item.path===path&&!item.used&&!item.protected))
  if(!targets.length)return
  onPreparePublished(targets)
 }
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel local-media-manager" role="dialog" aria-modal="true" aria-label="Gerenciar arquivos de mídia">
  <header><div><span className="eyebrow">✦ LOCAL STUDIO · ARQUIVOS</span><h2>Biblioteca de arquivos</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll">
   <div className="media-manager-tabs" role="tablist" aria-label="Origem dos arquivos">
    <button type="button" role="tab" aria-selected={tab==='published'} onClick={()=>{setTab('published');setView('all');setSearch('')}}><FolderOpen size={16}/> Arquivos do GitHub <span>{publishedLoaded?publishedItems.length:'…'}</span></button>
    <button type="button" role="tab" aria-selected={tab==='local'} onClick={()=>{setTab('local');setView('all');setSearch('')}}><Database size={16}/> Arquivos locais <span>{localLoading?'…':localItems.length}</span></button>
   </div>
   <p className="editor-help">{tab==='published'?'Todas as imagens e outras mídias existentes nas subpastas públicas do GitHub aparecem aqui, mesmo que não estejam vinculadas ao site. É possível visualizá-las sem token; para excluir, selecione e autorize a publicação.':'Estes arquivos são armazenados somente neste navegador. Você pode apagar os que não estão vinculados ao rascunho sem alterar o GitHub.'}</p>
   <div className="local-media-stats">
    <span>{tab==='published'?publishedItems.length:localItems.length} arquivos</span>
    <span>{tab==='published'?publishedOrphans.length:localOrphans.length} sem uso identificado</span>
    <span>{tab==='published'?publishedSelected.length:localSelected.length} selecionados</span>
   </div>
   <div className="media-manager-filters">
    <div className="local-media-options"><button type="button" aria-pressed={view==='all'} onClick={()=>setView('all')}>Todos</button><button type="button" aria-pressed={view==='unused'} onClick={()=>setView('unused')}>Sem uso</button></div>
    {tab==='published'&&<select aria-label="Filtrar por pasta" value={folder} onChange={e=>setFolder(e.target.value)}><option value="all">Todas as pastas</option>{folders.map(path=><option key={path} value={path}>{path}</option>)}</select>}
    <label className="media-manager-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar arquivo ou pasta…" aria-label="Buscar arquivos"/></label>
    {tab==='published'&&<button type="button" className="media-manager-refresh" onClick={()=>void scanPublished()} disabled={publishedLoading} aria-label="Atualizar arquivos do GitHub"><RefreshCw size={16}/></button>}
   </div>
   {error&&<p className="editor-status" role="alert">{error}</p>}
   {tab==='published'?<>
    {publishedLoading&&!publishedLoaded&&<p className="editor-help">Consultando todas as subpastas públicas do repositório…</p>}
    {publishedLoaded&&<div className="media-repo-gallery">
     {filteredPublished.map(item=><article className={'media-repo-card'+(item.used||item.protected?' is-protected':'')} key={item.path}>
      <div className="media-repo-preview">
       {item.kind==='Imagem'?<a href={repositoryMediaPreviewUrl(item.path)} target="_blank" rel="noopener noreferrer" title={'Abrir imagem original: '+item.path}><img src={repositoryMediaPreviewUrl(item.path)} loading="lazy" decoding="async" alt={fileName(item.path)}/></a>:<div className="media-repo-icon"><MediaSymbol kind={item.kind}/>{item.kind==='Áudio'&&<audio controls preload="none" src={repositoryMediaPreviewUrl(item.path)} aria-label={'Ouvir '+fileName(item.path)}/>}</div>}
       <span className={'media-repo-status'+(item.used||item.protected?' in-use':'')}>{item.protected?'Protegido':item.used?'Em uso':'Sem uso'}</span>
      </div>
      <div className="media-repo-details"><strong title={item.path}>{fileName(item.path)}</strong><small title={item.path}>{folderName(item.path)}</small><div className="media-repo-meta"><span>{item.kind} · {fileSize(item.bytes)}</span><label><input type="checkbox" checked={publishedSelected.includes(item.path)} disabled={busy||item.used||item.protected} onChange={e=>togglePublished(item.path,e.target.checked)}/><span>Excluir</span></label></div></div>
     </article>)}
    </div>}
    {publishedLoaded&&filteredPublished.length===0&&<p className="editor-help">Nenhum arquivo corresponde aos filtros selecionados. Experimente “Todos” e “Todas as pastas”.</p>}
    <p className="editor-help">“Em uso” significa referenciado pelo conteúdo atual. “Protegido” identifica arquivos padrão essenciais. Imagens referenciadas só por CSS, links antigos ou arquivos fora do conteúdo podem não ser detectadas: confira cada seleção antes de excluir.</p>
   </>:<>
    {localLoading&&<p className="editor-help">Carregando arquivos locais…</p>}
    <div className="local-media-list">
     {filteredLocal.map(item=><label className={'local-media-row'+(used.has(item.ref)?' used':'')} key={item.ref}><input type="checkbox" checked={localSelected.includes(item.ref)} disabled={busy||used.has(item.ref)} onChange={e=>toggleLocal(item.ref,e.target.checked)}/><div className="local-media-icon">{item.mime?.startsWith('audio/')||/\.(mp3|wav|ogg|m4a)$/i.test(item.ref)?<Music size={19}/>:item.mime?.startsWith('image/')?<AssetImage src={item.ref} alt="" loading="lazy"/>:<ImageIcon size={19}/>}</div><div className="local-media-info"><strong>{item.name||fileName(item.ref)}</strong><small>{fileSize(item.size??0)} · {used.has(item.ref)?'Em uso':item.folders.join(', ')||'Não vinculado'}</small></div></label>)}
     {!localLoading&&filteredLocal.length===0&&<p className="editor-help">Nenhum arquivo local corresponde aos filtros.</p>}
    </div>
   </>}
  </div>
  <footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button>
   {tab==='local'?<button type="button" className="save-action" disabled={busy||localSelected.length===0} onClick={()=>void removeLocal()}><Trash2 size={16}/>{busy?'Excluindo…':'Excluir arquivos locais ('+localSelected.length+')'}</button>:<button type="button" className="save-action" disabled={!publishedSelected.length||publishedLoading} onClick={preparePublished}><CloudUpload size={16}/>Excluir no GitHub ({publishedSelected.length})</button>}
   {tab==='published'&&!publishedSelected.length&&<button type="button" className="subtle-action" onClick={onOpenPublished}><ExternalLink size={14}/>Publicação</button>}
  </footer>
 </section></div>
}
