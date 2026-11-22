import {useState} from 'react'
import {X,Undo2,Redo2,RefreshCw} from 'lucide-react'
import type {StudioIssue} from '../../lib/studio-health'
type Entry={time:number;label:string}
const labels:Record<string,string>={projects:'Projetos',categories:'Categorias',customPages:'Páginas personalizadas',home:'Home',about:'Sobre',contact:'Contato',themePalette:'Paleta',typography:'Tipografia',studioControls:'Controles globais',nativeLayouts:'Composição nativa',homeModuleOrder:'Módulos da Home',musicTracks:'Músicas',socialLinks:'Redes sociais',testimonials:'Depoimentos',seoTitle:'Título do site',seoDescription:'Descrição do site',siteLogo:'Logo',imageVariants:'Variantes de imagem',glitchPalette:'Transição'}
const historyLabel=(value:string)=>value.split(', ').map(key=>labels[key]??key).join(' / ')
export function StudioMaintenance({tab,onClose,past,future,onUndo,onRedo,onAudit,historyStorage}:{tab:'history'|'health';onClose:()=>void;past:Entry[];future:Entry[];onUndo:()=>void;onRedo:()=>void;onAudit:()=>Promise<StudioIssue[]>;historyStorage?:'loading'|'local'|'session'}){
 const [issues,setIssues]=useState<StudioIssue[]|null>(null)
 const [busy,setBusy]=useState(false)
 const [failure,setFailure]=useState('')
 const run=async()=>{setBusy(true);setFailure('');try{setIssues(await onAudit())}catch{setFailure('Não foi possível concluir a verificação.')}finally{setBusy(false)}}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label={tab==='history'?'Histórico local':'Diagnóstico'}>
  <header><h2>{tab==='history'?'Histórico local':'Diagnóstico do Studio'}</h2><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll">{tab==='history'?<>
   <p>Até 30 alterações do manifesto. O histórico recente pode sobreviver ao recarregamento neste navegador, quando o rascunho corresponde à versão salva. Não restaura mídias apagadas; use checkpoints para isso.</p>
   <p role="status">{historyStorage==='local'?'Histórico local persistente disponível.':historyStorage==='loading'?'Verificando histórico local…':'Histórico desta sessão. A persistência não está disponível.'}</p>
   <div className="studio-nav-actions"><button type="button" disabled={!past.length} onClick={onUndo}><Undo2 size={16}/>Desfazer ({past.length})</button><button type="button" disabled={!future.length} onClick={onRedo}><Redo2 size={16}/>Refazer ({future.length})</button></div>
   {[...past].reverse().map((entry,i)=><div className="studio-nav-row" key={i}><strong>{historyLabel(entry.label)}</strong><small>{new Date(entry.time).toLocaleString('pt-BR')}</small></div>)}
   {!past.length&&<p>Nenhuma alteração disponível para desfazer.</p>}
  </>:<>
   <p>Verificação local de identificadores, capas, categorias, contraste e referências de mídia. Não executa testes de navegador nem verifica links externos.</p>
   <button type="button" className="save-action" disabled={busy} onClick={()=>void run()}><RefreshCw size={16}/>{busy?'Verificando…':'Executar diagnóstico'}</button>
   {failure&&<p role="alert">{failure}</p>}
   {issues&&<div role="status"><h3>{issues.length?issues.length+' ocorrência(s)':'Nenhuma ocorrência nos controles verificados.'}</h3>{issues.map((issue,i)=><p key={i}><strong>{issue.level==='error'?'Erro':'Atenção'}: </strong>{issue.message}</p>)}</div>}
  </>}</div><footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button></footer>
 </section></div>
}
