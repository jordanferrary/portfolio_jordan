import { useEffect, useState, type ComponentProps } from 'react'
import { isLocalMedia,readMedia } from '../../lib/media-store'
export function useAssetSrc(source?:string){
 const [url,setUrl]=useState(source&&!isLocalMedia(source)?source:'')
 useEffect(()=>{
  if(!source){setUrl('');return}
  if(!isLocalMedia(source)){setUrl(source);return}
  let active=true
  let objectUrl=''
  setUrl('')
  readMedia(source).then(blob=>{if(!blob||!active)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>setUrl(''))
  return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[source])
 return url
}
export function AssetImage({src,alt='',...props}:ComponentProps<'img'>){
 const resolved=useAssetSrc(src)
 return <img src={resolved||undefined} alt={alt} {...props}/>
}
