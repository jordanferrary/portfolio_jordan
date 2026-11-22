
import {ART_SHADER_PRESETS,DEFAULT_ART_SHADER,type ArtShader,type ArtShaderPreset} from './model-presentation'
export type CameraEffect='bloom'|'pixelSize'|'crt'|'vhs'|'chromaticAberration'
export const CAMERA_EFFECTS:readonly {id:CameraEffect;name:string;description:string;demo:number;max:number;step:number;swatch:string}[]=[
 {id:'bloom',name:'Bloom',description:'Halo suave ao redor das áreas luminosas.',demo:.9,max:2,step:.05,swatch:'radial-gradient(circle,#fff 5%,#ab70ff 25%,#302044 70%)'},
 {id:'chromaticAberration',name:'Aberração cromática',description:'Franjas RGB nas bordas da imagem.',demo:5,max:12,step:.25,swatch:'linear-gradient(100deg,#ff3658 20%,#e6e6ff 45%,#49d8ff 68%,#17142b 69%)'},
 {id:'pixelSize',name:'Pixelização',description:'Reduz a resolução aparente em blocos.',demo:5,max:12,step:1,swatch:'repeating-conic-gradient(#706aba 0 25%,#b7d7ec 0 50%) 0 0/16px 16px'},
 {id:'crt',name:'CRT',description:'Linhas de varredura e curvatura de monitor antigo.',demo:1,max:1,step:.05,swatch:'repeating-linear-gradient(0deg,#151322 0 2px,#8ac0aa 2px 4px)'},
 {id:'vhs',name:'VHS',description:'Granulação, desvio de cor e instabilidade horizontal.',demo:1,max:1,step:.05,swatch:'repeating-linear-gradient(0deg,#654f9f 0 4px,#e8b4b7 5px,#35516e 7px)'}
]
export const SHADER_CATEGORIES=[{id:'all',name:'Todos'},{id:'holo',name:'Materiais / FX'},{id:'drawing',name:'Ilustração'},{id:'retro',name:'Retro'}] as const
const groups:Record<string,ArtShaderPreset[]>={holo:['pearl','foil','opal','iridescent','hologram','rim','xray','chrome','velvet'],drawing:['toon','flat','hatch','crosshatch','stipple','halftone','watercolor','pencil','outline'],retro:['pixel','dither','blueprint','noir']}
export function filterShaders(group:string,search:string,allowFlat=true){
 const term=search.trim().toLowerCase()
 return ART_SHADER_PRESETS.filter(p=>(allowFlat||p.id!=='flat')&&(group==='all'||groups[group]?.includes(p.id)||p.id==='original')&&(p.name+' '+p.description).toLowerCase().includes(term))
}
export const PREVIEW_STYLES:readonly {id:string;style:ArtShader;camera:boolean}[]=[
 ...ART_SHADER_PRESETS.map(p=>({id:p.id,style:{...DEFAULT_ART_SHADER,preset:p.id,tint:p.tint,strength:1,bloom:0},camera:false})),
 ...CAMERA_EFFECTS.map(p=>({id:'fx-'+p.id,style:{...DEFAULT_ART_SHADER,bloom:0,[p.id]:p.demo},camera:true}))
]
