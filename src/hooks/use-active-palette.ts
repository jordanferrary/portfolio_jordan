import {useEffect,useState} from 'react'
import {readActivePalette} from '../lib/adaptive-background'
export function useActivePalette(){
 const [palette,setPalette]=useState(readActivePalette)
 useEffect(()=>{
  const update=()=>{const next=readActivePalette();setPalette(old=>JSON.stringify(old)===JSON.stringify(next)?old:next)}
  const observer=new MutationObserver(update)
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','data-jf-theme']})
  update()
  return ()=>observer.disconnect()
 },[])
 return palette
}
