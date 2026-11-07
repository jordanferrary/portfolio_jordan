import {lazy,Suspense,useState} from 'react'
import {Clapperboard,ExternalLink,Play} from 'lucide-react'
import {parseVideoEmbed} from '../../lib/video-embed'
import {AssetImage} from './asset-image'

const YouTubeCustomPlayer=lazy(()=>import('./youtube-custom-player').then(m=>({default:m.YouTubeCustomPlayer})))

export function ProjectVideo({url,poster,title}:{url:string;poster?:string;title?:string}){
 const [activated,setActivated]=useState(false)
 const video=parseVideoEmbed(url)
 if(!video)return null
 const label=title?.trim()||'Creative process video'
 if(activated&&video.provider==='youtube'){
  return <div className="project-video-embed"><Suspense fallback={<div className="project-video-frame project-video-loading">Loading YouTube player…</div>}><YouTubeCustomPlayer embedUrl={video.embedUrl} watchUrl={video.watchUrl} title={label}/></Suspense></div>
 }
 return <div className="project-video-embed">
  <div className="project-video-frame">
   {activated?<iframe src={video.embedUrl} title={label} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy"/>:
    <button type="button" className="project-video-poster" onClick={()=>setActivated(true)} aria-label={'Play '+label}>
     {(poster||video.thumbnail)?<AssetImage src={poster||video.thumbnail} alt="" loading="lazy"/>:<span className="project-video-placeholder">{video.provider==='vimeo'?'VIMEO':'VIDEO'}</span>}
     <span className="project-video-badge"><Clapperboard size={15}/> VIDEO</span>
     <span className="project-video-play"><Play fill="currentColor" size={24}/></span>
     <span className="project-video-provider">{video.provider==='youtube'?'YouTube':'Vimeo'} · Play video</span>
     <span className="project-video-kind">16:9 CINEMATIC</span>
    </button>}
  </div>
  <div className="project-video-preview-caption">
   <div><span>✦ PROJECT FILM</span><strong>{label}</strong></div>
   <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">Watch on {video.provider==='youtube'?'YouTube':'Vimeo'} <ExternalLink size={14}/></a>
  </div>
 </div>
}
