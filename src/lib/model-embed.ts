/** Static browser-compatible 3D assets. FBX is best converted to glb in Blender. */
export function parseModelUrl(value:string):{url:string;format:'glb'|'gltf'}|null{
 try{
  const url=new URL(value.trim())
  if(url.protocol!=='https:'&&url.protocol!=='http:')return null
  if(!['.glb','.gltf'].some(extension=>url.pathname.toLowerCase().endsWith(extension)))return null
  return {url:url.href,format:url.pathname.toLowerCase().endsWith('.glb')?'glb':'gltf'}
 }catch{return null}
}
