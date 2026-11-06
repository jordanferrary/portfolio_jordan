/** The four art-direction controls exposed to the owner. All small details derive from these. */
export type ThemePalette={primary:string;secondary:string;background:string;surface:string}
export type ThemeColorKey=keyof ThemePalette
export const DEFAULT_THEME:ThemePalette={
 primary:'#A63FFF',
 secondary:'#42DFF5',
 background:'#0B0715',
 surface:'#1C102B'
}
export const PALETTE_FIELDS:{key:ThemeColorKey;label:string;description:string}[]=[
 {key:'primary',label:'Cor principal',description:'Botões, foco, marca e elementos de destaque'},
 {key:'secondary',label:'Cor secundária',description:'Detalhes luminosos, indicadores e contraste visual'},
 {key:'background',label:'Fundo do site',description:'Base escura das páginas e atmosfera geral'},
 {key:'surface',label:'Superfícies',description:'Cards, janelas e áreas elevadas'}
]
export function normalizeHexColor(value:unknown):string|null{
 if(typeof value!=='string')return null
 const trimmed=value.trim()
 if(/^#[0-9a-f]{3}$/i.test(trimmed))return '#'+Array.from(trimmed.slice(1),c=>c+c).join('').toUpperCase()
 if(/^#[0-9a-f]{6}$/i.test(trimmed))return trimmed.toUpperCase()
 return null
}
export function normalizeThemePalette(raw:unknown):ThemePalette{
 const value=raw&&typeof raw==='object'?raw as Partial<Record<ThemeColorKey,unknown>>:{}
 return {
  primary:normalizeHexColor(value.primary)??DEFAULT_THEME.primary,
  secondary:normalizeHexColor(value.secondary)??DEFAULT_THEME.secondary,
  background:normalizeHexColor(value.background)??DEFAULT_THEME.background,
  surface:normalizeHexColor(value.surface)??DEFAULT_THEME.surface
 }
}
export function applyThemePalette(palette:ThemePalette):void{
 const target=document.documentElement.style
 for(const field of PALETTE_FIELDS)target.setProperty('--jf-'+field.key,palette[field.key])
 target.setProperty('--color-primary',palette.primary)
 target.setProperty('--color-background',palette.background)
}
