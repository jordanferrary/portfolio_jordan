import '../../styles/github-publish.css'
import { useEffect,useState } from 'react'
import { AlertTriangle,CheckCircle2,CloudUpload,Download,ExternalLink,Eye,EyeOff,GitBranch,RotateCcw,ShieldCheck,X,FolderOpen,Trash2,Image as ImageIcon,Music as MusicIcon } from 'lucide-react'
import type { PortfolioStore } from '../../hooks/use-portfolio'
import { currentPublishedRevision } from '../../hooks/use-portfolio'
import { publishPortfolioToGitHub,type GitHubPublishResult } from '../../lib/github-publish'
import {getRepositoryMedia,type RepositoryMedia} from '../../lib/github-media'
import {alquimagoPublishTokenVault,githubTokenVault,type GitHubTokenStatus} from '../../lib/github-token-vault'

type Props={
 entryPoint?:'studio'|'alquimago'
 store:PortfolioStore
 onPublished:(revision:string)=>void
 onRestore:()=>void
 onExport:()=>Promise<void>
 onClose:()=>void
 stagedDeletionPaths?:string[]
}
export function GitHubPublishEditor({entryPoint='studio',store,onPublished,onRestore,onExport,onClose,stagedDeletionPaths=[]}:Props){
 const viaAlquimago=entryPoint==='alquimago'
 const vault=viaAlquimago?alquimagoPublishTokenVault:githubTokenVault
 const [token,setToken]=useState('')
 const [savedToken,setSavedToken]=useState('')
 const [vaultStatus,setVaultStatus]=useState<GitHubTokenStatus>({status:'missing',description:'Nenhum token salvo.'})
 const [vaultBusy,setVaultBusy]=useState(viaAlquimago)
 const [authError,setAuthError]=useState('')
 // Studio accepts ONLY the token pasted for this dialog; never load or reuse it.
 // Alquimago alone can reuse its separate AES-GCM protected credential.
 const credential=viaAlquimago?(vaultStatus.status==='ready'?savedToken:''):token.trim()
 const [visible,setVisible]=useState(false)
 const [confirmed,setConfirmed]=useState(false)
 const [busy,setBusy]=useState(false)
 const [status,setStatus]=useState('')
 const [error,setError]=useState('')
 const [result,setResult]=useState<GitHubPublishResult|null>(null)
 const [media,setMedia]=useState<RepositoryMedia[]|null>(null)
 const [mediaLoading,setMediaLoading]=useState(false)
 const [mediaError,setMediaError]=useState('')
 const [selectedPaths,setSelectedPaths]=useState<string[]>(()=>[...stagedDeletionPaths])
 const [mediaFilter,setMediaFilter]=useState<'unused'|'all'>('unused')
 const [confirmDeletion,setConfirmDeletion]=useState(false)
 useEffect(()=>{
  if(!viaAlquimago){setVaultBusy(false);return}
  let active=true
  const restore=async()=>{
   try{
    const saved=await vault.load()
    const check=saved?await vault.check(saved):
     {status:'missing' as const,description:'Nenhum token guardado neste dispositivo.'}
    if(!active)return
    setVaultStatus(check)
    setSavedToken(check.status==='ready'?saved||'':'')
   }catch{
    if(active)setVaultStatus({status:'unavailable',description:'Não foi possível abrir o cofre de publicação.'})
   }finally{if(active)setVaultBusy(false)}
  }
  void restore()
  return()=>{active=false}
 },[vault,viaAlquimago])
 const saveToken=async()=>{
  if(!viaAlquimago||!token.trim()||vaultBusy||busy)return
  setVaultBusy(true);setAuthError('')
  try{
   const check=await vault.check(token.trim())
   if(check.status!=='ready'){
    setVaultStatus(check);setAuthError(check.description)
    return
   }
   await vault.save(token.trim())
   setSavedToken(token.trim());setToken('')
   setVaultStatus({status:'ready',description:'Token validado e protegido no cofre deste navegador.'})
  }catch(e){
   setAuthError(e instanceof Error?e.message:'Não foi possível proteger o token.')
  }finally{setVaultBusy(false)}
 }
 const refreshSaved=async()=>{
  if(!viaAlquimago||vaultBusy||busy)return
  setVaultBusy(true)
  try{
   const saved=await vault.load()
   const check=saved?await vault.check(saved):
    {status:'missing' as const,description:'Nenhum token guardado neste dispositivo.'}
   setVaultStatus(check)
   setSavedToken(check.status==='ready'?saved||'':'')
  }catch{setSavedToken('');setVaultStatus({status:'unavailable',description:'Não foi possível abrir o cofre.'})}
  finally{setVaultBusy(false)}
 }
 const forgetSaved=async()=>{
  if(!viaAlquimago||vaultBusy||busy||!window.confirm('Descartar o token armazenado neste dispositivo? Isso não o revoga automaticamente no GitHub.'))return
  setVaultBusy(true)
  try{
   await vault.forget()
   setSavedToken('');setVaultStatus({status:'missing',description:'Token descartado deste navegador.'})
   setToken('')
  }catch(e){setAuthError(e instanceof Error?e.message:'Não foi possível descartar o token.')}
  finally{setVaultBusy(false)}
 }
 const scanMedia=async()=>{
  if(!credential||mediaLoading||busy)return
  setMediaLoading(true);setMediaError('');setConfirmDeletion(false)
  try{const files=await getRepositoryMedia(credential,store);setMedia(files);setSelectedPaths(current=>current.filter(path=>files.some(item=>item.path===path&&!item.used&&!item.protected)))}
  catch(e){setMedia(null);setMediaError(e instanceof Error?e.message:'Falha ao consultar as mídias.')}
  finally{setMediaLoading(false)}
 }
 const togglePath=(path:string,checked:boolean)=>setSelectedPaths(previous=>checked?[...previous,path]:previous.filter(p=>p!==path))
 const close=()=>{if(busy)return;setToken('');onClose()}
 const publish=async()=>{
  if(!credential||!confirmed||busy)return
  if(selectedPaths.length>0){
   if(!confirmDeletion){setError('Confirme que deseja excluir os arquivos selecionados.');return}
   if(!window.confirm('Remover definitivamente '+selectedPaths.length+' arquivo(s) do branch main na mesma publicação? Confira o backup e as referências antes de continuar.'))return
  }
  setBusy(true);setError('');setResult(null)
  try{
   // No publishing without a fresh check of the selected credential.
   const check=await vault.check(credential)
   if(viaAlquimago)setVaultStatus(check)
   if(check.status!=='ready'){
    if(viaAlquimago)setSavedToken('')
    throw new Error(check.status==='expired'?
     'O token expirou ou foi revogado. Informe uma autorização válida.':
     check.description)
   }
   // The live familiar's uncommitted state is included only on this explicit
   // publication. Reloading without publishing discards its draft changes.
   const familiar=document.querySelector('alquimago-familiar') as (HTMLElement&{snapshot?:()=>unknown})|null
   const familiarSnapshot=familiar?.snapshot?.()??null
   const finished=await publishPortfolioToGitHub(credential,store,currentPublishedRevision,setStatus,selectedPaths,familiarSnapshot)
   onPublished(finished.revision)
   setResult(finished)
   setStatus('As alterações estão no GitHub. A Cloudflare Pages publicará essa versão após a nova implantação concluir.')
  }catch(e){
   const msg=e instanceof Error?e.message:'Não foi possível publicar no GitHub.'
   if(viaAlquimago&&savedToken&&/Token inválido ou expirado/.test(msg)){
    setSavedToken('');setVaultStatus({status:'expired',description:'O pão mofou! O token não funciona mais. Você pode descartá-lo e guardar outro.'})
   }
   setError(msg)
  }
  finally{setToken('');setBusy(false)}
 }
 const restore=()=>{
  if(!window.confirm('Substituir seu rascunho local pela versão publicada que está carregada neste site? Salve um backup ZIP se quiser manter suas alterações.'))return
  onRestore();close()
 }
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
  <section className="editor-panel github-publish-editor" role="dialog" aria-modal="true" aria-label={viaAlquimago?'Publicar com o Cofre do Alquimago':'Publicar portfólio no GitHub'}>
   <header><div><span className="eyebrow"><GitBranch size={14}/> {viaAlquimago?'ALQUIMAGO · PUBLICAÇÃO':'GITHUB STUDIO'}</span><h2>{viaAlquimago?'Cofre do Alquimago':'Publicar portfólio'}</h2></div><button type="button" onClick={close} disabled={busy} aria-label="Fechar publicação"><X size={20}/></button></header>
   <div className="editor-scroll">
    <div className="github-publish-overview">
     <div className="github-publish-icon"><CloudUpload size={25}/></div>
     <div><strong>{viaAlquimago?'Autorização independente do familiar':'Publicação protegida pelo Local Studio'}</strong><p>{viaAlquimago?'O comando “vai comprar pão” abriu esta área protegida. O Alquimago nunca recebe o token pelo chat nem publica sozinho.':'Seus projetos e mídias são gravados no repositório somente após sua confirmação.'} A publicação só ocorre depois de sua autorização explícita.</p></div>
    </div>
    <div className="github-publish-stats">
     <span><b>{store.projects.length}</b><small>projetos</small></span>
     <span><b>{store.musicTracks.length}</b><small>músicas</small></span>
     <span><b>main</b><small>branch</small></span>
    </div>
    {result?<div className="github-publish-success" role="status">
     <CheckCircle2 size={28}/>
     <h3>Publicação enviada!</h3>
     <p>{status}</p>
     <small>{result.newFiles} arquivo(s) novo(s) · {result.deletedFiles} removido(s) · Commit {result.commitSha.slice(0,7)}</small>
     <a href={result.commitUrl} target="_blank" rel="noopener noreferrer">Ver alterações no GitHub <ExternalLink size={15}/></a>
     <a href="https://github.com/jordanferrary/portfolio_jordan/actions" target="_blank" rel="noopener noreferrer">Ver commit/Actions do GitHub <ExternalLink size={15}/></a>
    </div>:<>
     <div className="github-publish-section">
      <div className="github-publish-section-title"><ShieldCheck size={18}/><h3>Autorizar publicação</h3></div>
      <p className="editor-help">{viaAlquimago?'Cole e guarde um token criptografado apenas no Cofre do Alquimago. Cada publicação exige confirmação.':'Cole seu token do GitHub para esta publicação. Ele será usado apenas nesta janela e não será salvo nem reutilizado pelo Studio.'}</p>
      <div className="github-token-vault" aria-label={viaAlquimago?'Cofre de publicação do Alquimago':'Autorização temporária do Local Studio'}>
       <div className="github-token-vault-heading"><ShieldCheck size={17}/><strong>{viaAlquimago?'Cofre de publicação do Alquimago':'Token temporário · publicação única'}</strong></div>
       {viaAlquimago&&<p role="status" className="editor-help github-token-vault-status">{vaultBusy?'Verificando o cofre...':vaultStatus.description}</p>}
       {viaAlquimago&&vaultStatus.status==='ready'&&<p className="editor-help">Token criptografado do Alquimago disponível neste navegador. O robô não lê a credencial nem pode confirmar a publicação sozinho.</p>}
       {viaAlquimago&&vaultStatus.status==='expired'&&<p className="editor-help">A autorização expirou ou foi revogada. Cole uma nova credencial válida.</p>}
       <label className="github-publish-token-label">Token GitHub de publicação
        <div className="github-publish-token-control">
         <input value={token} type={visible?'text':'password'} autoComplete="off" autoCapitalize="off" spellCheck={false} onChange={e=>setToken(e.target.value)} placeholder={viaAlquimago&&vaultStatus.status==='ready'?'Cole aqui somente para substituir o token salvo':viaAlquimago?'Cole seu token uma vez aqui':'Cole o token para esta publicação'} disabled={busy||(viaAlquimago&&vaultBusy)} aria-label={viaAlquimago?'Token de publicação do Alquimago':'Token temporário do Local Studio'}/>
         <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar token':'Mostrar token'} disabled={busy}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button>
        </div>
       </label>
       {viaAlquimago&&<div className="github-token-vault-actions">
        <button type="button" className="github-token-vault-button" onClick={()=>void saveToken()} disabled={busy||vaultBusy||!token.trim()}><ShieldCheck size={15}/>{vaultStatus.status==='ready'?'Substituir token salvo':'Guardar token criptografado'}</button>
        <button type="button" className="github-token-vault-button" onClick={()=>void refreshSaved()} disabled={busy||vaultBusy}>Verificar validade</button>
        <button type="button" className="github-token-vault-button" onClick={()=>void forgetSaved()} disabled={busy||vaultBusy||vaultStatus.status==='missing'}><Trash2 size={15}/>Descartar token</button>
       </div>}
       {authError&&<p role="alert" className="github-publish-error">{authError}</p>}
       <p className="editor-help github-token-vault-note">{viaAlquimago?'O token fica criptografado com AES-256-GCM no cofre exclusivo do Alquimago. Nunca o envie no chat. A frase de acesso é um atalho, não uma senha. Scripts do mesmo domínio ainda podem acessar credenciais locais.':'O Studio não armazena nem recupera este token. O campo é limpo ao publicar ou fechar o painel. Confirme cada publicação manualmente.'}</p>
      </div>
      <details className="github-token-help">
       <summary>Como criar o token de publicação</summary>
       <p>Use um fine-grained personal access token da conta proprietária, restrito ao repositório jordanferrary/portfolio_jordan, com permissão Contents: Read and write e uma validade definida.</p>
       <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Criar token restrito no GitHub <ExternalLink size={14}/></a>
      </details>
     </div>
     <section className="github-media-cleanup" aria-label="Gerenciar arquivos publicados">
      <div className="github-media-cleanup-head"><div><h3><FolderOpen size={17}/> Gerenciar arquivos publicados</h3><p>Confira imagens, capas, áudios e também vídeos ou modelos 3D existentes nas pastas públicas. Exclua somente arquivos sem referência conhecida.</p></div><button type="button" onClick={()=>void scanMedia()} disabled={busy||mediaLoading||!credential}><FolderOpen size={15}/>{mediaLoading?'Analisando...':media?'Atualizar lista':'Analisar arquivos do GitHub'}</button></div>
      {mediaError&&<p className="github-publish-error" role="alert">{mediaError}</p>}
      {media&&<><div className="github-media-summary"><span>{media.length} arquivo(s) encontrado(s)</span><span>{media.filter(item=>!item.used&&!item.protected).length} candidato(s) à remoção</span><span>{selectedPaths.length} selecionado(s)</span></div><div className="github-media-filters"><button type="button" aria-pressed={mediaFilter==='unused'} onClick={()=>setMediaFilter('unused')}>Sem uso identificado</button><button type="button" aria-pressed={mediaFilter==='all'} onClick={()=>setMediaFilter('all')}>Todos os arquivos</button></div>
       <div className="github-media-list">{media.filter(item=>mediaFilter==='all'||(!item.used&&!item.protected)).map(item=><label className={'github-media-row'+(item.used||item.protected?' is-protected':'')} key={item.path}><input type="checkbox" disabled={item.used||item.protected||busy} checked={selectedPaths.includes(item.path)} onChange={e=>togglePath(item.path,e.target.checked)}/><span className="github-media-file-icon">{item.kind==='Imagem'?<ImageIcon size={19}/>:item.kind==='Áudio'?<MusicIcon size={19}/>:<FolderOpen size={19}/>}</span><span className="github-media-file-info"><strong title={item.path}>{item.path.replace(/^public\//,'')}</strong><small>{item.kind} · {(item.bytes/1048576).toFixed(2)} MB · {item.protected?'Protegido (arquivo padrão)':item.used?'Em uso pelo portfólio':'Sem referência identificada'}</small></span></label>)}
       {media.length===0&&<p className="editor-help">Nenhuma mídia foi encontrada nas pastas públicas monitoradas.</p>}</div>
       <p className="editor-help">A análise verifica referências do rascunho atual e arquivos essenciais. Arquivos usados exclusivamente por CSS, URLs externas, versões antigas ou documentos podem não ser detectados. Faça backup e confira a lista antes de excluir.</p>
      </>}
      {selectedPaths.length>0&&<div className="github-media-queued">
       <p><Trash2 size={16}/> {selectedPaths.length} arquivo(s) selecionado(s) para remoção nesta publicação.</p>
       <details><summary>Conferir caminhos antes de excluir</summary><ul>{selectedPaths.map(path=><li key={path}>{path}</li>)}</ul></details>
       <label className="github-media-confirm"><input type="checkbox" checked={confirmDeletion} onChange={e=>setConfirmDeletion(e.target.checked)}/><span>Entendo que os arquivos selecionados serão excluídos do branch principal ao publicar.</span></label>
      </div>}
     </section>

     <label className="github-publish-confirm">
      <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/>
      <span>Revisei o conteúdo e autorizo a publicação pública dos projetos, imagens e áudios selecionados.</span>
     </label>
     {busy&&<div className="github-publish-progress" role="status"><span className="github-publish-progress-indicator"/>{status}</div>}
     {error&&<div className="github-publish-error" role="alert"><AlertTriangle size={17}/><span>{error}</span></div>}
    </>}
    <div className="github-publish-secondary">
     <button type="button" onClick={()=>void onExport()} disabled={busy}><Download size={15}/>Fazer backup ZIP</button>
     <button type="button" onClick={restore} disabled={busy}><RotateCcw size={15}/>Restaurar versão publicada</button>
    </div>
    <p className="github-publish-footnote">Revise os textos destinados aos visitantes em inglês antes de publicar. Rascunhos antigos podem conter conteúdo em português. As alterações feitas no Local Studio continuam locais até a publicação. Mensagens privadas e curtidas compartilhadas exigem uma API separada.</p>
   </div>
   <footer><button type="button" className="subtle-action" onClick={close} disabled={busy}>{result?'Fechar':'Cancelar'}</button>
    {!result&&<button type="button" className="save-action" onClick={()=>void publish()} disabled={busy||(viaAlquimago&&vaultBusy)||!credential||!confirmed}><CloudUpload size={17}/>{busy?'Publicando...':'Confirmar publicação'}</button>}
   </footer>
  </section>
 </div>
}
