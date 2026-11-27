import {DEFAULT_THEME,PALETTE_FIELDS,normalizeHexColor,type ThemeColorKey,type ThemePalette} from './theme-palette'
export type ActivePalette=ThemePalette&{themeName?:string}
export type AdaptiveColor={source:'fixed'|ThemeColorKey;fixedColor?:string;hue:number;saturation:number;lightness:number;contrast:number;opacity:number}
export type AdaptiveStop={global:AdaptiveColor;themes:Record<string,Partial<AdaptiveColor>>}
export const DEFAULT_ADAPTIVE_COLOR:AdaptiveColor={source:'fixed',hue:0,saturation:0,lightness:0,contrast:0,opacity:1}
const limit=(v:unknown,d:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):d
const keys=new Set<string>(['fixed',...PALETTE_FIELDS.map(f=>f.key)])
function normalizeColor(value:unknown):AdaptiveColor{
 const v=(value&&typeof value==='object'?value:{}) as Partial<AdaptiveColor>
 return {source:keys.has(v.source??'')?v.source!: 'fixed',...(normalizeHexColor(v.fixedColor)?{fixedColor:normalizeHexColor(v.fixedColor)!}:{}),hue:limit(v.hue,0,-180,180),saturation:limit(v.saturation,0,-100,100),lightness:limit(v.lightness,0,-100,100),contrast:limit(v.contrast,0,-100,100),opacity:limit(v.opacity,1,0,1)}
}
export function paletteIdentity(palette:ActivePalette):string{
 const name=palette.themeName?.trim().toLowerCase()
 return name?'theme:'+Array.from(name).map(c=>c.codePointAt(0)!.toString(16)).join('-'):PALETTE_FIELDS.map(f=>palette[f.key].replace('#','').toLowerCase()).join('-')
}
export function normalizeAdaptiveStop(value:unknown):AdaptiveStop{
 const v=(value&&typeof value==='object'?value:{}) as Partial<AdaptiveStop>
 const themes:AdaptiveStop['themes']={}
 if(v.themes&&typeof v.themes==='object'&&!Array.isArray(v.themes))for(const [id,raw] of Object.entries(v.themes).slice(0,60)){
  if(!/^(?:[0-9a-f]{6}(?:-[0-9a-f]{6}){6}|theme:[0-9a-f]{1,6}(?:-[0-9a-f]{1,6}){0,119})$/.test(id)||!raw||typeof raw!=='object')continue
  const n=normalizeColor(raw),patch:Partial<AdaptiveColor>={}
  if(keys.has(raw.source??''))patch.source=n.source
  if(n.fixedColor)patch.fixedColor=n.fixedColor
  if(typeof raw.contrast==='number')patch.contrast=n.contrast
  if(typeof raw.hue==='number')patch.hue=n.hue
  if(typeof raw.saturation==='number')patch.saturation=n.saturation
  if(typeof raw.lightness==='number')patch.lightness=n.lightness
  if(typeof raw.opacity==='number')patch.opacity=n.opacity
  if(Object.keys(patch).length)themes[id]=patch
 }
 return {global:normalizeColor(v.global),themes}
}
export function effectiveAdaptiveColor(stop:AdaptiveStop,palette:ActivePalette):AdaptiveColor{return {...stop.global,...stop.themes[paletteIdentity(palette)]}}
export function resolveAdaptiveColor(fixed:string,stop:AdaptiveStop|undefined,palette:ActivePalette=DEFAULT_THEME):string{
 if(!stop)return fixed
 const v=effectiveAdaptiveColor(stop,palette)
 const hex=normalizeHexColor(v.source==='fixed'?(v.fixedColor??fixed):palette[v.source])??'#000000'
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2
 let h=0,s=0
 if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h*=60}
 if(v.hue===0&&v.saturation===0&&v.lightness===0&&v.contrast===0&&v.opacity===1)return hex
 return 'hsla('+((h+v.hue+360)%360)+','+limit(s*100+v.saturation,0,0,100)+'%,'+limit((l*100-50)*(1+v.contrast/100)+50+v.lightness,0,0,100)+'%,'+v.opacity+')'
}
export function readActivePalette():ActivePalette{
 if(typeof document==='undefined')return DEFAULT_THEME
 const css=document.documentElement.style
 const palette:ActivePalette={...DEFAULT_THEME,themeName:document.documentElement.dataset.jfTheme||undefined}
 for(const {key} of PALETTE_FIELDS)palette[key]=normalizeHexColor(css.getPropertyValue('--jf-'+key))??DEFAULT_THEME[key]
 return palette
}
