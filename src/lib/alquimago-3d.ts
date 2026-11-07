import {readMedia} from './media-store'
import {applyPublishedAnimationProfile,readAnimationProfile,type AnimationProfile} from './alquimago-animation-profile'
import {readAlquimagoStage,writeAlquimagoStage,normalizeAlquimagoStage,applyPublishedAlquimagoStage,type AlquimagoStage} from './alquimago-3d-stage'

export const ALQUIMAGO_SKIN_MEDIA='media://alquimago/skin/custom.glb'
export const ALQUIMAGO_SKIN_PATH='public/alquimago/skins/custom.glb'
export const ALQUIMAGO_REQUIRED_SHAPES=['Idle','Blink','Happy','Curious','Talk','Sleep','Pet','Surprised','Focused','Sad'] as const
export const ALQUIMAGO_OPTIONAL_SHAPES=['Breath','Tired','Angry','Confused','Excited','Shy','Love','Proud','Thinking','Worried','Laugh','Yawn','LookLeft','LookRight','LookUp','LookDown'] as const
export const ALQUIMAGO_SHAPES=[...ALQUIMAGO_REQUIRED_SHAPES,...ALQUIMAGO_OPTIONAL_SHAPES] as const
export const ALQUIMAGO_SHAPE_MAP:Record<string,string>={
 breath:'Breath',idle:'Idle',blink:'Blink',happy:'Happy',curious:'Curious',talk:'Talk',
 sleep:'Sleep',pet:'Pet',surprised:'Surprised',focused:'Focused',sad:'Sad',
 tired:'Tired',angry:'Angry',confused:'Confused',excited:'Excited',shy:'Shy',
 love:'Love',proud:'Proud',thinking:'Thinking',worried:'Worried',laugh:'Laugh',
 yawn:'Yawn',lookleft:'LookLeft',lookright:'LookRight',lookup:'LookUp',lookdown:'LookDown'
}
type SkinAdapter={dispose:()=>void;setExpression:(name:string)=>void;previewExpression:(name:string)=>void;setStage:(settings:AlquimagoStage)=>void}
type ThreeKit=typeof import('three')
type GltfKit=typeof import('three/addons/loaders/GLTFLoader.js')
let kitPromise:Promise<[ThreeKit,GltfKit]>|null=null
function kit(){return kitPromise??=Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js')])}
function keys(scene:import('three').Object3D):string[]{
 const names=new Set<string>()
 scene.traverse(node=>{
  const mesh=node as import('three').Mesh
  if(mesh.morphTargetDictionary)Object.keys(mesh.morphTargetDictionary).forEach(name=>names.add(name))
 })
 return [...names]
}
export async function inspectAlquimagoGLB(file:File):Promise<{found:string[];missing:string[];all:string[]}>{
 if(!/\.glb$/i.test(file.name))throw Error('Envie um arquivo .glb binário, exportado no Blender.')
 if(file.size===0||file.size>18*1024*1024)throw Error('O modelo deve ter até 18 MiB para manter o site leve.')
 const header=new DataView(await file.slice(0,12).arrayBuffer())
 if(header.byteLength!==12||header.getUint32(0,true)!==0x46546c67||
    header.getUint32(4,true)!==2||header.getUint32(8,true)!==file.size)
  throw Error('Arquivo GLB inválido. Exporte como glTF Binary (.glb), versão 2.0.')
 const [,loaders]=await kit()
 const gltf=await new loaders.GLTFLoader().parseAsync(await file.arrayBuffer(),'')
 const all=keys(gltf.scene)
 const found=ALQUIMAGO_SHAPES.filter(name=>all.includes(name))
 const missing=ALQUIMAGO_SHAPES.filter(name=>!all.includes(name))
 return {all,found:[...found],missing:[...missing]}
}
const LAYOUT_STYLE=String.raw`
/* Alquimago layout polish: dark, compact, accessible, no extra panels. */
:host(:not([data-mode="desktop"])) .panel{width:min(415px,calc(100vw - 20px))!important}
.panel-header{padding:14px 15px 12px!important;border-bottom:1px solid #b18cda49!important}
.panel-header .subtitle{font-size:11px!important;line-height:1.45!important;opacity:.9}
.tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px!important;padding:9px 12px!important}
.tab{min-width:0!important;min-height:37px!important;border-radius:11px!important;font-weight:600!important;white-space:nowrap}
.tab.selected{box-shadow:inset 0 0 0 1px #c99afa42;background:#7f4ba0a6!important}
.content{padding:13px 15px!important}
.chat-history{margin:4px 0 8px!important;padding-right:4px!important;scrollbar-gutter:stable;max-height:min(36vh,310px)!important}
.chat-bubble{line-height:1.63!important;overflow-wrap:anywhere}
.chat-form{display:flex!important;align-items:stretch;gap:8px!important}
.chat-form input{min-width:0!important;flex:1!important}
.chat-send{min-width:45px!important}
.shell:has(.chat-form) > .feedback{display:none!important}
#arcane-skin-label select{min-height:38px!important}
:host([data-mode="desktop"]) .panel{width:min(365px,100%)!important}
@media(max-width:520px){
 :host(:not([data-mode="desktop"])) .panel{width:min(365px,calc(100vw - 12px))!important;max-height:70dvh!important}
 .chat-history{max-height:26dvh!important}
 .content{padding:10px 12px!important}
}

/* Chat – compact messenger hierarchy with intentional contrast. */
.panel{border-radius:20px!important;border:1px solid #b783e28f!important;
 background:linear-gradient(155deg,#2a1d3beb,#161024f7 72%)!important;
 backdrop-filter:blur(22px);box-shadow:0 22px 70px #0d0619bd,0 0 0 1px #b18deb12!important}
.panel-header{background:linear-gradient(100deg,#5f3d823d,transparent 85%)!important}
.chat-history{border-radius:15px;background:linear-gradient(170deg,#120b1caa,#21142db8);
 border:1px solid #9469b22b;padding:10px!important;scrollbar-gutter:stable}
.chat-bubble{max-width:94%!important;border:1px solid #b68add55!important;
 box-shadow:0 5px 16px #0a06112e!important;font-size:12px!important;line-height:1.7!important}
.chat-bubble.from-familiar{background:linear-gradient(145deg,#3b2851,#271c37)!important;
 border-color:#aa7bc368!important;border-radius:7px 15px 15px 15px!important}
.chat-bubble.from-user{background:linear-gradient(145deg,#7b4ea9,#55377c)!important;
 border-color:#c79be3a8!important;border-radius:15px 15px 7px 15px!important}
.chat-form{padding-top:8px!important;border-top:1px solid #956fbc38}
.chat-form input{border:1px solid #8867adbd!important;background:#130d1e!important;
 min-height:44px!important;border-radius:13px!important;transition:border-color .2s,box-shadow .2s}
.chat-form input:focus{border-color:#c89af8!important;box-shadow:0 0 0 3px #b17ae123!important;outline:none!important}
.chat-send{background:linear-gradient(155deg,#a36fe0,#7147ac)!important;
 border:1px solid #c599ebaa!important;border-radius:13px!important;transition:transform .15s,filter .15s}
.chat-send:hover{filter:brightness(1.15);transform:translateY(-1px)}
.chat-suggestions{gap:6px!important}
.chat-suggestions button{background:#422c56a8!important;border-color:#9d74b185!important;border-radius:999px!important}
.chat-suggestions button:hover{background:#674583!important}
.chat-suggestions button:focus-visible{outline:2px solid #e8c7ff!important}
@media(max-width:520px){.chat-history{padding:7px!important}.chat-bubble{font-size:11.5px!important}}
/* A framed model viewport instead of a floating canvas without controls. */
.character.alquimago-3d-stage{
 width:var(--jf-stage-width,206px)!important;height:var(--jf-stage-height,248px)!important;
 border:1px solid #bc8deb8c!important;background:linear-gradient(150deg,#39234dbf,#171225e8)!important;
 border-radius:22px!important;padding:0!important;animation:none!important;
 transform:translate(var(--jf-stage-x,0px),var(--jf-stage-y,0px))!important;
 box-shadow:inset 0 0 0 1px #bb8cf022,0 16px 32px #08031491,0 0 20px #9767c21b!important;
 overflow:visible!important;filter:none!important;touch-action:none;will-change:auto
}
.character.alquimago-3d-stage:focus-visible{outline:2px solid #edcaff!important;outline-offset:3px}
.alquimago-3d-surface{position:absolute;inset:3px;border-radius:18px;overflow:hidden;
 background:radial-gradient(ellipse at 40% 24%,#75548e3d,transparent 68%);pointer-events:none}
.alquimago-3d-surface canvas{width:100%!important;height:100%!important;display:block}
.alquimago-3d-header{position:absolute;left:10px;top:9px;pointer-events:none;
 font:600 9px system-ui;color:#ead7ff;letter-spacing:.07em;text-shadow:0 2px 6px #050209}
.alquimago-3d-grip{position:absolute;right:-3px;bottom:-3px;width:26px;height:26px;touch-action:none;
 border:1px solid #c08efa;border-radius:9px 2px 17px 2px;background:#624182;
 cursor:nwse-resize;display:flex;align-items:center;justify-content:center;z-index:2;
 color:#f6e6ff;pointer-events:auto;font:600 14px system-ui;box-shadow:0 3px 8px #08031391}
.character.alquimago-3d-stage .affection-burst{display:none!important}
@media(max-width:520px){.character.alquimago-3d-stage{max-width:calc(100vw - 32px)!important}}

@media(prefers-reduced-motion:reduce){.character,.character svg{animation:none!important}}
`;
let skinAvailable=false
const observedRoots=new WeakSet<ShadowRoot>()
let availabilityChecked=false
let checking=false

function refreshSkinUI(root:ShadowRoot){
 const slot=root.getElementById('arcane-skin-label')
 const select=root.getElementById('alquimago-skin-choice') as HTMLSelectElement|null
 if(!slot||!select)return
 const option=Array.from(select.options).find(item=>item.value==='custom-3d')
 if(!option)return
 const label=skinAvailable?'Minha skin 3D (GLB)':'Minha skin 3D — importe primeiro'
 if(option.textContent!==label)option.textContent=label
 if(option.disabled===skinAvailable)option.disabled=!skinAvailable
 if(!slot.querySelector('#alquimago-import-skin')){
  const importButton=document.createElement('button')
  importButton.id='alquimago-import-skin'
  importButton.type='button'
  importButton.textContent='✦ Importar modelo 3D (.glb)'
  importButton.title='Abre o Ateliê de skins 3D no Local Studio; requer acesso de edição.'
  importButton.style.cssText='margin-top:9px;display:block;width:100%;padding:9px 10px;border:1px solid #a178db;border-radius:10px;background:#563978;color:#fff;font:600 11px system-ui;cursor:pointer'
  importButton.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('alquimago:request-skin-editor')))
  slot.appendChild(importButton)
 }
 if(!slot.querySelector('#alquimago-skin-status')){
  const tip=document.createElement('small')
  tip.id='alquimago-skin-status'
  tip.style.cssText='display:block;margin-top:7px;font:10px/1.45 system-ui;color:#c8b5d8'
  tip.textContent=skinAvailable?'Skin disponível neste site ou navegador.':'Nenhum modelo 3D instalado. Importe um arquivo GLB antes de selecionar.'
  slot.appendChild(tip)
 }else{
  const tip=slot.querySelector('#alquimago-skin-status')
  const message=skinAvailable?'Skin disponível neste site ou navegador.':'Nenhum modelo 3D instalado. Importe um arquivo GLB antes de selecionar.'
  if(tip?.textContent!==message)tip!.textContent=message
 }
}
async function checkSkinAvailability(){
 if(checking)return
 checking=true
 try{
  const file=await readMedia(ALQUIMAGO_SKIN_MEDIA)
  let available=Boolean(file)
  if(!available){
   const response=await fetch('/alquimago/skins/custom.glb',{method:'HEAD',cache:'no-store'})
   const type=response.headers.get('Content-Type')?.toLowerCase()||''
   available=response.ok&&!type.includes('text/html')&&
    (type.includes('octet-stream')||type.includes('model/gltf-binary')||type.includes('application/gltf'))
  }
  skinAvailable=available
 }catch{skinAvailable=false}
 finally{
  checking=false
  availabilityChecked=true
  const root=document.querySelector('alquimago-familiar')?.shadowRoot
  if(root)refreshSkinUI(root)
 }
}
function styleAlquimago(){
 const familiar=document.querySelector('alquimago-familiar')
 const root=familiar?.shadowRoot
 if(!root)return
 if(!root.getElementById('jf-layout-v1')){
  const css=document.createElement('style');css.id='jf-layout-v1';css.textContent=LAYOUT_STYLE
  root.append(css)
 }
 if(!observedRoots.has(root)){
  observedRoots.add(root)
  const shadowObserver=new MutationObserver(()=>refreshSkinUI(root))
  shadowObserver.observe(root,{childList:true,subtree:true})
 }
 refreshSkinUI(root)
 if(!availabilityChecked)void checkSkinAvailability()
}

export function registerAlquimago3D():void{
 // The familiar's own config normalizer intentionally omits stage3d.
 // Read the already-public manifest separately so visitors see the published framing.
 void fetch('/alquimago/config.json',{cache:'no-store'})
  .then(response=>response.ok?response.json():null)
  .then(body=>{applyPublishedAlquimagoStage(body?.appearance?.stage3d);applyPublishedAnimationProfile(body?.appearance?.animation3d)})
  .catch(()=>{/* default viewport remains available */})
 const observer=new MutationObserver(styleAlquimago)
 observer.observe(document.documentElement,{childList:true,subtree:true})
 window.addEventListener('alquimago:skin3d-imported',()=>{
  availabilityChecked=false
  void checkSkinAvailability()
 })
 styleAlquimago()
 const world=window as typeof window & {AlquimagoSkinRenderers?:{model3d?: (args:{host:HTMLElement;url:string;shapeKeys:Record<string,string>})=>SkinAdapter}}
 world.AlquimagoSkinRenderers??={}
 world.AlquimagoSkinRenderers.model3d=({host,url,shapeKeys})=>{
  let dead=false,frame=0,blobUrl='',mood='idle',start=performance.now()
  let renderer:import('three').WebGLRenderer|undefined
  let scene:import('three').Scene|undefined
  let camera:import('three').PerspectiveCamera|undefined
  let model:import('three').Object3D|undefined
  let morphs:Array<{dictionary:Record<string,number>;weights:number[]}>=[] 
  let preview:{name:string;until:number}|null=null
  let gazeX=0,gazeY=0,targetX=0,targetY=0
  let dims={w:0,h:0}
  const familiar=host.getRootNode() instanceof ShadowRoot
   ? (host.getRootNode() as ShadowRoot).host as HTMLElement&{
     selectedSkin?:string;skin?:{type:string;src:string};
     state?:{brain?:{energy?:number}};config?:{appearance?:{stage3d?:unknown}};
     applySkin?:()=>void;render?:()=>void
    }:null
  let settings=readAlquimagoStage(familiar)
  let animation=readAnimationProfile()
  const onProfileChanged=(event:Event)=>{const next=(event as CustomEvent<AnimationProfile>).detail;if(next)animation=next}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  host.classList.add('alquimago-3d-stage')
  const surface=document.createElement('span')
  surface.className='alquimago-3d-surface'
  const canvas=document.createElement('canvas')
  canvas.className='alquimago-model3d'
  surface.append(canvas)
  const caption=document.createElement('span')
  caption.className='alquimago-3d-header'
  caption.textContent='✦ FAMILIAR 3D'
  const grip=document.createElement('span')
  grip.className='alquimago-3d-grip'
  grip.setAttribute('aria-label','Redimensionar janela 3D')
  grip.title='Arraste para ajustar o tamanho'
  grip.textContent='↘'
  host.append(surface,caption,grip)
  const applyStage=(incoming:AlquimagoStage)=>{
   settings=normalizeAlquimagoStage(incoming)
   host.style.setProperty('--jf-stage-width',String(settings.width)+'px')
   host.style.setProperty('--jf-stage-height',String(settings.height)+'px')
   host.style.setProperty('--jf-stage-x',String(settings.offsetX)+'px')
   host.style.setProperty('--jf-stage-y',String(settings.offsetY)+'px')
   const width=Math.min(settings.width,Math.max(120,window.innerWidth-32)),height=settings.height
   if(renderer&&camera&&(dims.w!==width||dims.h!==height)){
    dims={w:width,h:height}
    renderer.setSize(width,height,false)
    camera.aspect=width/height
    camera.updateProjectionMatrix()
   }
   if(camera){
    const distance=4/settings.zoom,yaw=settings.cameraYaw*Math.PI/180
    camera.position.set(settings.focusX+Math.sin(yaw)*distance,settings.focusY+0.08,Math.cos(yaw)*distance)
    camera.lookAt(settings.focusX,settings.focusY,0)
   }
  }
  applyStage(settings)
  let gripStart:{x:number;y:number;width:number;height:number}|null=null
  const resizeStart=(e:PointerEvent)=>{
   if(e.button!==0)return
   e.stopPropagation();e.preventDefault()
   gripStart={x:e.clientX,y:e.clientY,width:settings.width,height:settings.height}
   grip.setPointerCapture(e.pointerId)
  }
  const resizeMove=(e:PointerEvent)=>{
   if(!gripStart)return
   e.stopPropagation();e.preventDefault()
   applyStage(writeAlquimagoStage({...settings,
    width:gripStart.width+e.clientX-gripStart.x,
    height:gripStart.height+e.clientY-gripStart.y}))
  }
  const resizeEnd=(e:PointerEvent)=>{
   if(!gripStart)return
   e.stopPropagation();e.preventDefault()
   gripStart=null
   if(grip.hasPointerCapture(e.pointerId))grip.releasePointerCapture(e.pointerId)
  }
  grip.addEventListener('pointerdown',resizeStart)
  grip.addEventListener('pointermove',resizeMove)
  grip.addEventListener('pointerup',resizeEnd)
  grip.addEventListener('pointercancel',resizeEnd)
  const onStageChanged=(event:Event)=>{
   const detail=(event as CustomEvent<AlquimagoStage>).detail
   if(detail)applyStage(detail)
  }
  const onPointer=(e:PointerEvent)=>{
   if(dead||!settings.followPointer||reduced.matches||e.pointerType==='touch'){
    targetX=0;targetY=0;return
   }
   const rect=host.getBoundingClientRect()
   const midX=(rect.left+rect.right)/2,midY=(rect.top+rect.bottom)/2
   const dx=e.clientX-midX,dy=e.clientY-midY
   if(Math.hypot(dx,dy)>650){targetX=0;targetY=0;return}
   targetX=Math.max(-1,Math.min(1,dx/380))
   targetY=Math.max(-1,Math.min(1,dy/360))
  }
  const onWheel=(e:WheelEvent)=>{
   // Shift+scroll adjusts the 3D camera; regular scrolling stays available.
   if(!e.shiftKey)return
   e.preventDefault();e.stopImmediatePropagation()
   applyStage(writeAlquimagoStage({...settings,zoom:settings.zoom+(e.deltaY<0?0.08:-0.08)}))
  }
  const onActivity=(e:Event)=>{
   const detail=(e as CustomEvent<{type?:string}>).detail
   if(detail?.type==='published')preview={name:'proud',until:performance.now()+2600}
  }
  window.addEventListener('alquimago:stage3d-changed',onStageChanged)
  window.addEventListener('alquimago:animation-profile',onProfileChanged)
  window.addEventListener('pointermove',onPointer,{passive:true})
  window.addEventListener('alquimago:activity',onActivity)
  host.addEventListener('wheel',onWheel,{capture:true,passive:false})
  const map=(name:string)=>shapeKeys[name]||ALQUIMAGO_SHAPE_MAP[name]||name
  const timing=(id:string)=>{
   const proper=ALQUIMAGO_SHAPES.find(key=>key.toLowerCase()===id.toLowerCase())
   return animation.shapes[proper||'Idle']
  }
  const mapped=(name:string)=>name.toLowerCase().replace(/[^a-z]/g,'')
  async function init(){
   try{
    const [T,{GLTFLoader}]=await kit()
    if(dead)return
    const local=url.endsWith('/alquimago/skins/custom.glb')?await readMedia(ALQUIMAGO_SKIN_MEDIA):undefined
    if(local)blobUrl=URL.createObjectURL(local)
    const asset=await new GLTFLoader().loadAsync(blobUrl||url)
    if(dead)return
    model=asset.scene
    scene=new T.Scene();scene.add(model)
    scene.add(new T.HemisphereLight(0xf6eaff,0x2c173e,2.2))
    const key=new T.DirectionalLight(0xffe7c7,2.3);key.position.set(2,3,4);scene.add(key)
    renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5))
    renderer.outputColorSpace=T.SRGBColorSpace
    const box=new T.Box3().setFromObject(model)
    if(box.isEmpty())throw Error('O GLB não contém malha visível.')
    const dimension=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3())
    const max=Math.max(dimension.x,dimension.y,dimension.z,0.001)
    model.scale.setScalar(2/max);model.position.copy(center).multiplyScalar(-2/max)
    camera=new T.PerspectiveCamera(34,settings.width/settings.height,0.01,100)
    camera.position.set(0,0.1,4/settings.zoom);camera.lookAt(0,0,0)
    model.traverse(node=>{
     const mesh=node as import('three').Mesh
     if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences)
      morphs.push({dictionary:mesh.morphTargetDictionary,weights:mesh.morphTargetInfluences})
    })
    applyStage(settings)
    const available=keys(model)
    window.dispatchEvent(new CustomEvent('alquimago:skin3d-ready',{detail:{available}}))
    const animate=(now:number)=>{
     if(dead||!renderer||!scene||!camera||!model)return
     if(!document.hidden){
      const elapsed=now-start,t=elapsed/1000,energy=familiar?.state?.brain?.energy
      const tired=typeof energy==='number'&&energy<34
      const raw=preview&&now<preview.until?preview.name:mood
      const expression=tired&&raw==='idle'?'tired':raw
      const chosen=new Map<string,number>()
      const set=(name:string,value:number)=>{
       const key=map(name),intensity=timing(name).intensity
       chosen.set(key,Math.min(1,Math.max(0,value*intensity)))
      }
      if(expression==='idle')set('idle',0.55)
      else if(expression!=='breath')set(expression,1)
      if(tired&&expression!=='sleep'&&expression!=='pet'&&expression!=='talk')set('tired',0.9)
      if(expression==='pet')set('love',0.55)
      if(expression==='focused')set('thinking',0.42)
      if(expression==='happy')set('excited',0.3)
      // Breath is an independent cyclical morph target. Emotional speed factors
      // alter cycle duration but never overwrite the artist's base settings.
      const brainMood=host.dataset.mood||'tranquilo'
      const mappedMood=tired&&brainMood!=='meditando'&&brainMood!=='sonolento'?'cansado':brainMood
      const rate=animation.breathMoodSpeed[mappedMood as keyof AnimationProfile['breathMoodSpeed']]||1
      const breathCycle=Math.max(180,timing('breath').durationMs/rate)
      const phase=(elapsed%breathCycle)/breathCycle
      const breath=0.5-0.5*Math.cos(phase*Math.PI*2)
      set('breath',expression==='breath'?1:breath)
      const blinkTiming=timing('blink')
      const blinkMs=elapsed%blinkTiming.intervalMs
      const blink=blinkMs<blinkTiming.durationMs?Math.sin(blinkMs/blinkTiming.durationMs*Math.PI):0
      set('blink',expression==='sleep'?1:blink)
      if(tired&&expression!=='sleep'){
       const yawnTiming=timing('yawn'),yawnMs=elapsed%yawnTiming.intervalMs
       if(yawnMs<yawnTiming.durationMs)
        set('yawn',Math.sin(yawnMs/yawnTiming.durationMs*Math.PI))
      }
      if(expression==='talk'){
       const talkDuration=timing('talk').durationMs
       set('talk',0.28+0.72*(0.5+0.5*Math.sin(elapsed/talkDuration*Math.PI*2)))
      }
      gazeX+=(targetX-gazeX)*(reduced.matches?1:0.055)
      gazeY+=(targetY-gazeY)*(reduced.matches?1:0.055)
      if(settings.followPointer&&!reduced.matches){
       if(gazeX<-.15)chosen.set(map('lookleft'),-gazeX*0.36)
       if(gazeX>.15)chosen.set(map('lookright'),gazeX*0.36)
       if(gazeY<-.15)chosen.set(map('lookup'),-gazeY*0.30)
       if(gazeY>.15)chosen.set(map('lookdown'),gazeY*0.30)
      }
      const frameDelta=Math.min(70,Math.max(1,now-(animate as typeof animate & {last?:number}).last!||16))
      ;(animate as typeof animate & {last?:number}).last=now
      for(const entry of morphs)for(const [name,index] of Object.entries(entry.dictionary)){
       const target=chosen.get(name)??0
       const duration=timing(name).durationMs
       const blend=reduced.matches?1:1-Math.exp(-frameDelta/(Math.max(60,duration)/4))
       entry.weights[index]+=(target-entry.weights[index])*blend
      }
      model.rotation.y=(reduced.matches?0:Math.sin(t*0.75)*0.025)+gazeX*0.12
      model.rotation.x=-gazeY*0.075
      renderer.render(scene,camera)
     }
     frame=requestAnimationFrame(animate)
    }
    frame=requestAnimationFrame(animate)
   }catch(error){
    if(dead)return
    console.error('Alquimago 3D:',error)
    if(familiar?.isConnected && familiar.selectedSkin==='custom-3d'){
     familiar.selectedSkin='padrao'
     familiar.skin={type:'svg',src:''}
     familiar.applySkin?.();familiar.render?.()
    }
    window.dispatchEvent(new CustomEvent('alquimago:skin3d-error',{detail:{message:'O GLB não carregou. Skin original restaurada.'}}))
   }
  }
  void init()
  return {
   setStage(next:AlquimagoStage){applyStage(next)},
   setExpression(name:string){
    const key=mapped(name)
    mood=Object.hasOwn(ALQUIMAGO_SHAPE_MAP,key)?key:'idle'
    if(['pet','love','surprised','laugh','yawn'].includes(mood))
     preview={name:mood,until:performance.now()+timing(mood).durationMs}
   },
   previewExpression(name:string){
    const key=mapped(name)
    if(Object.hasOwn(ALQUIMAGO_SHAPE_MAP,key))
     preview={name:key,until:performance.now()+Math.max(1800,timing(key).durationMs)}
   },
   dispose(){
    dead=true;cancelAnimationFrame(frame)
    window.removeEventListener('alquimago:stage3d-changed',onStageChanged)
    window.removeEventListener('alquimago:animation-profile',onProfileChanged)
    window.removeEventListener('pointermove',onPointer)
    window.removeEventListener('alquimago:activity',onActivity)
    host.removeEventListener('wheel',onWheel,true)
    grip.removeEventListener('pointerdown',resizeStart)
    grip.removeEventListener('pointermove',resizeMove)
    grip.removeEventListener('pointerup',resizeEnd)
    grip.removeEventListener('pointercancel',resizeEnd)
    if(model)model.traverse(node=>{
     const mesh=node as import('three').Mesh
     if(mesh.geometry)mesh.geometry.dispose()
     const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material]
     for(const material of materials)if(material){
      const mat=material as import('three').MeshStandardMaterial
      mat.map?.dispose();mat.dispose()
     }
    })
    renderer?.dispose()
    if(blobUrl)URL.revokeObjectURL(blobUrl)
    host.classList.remove('alquimago-3d-stage')
    host.style.removeProperty('--jf-stage-width')
    host.style.removeProperty('--jf-stage-height')
    host.style.removeProperty('--jf-stage-x')
    host.style.removeProperty('--jf-stage-y')
    surface.remove();caption.remove();grip.remove()
   }
  }
 }
}
