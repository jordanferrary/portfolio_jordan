import {Component,type ErrorInfo,type ReactNode} from 'react'
import {isChunkLoadError,tryAutoRecoverChunk} from '../../lib/chunk-recovery'

type Props={children:ReactNode;compact?:boolean;editorOverlay?:boolean}
type State={error:Error|null}

/** Keep a React exception from unmounting the entire portfolio to a blank page. */
export class AppErrorBoundary extends Component<Props,State>{
 state:State={error:null}

 static getDerivedStateFromError(error:Error):State{
  return {error}
 }

 componentDidCatch(error:Error,info:ErrorInfo){
  // Vite's event may already have scheduled one refresh; both paths share a guard.
  if(tryAutoRecoverChunk(error))return
  console.error('[Portfolio] A page failed to render:',error,info.componentStack)
 }

 render(){
  if(!this.state.error)return this.props.children
  const lang=typeof document!=='undefined'?document.documentElement.lang:'en'
  const pt=lang.toLowerCase().startsWith('pt')
  const es=lang.toLowerCase().startsWith('es')
  const stale=isChunkLoadError(this.state.error)
  const title=pt?'Não foi possível abrir esta página':es?'No se pudo abrir esta página':'This page could not be opened'
  const explanation=stale
   ?(pt?'O site pode ter sido atualizado enquanto esta aba estava aberta. Seu conteúdo publicado continua disponível.':es?'Es posible que el sitio se haya actualizado mientras esta pestaña estaba abierta.':'The site may have updated while this tab was open.')
   :(pt?'Ocorreu um erro inesperado ao exibir o conteúdo.':es?'Ocurrió un error inesperado al mostrar el contenido.':'An unexpected error interrupted the page.')
  const refresh=pt?'Atualizar o site':es?'Actualizar el sitio':'Reload site'
  const overlay=Boolean(this.props.editorOverlay)
  // Studio editors mount after the page body. Without a fixed error panel, a
  // failed lazy import appears below the viewport and the button seems inert.
  return <main role="alert" style={{
   position:overlay?'fixed':undefined,inset:overlay?0:undefined,zIndex:overlay?120:undefined,
   minHeight:overlay?'100dvh':this.props.compact?'280px':'100svh',display:'grid',placeItems:'center',padding:24,
   background:'var(--jf-background,#0b0712)',color:'var(--jf-text,#f5ebff)',
   fontFamily:'DM Sans,system-ui,sans-serif'
  }}>
   <section style={{maxWidth:480,width:'100%',textAlign:'center',padding:32,
    border:'1px solid var(--jf-border,#6a467d)',borderRadius:24,
    background:'var(--jf-surface,#21142e)'}}>
    <h1 style={{fontSize:'clamp(21px,4vw,28px)',margin:'0 0 12px'}}>{title}</h1>
    <p style={{fontSize:14,lineHeight:1.6,opacity:.84,margin:'0 0 24px'}}>{explanation}</p>
    {overlay&&stale&&<p style={{fontSize:12,lineHeight:1.55,margin:'0 0 20px'}}>{pt?'O código do Studio foi atualizado durante esta sessão. Seus rascunhos salvos no navegador permanecem disponíveis, mas alterações ainda não salvas em campos podem se perder ao atualizar.':es?'El código del Studio cambió durante esta sesión. Guarda los cambios que puedas antes de actualizar.':'Studio changed during this session. Saved browser drafts remain, but unsaved form changes may be lost when refreshing.'}</p>}
    <button type="button" onClick={()=>window.location.reload()} style={{
     border:'1px solid var(--jf-secondary,#ae6be3)',background:'var(--jf-primary,#7736a9)',
     color:'#fff',borderRadius:999,padding:'12px 22px',font:'inherit',
     fontWeight:700,cursor:'pointer'
    }}>{refresh}</button>
   </section>
  </main>
 }
}
