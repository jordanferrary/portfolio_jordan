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
export type ShowcaseItem={id:string;image:string;name:string;description:string;portfolioUrl:string}
export type SlideTransition='fade'|'slide'|'zoom'
export type SlideItem={id:string;image:string;caption:string}
export type PageBlock=Omit<Block,'type'> &{
 type:BlockType|'action'|'showcase'|'slideshow'
 buttonLabel?:string
 buttonAction?:PageButtonAction
 buttonStyle?:'primary'|'outline'
 buttonNote?:string
 buttonAlign?:'left'|'center'|'right'
 buttonWidth?:'auto'|'full'
 showcaseItems?:ShowcaseItem[]
 slideItems?:SlideItem[]
 slideAutoplay?:boolean
 slideTransition?:SlideTransition
 slideInterval?:number
 /** Percent of the page's content column, 50–100. */
 slideWidth?:number
 /** Stage height in CSS px, 180–640. Shorter carousels display more images in auto mode. */
 slideHeight?:number
 /** Zero = automatically choose based on stage dimensions; 1–5 = preferred images per view. */
 slideVisible?:number
 slideFit?:'contain'|'cover'
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
 heroPositionX:number
 heroPositionY:number
 layout:'standard'|'wide'
 blocks:PageBlock[]
}
const blockTypes=new Set<string>(['heading','text','image','image-left','image-right','before-after','gallery','divider','video','model','action','showcase','slideshow'])
const iconSet=new Set<string>(customPageIconOptions.map(option=>option.value))
const buttonActions=new Set<string>(['copy','url-current','url-new'])
/** Stable IDs keep links working when a page title or navigation label changes. */
export function newCustomPage():CustomPage{
 return {id:'page-'+crypto.randomUUID(),navLabel:'New page',icon:'sparkles',showInNav:true,eyebrow:'✦ CREATIVE SPACE',title:'New page',subtitle:'',heroImage:'',heroPositionX:50,heroPositionY:50,layout:'standard',blocks:[]}
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
    showcaseItems:Array.isArray(block.showcaseItems)?block.showcaseItems.slice(0,120).filter((entry):entry is ShowcaseItem=>Boolean(entry&&typeof entry==='object'&&typeof entry.image==='string')).map(entry=>({id:typeof entry.id==='string'?entry.id:'item-'+crypto.randomUUID(),image:entry.image,name:typeof entry.name==='string'?entry.name.slice(0,120):'',description:typeof entry.description==='string'?entry.description.slice(0,1800):'',portfolioUrl:typeof entry.portfolioUrl==='string'?entry.portfolioUrl:''})):[],
    slideItems:Array.isArray(block.slideItems)?block.slideItems.slice(0,80).filter((entry):entry is SlideItem=>Boolean(entry&&typeof entry==='object'&&typeof entry.image==='string')).map(entry=>({id:typeof entry.id==='string'?entry.id:'slide-'+crypto.randomUUID(),image:entry.image,caption:typeof entry.caption==='string'?entry.caption.slice(0,500):''})):[],
    slideAutoplay:block.slideAutoplay===true,
    slideTransition:['fade','slide','zoom'].includes(block.slideTransition??'')?block.slideTransition:'fade',
    slideInterval:typeof block.slideInterval==='number'&&Number.isFinite(block.slideInterval)?Math.max(1500,Math.min(30000,Math.round(block.slideInterval))):5000,
    slideWidth:typeof block.slideWidth==='number'&&Number.isFinite(block.slideWidth)?Math.max(50,Math.min(100,Math.round(block.slideWidth))):100,
    slideHeight:typeof block.slideHeight==='number'&&Number.isFinite(block.slideHeight)?Math.max(180,Math.min(640,Math.round(block.slideHeight))):520,
    slideVisible:typeof block.slideVisible==='number'&&Number.isFinite(block.slideVisible)?Math.max(0,Math.min(5,Math.round(block.slideVisible))):0,
    slideFit:block.slideFit==='cover'?'cover':'contain',
    buttonAction:buttonActions.has(block.buttonAction??'')?block.buttonAction:'copy',
    buttonLabel:typeof block.buttonLabel==='string'?block.buttonLabel:'Copy',
    buttonNote:typeof block.buttonNote==='string'?block.buttonNote:'',
    buttonStyle:block.buttonStyle==='outline'?'outline':'primary',
    buttonAlign:['left','center','right'].includes(block.buttonAlign??'')?block.buttonAlign:'left',
    buttonWidth:block.buttonWidth==='full'?'full':'auto'
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
   heroPositionX:typeof value.heroPositionX==='number'?Math.min(100,Math.max(0,value.heroPositionX)):50,
   heroPositionY:typeof value.heroPositionY==='number'?Math.min(100,Math.max(0,value.heroPositionY)):50,
   layout:value.layout==='wide'?'wide':'standard',
   blocks
  })
 }
 return list
}
