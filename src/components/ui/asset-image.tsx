import { useEffect, useState, type ComponentProps } from 'react'
import { isLocalMedia,readMedia } from '../../lib/media-store'
import { normalizeBundledImage } from '../../lib/default-assets'
export function useAssetSrc(source?:string){
 const normalized=source?normalizeBundledImage(source):''
 const [url,setUrl]=useState(normalized&&!isLocalMedia(normalized)?normalized:'')
 useEffect(()=>{
  if(!normalized){setUrl('');return}
  if(!isLocalMedia(normalized)){setUrl(normalized);return}
  let active=true
  let objectUrl=''
  setUrl('')
  readMedia(normalized).then(blob=>{if(!blob||!active)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>setUrl(''))
  return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[normalized])
 return url
}
export function AssetImage({src,alt='',...props}:ComponentProps<'img'>){
 const resolved=useAssetSrc(src)
 return <img src={resolved||undefined} alt={alt} {...props}/>
}
