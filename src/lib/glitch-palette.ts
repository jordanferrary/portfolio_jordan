import type {CSSProperties} from 'react'
import {normalizeHexColor} from './theme-palette'

/** Independent signal-corruption colors, never overrides the site art direction. */
export type GlitchPalette={
 magenta:string;cyan:string;lime:string;noise:string;dark:string;intensity:number
}
export type GlitchColorKey=Exclude<keyof GlitchPalette,'intensity'>
export const DEFAULT_GLITCH_PALETTE:GlitchPalette={
 magenta:'#D84CFF',cyan:'#5CF4FF',lime:'#ACFF58',noise:'#F6F7FF',dark:'#060410',intensity:1
}
export const GLITCH_COLORS:{key:GlitchColorKey;label:string;description:string}[]=[
 {key:'magenta',label:'Magenta neon',description:'Rupturas e interferências violetas'},
 {key:'cyan',label:'Ciano elétrico',description:'Canal digital e bordas cromáticas'},
 {key:'lime',label:'Verde-limão',description:'Falhas intensas e blocos luminosos'},
 {key:'noise',label:'Ruído e pixels',description:'Granulação e fragmentos claros'},
 {key:'dark',label:'Base escura',description:'Contraste atrás dos blocos'}
]
export const GLITCH_PRESETS:{name:string;palette:GlitchPalette}[]=[
 {name:'Signal Corruption',palette:{...DEFAULT_GLITCH_PALETTE}},
 {name:'Cyberpunk 2077',palette:{...DEFAULT_GLITCH_PALETTE,magenta:'#FF2DAA',cyan:'#29F7FF',lime:'#C1FF36',dark:'#05070E'}},
 {name:'Purple Haze',palette:{...DEFAULT_GLITCH_PALETTE,magenta:'#C04CFF',cyan:'#9F7DFF',lime:'#FF6DCD',dark:'#0D0616'}},
 {name:'Neon Terminal',palette:{...DEFAULT_GLITCH_PALETTE,magenta:'#F948D4',cyan:'#28FFE3',lime:'#85FF41',dark:'#030A0A'}}
]
export function normalizeGlitchPalette(value:unknown):GlitchPalette{
 const raw=value&&typeof value==='object'?value as Partial<Record<keyof GlitchPalette,unknown>>:{}
 const i=typeof raw.intensity==='number'?raw.intensity:Number(raw.intensity)
 return {
  magenta:normalizeHexColor(raw.magenta)??DEFAULT_GLITCH_PALETTE.magenta,
  cyan:normalizeHexColor(raw.cyan)??DEFAULT_GLITCH_PALETTE.cyan,
  lime:normalizeHexColor(raw.lime)??DEFAULT_GLITCH_PALETTE.lime,
  noise:normalizeHexColor(raw.noise)??DEFAULT_GLITCH_PALETTE.noise,
  dark:normalizeHexColor(raw.dark)??DEFAULT_GLITCH_PALETTE.dark,
  intensity:Number.isFinite(i)?Math.max(.5,Math.min(1.4,i)):DEFAULT_GLITCH_PALETTE.intensity
 }
}
export function glitchPaletteStyle(value:GlitchPalette):CSSProperties{
 const palette=normalizeGlitchPalette(value)
 return {
  '--jf-glitch-magenta':palette.magenta,
  '--jf-glitch-cyan':palette.cyan,
  '--jf-glitch-lime':palette.lime,
  '--jf-glitch-noise':palette.noise,
  '--jf-glitch-dark':palette.dark,
  '--jf-glitch-intensity':String(palette.intensity)
 } as CSSProperties
}
export function applyGlitchPalette(value:GlitchPalette):void{
 const root=document.documentElement.style
 const styles=glitchPaletteStyle(value) as Record<string,string>
 for(const [name,hex] of Object.entries(styles))root.setProperty(name,hex)
}
