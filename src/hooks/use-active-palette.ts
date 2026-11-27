import {useEffect,useState} from 'react'
import {paletteIdentity,readActivePalette} from '../lib/adaptive-background'
export function useActivePalette(){
 const [palette,setPalette]=useState(readActivePalette)
 useEffect(()=>{
  const update=()=>{const next=readActivePalette();setPalette(old=>paletteIdentity(old)===paletteIdentity(next)?old:next)}
  const observer=new MutationObserver(update)
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']})
  update()
  return ()=>observer.disconnect()
 },[])
 return palette
}
