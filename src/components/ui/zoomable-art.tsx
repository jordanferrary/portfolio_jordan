import {lazy,Suspense,useState,type ComponentProps} from 'react'
import {AssetImage} from './asset-image'
const ArtLightbox=lazy(()=>import('./art-lightbox').then(module=>({default:module.ArtLightbox})))
export function ZoomableArt({src,alt='',...props}:ComponentProps<'img'>){
 const [open,setOpen]=useState(false)
 if(!src)return <AssetImage src={src} alt={alt} {...props}/>
 return <>
  <AssetImage {...props} src={src} alt={alt} className={['zoomable-art',props.className].filter(Boolean).join(' ')} role="button" tabIndex={0} aria-label={'Enlarge image: '+alt} onClick={()=>setOpen(true)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setOpen(true)}}}/>
  {open&&<Suspense fallback={null}><ArtLightbox src={src} alt={alt} onClose={()=>setOpen(false)}/></Suspense>}
 </>
}
