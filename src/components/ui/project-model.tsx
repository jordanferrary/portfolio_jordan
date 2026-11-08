import '../../styles/project-model.css'
import {useEffect,useRef,useState} from 'react'
import {Box,ExternalLink,Move3d,Play} from 'lucide-react'
import {AssetImage} from './asset-image'
import {parseModelUrl} from '../../lib/model-embed'
let viewerReady:Promise<void>|null=null
/** Model-viewer is fetched only after a deliberate click and never added to Vite's initial JS bundle. */
function loadViewer():Promise<void>{
 if(customElements.get('model-viewer'))return Promise.resolve()
 if(viewerReady)return viewerReady
 viewerReady=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script')
  script.type='module'
  script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js'
  script.onload=()=>{void customElements.whenDefined('model-viewer').then(()=>resolve(),reject)}
  script.onerror=()=>reject(new Error('Não foi possível carregar o visualizador 3D.'))
  document.head.appendChild(script)
 }).catch(error=>{viewerReady=null;throw error})
 return viewerReady
}
type Props={url:string;poster?:string;title?:string}
export function ProjectModel({url,poster,title='3D artwork'}:Props){
 const parsed=parseModelUrl(url)
 const [activated,setActivated]=useState(false)
 const [error,setError]=useState('')
 const [ready,setReady]=useState(false)
 const canvas=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!activated||!parsed)return
  let live=true
  let viewer:HTMLElement|null=null
  setReady(false)
  void loadViewer().then(()=>{
   if(!live||!canvas.current)return
   viewer=document.createElement('model-viewer')
   viewer.setAttribute('src',parsed.url)
   viewer.setAttribute('alt',title)
   viewer.setAttribute('camera-controls','')
   viewer.setAttribute('auto-rotate','')
   viewer.setAttribute('shadow-intensity','1')
   viewer.setAttribute('interaction-prompt','none')
   viewer.setAttribute('loading','eager')
   viewer.className='project-model-canvas'
   viewer.style.width='100%'
   viewer.style.height='100%'
   viewer.addEventListener('load',()=>{if(live){setReady(true);setError('')}})
   viewer.addEventListener('error',()=>{if(live)setError('Não foi possível abrir o modelo. Verifique o link direto, CORS e as texturas externas.')})
   canvas.current.appendChild(viewer)
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:'Erro ao carregar visualizador 3D.')})
  return ()=>{live=false;viewer?.remove()}
 },[activated,parsed?.url,title])
 if(!parsed)return <div className="project-model-invalid" role="status">3D model not available — GLB or glTF link required.</div>
 return <section className="project-model-block" aria-label={'Interactive model: '+title}>
  <div className="project-model-frame">
   {!activated?<button type="button" className="project-model-poster" onClick={()=>setActivated(true)} aria-label={'Open interactive 3D model: '+title}>
    {poster?<AssetImage src={poster} alt="" loading="lazy"/>:<span className="project-model-fallback"><Box size={76} strokeWidth={1.1}/></span>}
    <span className="project-model-corner"><Box size={16}/> INTERACTIVE 3D</span>
    <span className="project-model-launch"><Move3d size={17}/><Play size={15} fill="currentColor"/> Explore model</span>
    <span className="project-model-format">{parsed.format.toUpperCase()} MODEL</span>
   </button>:<><div className="project-model-stage" ref={canvas}/>{!ready&&!error&&<p className="project-model-loading" role="status">Loading interactive 3D model…</p>}{error&&<div className="project-model-error" role="alert"><p>{error}</p><a href={parsed.url} target="_blank" rel="noopener noreferrer">Open model source <ExternalLink size={14}/></a></div>}</>}
  </div>
  <p className="project-model-hint"><Move3d size={15}/> Rotate · Zoom · Pan — 3D assets load only on request</p>
 </section>
}
