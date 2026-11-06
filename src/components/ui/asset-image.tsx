import { createContext,useContext,useEffect,useState,type ComponentProps,type ReactNode } from 'react'
import { isLocalMedia,readMedia } from '../../lib/media-store'
import { resolvePublishedAsset } from '../../lib/published-assets'
import { normalizeBundledImage } from '../../lib/default-assets'
import type { ResponsiveImageMap } from '../../lib/image-variants'

const VariantContext=createContext<ResponsiveImageMap>({})
export function ImageVariantProvider({variants,children}:{variants:ResponsiveImageMap;children:ReactNode}){
 return <VariantContext.Provider value={variants}>{children}</VariantContext.Provider>
}

export function useAssetSrc(source?:string){
 const normalized=source?resolvePublishedAsset(normalizeBundledImage(source)):''
 const [url,setUrl]=useState(normalized&&!isLocalMedia(normalized)?normalized:'')
 useEffect(()=>{
  if(!normalized){setUrl('');return}
  if(!isLocalMedia(normalized)){setUrl(normalized);return}
  let active=true
  let objectUrl=''
  setUrl('')
  readMedia(normalized).then(blob=>{if(!blob||!active)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>{if(active)setUrl('')})
  return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[normalized])
 return url
}
export function AssetImage({src,alt='',sizes,srcSet,...props}:ComponentProps<'img'>){
 const resolved=useAssetSrc(src)
 const variants=useContext(VariantContext)
 const item=src?variants[src]:undefined
 const candidates=item&&resolved&&item.smallWidth>0&&item.mediumWidth>0&&item.largeWidth>0?[
  {url:resolvePublishedAsset(item.small),width:item.smallWidth},
  {url:resolvePublishedAsset(item.medium),width:item.mediumWidth},
  {url:resolved,width:item.largeWidth}
 ].sort((a,b)=>a.width-b.width).filter((part,index,arr)=>index===0||part.width!==arr[index-1].width):[]
 const autoSet=candidates.length>0?candidates.map(part=>part.url+' '+part.width+'w').join(', '):undefined
 return <img src={resolved||undefined} alt={alt} srcSet={srcSet??autoSet} sizes={sizes??(autoSet?'100vw':undefined)} {...props}/>
}
