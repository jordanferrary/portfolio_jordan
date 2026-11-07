import {useEffect,useState} from 'react'
import {saveMediaBlob,readMedia} from '../../lib/media-store'
import {ALQUIMAGO_SKIN_MEDIA,ALQUIMAGO_SHAPES,ALQUIMAGO_SHAPE_MAP,inspectAlquimagoGLB} from '../../lib/alquimago-3d'
type Props={onClose:()=>void;onPublish:()=>void}
type Familiar=HTMLElement&{
 selectedSkin:string;skin:{type:string;src:string;shapeKeys:Record<string,string>};
 skinProfiles:Array<{id:string;type:string;src:string;shapeKeys?:Record<string,string>}>;
 applySkin:()=>void;render:()=>void;skinAdapter?:{setExpression?:(name:string)=>void}
}
function showOnFamiliar(){
 const familiar=document.querySelector('alquimago-familiar') as Familiar|null
 if(!familiar)throw Error('Abra a página com o Alquimago ativo para visualizar sua skin.')
 const profile=familiar.skinProfiles.find(item=>item.id==='custom-3d')
 if(!profile)throw Error('A configuração do Alquimago ainda não tem o perfil 3D. Atualize a página.')
 familiar.selectedSkin='custom-3d'
 familiar.skin={type:'model3d',src:profile.src,shapeKeys:{...ALQUIMAGO_SHAPE_MAP,...profile.shapeKeys}}
 familiar.applySkin()
 familiar.render()
}
export function Alquimago3DEditor({onClose,onPublish}:Props){
 const [busy,setBusy]=useState(false)
 const [exists,setExists]=useState(false)
 const [found,setFound]=useState<string[]>([])
 const [message,setMessage]=useState('Escolha um GLB para analisar e visualizar antes de publicar.')
 const [error,setError]=useState('')
 useEffect(()=>{void readMedia(ALQUIMAGO_SKIN_MEDIA).then(file=>setExists(Boolean(file))).catch(()=>{})},[])
 const load=async(file:File|undefined)=>{
  if(!file)return
  setBusy(true);setError('');setMessage('Validando formato e Shape Keys…')
  try{
   const report=await inspectAlquimagoGLB(file)
   await saveMediaBlob(ALQUIMAGO_SKIN_MEDIA,file)
   setExists(true);setFound(report.found)
   showOnFamiliar()
   setMessage('Skin importada neste navegador. '+report.found.length+' Shape Keys reconhecidas. Use Publicar no Local Studio para enviar o GLB ao GitHub/Cloudflare.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível importar o modelo.')}
  finally{setBusy(false)}
 }
 const choose=()=>{try{showOnFamiliar();setMessage('Skin 3D selecionada como rascunho. Publique pelo Local Studio para torná-la oficial.')}catch(e){setError(e instanceof Error?e.message:'Falha na prévia.')}}
 const expression=(name:string)=>{
  const familiar=document.querySelector('alquimago-familiar') as Familiar|null
  familiar?.skinAdapter?.setExpression?.(name)
  setMessage('Prévia de expressão: '+name+'. A reação às emoções também acontece automaticamente.')
 }
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
 <section className="editor-panel" style={{maxWidth:640,maxHeight:'90dvh',overflowY:'auto',padding:22}} role="dialog" aria-modal="true" aria-label="Skins 3D do Alquimago">
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
   <div><span style={{fontSize:11,color:'#caa0ff',fontWeight:700,letterSpacing:1}}>LOCAL STUDIO · FAMILIAR</span><h2 style={{margin:'6px 0 0'}}>Ateliê de skins 3D</h2></div>
   <button type="button" aria-label="Fechar" onClick={onClose} style={{padding:'8px 12px',borderRadius:10}}>Fechar</button>
  </div>
  <p style={{lineHeight:1.6,color:'#d3c3e2'}}>Importe um personagem 3D com suas próprias Shape Keys. O Alquimago reconhecerá nomes padronizados e interpolará as expressões em tempo real. A skin original SVG não será substituída.</p>
  <div style={{border:'1px solid #7b5da1',borderRadius:16,padding:16,background:'#1c1329',display:'grid',gap:12}}>
   <strong>1. Importar modelo GLB</strong>
   <label style={{cursor:'pointer',border:'1px dashed #bc86f7',borderRadius:12,padding:14,display:'block'}}>
    <span>{busy?'Validando modelo…':'Escolher arquivo .glb (até 18 MiB)'}</span>
    <input type="file" accept=".glb,model/gltf-binary" disabled={busy} style={{display:'block',marginTop:9,maxWidth:'100%'}} onChange={event=>{void load(event.target.files?.[0]);event.target.value=''}}/>
   </label>
   <small style={{color:'#c8b3db'}}>Formatos .blend, .fbx e .obj precisam ser exportados como glTF Binary (.glb). Texturas devem ser incorporadas ao arquivo.</small>
   <div role="status" style={{color:'#e2d0ff'}}>{message}</div>
   {error&&<p role="alert" style={{color:'#ffaebc'}}>{error}</p>}
  </div>
  <div style={{marginTop:14,border:'1px solid #7b5da1',borderRadius:16,padding:16}}>
   <strong>2. Expressões reconhecidas</strong>
   <p style={{color:'#cabbd6',fontSize:12}}>Os nomes distinguem maiúsculas de minúsculas. Crie uma Shape Key <b>Basis</b> no Blender e as seguintes formas:</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
    {ALQUIMAGO_SHAPES.map(name=><button type="button" key={name} onClick={()=>expression(name.toLowerCase())}
     style={{borderRadius:99,padding:'6px 11px',background:found.includes(name)?'#493365':'#30263a',border:'1px solid #8264a4',color:found.length?(found.includes(name)?'#fff':'#e3a4aa'):'#eee'}}>
     {found.length?(found.includes(name)?'✓ ':'· '):''}{name}</button>)}
   </div>
   <small style={{color:'#cebde1',display:'block',marginTop:9}}>As ausentes não impedem importar, mas a expressão correspondente ficará neutra. Clique em uma para testar a skin ativa.</small>
  </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'flex-end',marginTop:18}}>
   <button type="button" onClick={choose} disabled={!exists||busy} style={{padding:'10px 14px',borderRadius:10}}>Visualizar no Alquimago</button>
   <button type="button" disabled={!exists||busy} onClick={()=>{onClose();onPublish()}} style={{padding:'10px 16px',borderRadius:10,background:'#8651bd',color:'#fff'}}>Publicar skin e alterações</button>
  </div>
 </section></div>
}
