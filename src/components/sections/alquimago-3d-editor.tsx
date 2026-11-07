import {useEffect,useState} from 'react'
import {saveMediaBlob,readMedia} from '../../lib/media-store'
import {ALQUIMAGO_SKIN_MEDIA,ALQUIMAGO_SHAPES,ALQUIMAGO_REQUIRED_SHAPES,ALQUIMAGO_OPTIONAL_SHAPES,ALQUIMAGO_SHAPE_MAP,inspectAlquimagoGLB} from '../../lib/alquimago-3d'
import {readAlquimagoStage,writeAlquimagoStage,resetAlquimagoStage,type AlquimagoStage} from '../../lib/alquimago-3d-stage'
type Props={onClose:()=>void;onPublish:()=>void}
const STAGE_CONTROLS=[
 {key:'width',label:'Largura da janela',min:145,max:420,step:5,unit:'px'},
 {key:'height',label:'Altura da janela',min:175,max:475,step:5,unit:'px'},
 {key:'zoom',label:'Zoom do modelo',min:0.65,max:2.6,step:0.05,unit:'×'},
 {key:'offsetX',label:'Deslocamento horizontal',min:-220,max:220,step:5,unit:'px'},
 {key:'offsetY',label:'Deslocamento vertical',min:-200,max:200,step:5,unit:'px'}
] as const
type Familiar=HTMLElement&{
 selectedSkin:string;skin:{type:string;src:string;shapeKeys:Record<string,string>};
 skinProfiles:Array<{id:string;type:string;src:string;shapeKeys?:Record<string,string>}>;
 applySkin:()=>void;render:()=>void;skinAdapter?:{setExpression?:(name:string)=>void;previewExpression?:(name:string)=>void;setStage?:(stage:AlquimagoStage)=>void}
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
 const [stage,setStage]=useState<AlquimagoStage>(()=>readAlquimagoStage(document.querySelector('alquimago-familiar')))
 const [busy,setBusy]=useState(false)
 const [exists,setExists]=useState(false)
 const [found,setFound]=useState<string[]>([])
 const [message,setMessage]=useState('Escolha um GLB para analisar e visualizar antes de publicar.')
 const [error,setError]=useState('')
 useEffect(()=>{
  void readMedia(ALQUIMAGO_SKIN_MEDIA).then(file=>setExists(Boolean(file))).catch(()=>{})
  const sync=(e:Event)=>setStage((e as CustomEvent<AlquimagoStage>).detail)
  window.addEventListener('alquimago:stage3d-changed',sync)
  return ()=>window.removeEventListener('alquimago:stage3d-changed',sync)
 },[])
 const updateStage=(next:AlquimagoStage)=>setStage(writeAlquimagoStage(next))
 const load=async(file:File|undefined)=>{
  if(!file)return
  setBusy(true);setError('');setMessage('Validando formato e Shape Keys…')
  try{
   const report=await inspectAlquimagoGLB(file)
   await saveMediaBlob(ALQUIMAGO_SKIN_MEDIA,file)
   window.dispatchEvent(new Event('alquimago:skin3d-imported'))
   setExists(true);setFound(report.found)
   showOnFamiliar()
   setMessage('Skin importada neste navegador. '+report.found.length+' Shape Keys reconhecidas. Use Publicar no Local Studio para enviar o GLB ao GitHub/Cloudflare.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível importar o modelo.')}
  finally{setBusy(false)}
 }
 const choose=()=>{try{showOnFamiliar();setMessage('Skin 3D selecionada como rascunho. Publique pelo Local Studio para torná-la oficial.')}catch(e){setError(e instanceof Error?e.message:'Falha na prévia.')}}
 const expression=(name:string)=>{
  const familiar=document.querySelector('alquimago-familiar') as Familiar|null
  if(familiar?.skinAdapter?.previewExpression)familiar.skinAdapter.previewExpression(name)
  else familiar?.skinAdapter?.setExpression?.(name)
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
  <div style={{marginTop:14,border:'1px solid #7b5da1',borderRadius:16,padding:16,background:'#21152e'}}>
   <strong>2. Laboratório de expressões</strong>
   <p style={{color:'#cabbd6',fontSize:12}}>Crie <b>Basis</b> e as Shape Keys com estes nomes exatos, diferenciando maiúsculas de minúsculas. Clique em uma expressão para testar por alguns segundos.</p>
   <p style={{fontSize:11,color:'#eed6ff',marginBottom:8}}>Expressões principais</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
    {ALQUIMAGO_REQUIRED_SHAPES.map(name=><button type="button" key={name} onClick={()=>expression(name.toLowerCase())}
     style={{borderRadius:99,padding:'7px 11px',background:found.includes(name)?'#543a72':'#30263a',border:'1px solid #8264a4',color:found.length?(found.includes(name)?'#fff':'#f6b9c4'):'#eee'}}>
     {found.length?(found.includes(name)?'✓ ':'· '):''}{name}</button>)}
   </div>
   <p style={{fontSize:11,color:'#eed6ff',margin:'16px 0 8px'}}>Expressões extras e olhar</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
    {ALQUIMAGO_OPTIONAL_SHAPES.map(name=><button type="button" key={name} onClick={()=>expression(name.toLowerCase())}
     style={{borderRadius:99,padding:'7px 11px',background:found.includes(name)?'#543a72':'#30263a',border:'1px solid #8264a4',color:found.length?(found.includes(name)?'#fff':'#c4b1d6'):'#eee'}}>
     {found.length?(found.includes(name)?'✓ ':'· '):''}{name}</button>)}
   </div>
   <small style={{color:'#cebde1',display:'block',marginTop:10}}>Detectadas: {found.length} de {ALQUIMAGO_SHAPES.length}. As extras são opcionais: sem elas, o Alquimago utiliza animações faciais disponíveis e movimentos suaves.</small>
  </div>
  <div style={{marginTop:14,border:'1px solid #7b5da1',borderRadius:16,padding:16,background:'#1c142a'}}>
   <strong>3. Janela e enquadramento 3D</strong>
   <p style={{color:'#cabbd6',fontSize:12,lineHeight:1.6}}>Ajuste a janela como um elemento do portfólio. Também é possível arrastar o mascote na página, usar a alça no canto da janela e usar <b>Shift + roda do mouse</b> para o zoom.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
    {STAGE_CONTROLS.map(control=><label key={control.key} style={{display:'grid',gap:5,fontSize:11,color:'#e6d6f2'}}>
     <span style={{display:'flex',justifyContent:'space-between',gap:7}}>{control.label}<b style={{color:'#d7b2ff'}}>{stage[control.key]}{control.unit}</b></span>
     <input aria-label={control.label} type="range" min={control.min} max={control.max} step={control.step} value={stage[control.key]}
       onChange={event=>updateStage({...stage,[control.key]:Number(event.target.value)})} style={{width:'100%',accentColor:'#ac77e4'}}/>
    </label>)}
   </div>
   <label style={{display:'flex',alignItems:'center',gap:9,marginTop:15,fontSize:12,color:'#eadbf4',cursor:'pointer'}}>
    <input type="checkbox" checked={stage.followPointer} onChange={event=>updateStage({...stage,followPointer:event.target.checked})} style={{accentColor:'#ac77e4'}}/>
    Seguir o mouse com movimentos suaves (desativável)
   </label>
   <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
    <button type="button" onClick={()=>setStage(resetAlquimagoStage(document.querySelector('alquimago-familiar')))} style={{padding:'7px 11px',borderRadius:9}}>Restaurar enquadramento</button>
   </div>
   <small style={{display:'block',marginTop:10,color:'#c5b1d5'}}>Os ajustes ficam neste navegador até a publicação da skin pelo Local Studio. Visitantes recebem o enquadramento publicado como padrão.</small>
  </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'flex-end',marginTop:18}}>
   <button type="button" onClick={choose} disabled={!exists||busy} style={{padding:'10px 14px',borderRadius:10}}>Visualizar no Alquimago</button>
   <button type="button" disabled={!exists||busy} onClick={()=>{onClose();onPublish()}} style={{padding:'10px 16px',borderRadius:10,background:'#8651bd',color:'#fff'}}>Publicar skin e alterações</button>
  </div>
 </section></div>
}
