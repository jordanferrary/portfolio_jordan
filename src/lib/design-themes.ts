import {normalizeThemePalette,type ThemePalette} from './theme-palette'
import {normalizeTypography,type TypographySettings} from './typography'
import {normalizeGlitchPalette,type GlitchPalette} from './glitch-palette'
import {normalizeHeadingSymbol,type HeadingSymbolStyle} from './heading-symbol'
import {normalizeStudioControls,type StudioControls} from './studio-controls'
export type DesignTheme={schema:1;name:string;palette:ThemePalette;typography:TypographySettings;glitch:GlitchPalette;symbol:HeadingSymbolStyle;design:Pick<StudioControls,'desktop'|'mobile'|'motion'>}
export function normalizeDesignTheme(raw:unknown):DesignTheme{
 if(!raw||typeof raw!=='object')throw new Error('Arquivo de tema inválido.')
 const v=raw as Record<string,unknown>
 if(v.schema!==1||typeof v.name!=='string'||!v.name.trim()||!v.palette||typeof v.palette!=='object')throw new Error('Formato de tema incompatível.')
 const {desktop,mobile,motion}=normalizeStudioControls(v.design)
 return {schema:1,name:v.name.trim().slice(0,60),palette:normalizeThemePalette(v.palette),typography:normalizeTypography(v.typography),glitch:normalizeGlitchPalette(v.glitch),symbol:normalizeHeadingSymbol(v.symbol),design:{desktop,mobile,motion}}
}
export function themeFromCurrent(name:string,store:{themePalette:ThemePalette;typography?:TypographySettings;glitchPalette:GlitchPalette;headingSymbol:HeadingSymbolStyle;studioControls?:StudioControls}):DesignTheme{
 return normalizeDesignTheme({schema:1,name,palette:store.themePalette,typography:store.typography,glitch:store.glitchPalette,symbol:store.headingSymbol,design:store.studioControls})
}
const KEY='jf-studio-design-themes-v1'
export function readDesignThemes():DesignTheme[]{
 try{const list:unknown=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(list)?list.slice(0,30).flatMap(value=>{try{return [normalizeDesignTheme(value)]}catch{return []}}):[]}catch{return []}
}
export function saveDesignThemes(themes:DesignTheme[]){
 localStorage.setItem(KEY,JSON.stringify(themes.slice(0,30).map(normalizeDesignTheme)))
}
