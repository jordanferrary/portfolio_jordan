import type {CustomPage,PageBlock} from '../data/custom-pages'
import {normalizeCustomPages} from '../data/custom-pages'
/** One-level links prevent cycles. Keep a fallback snapshot if a source is deleted. */
export function resolvePageBlock(block:PageBlock,pages:CustomPage[]):PageBlock{
 if(!block.linkedSource)return block
 const source=pages.find(p=>p.id===block.linkedSource?.pageId)?.blocks.find(b=>b.id===block.linkedSource?.blockId)
 if(!source||source.linkedSource)return block
 return {...source,id:block.id,appearance:block.appearance??source.appearance,linkedSource:block.linkedSource}
}
export function copyBlock(block:PageBlock):PageBlock{
 const result=JSON.parse(JSON.stringify(block)) as PageBlock
 return {...result,id:'block-'+crypto.randomUUID()}
}
export function instantiatePage(page:CustomPage,allPages:CustomPage[]):CustomPage{
 const copy=JSON.parse(JSON.stringify(page)) as CustomPage
 return {...copy,id:'page-'+crypto.randomUUID(),title:copy.title+' (cópia)',navLabel:copy.navLabel.slice(0,28)+' Copy',showInNav:false,blocks:copy.blocks.map(block=>({...copyBlock(resolvePageBlock(block,allPages)),linkedSource:undefined}))}
}
export function refreshLinkedBlocks(pages:CustomPage[]):CustomPage[]{
 return pages.map(page=>({...page,blocks:page.blocks.map(block=>resolvePageBlock(block,pages))}))
}
export type PageTemplate={schema:1;name:string;page:CustomPage}
export function normalizePageTemplate(raw:unknown):PageTemplate{
 const v=raw as Partial<PageTemplate>|null
 if(!v||v.schema!==1||typeof v.name!=='string'||!v.name.trim())throw new Error('Modelo de página inválido.')
 const page=normalizeCustomPages([v.page])[0]
 if(!page)throw new Error('Página inválida no modelo.')
 return {schema:1,name:v.name.trim().slice(0,60),page}
}
const KEY='jf-studio-page-templates-v1'
export function readPageTemplates():PageTemplate[]{
 try{const v:unknown=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.slice(0,20).flatMap(t=>{try{return [normalizePageTemplate(t)]}catch{return []}}):[]}catch{return []}
}
export function savePageTemplates(list:PageTemplate[]){
 localStorage.setItem(KEY,JSON.stringify(list.slice(0,20).map(normalizePageTemplate)))
}
