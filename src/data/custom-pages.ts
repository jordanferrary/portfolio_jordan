import type {Block,BlockType} from './projects'
import {normalizeBundledImage} from '../lib/default-assets'

export type CustomPageIcon='book'|'graduation'|'sparkles'|'layers'|'code'|'download'|'file'|'gem'|'folder'|'video'|'star'|'link'
export const customPageIconOptions:{value:CustomPageIcon;label:string}[]=[
 {value:'book',label:'Livro'},{value:'graduation',label:'Curso'},{value:'sparkles',label:'Criação'},
 {value:'layers',label:'Coleção'},{value:'code',label:'Código'},{value:'download',label:'Downloads'},
 {value:'file',label:'Documento'},{value:'gem',label:'Destaque'},{value:'folder',label:'Pasta'},
 {value:'video',label:'Vídeo'},{value:'star',label:'Estrela'},{value:'link',label:'Links'}
]
export type PageButtonAction='copy'|'url-current'|'url-new'
export type PageBlock=Omit<Block,'type'> &{
 type:BlockType|'action'
 buttonLabel?:string
 buttonAction?:PageButtonAction
 buttonStyle?:'primary'|'outline'
 buttonNote?:string
}
export interface CustomPage{
 id:string
 navLabel:string
 icon:CustomPageIcon
 showInNav:boolean
 eyebrow:string
 title:string
 subtitle:string
 heroImage:string
 blocks:PageBlock[]
}
const blockTypes=new Set<string>(['heading','text','image','image-left','image-right','before-after','gallery','divider','video','model','action'])
const iconSet=new Set<string>(customPageIconOptions.map(option=>option.value))
const buttonActions=new Set<string>(['copy','url-current','url-new'])
/** Stable IDs keep links working when a page title or navigation label changes. */
export function newCustomPage():CustomPage{
 return {id:'page-'+crypto.randomUUID(),navLabel:'New page',icon:'sparkles',showInNav:true,eyebrow:'✦ CREATIVE SPACE',title:'New page',subtitle:'',heroImage:'',blocks:[]}
}
/** Accept only simple http(s), mailto, or an internal hash route. No executable URLs. */
export function safePageHref(value:string):string|null{
 const input=value.trim()
 if(/^#\/(inicio|portfolio|sobre|contato|page\/[a-z0-9-]+|project\/[a-z0-9-]+)$/i.test(input))return input
 try{
  const url=new URL(input)
  if(['https:','http:','mailto:'].includes(url.protocol))return url.href
 }catch{/* Invalid URLs must never become active links. */}
 return null
}
export function normalizeCustomPages(input:unknown):CustomPage[]{
 if(!Array.isArray(input))return []
 const ids=new Set<string>()
 const list:CustomPage[]=[]
 for(const raw of input.slice(0,80)){
  if(!raw||typeof raw!=='object')continue
  const value=raw as Partial<CustomPage>
  if(typeof value.id!=='string'||!/^page-[a-z0-9-]{8,100}$/.test(value.id)||ids.has(value.id))continue
  ids.add(value.id)
  const blocks:PageBlock[]=[]
  if(Array.isArray(value.blocks))for(const item of value.blocks.slice(0,250)){
   if(!item||typeof item!=='object'||typeof item.id!=='string'||typeof item.type!=='string'||!blockTypes.has(item.type))continue
   const block=item as PageBlock
   blocks.push({
    ...block,
    content:typeof block.content==='string'?(block.type==='image'?normalizeBundledImage(block.content):block.content):'',
    media:typeof block.media==='string'?normalizeBundledImage(block.media):undefined,
    after:typeof block.after==='string'?normalizeBundledImage(block.after):undefined,
    gallery:Array.isArray(block.gallery)?block.gallery.filter((a):a is string=>typeof a==='string').map(normalizeBundledImage):undefined,
    buttonAction:buttonActions.has(block.buttonAction??'')?block.buttonAction:'copy',
    buttonLabel:typeof block.buttonLabel==='string'?block.buttonLabel:'Copy',
    buttonNote:typeof block.buttonNote==='string'?block.buttonNote:'',
    buttonStyle:block.buttonStyle==='outline'?'outline':'primary'
   })
  }
  list.push({
   id:value.id,
   navLabel:typeof value.navLabel==='string'?value.navLabel.slice(0,35):'Page',
   icon:iconSet.has(value.icon??'')?value.icon!:'sparkles',
   showInNav:value.showInNav!==false,
   eyebrow:typeof value.eyebrow==='string'?value.eyebrow.slice(0,120):'',
   title:typeof value.title==='string'?value.title.slice(0,160):'New page',
   subtitle:typeof value.subtitle==='string'?value.subtitle.slice(0,1200):'',
   heroImage:typeof value.heroImage==='string'?normalizeBundledImage(value.heroImage):'',
   blocks
  })
 }
 return list
}
