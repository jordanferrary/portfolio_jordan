import '../../styles/project-model.css'
import {useEffect,useRef,useState} from 'react'
import {Box,ExternalLink,Move3d,Play,Pause,RotateCcw,Expand,SlidersHorizontal,Camera,Focus} from 'lucide-react'
import {AssetImage} from './asset-image'
import {MODEL_MIME,parseModelUrl} from '../../lib/model-embed'
import {isLocalMedia,readMedia} from '../../lib/media-store'
import {resolvePublishedAsset} from '../../lib/published-assets'
import {DEFAULT_INSPECTOR_OPTIONS,normalizeModelPresentation,ART_SHADER_PRESETS,type ModelMode,type ModelPresentation,type InspectorOptions,type ModelCamera,type LightEditState,type LightEditCallbacks} from '../../lib/model-presentation'
import {ModelInspectorPanel} from './model-inspector-panel'
import type {ModelStage,ModelStats} from '../../lib/model-inspector-stage'
type Props={url:string;poster?:string;title?:string;presentation?:Partial<ModelPresentation>;startActive?:boolean;resetCameraToken?:number;onCaptureCamera?:(camera:ModelCamera)=>void;lightEditing?:LightEditState;lightCallbacks?:LightEditCallbacks}
export function ProjectModel(props:Props){return <ModelViewer key={props.url} {...props}/>}
function ModelViewer({url,poster,title='3D artwork',presentation,startActive=false,resetCameraToken,onCaptureCamera,lightEditing,lightCallbacks}:Props){
 const parsed=parseModelUrl(url)
 const settings=normalizeModelPresentation(presentation)
 const configuration=useRef(settings);configuration.current=settings
 const [activated,setActivated]=useState(startActive)
 const [error,setError]=useState('')
 const [ready,setReady]=useState(false)
 const [resolvedSource,setResolvedSource]=useState('')
 const [mode,setMode]=useState<ModelMode>('material')
 const [rotate,setRotate]=useState(settings.autoRotate)
 const [stats,setStats]=useState<ModelStats|null>(null)
 const [panelOpen,setPanelOpen]=useState(false)
 const [options,setOptions]=useState<InspectorOptions>({...DEFAULT_INSPECTOR_OPTIONS})
 const [animation,setAnimation]=useState(-1),[playing,setPlaying]=useState(false)
 const canvas=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null),stage=useRef<ModelStage|null>(null)
 const modeRef=useRef(mode);modeRef.current=mode
 const rotationRef=useRef(rotate);rotationRef.current=rotate
 const lightStateRef=useRef(lightEditing);lightStateRef.current=lightEditing
 const lightCallbacksRef=useRef(lightCallbacks);lightCallbacksRef.current=lightCallbacks
 useEffect(()=>{setRotate(settings.autoRotate)},[settings.autoRotate])
 useEffect(()=>{stage.current?.setPresentation(configuration.current)})
 useEffect(()=>{stage.current?.resetCamera()},[resetCameraToken])
 useEffect(()=>{stage.current?.setMode(mode)},[mode])
 useEffect(()=>{stage.current?.setRotation(rotate)},[rotate])
 useEffect(()=>{if(lightEditing)stage.current?.setLightEditing(lightEditing)},[lightEditing])
 useEffect(()=>{stage.current?.setOptions(options)},[options])
 useEffect(()=>{stage.current?.setAnimation(animation,playing)},[animation,playing])
 useEffect(()=>{
  if(!activated||!parsed)return
  let live=true,objectUrl=''
  let instance:ModelStage|null=null
  setReady(false);setError('');setResolvedSource('');setStats(null)
  const prepare=async()=>{
   let source=resolvePublishedAsset(parsed.url)
   if(isLocalMedia(parsed.url)){
    const blob=await readMedia(parsed.url)
    if(!live)return
    if(!blob)throw new Error('Modelo local não encontrado. Importe o arquivo novamente.')
    objectUrl=URL.createObjectURL(new Blob([blob],{type:MODEL_MIME}));source=objectUrl
   }
   if(!live)return
   setResolvedSource(source)
   const {createModelStage}=await import('../../lib/model-inspector-stage')
   if(!live||!canvas.current)return
   instance=createModelStage(canvas.current,source,configuration.current,{onLoad:value=>{if(live){setStats(value);setReady(true);setError('')}},onError:()=>{if(live)setError('Could not load the 3D model. Check its format, textures and connection.')}},lightCallbacksRef.current?{onSelect:id=>lightCallbacksRef.current?.onSelect(id),onChange:(id,patch)=>lightCallbacksRef.current?.onChange(id,patch)}:undefined)
   stage.current=instance
   instance.setMode(modeRef.current);instance.setRotation(rotationRef.current);if(lightStateRef.current)instance.setLightEditing(lightStateRef.current)
  }
  void prepare().catch(()=>{if(live)setError('Could not initialize the 3D viewer. Check WebGL support and the model file.')})
  return ()=>{live=false;instance?.dispose();if(stage.current===instance)stage.current=null;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[activated,parsed?.url])
 const fullscreen=()=>{if(document.fullscreenElement===frame.current)void document.exitFullscreen().catch(()=>{});else if(frame.current?.requestFullscreen)void frame.current.requestFullscreen().catch(()=>{})}
 if(!parsed)return <div className="project-model-invalid" role="status">3D model not available — GLB or glTF link required.</div>
 return <section className="project-model-block" aria-label={'Interactive model: '+title}>
  <div className="project-model-frame" ref={frame} style={activated?{background:settings.background}:undefined}>
   {!activated?<button type="button" className="project-model-poster" onClick={()=>setActivated(true)} aria-label={'Open interactive 3D model: '+title}>
    {poster?<AssetImage src={poster} alt="" loading="lazy"/>:<span className="project-model-fallback"><Box size={76} strokeWidth={1.1}/></span>}
    <span className="project-model-corner"><Box size={16}/> INTERACTIVE 3D</span>
    <span className="project-model-launch"><Move3d size={17}/><Play size={15} fill="currentColor"/> Explore model</span>
    <span className="project-model-format">{parsed.format.toUpperCase()} MODEL</span>
   </button>:<><div className="project-model-stage" ref={canvas}/>{!ready&&!error&&<p className="project-model-loading" role="status">Loading interactive 3D model…</p>}
   {ready&&<><div className="model-inspector-toolbar"><button type="button" className={panelOpen?'primary-action':'secondary-action'} aria-expanded={panelOpen} onClick={()=>setPanelOpen(v=>!v)}><SlidersHorizontal size={16}/> Model inspector</button><div className="model-inspector-actions">{lightEditing?.helpers&&<button className="secondary-action" type="button" title="Enquadrar modelo e luzes" aria-label="Enquadrar modelo e luzes" onClick={()=>{setRotate(false);stage.current?.frameLights()}}><Focus size={16}/></button>}{onCaptureCamera&&<button className="secondary-action" type="button" title="Salvar o enquadramento atual" onClick={()=>{const captured=stage.current?.captureCamera();if(captured){setRotate(false);onCaptureCamera(captured)}}}><Camera size={16}/> Capturar câmera</button>}<button className="secondary-action" type="button" aria-label={rotate?'Pause rotation':'Resume rotation'} title={rotate?'Pause rotation':'Resume rotation'} onClick={()=>setRotate(v=>!v)}>{rotate?<Pause size={16}/>:<Play size={16}/>}</button><button className="secondary-action" type="button" aria-label="Reset camera" title="Reset camera" onClick={()=>stage.current?.resetCamera()}><RotateCcw size={16}/></button>{typeof document!=='undefined'&&document.fullscreenEnabled&&<button className="secondary-action" type="button" aria-label="Fullscreen" title="Fullscreen" onClick={fullscreen}><Expand size={16}/></button>}</div></div>{panelOpen&&stats&&<ModelInspectorPanel mode={mode} onMode={setMode} options={options} onOptions={setOptions} stats={stats} onClose={()=>setPanelOpen(false)} animation={animation} playing={playing} onAnimation={index=>{setAnimation(index);setPlaying(index>=0)}} onPlaying={setPlaying}/>}</>}
   {error&&<div className="project-model-error" role="alert"><p>{error}</p>{resolvedSource&&!isLocalMedia(parsed.url)&&<a href={resolvedSource} target="_blank" rel="noopener noreferrer">Open model source <ExternalLink size={14}/></a>}</div>}</>}
  </div>
  {lightEditing&&stats&&<div className="model-light-preview-notice">{settings.artShader.preset!=='original'&&mode!=='material'&&<span>O shader artístico aparece apenas no Render final. Os outros modos mantêm a inspeção técnica.</span>}{settings.artShader.preset!=='original'&&mode==='material'&&<span>Shader ativo: {ART_SHADER_PRESETS.find(item=>item.id===settings.artShader.preset)?.name}</span>}{stats.unlitMaterials>0&&!settings.relightUnlit&&<span>Este modelo contém materiais Unlit, que não recebem iluminação. Escolha “Iluminação da cena (automática)” na aba Luzes.</span>}{!['material','neutral','clay','flat','shaded-wire','clay-wire','flat-wire','bones'].includes(mode)&&<span>O modo de inspeção atual não mostra a iluminação. Volte ao Render final ou Clay.</span>}</div>}<div className="model-inspector-meta"><p className="project-model-hint"><Move3d size={15}/> Rotate · Zoom · Pan — 3D assets load only on request</p>{stats&&<span translate="no">{stats.triangles.toLocaleString()} tris · {stats.vertices.toLocaleString()} verts</span>}</div>
 </section>
}
