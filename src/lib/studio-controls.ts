export const NAV_IDS=['inicio','portfolio','custom','sobre','contato'] as const
export type NavId=typeof NAV_IDS[number]
export const NAV_ICONS=['home','grid','user','mail','layers','book','image','star'] as const
export type NavIcon=typeof NAV_ICONS[number]
export type TranslationEntry={source:string;pt:string;es:string}
export type LayoutSettings={width:number;gutter:number;gap:number;radius:number;iconRadius:number;glassBlur:number;glassGlow:number;glassOpacity:number;glassSheen:number}
export type StudioControls={
 desktop:LayoutSettings;mobile:LayoutSettings;
 motion:{mode:'glitch'|'fade'|'none';duration:number};
 features:{music:boolean;profile:boolean;featured:boolean;focus:boolean;testimonials:boolean;footer:boolean};
 navigation:{order:NavId[];items:Record<Exclude<NavId,'custom'>,{label:string;visible:boolean;icon:NavIcon}>};
 translations:TranslationEntry[]
}
export const DEFAULT_LAYOUT:LayoutSettings={width:1470,gutter:0,gap:100,radius:100,iconRadius:100,glassBlur:100,glassGlow:100,glassOpacity:100,glassSheen:100}
export const DEFAULT_CONTROLS:StudioControls={
 desktop:{...DEFAULT_LAYOUT},mobile:{...DEFAULT_LAYOUT},
 motion:{mode:'glitch',duration:260},
 features:{music:true,profile:true,featured:true,focus:true,testimonials:true,footer:true},
 navigation:{order:[...NAV_IDS],items:{inicio:{label:'Home',visible:true,icon:'home'},portfolio:{label:'Portfolio',visible:true,icon:'grid'},sobre:{label:'About',visible:true,icon:'user'},contato:{label:'Contact',visible:true,icon:'mail'}}},
 translations:[]
}
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const integer=(value:unknown,min:number,max:number,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):fallback
const bool=(value:unknown,fallback:boolean)=>typeof value==='boolean'?value:fallback
const str=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):''
function layout(raw:unknown):LayoutSettings{
 const v=record(raw)
 return {width:integer(v.width,900,1800,1470),gutter:integer(v.gutter,0,16,0),gap:integer(v.gap,75,135,100),radius:integer(v.radius,0,150,100),iconRadius:integer(v.iconRadius,0,200,100),glassBlur:integer(v.glassBlur,0,250,100),glassGlow:integer(v.glassGlow,0,250,100),glassOpacity:integer(v.glassOpacity,15,150,100),glassSheen:integer(v.glassSheen,0,250,100)}
}
export function normalizeStudioControls(raw:unknown):StudioControls{
 const v=record(raw),m=record(v.motion),f=record(v.features),n=record(v.navigation),nItems=record(n.items)
 const order:NavId[]=[]
 if(Array.isArray(n.order))for(const id of n.order)if(NAV_IDS.includes(id as NavId)&&!order.includes(id as NavId))order.push(id as NavId)
 for(const id of NAV_IDS)if(!order.includes(id))order.push(id)
 const items={...DEFAULT_CONTROLS.navigation.items}
 for(const id of ['inicio','portfolio','sobre','contato'] as const){
  const x=record(nItems[id]),d=DEFAULT_CONTROLS.navigation.items[id]
  items[id]={label:str(x.label,36)||d.label,visible:id==='inicio'?true:bool(x.visible,true),icon:NAV_ICONS.includes(x.icon as NavIcon)?x.icon as NavIcon:d.icon}
 }
 const translations:TranslationEntry[]=[]
 if(Array.isArray(v.translations))for(const raw of v.translations.slice(0,400)){
  const x=record(raw),source=str(x.source,2500),pt=str(x.pt,2800),es=str(x.es,2800)
  if(source&&(pt||es)&&!translations.some(t=>t.source===source))translations.push({source,pt,es})
 }
 return {desktop:layout(v.desktop),mobile:layout(v.mobile),motion:{mode:m.mode==='fade'||m.mode==='none'?m.mode:'glitch',duration:integer(m.duration,120,600,260)},
 features:{music:bool(f.music,true),profile:bool(f.profile,true),featured:bool(f.featured,true),focus:bool(f.focus,true),testimonials:bool(f.testimonials,true),footer:bool(f.footer,true)},
 navigation:{order,items},translations}
}
// Personal browser preference only: never serialized in StudioControls or a theme.
const LOCAL_GLASS_OVERRIDE='jf-local-glass-override'
export function getLocalGlassOverride():boolean{
 try{return localStorage.getItem(LOCAL_GLASS_OVERRIDE)==='true'}catch{return typeof document!=='undefined'&&document.documentElement.dataset.jfGlassOverride==='true'}
}
export function setLocalGlassOverride(enabled:boolean):void{
 document.documentElement.dataset.jfGlassOverride=String(enabled)
 try{localStorage.setItem(LOCAL_GLASS_OVERRIDE,String(enabled))}catch{/* In restricted storage, retain the current page preference. */}
}
export function applyStudioControls(raw:unknown){
 const v=normalizeStudioControls(raw),root=document.documentElement
 if(root.dataset.jfGlassOverride===undefined)root.dataset.jfGlassOverride=String(getLocalGlassOverride())
 for(const device of ['desktop','mobile'] as const){
  const size=v[device]
  for(const key of ['gap','radius','iconRadius','glassBlur','glassGlow','glassOpacity','glassSheen'] as const)root.style.setProperty('--jf-'+device+'-'+key,String(size[key]/100))
  root.style.setProperty('--jf-'+device+'-width',size.width+'px')
  root.style.setProperty('--jf-'+device+'-gutter',size.gutter+'px')
 }
 root.dataset.jfMotion=v.motion.mode
 root.dataset.jfFooter=String(v.features.footer)
}
