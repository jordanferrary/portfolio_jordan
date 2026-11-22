/** Bounded public typography; existing projects retain their original scale. */
export type TypographySettings={headingScale:number;bodyScale:number;headingFont:'manrope'|'dm-sans';bodyFont:'dm-sans'|'manrope'}
export const DEFAULT_TYPOGRAPHY:TypographySettings={headingScale:1,bodyScale:1,headingFont:'manrope',bodyFont:'dm-sans'}
export function normalizeTypography(raw:unknown):TypographySettings{
 const value=raw&&typeof raw==='object'?raw as Partial<TypographySettings>:{}
 const scale=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?Math.max(.9,Math.min(1.15,Math.round(n*100)/100)):1
 return {headingScale:scale(value.headingScale),bodyScale:scale(value.bodyScale),headingFont:value.headingFont==='dm-sans'?'dm-sans':'manrope',bodyFont:value.bodyFont==='manrope'?'manrope':'dm-sans'}
}
export function applyTypography(raw:unknown){
 const value=normalizeTypography(raw)
 const root=document.documentElement.style
 root.setProperty('--jf-heading-scale',String(value.headingScale))
 root.setProperty('--jf-body-scale',String(value.bodyScale))
 root.setProperty('--jf-heading-family',value.headingFont==='manrope'?"'Manrope',sans-serif":"'DM Sans',sans-serif")
 root.setProperty('--jf-body-family',value.bodyFont==='manrope'?"'Manrope',sans-serif":"'DM Sans',sans-serif")
}
