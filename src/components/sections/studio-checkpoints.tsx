import {useEffect,useState} from 'react'
import {X,Clock,Trash2,RotateCcw,Save} from 'lucide-react'
import {listCheckpoints,removeCheckpoint,type CheckpointInfo} from '../../lib/studio-checkpoints'
export function StudioCheckpoints({onCreate,onRestore,onClose}:{onCreate:()=>Promise<unknown>;onRestore:(id:string)=>Promise<void>;onClose:()=>void}){
 const [list,setList]=useState<CheckpointInfo[]>([])
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 useEffect(()=>{let active=true;void listCheckpoints().then(items=>{if(active)setList(items)},()=>{if(active)setMessage('Armazenamento local indisponível.')});return()=>{active=false}},[])
 const run=async(action:()=>Promise<unknown>,success:string)=>{setBusy(true);setMessage('');try{await action();setList(await listCheckpoints());setMessage(success)}catch(e){setMessage(e instanceof Error?e.message:'Operação não concluída.')}finally{setBusy(false)}}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label="Pontos de recuperação">
  <header><h2>Pontos de recuperação</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll"><p>Até cinco cópias locais de rascunho e mídias referenciadas, de até 100 MB cada. Elas sobrevivem ao recarregamento, mas não à limpeza dos dados do navegador. URLs externas não são arquivadas. Para guardar uma cópia fora deste dispositivo, use o backup ZIP.</p>
   <button type="button" disabled={busy} className="save-action" onClick={()=>void run(onCreate,'Checkpoint criado.')}><Save size={16}/>Criar checkpoint</button>
   {list.map(item=><div className="studio-nav-row" key={item.id}><strong><Clock size={16}/> {item.label}</strong><small>{new Date(item.time).toLocaleString('pt-BR')} • {(item.bytes/1024/1024).toFixed(1)} MB</small><div className="studio-nav-actions"><button type="button" disabled={busy} onClick={()=>{if(window.confirm('Restaurar este rascunho? O site publicado não será alterado.'))void run(()=>onRestore(item.id),'Rascunho restaurado.')}}><RotateCcw size={16}/>Restaurar</button><button type="button" disabled={busy} onClick={()=>{if(window.confirm('Excluir somente este ponto de recuperação?'))void run(()=>removeCheckpoint(item.id),'Checkpoint excluído.')}}><Trash2 size={16}/>Excluir</button></div></div>)}
   {!list.length&&<p>Nenhum checkpoint disponível.</p>}{message&&<p role="status">{message}</p>}
  </div><footer><button type="button" className="subtle-action" disabled={busy} onClick={onClose}>Fechar</button></footer>
 </section></div>
}
