import type { ReactNode } from 'react'

/** Keep the artist's legal/brand name unchanged by browser translation services. */
export function protectArtistName(value:string):ReactNode {
 return value.split(/(Jordan Ferrary)/gi).map((part,index)=>
  part.toLowerCase()==='jordan ferrary'
   ? <span key={index} className="notranslate" translate="no" lang="en">{part}</span>
   : part
 )
}
