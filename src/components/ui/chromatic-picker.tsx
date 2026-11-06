import { useEffect,useRef,useState,type CSSProperties,type PointerEvent } from 'react'
import { normalizeHexColor } from '../../lib/theme-palette'

type HSV={h:number;s:number;v:number}
type RGB={r:number;g:number;b:number}
const SIZE=300
const CENTER=150
const BLACK={x:150,y:56}
const WHITE={x:68,y:198}
const HUE={x:232,y:198}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const within=(n:number)=>clamp(Math.round(n),0,255)
function rgbToHex({r,g,b}:RGB):string{
 return '#'+[r,g,b].map(n=>within(n).toString(16).padStart(2,'0')).join('').toUpperCase()
}
function hexToRgb(value:string):RGB{
 const color=normalizeHexColor(value)??'#A63FFF'
 return {r:parseInt(color.slice(1,3),16),g:parseInt(color.slice(3,5),16),b:parseInt(color.slice(5,7),16)}
}
function hueRgb(hue:number):RGB{
 const h=((hue%360)+360)%360
 const x=1-Math.abs((h/60)%2-1)
 const [r,g,b]=h<60?[1,x,0]:h<120?[x,1,0]:h<180?[0,1,x]:h<240?[0,x,1]:h<300?[x,0,1]:[1,0,x]
 return {r:r*255,g:g*255,b:b*255}
}
function hsvToRgb({h,s,v}:HSV):RGB{
 const hue=hueRgb(h)
 return {
  r:255*v*(1-s)+v*s*hue.r,
  g:255*v*(1-s)+v*s*hue.g,
  b:255*v*(1-s)+v*s*hue.b
 }
}
function rgbToHsv({r,g,b}:RGB):HSV{
 const channels=[r/255,g/255,b/255]
 const max=Math.max(...channels),min=Math.min(...channels),d=max-min
 let h=0
 if(d>0){
  if(max===channels[0])h=60*(((channels[1]-channels[2])/d)%6)
  else if(max===channels[1])h=60*((channels[2]-channels[0])/d+2)
  else h=60*((channels[0]-channels[1])/d+4)
 }
 return {h:(h+360)%360,s:max===0?0:d/max,v:max}
}
function barycentric(x:number,y:number):[number,number,number]{
 const denominator=(WHITE.y-HUE.y)*(BLACK.x-HUE.x)+(HUE.x-WHITE.x)*(BLACK.y-HUE.y)
 const a=((WHITE.y-HUE.y)*(x-HUE.x)+(HUE.x-WHITE.x)*(y-HUE.y))/denominator
 const b=((HUE.y-BLACK.y)*(x-HUE.x)+(BLACK.x-HUE.x)*(y-HUE.y))/denominator
 return [a,b,1-a-b]
}
function trianglePosition({s,v}:HSV){
 const a=1-v,b=v*(1-s),c=v*s
 return {x:a*BLACK.x+b*WHITE.x+c*HUE.x,y:a*BLACK.y+b*WHITE.y+c*HUE.y}
}

export function ChromaticPicker({value,onChange}:{value:string;onChange:(next:string)=>void}){
 const [hsv,setHsv]=useState<HSV>(()=>rgbToHsv(hexToRgb(value)))
 const [hexDraft,setHexDraft]=useState(value)
 const [dragging,setDragging]=useState<'hue'|'triangle'|null>(null)
 const drag=useRef<'hue'|'triangle'|null>(null)
 const canvas=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{setHsv(rgbToHsv(hexToRgb(value)));setHexDraft(value)},[value])
 useEffect(()=>{
  const context=canvas.current?.getContext('2d')
  if(!context)return
  const image=context.createImageData(SIZE,SIZE)
  const pure=hueRgb(hsv.h)
  for(let y=BLACK.y;y<=WHITE.y;y++){
   for(let x=WHITE.x;x<=HUE.x;x++){
    const [a,b,c]=barycentric(x+.5,y+.5)
    if(a<-.001||b<-.001||c<-.001)continue
    const index=(y*SIZE+x)*4
    image.data[index]=within(255*b+pure.r*c)
    image.data[index+1]=within(255*b+pure.g*c)
    image.data[index+2]=within(255*b+pure.b*c)
    image.data[index+3]=255
   }
  }
  context.putImageData(image,0,0)
 },[hsv.h])
 const update=(next:HSV)=>{
  const sanitized={h:(next.h+360)%360,s:clamp(next.s,0,1),v:clamp(next.v,0,1)}
  setHsv(sanitized)
  onChange(rgbToHex(hsvToRgb(sanitized)))
 }
 const point=(event:PointerEvent<HTMLDivElement>)=>{
  const bounds=event.currentTarget.getBoundingClientRect()
  return {x:(event.clientX-bounds.left)*SIZE/bounds.width,y:(event.clientY-bounds.top)*SIZE/bounds.height}
 }
 const usePoint=(event:PointerEvent<HTMLDivElement>,target:'hue'|'triangle')=>{
  const {x,y}=point(event)
  if(target==='hue'){
   const angle=(Math.atan2(x-CENTER,CENTER-y)*180/Math.PI+360)%360
   update({...hsv,h:angle})
   return
  }
  const weights=barycentric(x,y).map(w=>Math.max(0,w))
  const total=weights.reduce((acc,n)=>acc+n,0)
  if(total<=0)return
  const white=weights[1]/total,hue=weights[2]/total
  const v=white+hue
  update({...hsv,v,s:v<=.000001?0:hue/v})
 }
 const down=(event:PointerEvent<HTMLDivElement>)=>{
  if(event.button!==0)return
  const {x,y}=point(event)
  const radius=Math.hypot(x-CENTER,y-CENTER)
  const weights=barycentric(x,y)
  const target=radius>=108&&radius<=148?'hue':weights.every(w=>w>=-.025)?'triangle':null
  if(!target)return
  drag.current=target
  setDragging(target)
  event.currentTarget.setPointerCapture(event.pointerId)
  usePoint(event,target)
 }
 const up=(event:PointerEvent<HTMLDivElement>)=>{
  drag.current=null
  setDragging(null)
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
 }
 const ringAngle=hsv.h*Math.PI/180
 const ringPosition={x:CENTER+126*Math.sin(ringAngle),y:CENTER-126*Math.cos(ringAngle)}
 const tri=trianglePosition(hsv)
 const rgb=hexToRgb(value)
 const number=(label:string,n:number,onValue:(value:number)=>void,max:number)=>
  <label className="chromatic-number" key={label}><span>{label}</span><input type="number" min="0" max={max} step="1" value={Math.round(n)} onChange={e=>{const v=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(v))onValue(clamp(v,0,max))}}/></label>
 const slider=(label:string,n:number,max:number,onValue:(v:number)=>void)=>
  <label className="chromatic-slider" key={label}><span>{label}<b>{Math.round(n)}{label==='Matiz'?'°':'%'}</b></span><input type="range" min="0" max={max} step="1" value={Math.round(n)} onChange={e=>onValue(Number(e.target.value))}/></label>
 const pickerStyle={'--picker-hue':rgbToHex(hueRgb(hsv.h))} as CSSProperties
 return <div className="chromatic-picker" style={pickerStyle}>
  <div className="chromatic-wheel-layout">
   <div className={'chromatic-wheel'+(dragging?' is-dragging':'')} style={pickerStyle} onPointerDown={down} onPointerMove={e=>{if(drag.current)usePoint(e,drag.current)}} onPointerUp={up} onPointerCancel={up} aria-label="Círculo cromático: clique no aro para escolher matiz e no triângulo para saturação e luminosidade">
    <div className="chromatic-hue-ring" aria-hidden="true"/>
    <canvas className="chromatic-triangle-canvas" width={SIZE} height={SIZE} ref={canvas} aria-hidden="true"/>
    <span className="chromatic-hue-cursor" style={{left:ringPosition.x/SIZE*100+'%',top:ringPosition.y/SIZE*100+'%'}}/>
    <span className="chromatic-triangle-cursor" style={{left:tri.x/SIZE*100+'%',top:tri.y/SIZE*100+'%',background:rgbToHex(hsvToRgb(hsv))}}/>
   </div>
   <div className="chromatic-hsv-sliders">
    {slider('Matiz',hsv.h,360,h=>update({...hsv,h}))}
    {slider('Saturação',hsv.s*100,100,s=>update({...hsv,s:s/100}))}
    {slider('Brilho',hsv.v*100,100,v=>update({...hsv,v:v/100}))}
    <p>Arraste o aro para escolher a matiz e o triângulo para controlar saturação e brilho.</p>
   </div>
  </div>
  <div className="chromatic-values">
   <label className="chromatic-hex"><span>HEX</span><div><span className="chromatic-color-sample" style={{background:value}}/><input value={hexDraft} spellCheck={false} maxLength={7} onChange={e=>{setHexDraft(e.target.value);const hex=normalizeHexColor(e.target.value);if(hex)onChange(hex)}} onBlur={()=>setHexDraft(value)} aria-label="Cor hexadecimal"/></div></label>
   <div className="chromatic-rgb">{number('R',rgb.r,r=>onChange(rgbToHex({...rgb,r})),255)}{number('G',rgb.g,g=>onChange(rgbToHex({...rgb,g})),255)}{number('B',rgb.b,b=>onChange(rgbToHex({...rgb,b})),255)}</div>
  </div>
 </div>
}
