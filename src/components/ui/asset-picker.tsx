import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from 'react'
import { Check,ImagePlus,Paperclip,Search,Upload,X } from 'lucide-react'
import type { Project,Category } from '../../data/projects'
import type { HomeContent,MusicTrack,AboutContent } from '../../data/studio'
import { AssetImage } from './asset-image'
import {QuickEditImageButton} from './image-quick-editor'
import { linkAssetToFolder,listMediaAssets,saveUploadedMedia,type LibraryAsset } from '../../lib/media-store'
type Sources={projects:Project[];categories:Category[];home:HomeContent;about:AboutContent;tracks:MusicTrack[]}
const LibraryContext=createContext<Sources|null>(null)
export function AssetLibraryProvider({projects,categories,home,about,tracks,children}:Sources&{children:ReactNode}){
 const value=useMemo(()=>({projects,categories,home,about,tracks}),[projects,categories,home,about,tracks])
 return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
interface AssetEntry {ref:string;name:string;folders:string[];date:number}
function collectSources(sources:Sources|null,catalog:LibraryAsset[]):AssetEntry[]{
 const map=new Map<string,AssetEntry>()
 const canonical=new Map<string,LibraryAsset>()
 const aliases=new Map<string,string>()
 const unique:LibraryAsset[]=[]
 // Identical legacy uploads stay referenced on disk, but appear once in the picker.
 for(const asset of catalog){
  if(!asset.hash){unique.push(asset);continue}
  const original=canonical.get(asset.hash)
  if(original){aliases.set(asset.ref,original.ref);original.folders=[...new Set([...original.folders,...asset.folders])]}
  else{const entry={...asset,folders:[...asset.folders]};canonical.set(asset.hash,entry);unique.push(entry)}
 }
 const add=(source:string,folder:string,name:string,date=0)=>{
  if(!source||!source.trim())return
  const ref=aliases.get(source)??source
  const prev=map.get(ref)
  if(prev){if(!prev.folders.includes(folder))prev.folders.push(folder);return}
  map.set(ref,{ref,name,folders:[folder],date})
 }
 for(const item of unique)if(item.mime?.startsWith('image/')||/\.(png|jpe?g|webp|avif)(?:[?#]|$)/i.test(item.ref))for(const folder of item.folders)add(item.ref,folder,item.name,item.createdAt)
 for(const project of sources?.projects??[]){
  const folder='projects/'+project.id
  add(project.image,folder,project.title+' · Capa')
  for(const block of project.blocks){
   if(block.type==='image')add(block.content,folder,'Arte de '+project.title)
   if(block.media)add(block.media,folder,project.title+' · Imagem')
   if(block.after)add(block.after,folder,project.title+' · Depois')
   for(const source of block.gallery??[])add(source,folder,project.title+' · Galeria')
  }
  for(const step of project.processSteps??[])add(step.image,folder,project.title+' · '+step.label)
 }
 for(const category of sources?.categories??[])if(category.image)add(category.image,'filter-icons','Filtro '+category.label)
 if(sources?.about){add(sources.about.portrait,'about','Imagem principal Sobre');add(sources.about.secondaryImage,'about','Imagem complementar Sobre')}
 if(sources?.home){
  add(sources.home.avatar,'home','Avatar')
  add(sources.home.background,'home','Arte de fundo')
 }
 for(const track of sources?.tracks??[])if(track.cover)add(track.cover,'music','Capa · '+track.title)
 return [...map.values()].sort((a,b)=>b.date-a.date||a.name.localeCompare(b.name,'pt-BR'))
}
function belongs(entry:AssetEntry,folder:string){return entry.folders.some(f=>f===folder||f.startsWith(folder+'/'))}
export function AssetPicker({folder,onSelect,onClose}:{folder:string;onSelect:(ref:string)=>void;onClose:()=>void}){
 const sources=useContext(LibraryContext)
 const [catalog,setCatalog]=useState<LibraryAsset[]>([])
 const [onlyCurrent,setOnlyCurrent]=useState(true)
 const [search,setSearch]=useState('')
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{
  let alive=true
  void listMediaAssets().then(data=>{if(alive){setCatalog(data);setLoading(false)}}).catch(()=>{if(alive){setLoading(false);setError('Não foi possível abrir a biblioteca de imagens.')}})
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
  window.addEventListener('keydown',escape)
  return ()=>{alive=false;window.removeEventListener('keydown',escape)}
 },[onClose])
 const entries=useMemo(()=>collectSources(sources,catalog),[sources,catalog])
 const currentCount=entries.filter(e=>belongs(e,folder)).length
 const visible=entries.filter(e=>(!onlyCurrent||belongs(e,folder))&&(!search||e.name.toLowerCase().includes(search.toLowerCase())||e.folders.some(f=>f.toLowerCase().includes(search.toLowerCase()))))
 const choose=(ref:string)=>{void linkAssetToFolder(ref,folder).catch(()=>{});onSelect(ref);onClose()}
 const upload=async(file:File)=>{
  setBusy(true);setError('')
  try{
   const ref=await saveUploadedMedia(file,folder,'library')
   const updated=await listMediaAssets()
   setCatalog(updated)
   choose(ref)
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível importar a imagem.')}finally{setBusy(false)}
 }
 return <div className="asset-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="asset-modal" role="dialog" aria-modal="true" aria-label="Biblioteca de imagens">
  <header className="asset-modal-head"><div><span className="eyebrow"><Paperclip size={15}/> ASSET LIBRARY</span><h2>Escolher imagem existente</h2><p>Reutilize um arquivo sem criar outra cópia.</p></div><button aria-label="Fechar biblioteca" onClick={onClose}><X size={20}/></button></header>
  <div className="asset-modal-tools"><div className="asset-filter-switch"><button className={onlyCurrent?'active':''} onClick={()=>setOnlyCurrent(true)}>Neste projeto <span>{currentCount}</span></button><button className={!onlyCurrent?'active':''} onClick={()=>setOnlyCurrent(false)}>Todas as imagens <span>{entries.length}</span></button></div><label className="asset-search"><Search size={16}/><input placeholder="Pesquisar imagens e pastas" aria-label="Pesquisar imagens" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Limpar pesquisa" onClick={()=>setSearch('')}><X size={15}/></button>}</label></div>
  <div className="asset-modal-scroll">
   {loading?<p className="asset-empty">Carregando imagens...</p>:visible.length?<div className="asset-pick-grid">{visible.map(entry=><div className="asset-pick-item" key={entry.ref}><button className="asset-pick-card" onClick={()=>choose(entry.ref)} title={entry.name}><AssetImage src={entry.ref} alt={entry.name}/><span className="asset-pick-name">{entry.name}</span>{belongs(entry,folder)&&<span className="asset-in-project"><Check size={12}/></span>}</button><QuickEditImageButton source={entry.ref} folder={folder} onSave={choose}/></div>)}</div>:<div className="asset-empty"><ImagePlus size={27}/><p>{onlyCurrent?'Ainda não há imagens neste projeto.':'Nenhuma imagem encontrada.'}</p>{onlyCurrent&&<button onClick={()=>setOnlyCurrent(false)}>Limpar filtro e ver todas</button>}</div>}
   {error&&<p role="alert" className="asset-error">{error}</p>}
  </div>
  <footer className="asset-modal-foot"><span>{visible.length} imagens · {onlyCurrent?'filtro deste projeto':'todas as pastas'}</span><label className="asset-import"><Upload size={16}/>{busy?'Importando...':'Importar nova'}<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label></footer>
 </section></div>
}
export function AssetClipButton({folder,onSelect}:{folder:string;onSelect:(ref:string)=>void}){
 const [open,setOpen]=useState(false)
 return <><button className="asset-clip-button" type="button" onClick={()=>setOpen(true)} title="Selecionar da biblioteca" aria-label="Abrir biblioteca de imagens"><Paperclip size={15}/>Biblioteca</button>{open&&<AssetPicker folder={folder} onSelect={onSelect} onClose={()=>setOpen(false)}/>}</>
}
