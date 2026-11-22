import {Box,Circle,Diamond,Layers,PenTool} from 'lucide-react'
import {DEFAULT_HEADING_SYMBOL,type HeadingSymbolStyle} from '../../lib/heading-symbol'
const icons={sparkle:Box,sparkles:Layers,star:PenTool,box:Box,pen:PenTool,layers:Layers,diamond:Diamond,circle:Circle}
export function HeadingSymbol({symbol=DEFAULT_HEADING_SYMBOL,size=17}:{symbol?:HeadingSymbolStyle;size?:number}){
 if(symbol==='none')return null
 const Icon=icons[symbol]
 return <span className="jf-heading-symbol" aria-hidden="true"><Icon size={size} strokeWidth={1.9}/></span>
}
