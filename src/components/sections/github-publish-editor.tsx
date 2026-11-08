import { useEffect,useState } from 'react'
import { AlertTriangle,CheckCircle2,CloudUpload,Download,ExternalLink,Eye,EyeOff,GitBranch,RotateCcw,ShieldCheck,X,FolderOpen,Trash2,Image as ImageIcon,Music as MusicIcon } from 'lucide-react'
import type { PortfolioStore } from '../../hooks/use-portfolio'
import { currentPublishedRevision } from '../../hooks/use-portfolio'
import { publishPortfolioToGitHub,type GitHubPublishResult } from '../../lib/github-publish'
import {getRepositoryMedia,type RepositoryMedia} from '../../lib/github-media'
import {GITHUB_WORKER_SESSION,beginGitHubLogin,disconnectGitHubSession,hasGitHubLogin,isAuthCompletion,readGitHubSession,type GitHubSession} from '../../lib/github-auth'
import {githubTokenVault,type GitHubTokenStatus} from '../../lib/github-token-vault'

type Props={
 store:PortfolioStore
 onPublished:(revision:string)=>void
 onRestore:()=>void
 onExport:()=>Promise<void>
 onClose:()=>void
 stagedDeletionPaths?:string[]
}
export function GitHubPublishEditor({store,onPublished,onRestore,onExport,onClose,stagedDeletionPaths=[]}:Props){
 const [token,setToken]=useState('')
 const [savedToken,setSavedToken]=useState('')
 const [vaultStatus,setVaultStatus]=useState<GitHubTokenStatus>({status:'missing',description:'Nenhum token salvo.'})
 const [vaultBusy,setVaultBusy]=useState(true)
 const [session,setSession]=useState<GitHubSession>({authenticated:false})
 const [checkingSession,setCheckingSession]=useState(hasGitHubLogin())
 const [authError,setAuthError]=useState('')
 const configured=hasGitHubLogin()
 const credential=session.authenticated?GITHUB_WORKER_SESSION:(token.trim()||(vaultStatus.status==='ready'?savedToken:''))
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
  if(!configured)return
  let active=true
  const refresh=async()=>{
   const status=await readGitHubSession()
   if(!active)return
   setSession(status);setCheckingSession(false)
   if(status.authenticated)setAuthError('')
  }
  const onAuth=(event:MessageEvent)=>{if(isAuthCompletion(event))void refresh()}
  window.addEventListener('message',onAuth)
  void refresh()
  return()=>{active=false;window.removeEventListener('message',onAuth)}
 },[configured])
 useEffect(()=>{
  let active=true
  const restore=async()=>{
   try{
    const saved=await githubTokenVault.load()
    const check=saved?await githubTokenVault.check(saved):
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
 },[])
 const saveToken=async()=>{
  if(!token.trim()||vaultBusy||busy)return
  setVaultBusy(true);setAuthError('')
  try{
   const check=await githubTokenVault.check(token.trim())
   if(check.status!=='ready'){
    setVaultStatus(check);setAuthError(check.description)
    return
   }
   await githubTokenVault.save(token.trim())
   setSavedToken(token.trim());setToken('')
   setVaultStatus({status:'ready',description:'Token validado e protegido no cofre deste navegador.'})
  }catch(e){
   setAuthError(e instanceof Error?e.message:'Não foi possível proteger o token.')
  }finally{setVaultBusy(false)}
 }
 const refreshSaved=async()=>{
  if(vaultBusy||busy)return
  setVaultBusy(true)
  try{
   const saved=await githubTokenVault.load()
   const check=saved?await githubTokenVault.check(saved):
    {status:'missing' as const,description:'Nenhum token guardado neste dispositivo.'}
   setVaultStatus(check)
   setSavedToken(check.status==='ready'?saved||'':'')
  }catch{setSavedToken('');setVaultStatus({status:'unavailable',description:'Não foi possível abrir o cofre.'})}
  finally{setVaultBusy(false)}
 }
 const forgetSaved=async()=>{
  if(vaultBusy||busy||!window.confirm('Descartar o token armazenado neste dispositivo? Isso não o revoga automaticamente no GitHub.'))return
  setVaultBusy(true)
  try{
   await githubTokenVault.forget()
   setSavedToken('');setVaultStatus({status:'missing',description:'Token descartado deste navegador.'})
   setToken('')
  }catch(e){setAuthError(e instanceof Error?e.message:'Não foi possível descartar o token.')}
  finally{setVaultBusy(false)}
 }
 const connect=()=>{
  setAuthError('')
  if(!beginGitHubLogin())setAuthError('A integração segura ainda não está configurada.')
 }
 const disconnect=async()=>{
  try{await disconnectGitHubSession();setSession({authenticated:false})}
  catch(e){setAuthError(e instanceof Error?e.message:'Falha ao desconectar.')}
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
   if(!session.authenticated&&savedToken&&!token.trim()){
    const check=await githubTokenVault.check(savedToken)
    setVaultStatus(check)
    if(check.status!=='ready'){
     setSavedToken('')
     throw new Error(check.status==='expired'?
      'O pão mofou! Este token expirou ou foi revogado. Posso descartá-lo quando você confirmar.':
      check.description)
    }
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
   if(!session.authenticated&&savedToken&&/Token inválido ou expirado/.test(msg)){
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
  <section className="editor-panel github-publish-editor" role="dialog" aria-modal="true" aria-label="Publicar portfólio no GitHub">
   <header><div><span className="eyebrow"><GitBranch size={14}/> GITHUB STUDIO</span><h2>Publicar portfólio</h2></div><button type="button" onClick={close} disabled={busy} aria-label="Fechar publicação"><X size={20}/></button></header>
   <div className="editor-scroll">
    <div className="github-publish-overview">
     <div className="github-publish-icon"><CloudUpload size={25}/></div>
     <div><strong>{configured?'Publicação com autenticação protegida':'Publicação pelo GitHub'}</strong><p>Seus projetos e mídias são gravados no repositório somente após sua confirmação. A Cloudflare Pages gera a versão pública automaticamente ao detectar o commit.</p></div>
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
      <div className="github-publish-section-title"><ShieldCheck size={18}/><h3>Autorizar a publicação</h3></div>
      {configured?<div className="github-publish-auth">
       {session.authenticated?<><p><ShieldCheck size={16}/> Conectado com segurança como <strong>{session.login}</strong>. Não precisa digitar um token.</p>
        <button type="button" onClick={()=>void disconnect()} disabled={busy}>Desconectar GitHub</button></>:
        <><p>Entre com sua conta GitHub uma única vez. A sessão fica protegida no serviço de autenticação.</p>
        <button type="button" onClick={connect} disabled={busy||checkingSession}><ShieldCheck size={16}/>{checkingSession?'Verificando sessão...':'Conectar com GitHub'}</button>
        <button type="button" onClick={()=>void readGitHubSession().then(setSession)} disabled={busy}>Verificar conexão</button></>}
       {authError&&<p role="alert" className="github-publish-error">{authError}</p>}
       <p className="editor-help">Se a conexão não persistir, configure o serviço no mesmo domínio do site. A publicação continua exigindo sua confirmação.</p>
      </div>:<p>Login sem token ainda não foi ativado neste site. O responsável precisa configurar o serviço GitHub App conforme o guia do repositório. O método temporário abaixo continua disponível.</p>}
      <details className="github-token-help">
       <summary>{configured?'Método alternativo: token temporário':'Como gerar um token temporário'}</summary>
       <p>Este método funciona sem o serviço de autenticação. Crie um <b>fine-grained personal access token</b> do GitHub, restrito ao repositório <code>jordanferrary/portfolio_jordan</code>, com permissão <b>Contents: Read and write</b> e prazo de validade curto.</p>
       <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Criar token restrito no GitHub <ExternalLink size={14}/></a>
      </details>
      
     </div>
     {!session.authenticated&&<div className="github-token-vault" aria-label="Cofre de publicação GitHub" style={{margin:'12px 0',padding:'12px',border:'1px solid var(--jf-border, #785c94)',borderRadius:12}}>
       <p><ShieldCheck size={16}/> <strong>Cofre do Alquimago</strong></p>
       <p className="editor-help">{vaultBusy?'Verificando o cofre...':vaultStatus.description}</p>
       {vaultStatus.status==='ready'&&<p className="editor-help">Já tenho o dinheiro guardado! Posso reutilizar a autorização, mas cada publicação continua exigindo sua confirmação.</p>}
       {vaultStatus.status==='expired'&&<p role="status" className="editor-help">O pão mofou... posso jogar fora? Descarte a autorização antiga e informe outra.</p>}
       {vaultStatus.status==='forbidden'&&<p role="status" className="editor-help">O token está sem permissão suficiente. Você pode descartá-lo e autorizar outro.</p>}
       <div className="actions" style={{display:'flex',flexWrap:'wrap',gap:8}}>
        <button type="button" className="action" onClick={()=>void saveToken()} disabled={busy||vaultBusy||!token.trim()}><ShieldCheck size={15}/>Guardar token criptografado</button>
        <button type="button" className="action" onClick={()=>void refreshSaved()} disabled={busy||vaultBusy}>Verificar validade</button>
        <button type="button" className="action" onClick={()=>void forgetSaved()} disabled={busy||vaultBusy||vaultStatus.status==='missing'}><Trash2 size={15}/>Descartar token</button>
       </div>
       {authError&&<p role="alert" className="github-publish-error">{authError}</p>}
       <p className="editor-help">Opcional: o token fica criptografado neste navegador com AES-256-GCM. Não o envie no chat. Scripts deste mesmo site ainda podem acessar a autorização; prefira a conexão GitHub App quando configurada.</p>
      </div>}
      {!session.authenticated&&<label className="github-publish-token-label">{configured?'Alternativa: token temporário':'Token temporário do GitHub'}
      <div className="github-publish-token-control">
       <input value={token} type={visible?'text':'password'} autoComplete="off" autoCapitalize="off" spellCheck={false} onChange={e=>setToken(e.target.value)} placeholder="Cole o token somente aqui" disabled={busy} aria-label="Token temporário de publicação GitHub"/>
       <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar token':'Mostrar token'} disabled={busy}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button>
      </div>
     </label>}
     <p className="github-publish-security"><ShieldCheck size={14}/> {session.authenticated?'A autorização fica no serviço seguro; nenhum token GitHub chega ao navegador.':'O token digitado não é salvo automaticamente. Somente o botão Guardar token criptografado permite reutilizá-lo neste dispositivo.'}</p>
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
    {!result&&<button type="button" className="save-action" onClick={()=>void publish()} disabled={busy||vaultBusy||!credential||!confirmed}><CloudUpload size={17}/>{busy?'Publicando...':session.authenticated?'Confirmar publicação':'Publicar no GitHub'}</button>}
   </footer>
  </section>
 </div>
}
