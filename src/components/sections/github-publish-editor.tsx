import { useState } from 'react'
import { AlertTriangle,CheckCircle2,CloudUpload,Download,ExternalLink,Eye,EyeOff,GitBranch,RotateCcw,ShieldCheck,X,FolderOpen,Trash2,Image as ImageIcon,Music as MusicIcon } from 'lucide-react'
import type { PortfolioStore } from '../../hooks/use-portfolio'
import { currentPublishedRevision } from '../../hooks/use-portfolio'
import { publishPortfolioToGitHub,type GitHubPublishResult } from '../../lib/github-publish'
import {getRepositoryMedia,type RepositoryMedia} from '../../lib/github-media'

type Props={
 store:PortfolioStore
 onPublished:(revision:string)=>void
 onRestore:()=>void
 onExport:()=>Promise<void>
 onClose:()=>void
}
export function GitHubPublishEditor({store,onPublished,onRestore,onExport,onClose}:Props){
 const [token,setToken]=useState('')
 const [visible,setVisible]=useState(false)
 const [confirmed,setConfirmed]=useState(false)
 const [busy,setBusy]=useState(false)
 const [status,setStatus]=useState('')
 const [error,setError]=useState('')
 const [result,setResult]=useState<GitHubPublishResult|null>(null)
 const [media,setMedia]=useState<RepositoryMedia[]|null>(null)
 const [mediaLoading,setMediaLoading]=useState(false)
 const [mediaError,setMediaError]=useState('')
 const [selectedPaths,setSelectedPaths]=useState<string[]>([])
 const [mediaFilter,setMediaFilter]=useState<'unused'|'all'>('unused')
 const [confirmDeletion,setConfirmDeletion]=useState(false)
 const scanMedia=async()=>{
  if(!token.trim()||mediaLoading||busy)return
  setMediaLoading(true);setMediaError('');setSelectedPaths([]);setConfirmDeletion(false)
  try{setMedia(await getRepositoryMedia(token,store))}
  catch(e){setMedia(null);setMediaError(e instanceof Error?e.message:'Falha ao consultar as mídias.')}
  finally{setMediaLoading(false)}
 }
 const togglePath=(path:string,checked:boolean)=>setSelectedPaths(previous=>checked?[...previous,path]:previous.filter(p=>p!==path))
 const close=()=>{if(busy)return;setToken('');onClose()}
 const publish=async()=>{
  if(!token.trim()||!confirmed||busy)return
  if(selectedPaths.length>0){
   if(!confirmDeletion){setError('Confirme que deseja excluir os arquivos selecionados.');return}
   if(!window.confirm('Remover definitivamente '+selectedPaths.length+' arquivo(s) do branch main na mesma publicação? Confira o backup e as referências antes de continuar.'))return
  }
  setBusy(true);setError('');setResult(null)
  try{
   const finished=await publishPortfolioToGitHub(token,store,currentPublishedRevision,setStatus,selectedPaths)
   onPublished(finished.revision)
   setResult(finished)
   setStatus('As alterações estão no GitHub. O GitHub Pages publicará essa versão após o workflow concluir.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível publicar no GitHub.')}
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
     <div><strong>Publicação sem servidor adicional</strong><p>Seus projetos e mídias serão gravados no repositório. A automação do GitHub Pages gera o site atualizado.</p></div>
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
     <a href="https://github.com/jordanferrary/portfolio_jordan/actions" target="_blank" rel="noopener noreferrer">Acompanhar publicação do site <ExternalLink size={15}/></a>
    </div>:<>
     <div className="github-publish-section">
      <div className="github-publish-section-title"><ShieldCheck size={18}/><h3>Autorizar somente esta publicação</h3></div>
      <p>Crie um <b>fine-grained personal access token</b> do GitHub, restrito ao repositório <code>jordanferrary/portfolio_jordan</code>, com permissão <b>Contents: Read and write</b> e prazo de validade curto.</p>
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Criar token restrito no GitHub <ExternalLink size={14}/></a>
      <details className="github-token-help">
       <summary>Como gerar o token? Ver passo a passo</summary>
       <ol>
        <li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Gerar novo token no GitHub <ExternalLink size={12}/></a> e entre na sua conta <strong>jordanferrary</strong>.</li>
        <li>Informe um nome como <strong>Portfolio Studio</strong> e escolha uma <strong>validade curta</strong>.</li>
        <li>Em <strong>Resource owner</strong>, selecione sua conta. Em <strong>Repository access</strong>, escolha <strong>Only select repositories</strong> e marque <code>portfolio_jordan</code>.</li>
        <li>Em <strong>Repository permissions → Contents</strong>, selecione <strong>Read and write</strong>. Deixe os demais acessos no mínimo necessário.</li>
        <li>Clique em <strong>Generate token</strong>, copie o valor imediatamente e cole no campo abaixo. Depois, revise a confirmação e publique.</li>
       </ol>
       <p>Já gerou antes e perdeu o valor? O GitHub não permite visualizar novamente um token criado. Abra <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer">Gerenciar meus tokens <ExternalLink size={12}/></a> para revogar o antigo se não for necessário e criar outro.</p>
       <p>O token autoriza a publicação mesmo sem acesso ao PIN se alguém o obtiver. Não o envie por chat nem o coloque no código ou em capturas de tela.</p>
       <a href="https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noopener noreferrer">Documentação oficial do GitHub <ExternalLink size={12}/></a>
      </details>
     </div>
     <label className="github-publish-token-label">Token temporário do GitHub
      <div className="github-publish-token-control">
       <input value={token} type={visible?'text':'password'} autoComplete="off" autoCapitalize="off" spellCheck={false} onChange={e=>setToken(e.target.value)} placeholder="Cole o token somente aqui" disabled={busy} aria-label="Token temporário de publicação GitHub"/>
       <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar token':'Mostrar token'} disabled={busy}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button>
      </div>
     </label>
     <p className="github-publish-security"><ShieldCheck size={14}/> A credencial fica apenas na memória desta página durante a publicação. Não é adicionada ao código, ao ZIP ou ao armazenamento do navegador.</p>
     <section className="github-media-cleanup" aria-label="Gerenciar arquivos publicados">
      <div className="github-media-cleanup-head"><div><h3><FolderOpen size={17}/> Gerenciar arquivos publicados</h3><p>Confira imagens, capas, áudios e também vídeos ou modelos 3D existentes nas pastas públicas. Exclua somente arquivos sem referência conhecida.</p></div><button type="button" onClick={()=>void scanMedia()} disabled={busy||mediaLoading||!token.trim()}><FolderOpen size={15}/>{mediaLoading?'Analisando...':media?'Atualizar lista':'Analisar arquivos do GitHub'}</button></div>
      {mediaError&&<p className="github-publish-error" role="alert">{mediaError}</p>}
      {media&&<><div className="github-media-summary"><span>{media.length} arquivo(s) encontrado(s)</span><span>{media.filter(item=>!item.used&&!item.protected).length} candidato(s) à remoção</span><span>{selectedPaths.length} selecionado(s)</span></div><div className="github-media-filters"><button type="button" aria-pressed={mediaFilter==='unused'} onClick={()=>setMediaFilter('unused')}>Sem uso identificado</button><button type="button" aria-pressed={mediaFilter==='all'} onClick={()=>setMediaFilter('all')}>Todos os arquivos</button></div>
       <div className="github-media-list">{media.filter(item=>mediaFilter==='all'||(!item.used&&!item.protected)).map(item=><label className={'github-media-row'+(item.used||item.protected?' is-protected':'')} key={item.path}><input type="checkbox" disabled={item.used||item.protected||busy} checked={selectedPaths.includes(item.path)} onChange={e=>togglePath(item.path,e.target.checked)}/><span className="github-media-file-icon">{item.kind==='Imagem'?<ImageIcon size={19}/>:item.kind==='Áudio'?<MusicIcon size={19}/>:<FolderOpen size={19}/>}</span><span className="github-media-file-info"><strong title={item.path}>{item.path.replace(/^public\//,'')}</strong><small>{item.kind} · {(item.bytes/1048576).toFixed(2)} MB · {item.protected?'Protegido (arquivo padrão)':item.used?'Em uso pelo portfólio':'Sem referência identificada'}</small></span></label>)}
       {media.length===0&&<p className="editor-help">Nenhuma mídia foi encontrada nas pastas públicas monitoradas.</p>}</div>
       <p className="editor-help">A análise verifica referências do rascunho atual e arquivos essenciais. Arquivos usados exclusivamente por CSS, URLs externas, versões antigas ou documentos podem não ser detectados. Faça backup e confira a lista antes de excluir.</p>
       {selectedPaths.length>0&&<label className="github-media-confirm"><input type="checkbox" checked={confirmDeletion} onChange={e=>setConfirmDeletion(e.target.checked)}/><span><Trash2 size={15}/> Entendo que {selectedPaths.length} arquivo(s) serão removidos do GitHub quando eu clicar em Publicar.</span></label>}
      </>}
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
    {!result&&<button type="button" className="save-action" onClick={()=>void publish()} disabled={busy||!token.trim()||!confirmed}><CloudUpload size={17}/>{busy?'Publicando...':'Publicar no GitHub'}</button>}
   </footer>
  </section>
 </div>
}
