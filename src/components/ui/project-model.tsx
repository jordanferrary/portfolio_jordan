import '../../styles/project-model.css'
import {useEffect,useRef,useState} from 'react'
import {Box,ExternalLink,Move3d,Play,Pause,RotateCcw,Expand} from 'lucide-react'
import {AssetImage} from './asset-image'
import {MODEL_MIME,parseModelUrl} from '../../lib/model-embed'
import {isLocalMedia,readMedia} from '../../lib/media-store'
import {resolvePublishedAsset} from '../../lib/published-assets'
import {MODEL_MODES,normalizeModelPresentation,type ModelMode,type ModelPresentation} from '../../lib/model-presentation'
import type {ModelStage,ModelStats} from '../../lib/model-inspector-stage'
type Props={url:string;poster?:string;title?:string;presentation?:Partial<ModelPresentation>}
export function ProjectModel(props:Props){return <ModelViewer key={props.url} {...props}/>}
function ModelViewer({url,poster,title='3D artwork',presentation}:Props){
 const parsed=parseModelUrl(url)
 const settings=normalizeModelPresentation(presentation)
 const configuration=useRef(settings);configuration.current=settings
 const [activated,setActivated]=useState(false)
 const [error,setError]=useState('')
 const [ready,setReady]=useState(false)
 const [resolvedSource,setResolvedSource]=useState('')
 const [mode,setMode]=useState<ModelMode>('material')
 const [rotate,setRotate]=useState(settings.autoRotate)
 const [stats,setStats]=useState<ModelStats|null>(null)
 const canvas=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null),stage=useRef<ModelStage|null>(null)
 const modeRef=useRef(mode);modeRef.current=mode
 const rotationRef=useRef(rotate);rotationRef.current=rotate
 useEffect(()=>{setRotate(settings.autoRotate)},[settings.autoRotate])
 useEffect(()=>{stage.current?.setPresentation(configuration.current)})
 useEffect(()=>{stage.current?.setMode(mode)},[mode])
 useEffect(()=>{stage.current?.setRotation(rotate)},[rotate])
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
   instance=createModelStage(canvas.current,source,configuration.current,{onLoad:value=>{if(live){setStats(value);setReady(true);setError('')}},onError:()=>{if(live)setError('Could not load the 3D model. Check its format, textures and connection.')}})
   stage.current=instance
   instance.setMode(modeRef.current);instance.setRotation(rotationRef.current)
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
   {ready&&<div className="model-inspector-toolbar"><div className="model-inspector-modes" role="group" aria-label="Shading mode">{MODEL_MODES.map(item=><button key={item.id} type="button" className={mode===item.id?'primary-action':'secondary-action'} aria-pressed={mode===item.id} onClick={()=>setMode(item.id)}>{item.label}</button>)}</div><div className="model-inspector-actions"><button className="secondary-action" type="button" aria-label={rotate?'Pause rotation':'Resume rotation'} title={rotate?'Pause rotation':'Resume rotation'} onClick={()=>setRotate(v=>!v)}>{rotate?<Pause size={16}/>:<Play size={16}/>}</button><button className="secondary-action" type="button" aria-label="Reset camera" title="Reset camera" onClick={()=>stage.current?.resetCamera()}><RotateCcw size={16}/></button>{typeof document!=='undefined'&&document.fullscreenEnabled&&<button className="secondary-action" type="button" aria-label="Fullscreen" title="Fullscreen" onClick={fullscreen}><Expand size={16}/></button>}</div></div>}
   {error&&<div className="project-model-error" role="alert"><p>{error}</p>{resolvedSource&&!isLocalMedia(parsed.url)&&<a href={resolvedSource} target="_blank" rel="noopener noreferrer">Open model source <ExternalLink size={14}/></a>}</div>}</>}
  </div>
  <div className="model-inspector-meta"><p className="project-model-hint"><Move3d size={15}/> Rotate · Zoom · Pan — 3D assets load only on request</p>{stats&&<span translate="no">{stats.triangles.toLocaleString()} tris · {stats.vertices.toLocaleString()} verts</span>}</div>
 </section>
}
