/**
 * GitHub Pages replaces hashed Vite assets on deploy. An already-open tab
 * can attempt to import a removed hash when navigating to a lazy page.
 * Reload at most once per deployed build; never discard in-progress Studio
 * edits without an explicit click.
 */
const RETRY_WINDOW_MS=10*60*1000
const RETRY_PREFIX='jf-stale-chunk-retry-v1:'

export function isChunkLoadError(reason:unknown):boolean{
 const error=reason instanceof Error?reason.message:String(reason??'')
 return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|unable to preload css|loading (?:css )?chunk [\w-]+ failed|chunkloaderror/i.test(error)
}

export function tryAutoRecoverChunk(reason:unknown):boolean{
 if(!isChunkLoadError(reason)||typeof window==='undefined')return false
 // A refresh could destroy unsaved values in an open Studio editor.
 if(document.documentElement.dataset.jfStudioActive==='true')return false
 if(typeof navigator!=='undefined'&&navigator.onLine===false)return false
 try{
  const version=document.querySelector<HTMLMetaElement>('meta[name="jf-build"]')?.content||'unknown'
  const key=RETRY_PREFIX+version
  const previous=Number(window.sessionStorage.getItem(key)||0)
  if(previous>0&&Date.now()-previous<RETRY_WINDOW_MS)return false
  window.sessionStorage.setItem(key,String(Date.now()))
  window.location.reload()
  return true
 }catch{
  // Missing sessionStorage must not turn a transient failure into a reload loop.
  return false
 }
}
