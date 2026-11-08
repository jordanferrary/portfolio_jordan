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
/* Public familiar is simple; creator tools live in the Studio hub. */
:host([data-public-mode="true"]) .tabs,
:host([data-public-mode="true"]) .arcane-advanced,
:host([data-public-mode="true"]) .session-note{display:none!important}
:host([data-public-mode="true"]) .panel{width:min(320px,calc(100vw - 16px))!important}
:host([data-public-mode="true"]) .panel-header{border-bottom:1px solid #8c62a345!important}
:host([data-public-mode="true"]) .content .actions{display:grid!important;grid-template-columns:1fr 1fr;gap:6px}
:host([data-public-mode="true"]) .content .actions .action{border-radius:11px!important}
:host([data-public-mode="true"]) .content .muted{font-size:11px}
.jf-grimoire-head{margin-bottom:11px;border:1px solid #ac7ec94f;border-radius:15px;
 background:linear-gradient(135deg,#5d36803c,#29193735);padding:12px 14px;display:flex;
 align-items:flex-start;justify-content:space-between;gap:8px}
.jf-grimoire-head strong{display:block;font:700 14px system-ui;color:#f4e3ff}
.jf-grimoire-head p{font:11px/1.5 system-ui;color:#cbb3df;margin:4px 0 0}
.jf-grimoire-pill{flex:0 0 auto;background:#623d86;border:1px solid #b886dc70;
 color:#f0d9ff;border-radius:999px;padding:4px 7px;font:600 9px system-ui}
.jf-mentor-tools{border:1px solid #8763a453!important;border-radius:13px;
 padding:11px 12px;margin-top:10px;background:#22152ee3!important}
.jf-mentor-tools summary{cursor:pointer;color:#ead0ff;font:600 11px system-ui}
.jf-mentor-tools .arcane-ai-consent{margin-top:13px}
.jf-mentor-tools .neural-lesson{margin-top:12px}
.jf-mentor-tools:focus-within{border-color:#c18be8!important}

@media(max-width:520px){.character.alquimago-3d-stage{max-width:calc(100vw - 32px)!important}}

@media(prefers-reduced-motion:reduce){.character,.character svg{animation:none!important}}


/* GRIMORIO 2.0 — a real creator workspace rather than a 360px widget. */
:host([data-public-mode="false"]:not([data-mode="desktop"])) .panel{
 position:fixed!important;
 right:clamp(152px,11vw,194px)!important;left:auto!important;
 top:auto!important;bottom:16px!important;
 width:min(790px,calc(100vw - 188px))!important;
 height:min(710px,calc(100dvh - 32px))!important;
 min-height:360px!important;max-height:calc(100dvh - 32px)!important;
 border:1px solid #9169bd!important;border-radius:24px!important;
 background:linear-gradient(145deg,#24162f 0%,#160f23 45%,#0e0b19 100%)!important;
 box-shadow:0 25px 85px #07020cdb,0 0 0 1px #d4a7fa21 inset!important;
 isolation:isolate;overflow:hidden!important;backdrop-filter:none!important;
}
:host([data-public-mode="false"]) .panel.open{display:flex!important;flex-direction:column!important}
:host([data-public-mode="false"]) .panel.expanded{
 right:clamp(18px,3vw,45px)!important;
 width:min(1100px,calc(100vw - 72px))!important;
}
:host([data-position="bottom-left"][data-public-mode="false"]) .panel{
 right:auto!important;left:clamp(152px,11vw,194px)!important
}
:host([data-position="bottom-left"][data-public-mode="false"]) .panel.expanded{
 left:clamp(18px,3vw,45px)!important;right:auto!important
}
:host([data-public-mode="false"]) .panel-header{
 flex:0 0 auto!important;padding:19px 23px 17px!important;
 background:radial-gradient(ellipse at 5% 0%,#74439930,transparent 67%),#22152f!important;
 border-bottom:1px solid #8662a74d!important
}
:host([data-public-mode="false"]) .panel-header .row{
 display:flex!important;align-items:center!important;justify-content:flex-start!important;
 gap:12px!important
}
.grimoire-brand-mark{
 width:43px;height:43px;display:grid;place-items:center;flex:0 0 43px;
 border:1px solid #b984e28c;border-radius:13px;color:#f4d8ff;
 background:radial-gradient(circle at 32% 21%,#8152b2,#482664 76%);
 box-shadow:0 7px 22px #8b50b831;font:24px/1 system-ui
}
.grimoire-brand{display:flex;flex-direction:column;min-width:0;gap:2px;flex:1}
.grimoire-kicker{color:#cba1e9;font:700 9px/1.4 system-ui;letter-spacing:.14em}
:host([data-public-mode="false"]) .panel-header .grimoire-brand b{
 font:750 22px/1.18 system-ui!important;color:#fff0ff;letter-spacing:-.025em!important
}
:host([data-public-mode="false"]) .panel-header .subtitle{
 margin:7px 0 0 55px;color:#bba6cb;font-size:11px!important;line-height:1.45!important
}
:host([data-public-mode="false"]) .panel-header .badge{
 padding:6px 10px;font-size:10px;border-radius:999px;
 background:#423056;border-color:#9570b38e;color:#ead7ff;white-space:nowrap
}
:host([data-public-mode="false"]) .panel-close{
 flex:0 0 34px;width:34px;height:34px;border-radius:10px;
 background:#342145;border:1px solid #8f63ad;color:#f7ddff;
 transition:background .15s,border-color .15s;cursor:pointer
}
:host([data-public-mode="false"]) .panel-close:hover{background:#5e3c79;border-color:#bf90de}
.grimoire-size-toggle{font:22px/1 system-ui!important}
.grimoire-layout{
 flex:1 1 auto;min-height:0;min-width:0;display:grid;
 grid-template-columns:164px minmax(0,1fr);overflow:hidden
}
:host([data-public-mode="false"]) .panel .grimoire-layout>.tabs{
 min-height:0!important;min-width:0!important;
 display:flex!important;flex-direction:column!important;align-items:stretch!important;
 gap:7px!important;grid-template-columns:none!important;
 padding:20px 11px!important;margin:0!important;
 background:linear-gradient(180deg,#21152f,#160e22)!important;
 border-bottom:0!important;border-right:1px solid #66487864;
 overflow-y:auto!important;overflow-x:hidden!important;
}
:host([data-public-mode="false"]) .grimoire-layout .tab{
 width:100%;display:flex;align-items:center;justify-content:flex-start;
 gap:10px;flex:0 0 auto!important;padding:12px 13px!important;
 text-align:left;min-height:46px!important;
 background:transparent!important;border:1px solid transparent!important;
 color:#c7b4d8!important;border-radius:12px!important;
 font:650 12px/1.3 system-ui!important;
 transition:background .15s,border-color .15s,color .15s
}
.grimoire-nav-icon{
 flex:0 0 24px;height:24px;width:24px;display:grid;place-items:center;
 border-radius:7px;background:#ffffff0b;color:#c49de0;font:16px/1 system-ui
}
:host([data-public-mode="false"]) .grimoire-layout .tab.selected{
 background:linear-gradient(105deg,#69428e9a,#4e306e7c)!important;
 border-color:#a679cf7d!important;color:#fff!important;
 box-shadow:inset 3px 0 #d398f6!important
}
:host([data-public-mode="false"]) .grimoire-layout .tab:hover{
 background:#764d962b!important;border-color:#9e74b553!important
}
:host([data-public-mode="false"]) .grimoire-layout .tab:focus-visible,
:host([data-public-mode="false"]) .panel-close:focus-visible,
:host([data-public-mode="false"]) .chat-send:focus-visible,
:host([data-public-mode="false"]) .chat-suggestions button:focus-visible{
 outline:2px solid #e9b8ff!important;outline-offset:2px!important
}
:host([data-public-mode="false"]) .grimoire-layout>.content{
 flex:1 1 auto!important;min-width:0!important;min-height:0!important;
 max-height:none!important;overflow:auto!important;
 background:radial-gradient(ellipse at 92% 4%,#6e448b18,transparent 62%),#150f21;
 padding:22px!important;scrollbar-gutter:stable
}
:host([data-public-mode="false"]) .grimoire-layout>.content:has(.grimoire-conversation){
 padding:0!important;overflow:hidden!important;scrollbar-gutter:auto
}
.grimoire-conversation{
 display:flex;flex-direction:column;height:100%;min-height:0;min-width:0;
 overflow:hidden
}
.grimoire-conversation-header{
 flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
 gap:12px;padding:16px 22px 14px;border-bottom:1px solid #5c407145;
 background:#22172e6b
}
.grimoire-conversation-title{display:flex;flex-direction:column;gap:4px;min-width:0}
.grimoire-conversation-title>span{
 font:700 9px/1.3 system-ui;letter-spacing:.14em;color:#bd90db
}
.grimoire-conversation-title strong{
 font:750 15px/1.3 system-ui;color:#f6eaff
}
.grimoire-answer-source{
 display:block;max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
 border:1px solid #7c589a73;background:#352448;color:#dabcf0;
 padding:6px 9px;border-radius:999px;font:600 10px/1.3 system-ui
}
:host([data-public-mode="false"]) .grimoire-conversation .chat-history{
 flex:1 1 auto!important;min-height:0!important;max-height:none!important;
 overflow-y:auto!important;overscroll-behavior:contain;
 margin:0!important;padding:24px 24px 20px!important;
 display:flex;flex-direction:column;align-items:stretch;gap:13px!important;
 border:0!important;border-radius:0!important;
 background:transparent!important;scrollbar-gutter:stable!important
}
:host([data-public-mode="false"]) .chat-bubble{
 max-width:min(86%,540px)!important;
 padding:13px 16px!important;font:500 13px/1.65 system-ui!important;
 border-radius:16px!important;box-shadow:0 4px 18px #06021146!important;
 overflow-wrap:anywhere;white-space:pre-wrap
}
:host([data-public-mode="false"]) .chat-bubble.from-familiar{
 background:linear-gradient(135deg,#362347,#251932)!important;
 border:1px solid #765391a6!important;border-radius:5px 17px 17px 17px!important;
 color:#f3e9ff
}
:host([data-public-mode="false"]) .chat-bubble.from-user{
 background:linear-gradient(130deg,#8353b1,#633d92)!important;
 border:1px solid #b28bdb!important;border-radius:17px 17px 5px 17px!important;
 color:#fff
}
.grimoire-composer{
 flex:0 0 auto;display:flex;flex-direction:column;gap:10px;
 padding:13px 22px 15px;background:linear-gradient(180deg,#1c132a,#20132e);
 border-top:1px solid #76529062
}
:host([data-public-mode="false"]) .grimoire-composer .chat-form{
 display:flex!important;align-items:stretch!important;gap:10px!important;
 margin:0!important;padding:0!important;border:0!important
}
:host([data-public-mode="false"]) .grimoire-composer .chat-form input{
 flex:1;min-width:0;min-height:48px!important;
 background:#100b1a!important;border:1px solid #8967a8!important;
 border-radius:13px!important;color:#fff;font:500 13px/1.4 system-ui!important;
 padding:13px 16px!important
}
:host([data-public-mode="false"]) .grimoire-composer .chat-form input:focus{
 border-color:#cb94f4!important;box-shadow:0 0 0 3px #a26ed82b!important
}
:host([data-public-mode="false"]) .grimoire-composer .chat-send{
 flex:0 0 51px;min-width:51px!important;min-height:48px!important;height:auto!important;
 display:grid;place-items:center;border-radius:13px!important;
 background:linear-gradient(135deg,#a16bd9,#7047a1)!important;
 border:1px solid #c396e6!important;color:#fff;font-size:19px
}
:host([data-public-mode="false"]) .grimoire-composer .chat-suggestions{
 display:flex;gap:7px!important;flex-wrap:wrap;margin:0!important
}
:host([data-public-mode="false"]) .grimoire-composer .chat-suggestions button{
 border-radius:999px!important;font:600 10px/1.3 system-ui!important;
 padding:7px 11px!important;color:#dfc8ef!important;
 border:1px solid #8763a484!important;background:#4530548a!important
}
:host([data-public-mode="false"]) .grimoire-composer .chat-suggestions button:hover{
 background:#62447d!important;border-color:#bd8bdf!important
}
.grimoire-mentor{
 flex:0 0 auto;max-height:min(29dvh,240px);
 overflow-y:auto;background:#1c142b;border-top:1px solid #64497b5e;
 color:#d7c3e8
}
.grimoire-mentor>summary{
 list-style:none;cursor:pointer;padding:13px 22px;
 display:flex;align-items:center;gap:8px;
 font:700 11px/1.45 system-ui;color:#e9d2f7
}
.grimoire-mentor>summary::-webkit-details-marker{display:none}
.grimoire-mentor>summary:after{content:'⌄';margin-left:auto;font-size:14px;color:#b99aca}
.grimoire-mentor[open]>summary:after{content:'⌃'}
.grimoire-mentor>summary:hover{background:#39234775}
.grimoire-mentor>.neural-teach,.grimoire-mentor>.neural-lesson,
.grimoire-mentor>.arcane-ai-consent,.grimoire-mentor>.session-note,
.grimoire-mentor>.grimoire-diagnostics{margin:9px 18px!important}
.grimoire-conversation>.alquimago-lesson-review{
 flex:0 0 auto;margin:10px 20px;max-height:min(26dvh,240px);overflow-y:auto
}
:host([data-public-mode="false"]) .panel:has(.grimoire-conversation)>.feedback{display:none!important}
:host([data-public-mode="false"]) .panel>.feedback{
 flex:0 0 auto;min-height:36px;max-height:60px;padding:10px 20px;
 font:11px/1.4 system-ui;color:#bca6cb;background:#170e22
}
@media(max-width:1010px){
 :host([data-public-mode="false"]:not([data-mode="desktop"])) .panel{
  width:min(700px,calc(100vw - 172px))!important;right:148px!important
 }
 :host([data-position="bottom-left"][data-public-mode="false"]) .panel{
  left:148px!important;right:auto!important
 }
 :host([data-public-mode="false"]) .grimoire-layout{grid-template-columns:146px minmax(0,1fr)}
}
@media(max-width:760px){
 :host([data-public-mode="false"]:not([data-mode="desktop"])) .panel,
 :host([data-position="bottom-left"][data-public-mode="false"]) .panel{
  top:9px!important;left:9px!important;right:9px!important;bottom:9px!important;
  width:calc(100vw - 18px)!important;height:calc(100dvh - 18px)!important;
  min-height:0!important;max-height:calc(100dvh - 18px)!important;
  border-radius:17px!important
 }
 :host([data-public-mode="false"]) .panel.expanded{left:9px!important;right:9px!important;width:calc(100vw - 18px)!important}
 :host([data-public-mode="false"]) .grimoire-layout{
  display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)
 }
 :host([data-public-mode="false"]) .panel .grimoire-layout>.tabs{
  flex-direction:row!important;gap:7px!important;overflow-x:auto!important;overflow-y:hidden!important;
  border-bottom:1px solid #66487864!important;border-right:0!important;padding:9px 12px!important
 }
 :host([data-public-mode="false"]) .grimoire-layout .tab{
  width:auto!important;min-width:0!important;min-height:40px!important;
  padding:9px 11px!important;flex:1 0 auto!important;justify-content:center
 }
 :host([data-public-mode="false"]) .panel-header{padding:12px 13px!important}
 .grimoire-brand-mark{width:36px;height:36px;flex-basis:36px}
 :host([data-public-mode="false"]) .panel-header .grimoire-brand b{font-size:18px!important}
 :host([data-public-mode="false"]) .panel-header .subtitle{margin-left:0;font-size:10px!important}
 :host([data-public-mode="false"]) .grimoire-conversation-header{padding:10px 13px}
 :host([data-public-mode="false"]) .grimoire-conversation .chat-history{padding:15px 13px!important}
 :host([data-public-mode="false"]) .grimoire-composer{padding:10px 12px}
 :host([data-public-mode="false"]) .chat-bubble{font-size:12px!important;max-width:92%!important}
 .grimoire-mentor>summary{padding:10px 13px}
}
@media(max-width:410px){
 :host([data-public-mode="false"]) .panel-header .badge{display:none}
 .grimoire-kicker{font-size:8px}
 .grimoire-answer-source{max-width:44%;font-size:9px}
 .grimoire-conversation-title strong{font-size:13px}
 :host([data-public-mode="false"]) .grimoire-layout .tab{font-size:10px!important;gap:5px;padding:8px!important}
 .grimoire-nav-icon{width:18px;height:18px;flex-basis:18px}
}
@media(prefers-reduced-motion:reduce){
 :host([data-public-mode="false"]) .grimoire-layout .tab,
 :host([data-public-mode="false"]) .panel-close{transition:none!important}
}



/* A filtered ancestor creates a containing block for position:fixed.
   The familiar's drop-shadow must not offset its fullscreen creator panel. */
:host([data-public-mode="false"]:not([data-mode="desktop"])) .shell:has(.panel.open){
 filter:none!important;
}
/* Center the creator Grimório in the viewport, independent of mascot drag,
   left/right docking, browser width or sidebar size. A panel is not a page layout. */
@media(min-width:761px){
 :host([data-public-mode="false"]:not([data-mode="desktop"])) .panel.open,
 :host([data-position][data-public-mode="false"]:not([data-mode="desktop"])) .panel.open{
  position:fixed!important;
  inset:auto!important;
  left:50vw!important;top:50dvh!important;
  right:auto!important;bottom:auto!important;
  transform:translate(-50%,-50%)!important;
  width:min(920px,calc(100vw - 48px))!important;
  height:min(755px,calc(100dvh - 48px))!important;
  min-height:0!important;max-height:calc(100dvh - 48px)!important;
  margin:0!important;
 }
 :host([data-public-mode="false"]:not([data-mode="desktop"])) .panel.open.expanded,
 :host([data-position][data-public-mode="false"]:not([data-mode="desktop"])) .panel.open.expanded{
  left:50vw!important;right:auto!important;top:50dvh!important;bottom:auto!important;
  width:min(1140px,calc(100vw - 36px))!important;
  height:min(840px,calc(100dvh - 32px))!important;
  max-height:calc(100dvh - 32px)!important;
 }
}
@media(max-width:760px){
 :host([data-public-mode="false"]:not([data-mode="desktop"])) .panel.open,
 :host([data-position][data-public-mode="false"]:not([data-mode="desktop"])) .panel.open{
  left:9px!important;right:9px!important;top:9px!important;bottom:9px!important;
  transform:none!important;width:calc(100vw - 18px)!important;
  height:calc(100dvh - 18px)!important;
  max-height:calc(100dvh - 18px)!important;
 }
}
:host([data-public-mode="false"]) .grimoire-layout{
 width:100%;min-height:0;min-width:0;
}
:host([data-public-mode="false"]) .panel .grimoire-layout>.content{
 box-sizing:border-box;min-width:0;
}
.grimoire-size-toggle{
 border:1px solid #986cbe;border-radius:10px;padding:0;
 width:34px;height:34px;flex:0 0 34px;
 background:#382449;color:#f1ddff;
 cursor:pointer;font:19px/1 system-ui;
}
.grimoire-size-toggle:hover{background:#624180}
.grimoire-size-toggle:focus-visible{
 outline:2px solid #f4cbff;outline-offset:2px
}
.grimoire-mentor[open]{
 max-height:min(42dvh,340px);
}
.grimoire-mentor>.reviewed-learning{margin:10px 18px!important}
.grimoire-answer-source{max-width:min(52%,300px)}
@media(max-width:760px){
 .grimoire-answer-source{max-width:44%}
 .grimoire-conversation-header{min-width:0}
 .grimoire-conversation-header>*{min-width:0}
 .grimoire-layout>.content:has(.grimoire-conversation){min-height:0}
}


/* Grimório 2.2: compact header controls and a right-side training drawer.
   Only Alquimago's shadow DOM is styled; portfolio layout is untouched. */
:host([data-public-mode="false"]) .grimoire-conversation{position:relative!important}
:host([data-public-mode="false"]) .grimoire-conversation-header{
 flex-wrap:wrap;align-items:center;gap:8px 12px!important;padding:12px 20px!important
}
.grimoire-chat-actions{display:flex;align-items:center;gap:6px;margin-left:auto;flex:0 0 auto}
.grimoire-chat-action{
 appearance:none;cursor:pointer;border:1px solid #8e66ac;background:#332143;color:#efdafa;
 border-radius:9px;padding:7px 10px;font:650 11px/1.3 system-ui;white-space:nowrap
}
.grimoire-chat-action:hover,.grimoire-chat-action[aria-pressed="true"]{
 background:#6d4590;border-color:#c69af2;color:#fff
}
.grimoire-chat-action:focus-visible,.grimoire-drawer-close:focus-visible{
 outline:2px solid #efd0ff;outline-offset:2px
}
:host([data-public-mode="false"]) .grimoire-conversation .chat-history{
 flex:1 1 auto!important;min-height:0!important
}
.grimoire-side-panel{
 display:flex;flex-direction:column;position:absolute;top:0;bottom:0;right:0;
 width:min(430px,100%);max-width:100%;min-width:0;
 background:linear-gradient(150deg,#281935 0%,#171022 75%);
 border-left:1px solid #a878c4;box-shadow:-16px 0 42px #080412b3;
 z-index:9;overflow:hidden;opacity:0;visibility:hidden;
 transform:translateX(101%);pointer-events:none;
 transition:transform .22s ease,opacity .22s ease,visibility .22s
}
.grimoire-side-panel.is-open{
 transform:translateX(0);opacity:1;visibility:visible;pointer-events:auto
}
.grimoire-side-header{
 display:flex;align-items:center;justify-content:space-between;gap:10px;
 flex:0 0 auto;padding:16px 18px;background:#322140;
 border-bottom:1px solid #795499;color:#f8e8ff;font:700 14px system-ui
}
.grimoire-drawer-close{
 appearance:none;border:1px solid #9066b0;background:#412853;
 border-radius:10px;min-width:33px;height:33px;color:#f8eaff;cursor:pointer
}
.grimoire-panel-ai,.grimoire-panel-training{
 min-height:0;overflow-y:auto;overscroll-behavior:contain;
 padding:15px 18px 22px;flex:1 1 auto;color:#e5cfef;font:12px/1.55 system-ui
}
.grimoire-panel-ai>p,.grimoire-training-intro{
 margin:0 0 14px;padding:10px 12px;border-radius:10px;
 border:1px solid #76518d;background:#342248;color:#dfc8ec
}
.grimoire-side-panel:not([data-mode="ia"]) .grimoire-panel-ai,
.grimoire-side-panel:not([data-mode="teach"]) .grimoire-panel-training{display:none!important}
.grimoire-panel-training .neural-lesson,.grimoire-panel-training .reviewed-learning{
 display:block;margin:9px 0 14px!important;max-width:100%
}
.grimoire-panel-training .neural-lesson summary{padding:3px 0;line-height:1.5}
.grimoire-panel-training .learning-options{
 grid-template-columns:repeat(2,minmax(0,1fr));max-height:none!important;overflow:visible!important
}
.grimoire-panel-training .learning-option{overflow-wrap:anywhere}
.grimoire-panel-training .neural-teach{display:block!important}
.grimoire-panel-training .neural-teach .learning-controls{margin-bottom:12px}
.grimoire-panel-ai .arcane-ai-consent{
 display:flex;align-items:flex-start;margin:10px 0!important;padding:12px!important
}
.grimoire-panel-training .reviewed-learning textarea{min-height:96px}
:host([data-public-mode="false"]) .panel:has(.grimoire-conversation)>.feedback{display:none!important}
@media(max-width:930px){
 .grimoire-answer-source{display:none!important}
 .grimoire-chat-actions{gap:5px}
 .grimoire-chat-action{padding:7px 9px}
}
@media(max-width:760px){
 .grimoire-chat-actions{width:100%;justify-content:flex-end}
 .grimoire-side-panel{width:100%;border-left:0}
 .grimoire-conversation-header{padding:10px 12px!important}
 .grimoire-chat-action{font-size:11px}
 .grimoire-panel-ai,.grimoire-panel-training{padding:12px 14px 18px}
}
@media(prefers-reduced-motion:reduce){
 .grimoire-side-panel{transition:none!important}
}

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
 const importButton=slot.querySelector('#alquimago-import-skin') as HTMLElement|null
 if(importButton)importButton.style.display=document.documentElement.dataset.alquimagoStudio==='true'?'block':'none'
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
   const response=await fetch(import.meta.env.BASE_URL+'alquimago/skins/custom.glb',{method:'HEAD',cache:'no-store'})
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
const grimoireDrawerState=new WeakMap<ShadowRoot,'ia'|'teach'|null>()
function enhanceGrimoire(root:ShadowRoot){
 const panel=root.getElementById('panel')
 const tabs=root.getElementById('tabs')
 const content=root.getElementById('content')
 const feedback=root.getElementById('feedback')
 if(!panel||!tabs||!content)return
 // Keep the widget's original nodes and delegated event listeners intact.
 if(!panel.querySelector(':scope > .grimoire-layout')){
  const layout=document.createElement('div')
  layout.className='grimoire-layout'
  panel.insertBefore(layout,feedback)
  layout.append(tabs,content)
 }
 if(root.host.getAttribute('data-public-mode')!=='false')return
 panel.setAttribute('role','dialog')
 panel.setAttribute('aria-label','Grimório do Alquimago')
 panel.setAttribute('aria-modal','false')
 const header=panel.querySelector('.panel-header .row')
 const title=root.getElementById('wizard-title')
 if(header&&title&&!header.querySelector('.grimoire-brand')){
  const mark=document.createElement('span')
  mark.className='grimoire-brand-mark'
  mark.setAttribute('aria-hidden','true')
  mark.textContent='✦'
  const brand=document.createElement('div')
  brand.className='grimoire-brand'
  const kicker=document.createElement('span')
  kicker.className='grimoire-kicker'
  kicker.textContent='FAMILIAR CRIATIVO'
  brand.append(kicker,title)
  header.prepend(mark,brand)
 }
 if(header&&!header.querySelector('.grimoire-size-toggle')){
  const resize=document.createElement('button')
  resize.className='grimoire-size-toggle'
  resize.type='button'
  resize.textContent='⤢'
  resize.title='Ampliar ou restaurar o Grimório'
  resize.setAttribute('aria-label','Ampliar Grimório')
  resize.setAttribute('aria-pressed','false')
  resize.addEventListener('click',()=>{
   const expanded=panel.classList.toggle('expanded')
   resize.textContent=expanded?'⤡':'⤢'
   resize.setAttribute('aria-label',expanded?'Restaurar tamanho do Grimório':'Ampliar Grimório')
   resize.setAttribute('aria-pressed',String(expanded))
  })
  header.insertBefore(resize,root.getElementById('close-panel'))
 }
 const icons=['✦','◈','↗','▣','◎','◇']
 for(const button of tabs.querySelectorAll<HTMLButtonElement>('button[data-tab]')){
  if(button.querySelector('.grimoire-nav-icon'))continue
  const idx=Number(button.dataset.tab)
  const icon=document.createElement('span')
  icon.className='grimoire-nav-icon'
  icon.setAttribute('aria-hidden','true')
  icon.textContent=icons[idx]||'✧'
  button.prepend(icon)
 }
 // The native Alquimago rebuilds the active tab after each message.
 if(content.querySelector(':scope > .grimoire-conversation'))return
 const history=content.querySelector<HTMLElement>(':scope > .chat-history')
 const form=content.querySelector<HTMLFormElement>('#alquimago-chat-form')
 if(!history||!form)return
 const conversation=document.createElement('section')
 conversation.className='grimoire-conversation'
 conversation.setAttribute('aria-label','Conversa com Alquimago')
 const conversationHeader=document.createElement('div')
 conversationHeader.className='grimoire-conversation-header'
 const heading=document.createElement('div')
 heading.className='grimoire-conversation-title'
 const kicker=document.createElement('span')
 kicker.textContent='CONVERSA ATIVA'
 const headline=document.createElement('strong')
 headline.textContent='Converse com o Alquimago'
 heading.append(kicker,headline)
 const source=document.createElement('span')
 source.className='grimoire-answer-source'
 source.textContent=(root.host as HTMLElement & {lastAnswerSource?:string}).lastAnswerSource||'Cérebro local'
 const actions=document.createElement('div')
 actions.className='grimoire-chat-actions'
 const makeAction=(label:string,title:string,action:string)=>{
  const button=document.createElement('button')
  button.type='button';button.textContent=label;button.title=title
  button.className='grimoire-chat-action'
  button.setAttribute('aria-label',title)
  button.dataset.grimoireAction=action
  return button
 }
 const ai=makeAction('IA','Professor Gemini (opcional)','ia')
 const teach=makeAction('Ensinar','Ensinar significados, tom e conhecimento','teach')
 const clear=makeAction('Limpar','Limpar somente a conversa; preservar o aprendizado','clear')
 clear.dataset.action='clear-chat' // handled by the Alquimago's own event delegation
 actions.append(ai,teach,clear)
 conversationHeader.append(heading,source,actions)
 const composer=document.createElement('div')
 composer.className='grimoire-composer'
 const formWrapper=form.parentElement
 if(formWrapper&&content.contains(formWrapper))composer.append(formWrapper)
 const suggestions=content.querySelector('.chat-suggestions')
 const suggestionsWrapper=suggestions?.parentElement
 if(suggestionsWrapper&&content.contains(suggestionsWrapper))composer.append(suggestionsWrapper)
 // Side drawer overlays the right edge and never shortens chat history.
 const drawer=document.createElement('aside')
 drawer.className='grimoire-side-panel'
 drawer.setAttribute('aria-label','Ferramentas de aprendizado do Alquimago')
 const drawerHeader=document.createElement('div')
 drawerHeader.className='grimoire-side-header'
 const drawerHeading=document.createElement('strong')
 const close=document.createElement('button')
 close.type='button';close.className='grimoire-drawer-close'
 close.textContent='✕';close.title='Fechar ferramentas'
 close.setAttribute('aria-label','Fechar ferramentas')
 drawerHeader.append(drawerHeading,close)
 const aiPanel=document.createElement('section')
 aiPanel.className='grimoire-panel-ai'
 const aiIntro=document.createElement('p')
 aiIntro.textContent='O Gemini é um professor opcional: só consulto quando não encontro uma resposta local. Suas explicações precisam ser aprovadas antes de virar memória.'
 aiPanel.append(aiIntro)
 const trainingPanel=document.createElement('section')
 trainingPanel.className='grimoire-panel-training'
 const trainingIntro=document.createElement('p')
 trainingIntro.className='grimoire-training-intro'
 const lastText=(root.host as HTMLElement & {lastUserText?:string}).lastUserText||''
 trainingIntro.textContent=lastText?'Última mensagem: “'+lastText.slice(0,155)+'”':'Envie uma mensagem no chat para ensinar o significado dela.'
 trainingPanel.append(trainingIntro)
 // Move native controls; do not clone, duplicate ids, or bypass lesson review.
 for(const item of Array.from(content.children)){
  if(item===history||item===formWrapper||item===suggestionsWrapper)continue
  const hasIA=item.classList.contains('arcane-ai-consent')||Boolean(item.querySelector('.arcane-ai-consent'))
  const hasTraining=item.classList.contains('neural-lesson')||
    item.classList.contains('reviewed-learning')||Boolean(item.querySelector('.neural-lesson'))
  if(hasIA&&!hasTraining)aiPanel.append(item)
  else trainingPanel.append(item)
 }
 drawer.append(drawerHeader,aiPanel,trainingPanel)
 const showMode=(mode:'ia'|'teach'|null)=>{
  grimoireDrawerState.set(root,mode)
  drawer.classList.toggle('is-open',mode!==null)
  drawer.setAttribute('data-mode',mode||'closed')
  drawerHeading.textContent=mode==='ia'?'IA · Professor Gemini':'Ensinar Alquimago'
  ai.setAttribute('aria-pressed',String(mode==='ia'))
  teach.setAttribute('aria-pressed',String(mode==='teach'))
  if(mode!==null)close.focus()
 }
 ai.addEventListener('click',()=>showMode(grimoireDrawerState.get(root)==='ia'?null:'ia'))
 teach.addEventListener('click',()=>showMode(grimoireDrawerState.get(root)==='teach'?null:'teach'))
 close.addEventListener('click',()=>showMode(null))
 conversation.append(conversationHeader,history,composer,drawer)
 content.append(conversation)
 const current=grimoireDrawerState.get(root)||null
 // The professor's pending explanation remains discoverable for approval.
 const answer=trainingPanel.querySelector<HTMLTextAreaElement>('#lesson-answer')
 showMode(answer?.value?'teach':current)
 history.scrollTop=history.scrollHeight
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
  const shadowObserver=new MutationObserver(()=>{refreshSkinUI(root);enhanceGrimoire(root)})
  shadowObserver.observe(root,{childList:true,subtree:true})
  // Escape closes only this familiar's creator panel; no global site UI changes.
  root.addEventListener('keydown',event=>{
   if(!(event instanceof KeyboardEvent)||event.key!=='Escape')return
   const drawer=root.querySelector('.grimoire-side-panel.is-open')
   if(drawer){
    (drawer.querySelector('.grimoire-drawer-close') as HTMLButtonElement|null)?.click()
    event.stopPropagation()
    return
   }
   if(root.getElementById('panel')?.classList.contains('open')){
    const close=root.getElementById('close-panel') as HTMLButtonElement|null
    if(close){event.stopPropagation();close.click()}
   }
  })
 }
 refreshSkinUI(root)
 enhanceGrimoire(root)
 if(!availabilityChecked)void checkSkinAvailability()
}

export function registerAlquimago3D():void{
 // The familiar's own config normalizer intentionally omits stage3d.
 // Read the already-public manifest separately so visitors see the published framing.
 void fetch(import.meta.env.BASE_URL+'alquimago/config.json',{cache:'no-store'})
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
  let dead=false,frame=0,blobUrl='',mood='idle',start=performance.now(),moodStart=start
  let renderer:import('three').WebGLRenderer|undefined
  let scene:import('three').Scene|undefined
  let camera:import('three').PerspectiveCamera|undefined
  let model:import('three').Object3D|undefined
  let morphs:Array<{dictionary:Record<string,number>;weights:number[]}>=[] 
  let preview:{name:string;until:number;start:number}|null=null
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
   if(detail?.type==='published'){const at=performance.now();preview={name:'proud',start:at,until:at+2600}}
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
      const cueStart=preview&&now<preview.until?preview.start:moodStart
      // Loop plays a repeating 0 -> 1 -> 0 cycle. One-shot plays one
      // bounded envelope, then rests until the next distinct expression.
      // The same config will later drive skeletal GLB clips via AnimationMixer.
      const cue=(name:string)=>{
       const cfg=timing(name)
       const elapsed=Math.max(0,now-cueStart)
       const progress=cfg.loop?(elapsed%cfg.durationMs)/cfg.durationMs
        :Math.min(1,elapsed/cfg.durationMs)
       return cfg.loop ? 0.5-0.5*Math.cos(progress*2*Math.PI)
        :Math.sin(progress*Math.PI)
      }
      const set=(name:string,value:number)=>{
       const key=map(name),intensity=timing(name).intensity
       chosen.set(key,Math.min(1,Math.max(0,value*intensity)))
      }
      if(expression==='idle')set('idle',0.55*cue('idle'))
      else if(expression!=='breath')set(expression,cue(expression))
      if(tired&&expression!=='sleep'&&expression!=='pet'&&expression!=='talk')set('tired',0.9*cue('tired'))
      if(expression==='pet')set('love',0.55*cue('love'))
      if(expression==='focused')set('thinking',0.42*cue('thinking'))
      if(expression==='happy')set('excited',0.3*cue('excited'))
      // Breath is an independent cyclical morph target. Emotional speed factors
      // alter cycle duration but never overwrite the artist's base settings.
      const reaction=host.dataset.reaction||''
      const brainMood=reaction&&Object.prototype.hasOwnProperty.call(animation.breathMoodSpeed,reaction)
       ?reaction:host.dataset.mood||'tranquilo'
      const mappedMood=tired&&brainMood!=='meditando'&&brainMood!=='sonolento'?'cansado':brainMood
      const rate=animation.breathMoodSpeed[mappedMood as keyof AnimationProfile['breathMoodSpeed']]||1
      const breathCycle=Math.max(180,timing('breath').durationMs/rate)
      const breathElapsed=expression==='breath'?now-cueStart:elapsed
      const breathTime=timing('breath').loop?breathElapsed%breathCycle:Math.min(breathElapsed,breathCycle)
      const phase=breathTime/breathCycle
      const breath=0.5-0.5*Math.cos(phase*Math.PI*2)
      set('breath',expression==='breath'?1:breath)
      const blinkTiming=timing('blink')
      const blinkMs=blinkTiming.loop?elapsed%blinkTiming.intervalMs:(expression==='blink'?now-cueStart:elapsed)
      const blink=blinkMs<blinkTiming.durationMs?Math.sin(blinkMs/blinkTiming.durationMs*Math.PI):0
      set('blink',expression==='sleep'?1:blink)
      if(tired&&expression!=='sleep'){
       const yawnTiming=timing('yawn'),yawnMs=yawnTiming.loop?elapsed%yawnTiming.intervalMs:(expression==='yawn'?now-cueStart:elapsed)
       if(yawnMs<yawnTiming.durationMs)
        set('yawn',Math.sin(yawnMs/yawnTiming.durationMs*Math.PI))
      }
      if(expression==='talk'){
       const talkDuration=timing('talk').durationMs
       const talkElapsed=now-cueStart
       const talkOn=timing('talk').loop||talkElapsed<=talkDuration
       set('talk',talkOn?0.28+0.72*(0.5+0.5*Math.sin(talkElapsed/talkDuration*Math.PI*2)):0)
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
    const next=Object.hasOwn(ALQUIMAGO_SHAPE_MAP,key)?key:'idle'
    const changed=next!==mood
    if(changed){mood=next;moodStart=performance.now()}
    if(changed&&['pet','love','surprised','laugh','yawn'].includes(mood)){
     const at=performance.now()
     preview={name:mood,start:at,until:at+timing(mood).durationMs}
    }
   },
   previewExpression(name:string){
    const key=mapped(name)
    if(Object.hasOwn(ALQUIMAGO_SHAPE_MAP,key))
     {const at=performance.now();preview={name:key,start:at,until:at+Math.max(1800,timing(key).durationMs)}}
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
