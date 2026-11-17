export type HeadingSymbolStyle='sparkle'|'sparkles'|'star'|'diamond'|'circle'|'none'
export const DEFAULT_HEADING_SYMBOL:HeadingSymbolStyle='sparkle'
export const HEADING_SYMBOL_OPTIONS:{id:HeadingSymbolStyle;label:string}[]=[
 {id:'sparkle',label:'Brilho simples'},
 {id:'sparkles',label:'Brilhos'},
 {id:'star',label:'Estrela'},
 {id:'diamond',label:'Diamante'},
 {id:'circle',label:'Círculo'},
 {id:'none',label:'Sem símbolo'}
]
export function normalizeHeadingSymbol(value:unknown):HeadingSymbolStyle{
 return HEADING_SYMBOL_OPTIONS.find(option=>option.id===value)?.id??DEFAULT_HEADING_SYMBOL
}
/** Some old Home/About text includes a literal star; never display two. */
export function cleanHeadingText(value:string):string{
 return value.replace(/^(?:\s*[✦✧★☆✨✳✴]\s*)+/u,'').trimStart()
}
