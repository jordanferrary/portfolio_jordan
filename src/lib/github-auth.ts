/**
 * GitHub App publishing session.
 *
 * No GitHub tokens, app secrets, refresh tokens or session keys are available
 * to this React application. The optional Worker owns that authorization.
 * A literal marker only chooses the authenticated Worker route; it is NOT a
 * credential. The backend must reject requests without a valid session.
 */
export const GITHUB_WORKER_SESSION='__ALQUIMAGO_AUTHENTICATED_WORKER_V1__' as const

export type GitHubSession={
 authenticated:boolean
 login?:string
 repository?:string
 expiresAt?:number
}

function configuredOrigin():string|null{
 const raw=String(import.meta.env.VITE_ALQUIMAGO_AUTH_ORIGIN||'').trim()
 if(!raw)return null
 try{
  const target=new URL(raw)
  if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/')return null
  return target.origin
 }catch{return null}
}

export function hasGitHubLogin():boolean{return configuredOrigin()!==null}
export function isGitHubWorkerCredential(value:string):boolean{return value===GITHUB_WORKER_SESSION}
export function githubWorkerProxy(path:string):string{
 const origin=configuredOrigin()
 if(!origin)throw new Error('A autenticação GitHub App ainda não foi configurada para este site.')
 if(!path.startsWith('/')||path.startsWith('//'))throw new Error('Rota GitHub inválida.')
 return origin+'/api/github?path='+encodeURIComponent(path)
}

export async function readGitHubSession():Promise<GitHubSession>{
 const origin=configuredOrigin()
 if(!origin)return {authenticated:false}
 try{
  const response=await fetch(origin+'/auth/session',{
   method:'GET',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer'
  })
  if(!response.ok)return {authenticated:false}
  const info=await response.json() as GitHubSession
  if(info.authenticated===true&&info.login?.toLowerCase()==='jordanferrary')
   return {authenticated:true,login:info.login,repository:'jordanferrary/portfolio_jordan',expiresAt:info.expiresAt}
 }catch{/* authentication server unavailable, blocked third-party cookies, etc. */}
 return {authenticated:false}
}

/** Call this synchronously from a real click so browsers allow the popup. */
export function beginGitHubLogin():boolean{
 const origin=configuredOrigin()
 if(!origin)return false
 const popup=window.open(origin+'/auth/start','alquimago-github-login','popup=yes,width=530,height=710')
 if(popup){popup.focus();return true}
 window.location.assign(origin+'/auth/start')
 return true
}

export function isAuthCompletion(event:MessageEvent):boolean{
 return !!configuredOrigin()&&event.origin===configuredOrigin()&&
  event.data?.type==='alquimago:github-auth-complete'&&event.data.ok===true
}

export async function disconnectGitHubSession():Promise<void>{
 const origin=configuredOrigin()
 if(!origin)return
 const response=await fetch(origin+'/auth/logout',{
  method:'POST',credentials:'include',cache:'no-store',
  headers:{'X-Alquimago-Request':'1'},
  referrerPolicy:'no-referrer'
 })
 if(!response.ok)throw new Error('Não foi possível encerrar a sessão. Tente novamente.')
}
