import type {CSSProperties} from 'react'
import {normalizeHexColor} from './theme-palette'

/** Theme mode inherits the seven global Studio colors; custom mode keeps manual overrides. */
export type BrandLogoAppearance={
 mode:'auto'|'custom'
 primary:string
 secondary:string
 glow:string
 glowStrength:number
}
export const DEFAULT_BRAND_LOGO_APPEARANCE:BrandLogoAppearance={
 mode:'auto',
 primary:'#A234FA',
 secondary:'#CB89FF',
 glow:'#A234FA',
 glowStrength:70
}
export function normalizeBrandLogoAppearance(raw:unknown):BrandLogoAppearance{
 const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Partial<Record<keyof BrandLogoAppearance,unknown>>:{}
 const strength=typeof value.glowStrength==='number'?value.glowStrength:Number(value.glowStrength)
 return {
  mode:value.mode==='custom'?'custom':'auto',
  primary:normalizeHexColor(value.primary)??DEFAULT_BRAND_LOGO_APPEARANCE.primary,
  secondary:normalizeHexColor(value.secondary)??DEFAULT_BRAND_LOGO_APPEARANCE.secondary,
  glow:normalizeHexColor(value.glow)??DEFAULT_BRAND_LOGO_APPEARANCE.glow,
  glowStrength:Number.isFinite(strength)?Math.max(0,Math.min(100,Math.round(strength))):DEFAULT_BRAND_LOGO_APPEARANCE.glowStrength
 }
}
/** Applied to the real sidebar and Studio preview; automatic colors update live as theme CSS variables change. */
export function brandLogoStyle(raw:BrandLogoAppearance):CSSProperties{
 const value=normalizeBrandLogoAppearance(raw)
 return {
  '--jf-brand-primary':value.mode==='auto'?'var(--jf-primary,#A234FA)':value.primary,
  '--jf-brand-secondary':value.mode==='auto'?'var(--jf-secondary,#CB89FF)':value.secondary,
  '--jf-brand-glow':value.mode==='auto'?'var(--jf-primary,#A234FA)':value.glow,
  '--jf-brand-glow-strength':value.glowStrength+'%'
 } as CSSProperties
}
