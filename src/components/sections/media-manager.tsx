import {useEffect,useMemo,useState} from 'react'
import {Database,Image as ImageIcon,Music,Trash2,X} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {deleteStoredMedia,isLocalMedia,listMediaAssets,type LibraryAsset} from '../../lib/media-store'
import type {PortfolioStore} from '../../hooks/use-portfolio'

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
export function MediaManager({store,onClose,onOpenPublished}:{store:PortfolioStore;onClose:()=>void;onOpenPublished:()=>void}){
 const [items,setItems]=useState<LibraryAsset[]>([])
 const [loading,setLoading]=useState(true)
 const [selected,setSelected]=useState<string[]>([])
 const [showAll,setShowAll]=useState(false)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const used=useMemo(()=>references(store),[store])
 useEffect(()=>{let active=true;void listMediaAssets().then(list=>{if(active){setItems(list);setLoading(false)}}).catch(()=>{if(active){setLoading(false);setError('Não foi possível abrir a biblioteca local.')}});return()=>{active=false}},[])
 const visible=items.filter(item=>showAll||!used.has(item.ref))
 const orphan=items.filter(item=>!used.has(item.ref))
 const remove=async()=>{
  const candidates=selected.filter(ref=>!used.has(ref))
  if(!candidates.length||busy)return
  if(!window.confirm('Excluir '+candidates.length+' arquivo(s) não utilizados do armazenamento deste navegador? Esta ação não pode ser desfeita sem um backup.'))return
  setBusy(true);setError('')
  try{
   for(const ref of candidates)await deleteStoredMedia(ref)
   setItems(previous=>previous.filter(item=>!candidates.includes(item.ref)))
   setSelected([])
  }catch(e){setError(e instanceof Error?e.message:'Falha ao excluir mídia.')}
  finally{setBusy(false)}
 }
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel local-media-manager" role="dialog" aria-modal="true" aria-label="Gerenciar arquivos de mídia">
  <header><div><span className="eyebrow">✦ LOCAL STUDIO · ARQUIVOS</span><h2>Biblioteca de arquivos</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll">
   <p className="editor-help">Os arquivos desta lista estão salvos neste navegador (IndexedDB). Apagar um arquivo aqui não o remove do GitHub nem de outros dispositivos. Arquivos ainda vinculados ao portfólio são protegidos contra seleção.</p>
   <div className="local-media-stats"><span><Database size={16}/>{items.length} locais</span><span>{orphan.length} sem uso</span><span>{selected.length} selecionados</span></div>
   <div className="local-media-options"><button type="button" aria-pressed={!showAll} onClick={()=>setShowAll(false)}>Sem uso</button><button type="button" aria-pressed={showAll} onClick={()=>setShowAll(true)}>Todos</button></div>
   <div className="local-media-list">
    {visible.map(item=><label className={'local-media-row'+(used.has(item.ref)?' used':'')} key={item.ref}><input type="checkbox" checked={selected.includes(item.ref)} disabled={busy||used.has(item.ref)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,item.ref]:prev.filter(value=>value!==item.ref))}/><div className="local-media-icon">{item.mime?.startsWith('audio/')||/\.(mp3|wav|ogg|m4a)$/i.test(item.ref)?<Music size={19}/>:item.mime?.startsWith('image/')?<AssetImage src={item.ref} alt="" loading="lazy"/>:<ImageIcon size={19}/>}</div><div className="local-media-info"><strong>{item.name||item.ref.split('/').pop()}</strong><small>{(item.size??0)/1048576>0?((item.size??0)/1048576).toFixed(2)+' MB · ':''}{used.has(item.ref)?'Em uso':item.folders.join(', ')||'Arquivo não vinculado'}</small></div></label>)}
    {!loading&&visible.length===0&&<p className="editor-help">Não há arquivos nesta categoria.</p>}
    {loading&&<p className="editor-help">Carregando a biblioteca…</p>}
   </div>
   {error&&<p className="editor-status" role="alert">{error}</p>}
   <div className="local-media-published"><h3>Arquivos que já estão no GitHub</h3><p>Imagens de `public/images/`, áudios publicados e outros arquivos não podem ser removidos apenas por esta lista. Abra a publicação e escolha <strong>Gerenciar arquivos publicados</strong> para analisar e excluir com seu token.</p><button type="button" onClick={()=>{onClose();onOpenPublished()}}>Abrir arquivos publicados</button></div>
  </div>
  <footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button><button type="button" className="save-action" disabled={busy||selected.length===0} onClick={()=>void remove()}><Trash2 size={16}/>{busy?'Excluindo…':'Excluir arquivos locais'}</button></footer>
 </section></div>
}
