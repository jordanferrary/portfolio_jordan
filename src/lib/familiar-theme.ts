/** Host-side palette bridge for the synchronized Shadow DOM widget.
 * Only interface paint is adapted: robot art, model materials and emotion effects stay intact. */
const paint=/^(?:background(?:-color|-image)?|color|border(?:-[\w-]+)?|box-shadow|text-shadow|outline(?:-color)?|caret-color|accent-color|scrollbar-color|-webkit-text-fill-color|filter)$/i
const colors=/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi
const ui=/(?:^:host(?:\([^)]*\))?$|\.(?:shell|panel(?:-[\w-]+)?|tabs?|content|line|muted|actions?|menu|badge|stat|bar|list-item|feedback|insight|thought|familiar-title|chat-[\w-]+|neural-[\w-]+|session-note|arcane-(?:control-label|cortex|advanced|toggle|ai-consent|orb-field)|orb-close|reviewed-learning|learning-[\w-]+|image-feedback|grimoire-[\w-]+|jf-(?:grimoire|mentor)[\w-]*|alquimago-3d-[\w-]+)(?![\w-])|#arcane-skin-label|\.character:focus-visible)/i
const art=/\.(?:orb-(?!close\b)[\w-]+|alquimago-orb|arcane-orb(?!-field\b)|arcane-skin-image|arc-(?:mouth|sigils)|eyes|rune|affection-burst|potion-[\w-]+)\b|\.character\s+svg/
function token(raw:string,property:string):string{
 let rgb:number[],alpha=1
 if(raw.startsWith('#')){
  let hex=raw.slice(1)
  if(hex.length===3||hex.length===4)hex=[...hex].map(c=>c+c).join('')
  rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16))
  if(hex.length===8)alpha=parseInt(hex.slice(6,8),16)/255
 }else{const values=raw.match(/[\d.]+/g)?.map(Number)??[];rgb=values.slice(0,3);alpha=values[3]??1}
 const [r,g,b]=rgb.map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,light=(max+min)/2
 if(!Number.isFinite(light))return raw
 const hue=delta?60*(max===r?((g-b)/delta+6)%6:max===g?(b-r)/delta+2:(r-g)/delta+4):0
 const neutralText=(property==='color'||property==='-webkit-text-fill-color')&&delta<.035&&light>.85
 if(!neutralText&&(delta<.035||hue<230||hue>315))return raw
 let name:string
 if(property==='scrollbar-color')name=light<.22?'--jf-scroll-track':'--jf-scroll-thumb'
 else if(property==='accent-color'||property==='caret-color')name='--jf-primary'
 else if(/shadow|filter/.test(property))name=light<.13?'--jf-background':light>.73?'--jf-secondary':'--jf-primary'
 else if(/border|outline/.test(property))name=light>.67?'--jf-secondary':'--jf-border'
 else if(property.startsWith('background'))name=light<.12?'--jf-studio-deep':light<.22?'--jf-studio-panel':light<.34?'--jf-studio-raised':light<.48?'--jf-familiar-action':'--jf-primary'
 else name=neutralText||light>.83?'--jf-text':light>.63?'--jf-muted':'--jf-secondary'
 const value='var('+name+')'
 return alpha>=.995?value:'color-mix(in srgb,'+value+' '+Math.round(alpha*100)+'%,transparent)'
}
export function themeChromeDeclarations(body:string):string{
 return body.replace(/(^|;)(\s*([\w-]+)\s*:\s*)([^;]+)/g,(match:string,separator:string,prefix:string,property:string,value:string)=>{
  property=property.toLowerCase()
  if(!paint.test(property))return match
  const next=value.replace(colors,(literal:string,offset:number)=>{
   if(/var\(\s*--[\w-]+\s*,\s*$/.test(value.slice(0,offset)))return literal
   return token(literal,property)
  }).replace(/var\(--violet\)/g,'var(--jf-secondary,var(--violet))').replace(/var\(--gold\)/g,'var(--jf-secondary,var(--gold))')
  return separator+prefix+next
 })
}
export function themeFamiliarChrome(css:string):string{
 return css.replace(/([^{}]+)\{([^{}]+)\}/g,(match:string,selector:string,body:string)=>{
  const clean=selector.replace(/\/\*[\s\S]*?\*\//g,'').trim()
  if(!ui.test(clean)||art.test(clean))return match
  return selector+'{'+themeChromeDeclarations(body)+'}'
 })
}
export function themeStudioModule(css:string):string{
 return css.replace(/([^{}]+)\{([^{}]+)\}/g,(match:string,selector:string,body:string)=>{
  const clean=selector.replace(/\/\*[\s\S]*?\*\//g,'').trim()
  if(!/\.(?:github-|studio-publish-trigger|jf-skin-|studio-hub-)/.test(clean)||/\.(?:github-publish-error|jf-skin-error|github-publish-security)\b/.test(clean))return match
  return selector+'{'+themeChromeDeclarations(body)+'}'
 })
}
const adaptedStyles=new WeakSet<HTMLStyleElement>()
export function adaptFamiliarStyles(root:ShadowRoot):void{
 for(const style of root.querySelectorAll('style')){
  if(adaptedStyles.has(style)||style.id==='jf-layout-v1')continue
  adaptedStyles.add(style)
  const original=style.textContent??''
  const next=themeFamiliarChrome(original)
  if(next!==original)style.textContent=next
 }
}
