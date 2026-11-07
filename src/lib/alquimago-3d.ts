import {readMedia} from './media-store'

export const ALQUIMAGO_SKIN_MEDIA='media://alquimago/skin/custom.glb'
export const ALQUIMAGO_SKIN_PATH='public/alquimago/skins/custom.glb'
export const ALQUIMAGO_SHAPES=['Idle','Blink','Happy','Curious','Talk','Sleep','Pet','Surprised','Focused','Sad'] as const
export const ALQUIMAGO_SHAPE_MAP:Record<string,string>={
 idle:'Idle',blink:'Blink',happy:'Happy',curious:'Curious',talk:'Talk',
 sleep:'Sleep',pet:'Pet',surprised:'Surprised',focused:'Focused',sad:'Sad'
}
type SkinAdapter={dispose:()=>void;setExpression:(name:string)=>void}
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
.panel:has(.chat-form) .feedback{display:none!important}
#arcane-skin-label select{min-height:38px!important}
:host([data-mode="desktop"]) .panel{width:min(365px,100%)!important}
@media(max-width:520px){
 :host(:not([data-mode="desktop"])) .panel{width:min(365px,calc(100vw - 12px))!important;max-height:70dvh!important}
 .chat-history{max-height:26dvh!important}
 .content{padding:10px 12px!important}
}
@media(prefers-reduced-motion:reduce){.character,.character svg{animation:none!important}}
`;
function styleAlquimago(){
 const familiar=document.querySelector('alquimago-familiar');
 if(!familiar?.shadowRoot||familiar.shadowRoot.getElementById('jf-layout-v1'))return
 const css=document.createElement('style');css.id='jf-layout-v1';css.textContent=LAYOUT_STYLE;
 familiar.shadowRoot.append(css)
}

export function registerAlquimago3D():void{
 const observer=new MutationObserver(styleAlquimago)
 observer.observe(document.documentElement,{childList:true,subtree:true})
 styleAlquimago()
 const world=window as typeof window & {AlquimagoSkinRenderers?:{model3d?: (args:{host:HTMLElement;url:string;shapeKeys:Record<string,string>})=>SkinAdapter}}
 world.AlquimagoSkinRenderers??={}
 world.AlquimagoSkinRenderers.model3d=({host,url,shapeKeys})=>{
  let dead=false,frame=0,blobUrl='',mood='idle',start=performance.now()
  let renderer:import('three').WebGLRenderer|undefined
  let scene:import('three').Scene|undefined
  let camera:import('three').PerspectiveCamera|undefined
  let model:import('three').Object3D|undefined
  let morphs:Array<{mesh:import('three').Mesh;dictionary:Record<string,number>;weights:number[]}>=[]
  const canvas=document.createElement('canvas')
  canvas.className='alquimago-model3d'
  canvas.style.cssText='width:116px;height:143px;display:block;pointer-events:none'
  host.append(canvas)
  async function init(){
   try{
    const [T,{GLTFLoader}]=await kit()
    if(dead)return
    const local=url.endsWith('/alquimago/skins/custom.glb')?await readMedia(ALQUIMAGO_SKIN_MEDIA):undefined
    if(local)blobUrl=URL.createObjectURL(local)
    const asset=await new GLTFLoader().loadAsync(blobUrl||url)
    if(dead)return
    model=asset.scene
    scene=new T.Scene()
    scene.add(model)
    scene.add(new T.HemisphereLight(0xf6eaff,0x2c173e,2.2))
    const key=new T.DirectionalLight(0xffe7c7,2.3);key.position.set(2,3,4);scene.add(key)
    renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'})
    renderer.setSize(116,143,false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5))
    renderer.outputColorSpace=T.SRGBColorSpace
    const box=new T.Box3().setFromObject(model)
    if(box.isEmpty())throw Error('O GLB não contém malha visível.')
    const dimension=box.getSize(new T.Vector3())
    const center=box.getCenter(new T.Vector3())
    const max=Math.max(dimension.x,dimension.y,dimension.z,0.001)
    model.scale.setScalar(2/max)
    model.position.copy(center).multiplyScalar(-2/max)
    camera=new T.PerspectiveCamera(34,116/143,0.01,100)
    camera.position.set(0,0.15,4)
    camera.lookAt(0,0,0)
    model.traverse(node=>{
     const mesh=node as import('three').Mesh
     if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences)
      morphs.push({mesh,dictionary:mesh.morphTargetDictionary,weights:mesh.morphTargetInfluences})
    })
    const available=keys(model)
    window.dispatchEvent(new CustomEvent('alquimago:skin3d-ready',{detail:{available}}))
    const animate=(now:number)=>{
     if(dead||!renderer||!scene||!camera)return
     if(!document.hidden){
      const t=(now-start)/1000
      const blink=(t%5.1)<0.14?Math.sin((t%5.1)/0.14*Math.PI):0
      const desired=new Map<string,number>()
      if(mood!=='idle')desired.set(shapeKeys[mood]||ALQUIMAGO_SHAPE_MAP[mood],0.95)
      else desired.set(shapeKeys.idle||'Idle',0.12)
      desired.set(shapeKeys.blink||'Blink',mood==='sleep'?1:blink)
      for(const entry of morphs)for(const [name,index] of Object.entries(entry.dictionary)){
       const target=desired.get(name)??0
       entry.weights[index]+=(target-entry.weights[index])*Math.min(1,0.14)
      }
      model!.rotation.y=Math.sin(t*0.8)*0.05
      renderer.render(scene,camera)
     }
     frame=requestAnimationFrame(animate)
    }
    frame=requestAnimationFrame(animate)
   }catch(error){
    if(dead)return
    console.error('Alquimago 3D:',error)
    canvas.remove()
    const familiar=(host.getRootNode() as ShadowRoot).host as (HTMLElement&{
      selectedSkin?:string;skin?:{type:string;src:string;shapeKeys?:Record<string,string>};
      applySkin?:()=>void;render?:()=>void
    })|undefined
    // A missing file or unsupported WebGL should never leave the mascot blank.
    if(familiar?.isConnected&&familiar.selectedSkin==='custom-3d'){
      familiar.selectedSkin='padrao'
      familiar.skin={type:'svg',src:''}
      familiar.applySkin?.()
      familiar.render?.()
    }
    window.dispatchEvent(new CustomEvent('alquimago:skin3d-error',{detail:{message:'O modelo 3D não carregou. A skin original foi restaurada.'}}))
   }
  }
  void init()
  return {
   setExpression(name:string){mood=Object.hasOwn(ALQUIMAGO_SHAPE_MAP,name)?name:'idle'},
   dispose(){
    dead=true;cancelAnimationFrame(frame)
    if(model)model.traverse(node=>{
     const mesh=node as import('three').Mesh
     if(mesh.geometry)mesh.geometry.dispose()
     const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material]
     for(const mat of mats)if(mat){
      const material=mat as import('three').MeshStandardMaterial
      material.map?.dispose()
      material.dispose()
     }
    })
    renderer?.dispose()
    if(blobUrl)URL.revokeObjectURL(blobUrl)
    canvas.remove()
   }
  }
 }
}
