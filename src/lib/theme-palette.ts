/** Seven art-direction controls. Existing four-color palettes migrate without losing choices. */
export type ThemePalette={primary:string;secondary:string;background:string;surface:string;text:string;muted:string;border:string}
export type ThemeColorKey=keyof ThemePalette
export const DEFAULT_THEME:ThemePalette={
 primary:'#A234FA',
 secondary:'#CB89FF',
 background:'#090611',
 surface:'#170D26',
 text:'#F8F3FF',
 muted:'#B7A0CD',
 border:'#7335A7'
}
export const PALETTE_FIELDS:{key:ThemeColorKey;label:string;description:string}[]=[
 {key:'primary',label:'Cor principal',description:'Botões Liquid Glass, brilho colorido, foco e destaques'},
 {key:'secondary',label:'Cor secundária',description:'Reflexos do vidro, contornos luminosos e indicadores'},
 {key:'background',label:'Fundo do site',description:'Base escura das páginas e atmosfera geral'},
 {key:'surface',label:'Superfícies',description:'Profundidade e tonalidade base do vidro, cards e janelas'},
 {key:'text',label:'Texto principal',description:'Títulos, textos e ícones de maior destaque'},
 {key:'muted',label:'Texto secundário',description:'Descrições, legendas e informações auxiliares'},
 {key:'border',label:'Bordas e divisórias',description:'Contorno do vidro, bordas dos cards e separadores'}
]
export function normalizeHexColor(value:unknown):string|null{
 if(typeof value!=='string')return null
 const trimmed=value.trim()
 if(/^#[0-9a-f]{3}$/i.test(trimmed))return '#'+Array.from(trimmed.slice(1),c=>c+c).join('').toUpperCase()
 if(/^#[0-9a-f]{6}$/i.test(trimmed))return trimmed.toUpperCase()
 return null
}
/** WCAG relative luminance and contrast against the site's fixed light text. */
export function colorLuminance(hex:string):number{
 const color=normalizeHexColor(hex)
 if(!color)return 0
 const components=[1,3,5].map(i=>{
  const channel=parseInt(color.slice(i,i+2),16)/255
  return channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4
 })
 return 0.2126*components[0]+0.7152*components[1]+0.0722*components[2]
}
export function contrastRatio(foreground:string,background:string):number{
 const a=colorLuminance(foreground),b=colorLuminance(background)
 return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)
}
export function normalizeThemePalette(raw:unknown):ThemePalette{
 const value=raw&&typeof raw==='object'?raw as Partial<Record<ThemeColorKey,unknown>>:{}
 // Migrate the temporary cyan palette introduced by the visual redesign.
 // Only migrate an exact match: any intentionally customized palette remains unchanged.
 const previous={
  primary:normalizeHexColor(value.primary),
  secondary:normalizeHexColor(value.secondary),
  background:normalizeHexColor(value.background),
  surface:normalizeHexColor(value.surface)
 }
 if(previous.primary==='#A63FFF'&&previous.secondary==='#42DFF5'&&previous.background==='#0B0715'&&previous.surface==='#1C102B')
  return {...DEFAULT_THEME}
 return {
  primary:previous.primary??DEFAULT_THEME.primary,
  secondary:previous.secondary??DEFAULT_THEME.secondary,
  background:previous.background??DEFAULT_THEME.background,
  surface:previous.surface??DEFAULT_THEME.surface,
  text:normalizeHexColor(value.text)??DEFAULT_THEME.text,
  muted:normalizeHexColor(value.muted)??DEFAULT_THEME.muted,
  border:normalizeHexColor(value.border)??DEFAULT_THEME.border
 }
}
export function applyThemePalette(palette:ThemePalette):void{
 const target=document.documentElement.style
 for(const field of PALETTE_FIELDS)target.setProperty('--jf-'+field.key,palette[field.key])
 target.setProperty('--color-primary',palette.primary)
 target.setProperty('--color-background',palette.background)
 target.setProperty('--color-text',palette.text)
 target.setProperty('--color-muted',palette.muted)
 target.setProperty('--color-border',palette.border)
}
