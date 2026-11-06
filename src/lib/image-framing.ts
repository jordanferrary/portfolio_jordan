import type { CSSProperties } from 'react'

/** Framing is independent for each view. Legacy projects default to the original center crop. */
export type ImageFraming={x:number;y:number;zoom:number}
export type ImageFramingKey='coverFocus'|'heroFocus'
export const DEFAULT_FRAMING:ImageFraming={x:50,y:50,zoom:1}
export function normalizeFraming(input:unknown):ImageFraming{
 const candidate=input&&typeof input==='object'?input as Partial<ImageFraming>:{}
 const limit=(value:unknown,defaultValue:number,min:number,max:number)=>{
  const number=typeof value==='number'?value:Number(value)
  return Number.isFinite(number)?Math.max(min,Math.min(max,number)):defaultValue
 }
 return {
  x:limit(candidate.x,50,0,100),
  y:limit(candidate.y,50,0,100),
  zoom:limit(candidate.zoom,1,1,2.5)
 }
}
export function framingStyle(value:unknown):CSSProperties{
 const frame=normalizeFraming(value)
 return {
  objectPosition:frame.x+'% '+frame.y+'%',
  '--jf-frame-zoom':frame.zoom
 } as CSSProperties
}
