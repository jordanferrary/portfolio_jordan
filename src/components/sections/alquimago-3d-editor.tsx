import {useEffect,useState} from 'react'
import {readMedia,saveMediaBlob} from '../../lib/media-store'
import {ALQUIMAGO_SHAPES,ALQUIMAGO_REQUIRED_SHAPES,ALQUIMAGO_OPTIONAL_SHAPES,ALQUIMAGO_SHAPE_MAP,ALQUIMAGO_SKIN_MEDIA,inspectAlquimagoGLB} from '../../lib/alquimago-3d'
import {readAlquimagoStage,writeAlquimagoStage,resetAlquimagoStage,stageWithFraming,type AlquimagoStage} from '../../lib/alquimago-3d-stage'
import {ANIMATION_IDS,BREATH_MOODS,readAnimationProfile,writeAnimationProfile,resetAnimationProfile,type AnimationKey,type AnimationProfile} from '../../lib/alquimago-animation-profile'

type Props={onClose:()=>void;onPublish:()=>void}
type Tab='model'|'face'|'camera'|'timing'
type Familiar=HTMLElement&{
 selectedSkin:string;skin:{type:string;src:string;shapeKeys:Record<string,string>}
 skinProfiles:Array<{id:string;type:string;src:string;shapeKeys?:Record<string,string>}>
 applySkin:()=>void;render:()=>void
 skinAdapter?:{setExpression?:(name:string)=>void;previewExpression?:(name:string)=>void}
}
const TAB_ITEMS:{id:Tab;label:string;detail:string}[]=[
 {id:'model',label:'Modelo',detail:'Importação e publicação'},
 {id:'face',label:'Expressões',detail:'Teste as Shape Keys'},
 {id:'camera',label:'Câmera',detail:'Mostre rosto, busto ou corpo'},
 {id:'timing',label:'Animações',detail:'Configure cada duração'}
]
const CAMERA_CONTROLS=[
 {key:'width',label:'Largura da janela',min:145,max:420,step:5,unit:'px'},
 {key:'height',label:'Altura da janela',min:175,max:475,step:5,unit:'px'},
 {key:'zoom',label:'Zoom da câmera',min:0.65,max:4.4,step:0.05,unit:'×'},
 {key:'focusX',label:'Câmera: foco horizontal',min:-1.25,max:1.25,step:0.025,unit:''},
 {key:'focusY',label:'Câmera: foco vertical (rosto)',min:-1.25,max:1.25,step:0.025,unit:''},
 {key:'cameraYaw',label:'Rotação da câmera',min:-70,max:70,step:2,unit:'°'},
 {key:'offsetX',label:'Mover janela: X',min:-220,max:220,step:5,unit:'px'},
 {key:'offsetY',label:'Mover janela: Y',min:-200,max:200,step:5,unit:'px'}
] as const
const MOOD_LABELS:Record<string,string>={
 tranquilo:'Tranquilo',feliz:'Feliz',animado:'Animado',curioso:'Curioso',
 concentrado:'Concentrado',sonolento:'Sonolento',meditando:'Meditando',cansado:'Cansado',
 sad:'Mouse saiu',happy:'Mouse voltou',angry:'Texto selecionado',surprised:'Movimento brusco',
 curious:'Navegação',focused:'Clique em projeto',pet:'Carinho',tired:'Inatividade'
}
function familiarElement(){return document.querySelector('alquimago-familiar') as Familiar|null}
function previewSkin(){
 const familiar=familiarElement()
 if(!familiar)throw Error('O Alquimago ainda não está carregado. Atualize a prévia e tente novamente.')
 const profile=familiar.skinProfiles.find(item=>item.id==='custom-3d')
 if(!profile)throw Error('O perfil 3D não consta da configuração pública. Atualize a página.')
 familiar.selectedSkin='custom-3d'
 familiar.skin={type:'model3d',src:profile.src,shapeKeys:{...ALQUIMAGO_SHAPE_MAP,...profile.shapeKeys}}
 familiar.applySkin()
 familiar.render()
}
function Range({label,value,min,max,step,unit='',onChange}:{
 label:string;value:number;min:number;max:number;step:number;unit?:string;onChange:(value:number)=>void
}){
 return <label className="jf-skin-range">
  <span>{label}<output>{Number(value.toFixed(2))}{unit}</output></span>
  <input type="range" aria-label={label} value={value} min={min} max={max} step={step}
    onChange={event=>onChange(Number(event.target.value))}/>
 </label>
}
export function Alquimago3DEditor({onClose,onPublish}:Props){
 const [tab,setTab]=useState<Tab>('model')
 const [activeSkin,setActiveSkin]=useState<'padrao'|'custom-3d'>(()=>familiarElement()?.selectedSkin==='custom-3d'?'custom-3d':'padrao')
 const [activeAnimation,setActiveAnimation]=useState<AnimationKey>('Pet')
 const [stage,setStage]=useState<AlquimagoStage>(()=>readAlquimagoStage(familiarElement()))
 const [animation,setAnimation]=useState<AnimationProfile>(()=>readAnimationProfile())
 const [busy,setBusy]=useState(false)
 const [exists,setExists]=useState(false)
 const [found,setFound]=useState<string[]>([])
 const [message,setMessage]=useState('Importe um arquivo GLB ou ajuste sua skin já existente.')
 const [error,setError]=useState('')
 useEffect(()=>{
  let mounted=true
  void readMedia(ALQUIMAGO_SKIN_MEDIA).then(async blob=>{
   if(!mounted)return
   if(blob){
    setExists(true)
    const file=new File([blob],'mascote.glb',{type:'model/gltf-binary'})
    try{const inspected=await inspectAlquimagoGLB(file);if(mounted)setFound(inspected.found)}catch{/* corrupted draft can be reimported */}
   }else{
    try{
     const res=await fetch('/alquimago/skins/custom.glb',{method:'HEAD'})
     if(mounted&&res.ok&&!res.headers.get('Content-Type')?.includes('text/html'))setExists(true)
    }catch{/* no published model yet */}
   }
  }).catch(()=>{})
  const syncStage=(e:Event)=>setStage((e as CustomEvent<AlquimagoStage>).detail)
  const syncAnimation=(e:Event)=>setAnimation((e as CustomEvent<AnimationProfile>).detail)
  window.addEventListener('alquimago:stage3d-changed',syncStage)
  window.addEventListener('alquimago:animation-profile',syncAnimation)
  return ()=>{
   mounted=false
   window.removeEventListener('alquimago:stage3d-changed',syncStage)
   window.removeEventListener('alquimago:animation-profile',syncAnimation)
  }
 },[])
 const updateStage=(next:AlquimagoStage)=>setStage(writeAlquimagoStage(next))
 const updateAnimation=(next:AnimationProfile)=>setAnimation(writeAnimationProfile(next))
 const editTiming=(key:AnimationKey,field:'durationMs'|'intervalMs'|'intensity'|'loop',value:number|boolean)=>{
  updateAnimation({...animation,shapes:{...animation.shapes,[key]:{...animation.shapes[key],[field]:value}}})
 }
 const load=async(file:File|undefined)=>{
  if(!file)return
  setBusy(true);setError('');setMessage('Validando GLB 2.0 e Shape Keys…')
  try{
   const report=await inspectAlquimagoGLB(file)
   await saveMediaBlob(ALQUIMAGO_SKIN_MEDIA,file)
   window.dispatchEvent(new Event('alquimago:skin3d-imported'))
   setExists(true);setFound(report.found)
   previewSkin()
   setActiveSkin('custom-3d')
   setTab('face')
   setMessage('Modelo importado neste navegador. '+report.found.length+' expressões identificadas; teste as reações antes de publicar.')
  }catch(e){setError(e instanceof Error?e.message:'Falha na importação.')}
  finally{setBusy(false)}
 }
 const preview=()=>{try{previewSkin();setActiveSkin('custom-3d');setMessage('Prévia 3D ativada. Você pode ajustar câmera e animações.')}catch(e){setError(e instanceof Error?e.message:'Falha ao abrir prévia.')}}
 const preview2D=()=>{
  const familiar=familiarElement()
  if(!familiar){setError('Alquimago não carregado. Atualize a página e tente novamente.');return}
  setError('')
  familiar.selectedSkin='padrao'
  familiar.skin={type:'svg',src:'',shapeKeys:{}}
  familiar.applySkin()
  familiar.render()
  setActiveSkin('padrao')
  setTab('face')
  setMessage('Alquimago Orb 2D ativado. Clique em qualquer emoção para ver os olhos, a boca e as luzes reagirem. Se quiser mantê-lo como padrão, revise a publicação.')
 }
 const testExpression=(name:string)=>{
  const familiar=familiarElement()
  if(familiar?.skinAdapter?.previewExpression)familiar.skinAdapter.previewExpression(name.toLowerCase())
  else familiar?.skinAdapter?.setExpression?.(name.toLowerCase())
  setMessage(activeSkin==='padrao'?'Testando '+name+' na skin vetorial Orb 2D.':'Testando '+name+' na skin 3D. Sem Shape Key correspondente, a expressão não aparecerá.')
 }
 const shapeOptions=(items:readonly string[])=><div className="jf-skin-shape-grid">
  {items.map(name=><button type="button" key={name}
   className={'jf-skin-shape'+(activeSkin==='padrao'||found.includes(name)?' known':'')}
   onClick={()=>testExpression(name)} title={'Testar '+name}
   >{activeSkin==='padrao'||found.includes(name)?'✓ ':'✦ '}{name}</button>)}
 </div>
 const selected=animation.shapes[activeAnimation]
 return <div className="editor-overlay" lang="pt-BR" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className="editor-panel jf-skin-editor" role="dialog" aria-modal="true" aria-label="Ateliê do Alquimago">
   <header className="jf-skin-header">
    <div><span className="jf-skin-eyebrow">LOCAL STUDIO / FAMILIAR</span><h2>Ateliê do Alquimago</h2><p>Modelo, expressões, enquadramento e comportamento visual.</p></div>
    <button type="button" onClick={onClose} className="jf-skin-close" aria-label="Fechar Ateliê">✕</button>
   </header>
   <nav className="editor-tabs jf-skin-tabs" role="tablist" aria-label="Configuração do familiar">
    {TAB_ITEMS.map(item=><button type="button" role="tab" key={item.id}
     aria-selected={tab===item.id} onClick={()=>setTab(item.id)} title={item.detail}>{item.label}</button>)}
   </nav>
   <div className="editor-scroll jf-skin-scroll">
    {tab==='model'&&<div className="jf-skin-block">
     <div className="jf-skin-section-title"><span>01</span><div><h3>Skin do personagem</h3><p>Alterne entre o novo robô vetorial e seu GLB 3D. Apenas publique depois de testar.</p></div></div>
     <div className="jf-skin-info"><strong>Alquimago Orb 2D — vetorial animado</strong>
       <p>Nova skin original: cabeça esférica, visor robótico, headset, olhos expressivos e animações leves de flutuação. Não necessita de arquivo externo.</p>
       <div className="jf-skin-end"><button type="button" onClick={preview2D}>Usar e testar skin Orb 2D</button></div>
     </div>
     <label className="jf-skin-upload">
      <strong>{busy?'Analisando modelo…':'Selecionar modelo .glb'}</strong>
      <small>glTF Binary 2.0 · até 18 MiB · texturas incorporadas</small>
      <input type="file" accept=".glb,model/gltf-binary" disabled={busy}
       onChange={event=>{void load(event.target.files?.[0]);event.target.value=''}}/>
     </label>
     <div className="jf-skin-hint"><b>Status:</b> {exists?'Há uma skin 3D disponível.':'Nenhuma skin 3D encontrada.'} A versão SVG sempre continuará disponível.</div>
     <div className="jf-skin-info"><strong>Pipeline recomendado</strong><p>Blender → Shape Keys → Exportar glTF Binary (.glb) → importar → testar expressões → revisar no Local Studio → publicar.</p></div>
    </div>}
    {tab==='face'&&<div className="jf-skin-block">
     <div className="jf-skin-section-title"><span>02</span><div><h3>Laboratório de Shape Keys</h3><p>Teste as expressões sem alterar o arquivo-fonte.</p></div></div>
     <div className="jf-skin-hint">{activeSkin==='padrao'
       ?'Skin ativa: Orb 2D. Todas as expressões abaixo funcionam por SVG animado e podem ser testadas clicando nos nomes.'
       :<>Skin 3D: o rosto precisa de <code>Basis</code> e dos nomes abaixo. Detectadas: <b>{found.length}/{ALQUIMAGO_SHAPES.length}</b>.</>}</div>
     <h4>Expressões principais</h4>{shapeOptions(ALQUIMAGO_REQUIRED_SHAPES)}
     <h4>Emoções extras e movimento dos olhos</h4>{shapeOptions(ALQUIMAGO_OPTIONAL_SHAPES)}
     <p className="jf-skin-help">A respiração usa <code>Breath</code>, representando o peito expandido. Você poderá ajustar o tempo do ciclo na aba Animações.</p>
    </div>}
    {tab==='camera'&&<div className="jf-skin-block">
     <div className="jf-skin-section-title"><span>03</span><div><h3>Enquadramento 3D</h3><p>Os controles de foco movem a câmera dentro da cena — não apenas a janela.</p></div></div>
     <div className="jf-skin-presets" aria-label="Presets de câmera">
      {(['face','bust','full'] as const).map(name=><button key={name} type="button"
       aria-pressed={stage.framing===name} onClick={()=>updateStage(stageWithFraming(stage,name))}>
       {name==='face'?'Rosto':name==='bust'?'Busto':'Corpo inteiro'}</button>)}
     </div>
     <p className="jf-skin-help">Comece com <b>Rosto</b>. Depois ajuste o foco vertical para subir ou descer a câmera e o zoom para aproximar.</p>
     <div className="jf-skin-range-grid">
      {CAMERA_CONTROLS.map(control=><Range key={control.key} label={control.label}
       value={stage[control.key]} min={control.min} max={control.max} step={control.step} unit={control.unit}
       onChange={value=>updateStage({...stage,[control.key]:value,
        framing:['focusX','focusY','cameraYaw','zoom'].includes(control.key)?'custom':stage.framing})}/>)}
     </div>
     <label className="jf-skin-check"><input type="checkbox" checked={stage.followPointer}
      onChange={event=>updateStage({...stage,followPointer:event.target.checked})}/>Seguir mouse com movimento discreto</label>
     <div className="jf-skin-end"><button type="button" onClick={()=>setStage(resetAlquimagoStage(familiarElement()))}>Restaurar enquadramento</button></div>
    </div>}
    {tab==='timing'&&<div className="jf-skin-block">
     <div className="jf-skin-section-title"><span>04</span><div><h3>Direção de animação</h3><p>A duração e a intensidade de cada Shape Key podem ser ajustadas para a sua skin.</p></div></div>
     <div className="jf-skin-info"><strong>Respiração — Breath</strong>
      <p>Modele o peito estufado com valor 1. O Alquimago interpola automaticamente 0 → 1 → 0; a velocidade muda conforme a emoção.</p>
      <Range label="Duração base da respiração" value={animation.shapes.Breath.durationMs} min={400} max={6000} step={100} unit=" ms"
       onChange={value=>editTiming('Breath','durationMs',value)}/>
      <Range label="Intensidade da respiração" value={animation.shapes.Breath.intensity} min={0} max={1} step={0.05}
       onChange={value=>editTiming('Breath','intensity',value)}/>
      <label className="jf-skin-check"><input type="checkbox" checked={animation.shapes.Breath.loop}
       onChange={event=>editTiming('Breath','loop',event.target.checked)}/>
       Repetir respiração continuamente (loop)</label>
     </div>
     <h4>Velocidade da respiração por estado</h4>
     <p className="jf-skin-help">1,0× é o ritmo base. Acima disso, a respiração fica mais rápida.</p>
     <div className="jf-skin-range-grid">
      {BREATH_MOODS.map(m=><Range key={m} label={MOOD_LABELS[m]} value={animation.breathMoodSpeed[m]}
       min={0.4} max={2.4} step={0.05} unit="×"
       onChange={value=>updateAnimation({...animation,breathMoodSpeed:{...animation.breathMoodSpeed,[m]:value}})}/>)}
     </div>
     <div className="jf-skin-info">
      <h4>Configuração individual das demais expressões</h4>
      <label className="jf-skin-picker">Expressão
       <select value={activeAnimation} onChange={event=>setActiveAnimation(event.target.value as AnimationKey)}>
        {ANIMATION_IDS.map(name=><option key={name} value={name}>{name}</option>)}
       </select>
      </label>
      <Range label={'Duração — '+activeAnimation} value={selected.durationMs} min={80} max={6000} step={20} unit=" ms"
       onChange={value=>editTiming(activeAnimation,'durationMs',value)}/>
      <Range label={'Intensidade — '+activeAnimation} value={selected.intensity} min={0} max={1} step={0.05}
       onChange={value=>editTiming(activeAnimation,'intensity',value)}/>
      <label className="jf-skin-check"><input type="checkbox" checked={selected.loop}
       onChange={event=>editTiming(activeAnimation,'loop',event.target.checked)}/>
       Repetir animação (loop)</label>
      <p className="jf-skin-help">{selected.loop
       ?'A animação repete o ciclo enquanto este estado estiver ativo.'
       :'A animação toca uma vez e termina, sem reiniciar até acontecer um novo evento.'}
       {' '}Esta opção já controla as Shape Keys; a reprodução de clips de Bones será integrada separadamente.</p>
      {selected.loop&&(activeAnimation==='Blink'||activeAnimation==='Yawn')&&<Range label="Intervalo entre repetições"
       value={selected.intervalMs} min={800} max={30000} step={200} unit=" ms"
       onChange={value=>editTiming(activeAnimation,'intervalMs',value)}/>}
      <button type="button" className="jf-skin-test" onClick={()=>testExpression(activeAnimation)}>Testar {activeAnimation}</button>
     </div>
     <div className="jf-skin-end"><button type="button" onClick={()=>setAnimation(resetAnimationProfile())}>Restaurar tempos padrão</button></div>
    </div>}
    <div className="jf-skin-message" role="status">{message}</div>
    {error&&<p className="jf-skin-error" role="alert">{error}</p>}
   </div>
   <footer className="jf-skin-footer">
    <button type="button" className="jf-skin-secondary" onClick={preview} disabled={!exists||busy}>Visualizar 3D</button>
    <button type="button" className="jf-skin-primary" onClick={()=>{onClose();onPublish()}} disabled={busy}>Revisar publicação</button>
   </footer>
  </section>
 </div>
}
