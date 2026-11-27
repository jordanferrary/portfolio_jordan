import '../../styles/project-model.css'
import {useEffect,useRef,useState} from 'react'
import {Box,ExternalLink,Move3d,Play,Pause,RotateCcw,Expand,SlidersHorizontal,Camera,Focus,RefreshCw,SkipBack} from 'lucide-react'
import {useActivePalette} from '../../hooks/use-active-palette'
import {AssetImage} from './asset-image'
import {MODEL_MIME,parseModelUrl} from '../../lib/model-embed'
import {isLocalMedia,readMedia} from '../../lib/media-store'
import {resolvePublishedAsset} from '../../lib/published-assets'
import {DEFAULT_INSPECTOR_OPTIONS,normalizeModelPresentation,backdropFill,ART_SHADER_PRESETS,type ModelMode,type ModelPresentation,type InspectorOptions,type ModelCamera,type LightEditState,type LightEditCallbacks,type MaterialInfo,type MaterialEditState,type ModelAnimationInfo} from '../../lib/model-presentation'
import {ModelInspectorPanel} from './model-inspector-panel'
import type {ModelStage,ModelStats} from '../../lib/model-inspector-stage'
type Props={url:string;poster?:string;title?:string;presentation?:Partial<ModelPresentation>;startActive?:boolean;resetCameraToken?:number;previewArtShader?:boolean;onCaptureCamera?:(camera:ModelCamera)=>void;lightEditing?:LightEditState;lightCallbacks?:LightEditCallbacks;materialEditing?:MaterialEditState;onMaterials?:(materials:MaterialInfo[]|null)=>void;onMaterialSelect?:(id:string)=>void;onAnimations?:(clips:ModelAnimationInfo[]|null)=>void;previewRotation?:boolean;onPreviewRotationChange?:(value:boolean)=>void}
export function ProjectModel(props:Props){return <ModelViewer key={props.url} {...props}/>}
function ModelViewer({url,poster,title='3D artwork',presentation,startActive=false,resetCameraToken,previewArtShader,onCaptureCamera,lightEditing,lightCallbacks,materialEditing,onMaterials,onMaterialSelect,onAnimations,previewRotation,onPreviewRotationChange}:Props){
 useActivePalette()
 const parsed=parseModelUrl(url)
 const settings=normalizeModelPresentation(presentation)
 const configuration=useRef(settings);configuration.current=settings
 const [activated,setActivated]=useState(startActive)
 const [retry,setRetry]=useState(0)
 const [error,setError]=useState('')
 const [ready,setReady]=useState(false)
 const [resolvedSource,setResolvedSource]=useState('')
 const [mode,setMode]=useState<ModelMode>('material')
 // A saved camera is always stationary until the visitor opts into orbiting.
 const [visitorRotate,setVisitorRotate]=useState(false)
 const rotate=previewRotation??visitorRotate
 const setRotate=(value:boolean|((previous:boolean)=>boolean))=>{
  const next=typeof value==='function'?value(rotate):value
  if(onPreviewRotationChange)onPreviewRotationChange(next);else setVisitorRotate(next)
 }
 const [stats,setStats]=useState<ModelStats|null>(null)
 const [panelOpen,setPanelOpen]=useState(false)
 const [options,setOptions]=useState<InspectorOptions>({...DEFAULT_INSPECTOR_OPTIONS})
 const [animation,setAnimation]=useState(settings.animation.clip),[playing,setPlaying]=useState(settings.animation.clip>=0&&settings.animation.autoplay)
 const canvas=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null),stage=useRef<ModelStage|null>(null)
 const modeRef=useRef(mode);modeRef.current=mode
 const rotationRef=useRef(rotate);rotationRef.current=rotate
 const lightStateRef=useRef(lightEditing);lightStateRef.current=lightEditing
 const lightCallbacksRef=useRef(lightCallbacks);lightCallbacksRef.current=lightCallbacks
 const materialEditingRef=useRef(materialEditing);materialEditingRef.current=materialEditing
 const materialCallbacks=useRef({onMaterials,onMaterialSelect,onAnimations});materialCallbacks.current={onMaterials,onMaterialSelect,onAnimations}
 useEffect(()=>{stage.current?.setPresentation(configuration.current)})
 useEffect(()=>{stage.current?.resetCamera()},[resetCameraToken])
 useEffect(()=>{stage.current?.setMode(mode)},[mode])
 useEffect(()=>{if(previewArtShader){setMode('material');setPanelOpen(false)}},[previewArtShader,settings.artShader.preset,settings.artShader.chromaticAberration,materialEditing?.selected])
 useEffect(()=>{stage.current?.setRotation(rotate)},[rotate])
 useEffect(()=>{if(lightEditing)stage.current?.setLightEditing(lightEditing)},[lightEditing])
 useEffect(()=>{if(materialEditing)stage.current?.setMaterialEditing(materialEditing)},[materialEditing])
 useEffect(()=>{stage.current?.setOptions(options)},[options])
 useEffect(()=>{if(!ready||!stats)return;const clip=settings.animation.clip>=0&&settings.animation.clip<stats.animationClips.length?settings.animation.clip:-1;setAnimation(clip);setPlaying(clip>=0&&settings.animation.autoplay)},[ready,stats,settings.animation.clip,settings.animation.autoplay])
 useEffect(()=>{if(ready)stage.current?.setAnimation(animation,playing,settings.animation.speed,settings.animation.loop)},[ready,animation,playing,settings.animation.speed,settings.animation.loop])
 useEffect(()=>{
  if(!activated||!parsed)return
  let live=true,objectUrl=''
  let instance:ModelStage|null=null
  setReady(false);setError('');setResolvedSource('');setStats(null);materialCallbacks.current.onMaterials?.(null);materialCallbacks.current.onAnimations?.(null)
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
   instance=createModelStage(canvas.current,source,configuration.current,{onLoad:value=>{if(live){setStats(value);materialCallbacks.current.onMaterials?.(value.materials);materialCallbacks.current.onAnimations?.(value.animationClips);setReady(true);setError('')}},onError:()=>{if(live){materialCallbacks.current.onMaterials?.([]);materialCallbacks.current.onAnimations?.([]);setError('Could not load the 3D model. Check its format, textures and connection.')}},onAnimationFinished:()=>{if(live)setPlaying(false)}},lightCallbacksRef.current?{onSelect:id=>lightCallbacksRef.current?.onSelect(id),onChange:(id,patch)=>lightCallbacksRef.current?.onChange(id,patch)}:undefined,materialCallbacks.current.onMaterialSelect?id=>materialCallbacks.current.onMaterialSelect?.(id):undefined)
   stage.current=instance
   instance.setMode(modeRef.current);instance.setRotation(rotationRef.current);if(lightStateRef.current)instance.setLightEditing(lightStateRef.current);if(materialEditingRef.current)instance.setMaterialEditing(materialEditingRef.current)
  }
  void prepare().catch(()=>{if(live){materialCallbacks.current.onMaterials?.([]);materialCallbacks.current.onAnimations?.([]);setError('Could not initialize the 3D viewer. Check WebGL support and the model file.')}})
  return ()=>{live=false;instance?.dispose();if(stage.current===instance)stage.current=null;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[activated,parsed?.url,retry])
 const fullscreen=()=>{if(document.fullscreenElement===frame.current)void document.exitFullscreen().catch(()=>{});else if(frame.current?.requestFullscreen)void frame.current.requestFullscreen().catch(()=>{})}
 if(!parsed)return <div className="project-model-invalid" role="status">3D model unavailable. A GLB or glTF link is required.</div>
 return <section className="project-model-block" aria-label={'Interactive model: '+title}>
  <div className="project-model-frame" ref={frame} style={activated?{background:'transparent'}:undefined}>
   {!activated?<button type="button" className="project-model-poster" onClick={()=>setActivated(true)} aria-label={'Open interactive 3D model: '+title}>
    {poster?<AssetImage src={poster} alt="" loading="lazy"/>:<span className="project-model-fallback"><Box size={76} strokeWidth={1.1}/></span>}
    <span className="project-model-corner"><Box size={16}/> INTERACTIVE 3D</span>
    <span className="project-model-launch"><Move3d size={17}/><Play size={15} fill="currentColor"/> Explore model</span>
    <span className="project-model-format">{parsed.format.toUpperCase()} MODEL</span>
   </button>:<><div className="model-scene-backdrop" aria-hidden="true" style={{background:backdropFill(settings.background,settings.backdrop)}}>{settings.backdrop.mode==='image'&&settings.backdrop.image&&<AssetImage src={settings.backdrop.image} alt="" loading="eager" style={{objectFit:settings.backdrop.fit,objectPosition:settings.backdrop.centerX+'% '+settings.backdrop.centerY+'%',opacity:settings.backdrop.opacity}}/>}</div><div className="project-model-stage" ref={canvas}/>{!ready&&!error&&<p className="project-model-loading" role="status">Loading interactive 3D model…</p>}
   {ready&&stats&&!error&&<dl className="model-geometry-readout" aria-label="Mesh statistics" translate="no"><div><dt>Tris</dt><dd>{stats.triangles.toLocaleString()}</dd></div><div><dt>Verts</dt><dd>{stats.vertices.toLocaleString()}</dd></div></dl>}
   {ready&&<><div className="model-inspector-toolbar"><button type="button" className={panelOpen?'primary-action':'secondary-action'} aria-expanded={panelOpen} onClick={()=>setPanelOpen(v=>!v)}><SlidersHorizontal size={16}/> Model inspector</button><div className="model-inspector-actions">{stats&&stats.animationClips.length>0&&<div className="model-playback-toolbar"><select aria-label="Animation clip" title="Animation clip" value={animation} onChange={event=>{const index=Number(event.target.value);setAnimation(index);setPlaying(index>=0)}}><option value={-1}>Rest pose</option>{stats.animationClips.map((clip,index)=><option key={index} value={index}>{clip.name}</option>)}</select><button type="button" className="secondary-action" disabled={animation<0} aria-label={playing?'Pause animation':'Play animation'} title={playing?'Pause animation':'Play animation'} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button type="button" className="secondary-action" disabled={animation<0} title="Restart animation" aria-label="Restart animation" onClick={()=>stage.current?.restartAnimation()}><SkipBack size={15}/></button></div>}{lightEditing?.helpers&&<button className="secondary-action" type="button" title="Enquadrar modelo e luzes" aria-label="Enquadrar modelo e luzes" onClick={()=>{setRotate(false);stage.current?.frameLights()}}><Focus size={16}/></button>}{onCaptureCamera&&<button className="secondary-action" type="button" title="Salvar o enquadramento atual" onClick={()=>{const captured=stage.current?.captureCamera();if(captured){setRotate(false);onCaptureCamera(captured)}}}><Camera size={16}/> Capturar câmera</button>}<button className="secondary-action model-orbit-toggle" type="button" aria-label="Auto rotation" aria-pressed={rotate} title={rotate?'Disable automatic rotation':'Enable automatic rotation'} onClick={()=>setRotate(v=>!v)}><RefreshCw size={17} strokeWidth={2.5} aria-hidden="true"/></button><button className="secondary-action" type="button" aria-label="Reset camera" title="Reset camera" onClick={()=>{setRotate(false);stage.current?.resetCamera()}}><RotateCcw size={16}/></button>{typeof document!=='undefined'&&document.fullscreenEnabled&&<button className="secondary-action" type="button" aria-label="Fullscreen" title="Fullscreen" onClick={fullscreen}><Expand size={16}/></button>}</div></div>{panelOpen&&stats&&<ModelInspectorPanel mode={mode} onMode={setMode} options={options} onOptions={setOptions} stats={stats} onClose={()=>setPanelOpen(false)} animation={animation} playing={playing} onAnimation={index=>{setAnimation(index);setPlaying(index>=0)}} onPlaying={setPlaying}/>}</>}
   {error&&<div className="project-model-error" role="alert">{poster&&<AssetImage src={poster} alt="" className="project-model-error-poster"/>}<div className="project-model-error-content"><p>{error}</p><button type="button" className="secondary-action" onClick={()=>{setError('');setRetry(n=>n+1)}}><RotateCcw size={15}/> Retry model</button>{resolvedSource&&!isLocalMedia(parsed.url)&&<a href={resolvedSource} target="_blank" rel="noopener noreferrer">Open model source <ExternalLink size={14}/></a>}</div></div>}</>}
  </div>
  {lightEditing&&stats&&<div className="model-light-preview-notice">{(settings.artShader.preset!=='original'||settings.artShader.chromaticAberration>0||settings.artShader.crt>0||settings.artShader.vhs>0||settings.artShader.pixelSize>0||settings.artShader.bloom>0||Object.keys(settings.materialLooks).length>0)&&mode!=='material'&&<span>Os shaders e efeitos de câmera aparecem apenas no Render final. Os outros modos mantêm a inspeção técnica.</span>}{(settings.artShader.chromaticAberration>0||settings.artShader.bloom>0||settings.artShader.crt>0||settings.artShader.vhs>0||settings.artShader.pixelSize>0)&&lightEditing.helpers&&<span>Os efeitos de câmera (incluindo Bloom) ficam temporariamente desativados enquanto as guias de luz estão visíveis.</span>}{settings.artShader.preset!=='original'&&mode==='material'&&<span>Shader ativo: {ART_SHADER_PRESETS.find(item=>item.id===settings.artShader.preset)?.name}</span>}{stats.unlitMaterials>0&&!settings.relightUnlit&&<span>Este modelo contém materiais Unlit, que não recebem iluminação. Escolha “Iluminação da cena (automática)” na aba Luzes.</span>}{!['material','neutral','clay','flat','shaded-wire','clay-wire','flat-wire','bones'].includes(mode)&&<span>O modo de inspeção atual não mostra a iluminação. Volte ao Render final ou Clay.</span>}</div>}
 </section>
}
