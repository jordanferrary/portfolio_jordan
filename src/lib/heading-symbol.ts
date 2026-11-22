export type HeadingSymbolStyle='sparkle'|'sparkles'|'star'|'diamond'|'circle'|'box'|'pen'|'layers'|'none'
export const DEFAULT_HEADING_SYMBOL:HeadingSymbolStyle='box'
export const HEADING_SYMBOL_OPTIONS:{id:HeadingSymbolStyle;label:string}[]=[
 {id:'box',label:'Cubo 3D'},
 {id:'pen',label:'Caneta vetorial'},
 {id:'layers',label:'Camadas'},
 {id:'diamond',label:'Diamante'},
 {id:'circle',label:'Círculo'},
 {id:'none',label:'Sem símbolo'}
]
export function normalizeHeadingSymbol(value:unknown):HeadingSymbolStyle{
 if(value==='sparkle')return 'box'
 if(value==='sparkles')return 'layers'
 if(value==='star')return 'pen'
 return HEADING_SYMBOL_OPTIONS.find(option=>option.id===value)?.id??DEFAULT_HEADING_SYMBOL
}
/** Some old Home/About text includes a literal star; never display two. */
export function cleanHeadingText(value:string):string{
 return value.replace(/^(?:\s*[✦✧★☆✨✳✴]\s*)+/u,'').trimStart()
}
