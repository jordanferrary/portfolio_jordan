import {useState} from 'react'
import {Clapperboard,ExternalLink,Play} from 'lucide-react'
import {parseVideoEmbed} from '../../lib/video-embed'
import {AssetImage} from './asset-image'
export function ProjectVideo({url,poster,title}:{url:string;poster?:string;title?:string}){
 const [activated,setActivated]=useState(false)
 const video=parseVideoEmbed(url)
 if(!video)return null
 return <div className="project-video-embed">
  <div className="project-video-frame">
   {activated?<iframe src={video.embedUrl} title={title||'Project video'} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy"/>:
    <button type="button" className="project-video-poster" onClick={()=>setActivated(true)} aria-label={'Play '+(title||'project video')}>
     {(poster||video.thumbnail)?<AssetImage src={poster||video.thumbnail} alt="" loading="lazy"/>:<span className="project-video-placeholder">{video.provider==='vimeo'?'VIMEO':'VIDEO'}</span>}
     <span className="project-video-badge"><Clapperboard size={15}/> VIDEO</span>
     <span className="project-video-play"><Play fill="currentColor" size={24}/></span><span className="project-video-provider">{video.provider==='youtube'?'YouTube':'Vimeo'} · Play video</span>
     <span className="project-video-kind">16:9 CINEMATIC</span>
    </button>}
  </div><a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className="project-video-source">Watch on {video.provider==='youtube'?'YouTube':'Vimeo'} <ExternalLink size={14}/></a>
 </div>
}
