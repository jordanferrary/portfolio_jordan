import {useState} from 'react'
import {X,CloudDownload,CloudUpload,RefreshCw} from 'lucide-react'
import {getCloudDraft,uploadCloudDraft,downloadCloudDraft,type CloudDraft} from '../../lib/cloud-draft'
import {hasGitHubLogin} from '../../lib/github-auth'
export function StudioCloud({onBackup,onImport,onClose}:{onBackup:()=>Promise<Blob>;onImport:(file:File)=>Promise<void>;onClose:()=>void}){
 const [remote,setRemote]=useState<CloudDraft|null|undefined>(undefined)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await action()}catch(e){setMessage(e instanceof Error?e.message:'Operação não concluída.')}finally{setBusy(false)}}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label="Rascunho na nuvem">
  <header><h2>Rascunho na nuvem</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll"><p>Transfira o backup entre seus dispositivos por uma sessão verificada. Nada é publicado automaticamente. O backup permanece em um armazenamento privado e requer confirmação para substituir outra versão. Limite de 32 MB.</p>
   {!hasGitHubLogin()?<p>O Worker de autenticação não está configurado neste site. Use a transferência por ZIP até ativar o serviço.</p>:<>
    <button type="button" className="subtle-action" disabled={busy} onClick={()=>void run(async()=>{setRemote(await getCloudDraft())})}><RefreshCw size={16}/>Consultar versão remota</button>
    {remote===null&&<p>Nenhuma cópia remota existente.</p>}
    {remote&&<div className="studio-nav-row"><strong>Última cópia na nuvem</strong><small>{new Date(remote.updatedAt).toLocaleString('pt-BR')} | {(remote.bytes/1024/1024).toFixed(1)} MB</small></div>}
    <button type="button" className="save-action" disabled={busy||remote===undefined} onClick={()=>{if(window.confirm('Enviar uma cópia do rascunho atual'+(remote?' e substituir esta versão remota?':'?')))void run(async()=>{const blob=await onBackup();setRemote(await uploadCloudDraft(blob,remote?.revision??'none'));setMessage('Cópia enviada. Nenhuma alteração foi publicada.')})}}><CloudUpload size={16}/>Enviar rascunho</button>
    <button type="button" className="subtle-action" disabled={busy||!remote} onClick={()=>{if(remote&&window.confirm('Importar a cópia remota neste dispositivo?'))void run(async()=>{await onImport(await downloadCloudDraft(remote.revision));setMessage('Rascunho remoto importado.')})}}><CloudDownload size={16}/>Importar rascunho remoto</button>
   </>}{message&&<p role="status">{message}</p>}</div><footer><button type="button" disabled={busy} className="subtle-action" onClick={onClose}>Fechar</button></footer>
 </section></div>
}
