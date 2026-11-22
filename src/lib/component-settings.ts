/** Bounded component overrides. Missing settings inherit the established design. */
export type BlockAppearance={width?:number;space?:number;align?:'left'|'center'|'right';surface?:'plain'|'panel';hideMobile?:boolean;hideDesktop?:boolean}
export type BlockLink={pageId:string;blockId:string}
export function normalizeBlockAppearance(raw:unknown):BlockAppearance|undefined{
 if(!raw||typeof raw!=='object')return undefined
 const v=raw as Record<string,unknown>,out:BlockAppearance={}
 if(typeof v.width==='number'&&Number.isFinite(v.width)&&v.width!==100)out.width=Math.max(50,Math.min(100,Math.round(v.width)))
 if(typeof v.space==='number'&&Number.isFinite(v.space)&&v.space!==0)out.space=Math.max(0,Math.min(64,Math.round(v.space)))
 if(v.align==='left'||v.align==='right')out.align=v.align
 if(v.surface==='panel')out.surface='panel'
 if(v.hideMobile===true)out.hideMobile=true
 if(v.hideDesktop===true)out.hideDesktop=true
 return Object.keys(out).length?out:undefined
}
export function normalizeBlockLink(raw:unknown):BlockLink|undefined{
 if(!raw||typeof raw!=='object')return undefined
 const {pageId,blockId}=raw as Partial<BlockLink>
 return typeof pageId==='string'&&/^page-[a-z0-9-]{8,100}$/.test(pageId)&&typeof blockId==='string'&&blockId.length>0&&blockId.length<=160?{pageId,blockId}:undefined
}
export type NativeRoute='inicio'|'portfolio'|'sobre'|'contato'
export const NATIVE_ROUTES:NativeRoute[]=['inicio','portfolio','sobre','contato']
export type NativeLayouts=Partial<Record<NativeRoute,string>>
export function normalizeNativeLayouts(raw:unknown):NativeLayouts{
 const out:NativeLayouts={}
 if(raw&&typeof raw==='object')for(const route of NATIVE_ROUTES){
  const value=(raw as Record<string,unknown>)[route]
  if(typeof value==='string'&&/^page-[a-z0-9-]{8,100}$/.test(value))out[route]=value
 }
 return out
}

export const HOME_UPPER=['intro','profile'] as const
export const HOME_LOWER=['featured','testimonials','focus'] as const
export type HomeModuleOrder={upper:(typeof HOME_UPPER)[number][];lower:(typeof HOME_LOWER)[number][]}
export function normalizeOrder<T extends string>(raw:unknown,defaults:readonly T[]):T[]{
 const order:T[]=[]
 if(Array.isArray(raw))for(const item of raw)if(defaults.includes(item)&&!order.includes(item))order.push(item)
 for(const item of defaults)if(!order.includes(item))order.push(item)
 return order
}
export function normalizeHomeModuleOrder(raw:unknown):HomeModuleOrder{
 const v=raw&&typeof raw==='object'?raw as Partial<HomeModuleOrder>:{}
 return {upper:normalizeOrder(v.upper,HOME_UPPER),lower:normalizeOrder(v.lower,HOME_LOWER)}
}
