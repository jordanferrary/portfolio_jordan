/**
 * Public, bounded visual preferences for the Alquimago 3D viewport.
 * The owner's published configuration is the default; browser changes are local.
 * No tokens, model binaries or private data are stored here.
 */
export type AlquimagoStage={
 width:number; height:number; zoom:number; offsetX:number; offsetY:number;
 followPointer:boolean
}
export const STAGE_KEY='jf-alquimago-3d-stage-v1'
export const DEFAULT_STAGE:AlquimagoStage={
 width:206,height:248,zoom:1.15,offsetX:0,offsetY:0,followPointer:true
}
const clamp=(n:unknown,min:number,max:number,fallback:number)=>{
 const value=typeof n==='number'&&Number.isFinite(n)?n:fallback
 return Math.max(min,Math.min(max,value))
}
export function normalizeAlquimagoStage(raw:unknown):AlquimagoStage{
 const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Partial<AlquimagoStage>:{}
 return {
  width:Math.round(clamp(s.width,145,420,DEFAULT_STAGE.width)),
  height:Math.round(clamp(s.height,175,475,DEFAULT_STAGE.height)),
  zoom:Math.round(clamp(s.zoom,0.65,2.6,DEFAULT_STAGE.zoom)*100)/100,
  offsetX:Math.round(clamp(s.offsetX,-220,220,DEFAULT_STAGE.offsetX)),
  offsetY:Math.round(clamp(s.offsetY,-200,200,DEFAULT_STAGE.offsetY)),
  followPointer:typeof s.followPointer==='boolean'?s.followPointer:DEFAULT_STAGE.followPointer
 }
}
export function readAlquimagoStageDraft():AlquimagoStage|null{
 try{
  const saved=localStorage.getItem(STAGE_KEY)
  return saved?normalizeAlquimagoStage(JSON.parse(saved)):null
 }catch{return null}
}
export function readAlquimagoStage(familiar?:Element|null):AlquimagoStage{
 const actor=familiar as (Element&{config?:{appearance?:{stage3d?:unknown}}})|undefined|null
 const published=actor?.config?.appearance?.stage3d
 return readAlquimagoStageDraft()||normalizeAlquimagoStage(published)
}
export function writeAlquimagoStage(value:unknown):AlquimagoStage{
 const next=normalizeAlquimagoStage(value)
 try{localStorage.setItem(STAGE_KEY,JSON.stringify(next))}catch{/* local storage optional */}
 window.dispatchEvent(new CustomEvent<AlquimagoStage>('alquimago:stage3d-changed',{detail:next}))
 return next
}
export function resetAlquimagoStage(familiar?:Element|null):AlquimagoStage{
 try{localStorage.removeItem(STAGE_KEY)}catch{/* optional */}
 const stage=readAlquimagoStage(familiar)
 window.dispatchEvent(new CustomEvent<AlquimagoStage>('alquimago:stage3d-changed',{detail:stage}))
 return stage
}
