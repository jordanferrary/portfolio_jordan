import {useEffect,useRef,useState} from 'react'
import {ExternalLink,Pause,Play,RotateCcw} from 'lucide-react'
import {loadYouTubePlayerApi,type YouTubePlayerHandle} from '../../lib/youtube-player-api'
import './youtube-custom-player.css'

type Props={embedUrl:string;watchUrl:string;title:string}
function clock(value:number){
 const safe=Math.max(0,Math.floor(Number.isFinite(value)?value:0))
 const seconds=String(safe%60).padStart(2,'0')
 const minutes=String(Math.floor(safe/60)%60).padStart(2,'0')
 const hours=Math.floor(safe/3600)
 return hours?hours+':'+minutes+':'+seconds:Math.floor(safe/60)+':'+seconds
}
export function YouTubeCustomPlayer({embedUrl,watchUrl,title}:Props){
 const host=useRef<HTMLDivElement>(null)
 const player=useRef<YouTubePlayerHandle|null>(null)
 const [time,setTime]=useState(0)
 const [duration,setDuration]=useState(0)
 const [playing,setPlaying]=useState(false)
 const [ready,setReady]=useState(false)
 const [controlsError,setControlsError]=useState(false)
 useEffect(()=>{
  const node=host.current
  if(!node)return
  let live=true
  const iframe=document.createElement('iframe')
  // Preserve the original YouTube privacy-enhanced player and all native controls.
  const origin=encodeURIComponent(window.location.origin)
  iframe.src=embedUrl+'&enablejsapi=1&origin='+origin+'&controls=1&color=white&playsinline=1'
  iframe.title=title+' — YouTube'
  iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share'
  iframe.allowFullscreen=true
  iframe.referrerPolicy='strict-origin-when-cross-origin'
  iframe.className='project-video-iframe'
  node.appendChild(iframe)
  void loadYouTubePlayerApi().then(api=>{
   if(!live)return
   player.current=new api.Player(iframe,{events:{
    onReady:()=>{
     if(!live)return
     setReady(true)
     setControlsError(false)
    },
    onStateChange:event=>{
     if(!live)return
     setPlaying(event.data===1)
     const seconds=event.target.getDuration()
     if(Number.isFinite(seconds)&&seconds>0)setDuration(seconds)
    },
    onError:()=>{if(live)setControlsError(true)}
   }})
  }).catch(()=>{if(live)setControlsError(true)})
  const ticker=window.setInterval(()=>{
   if(!live||!player.current)return
   try{
    const now=player.current.getCurrentTime()
    const total=player.current.getDuration()
    if(Number.isFinite(now))setTime(Math.max(0,now))
    if(Number.isFinite(total)&&total>0)setDuration(total)
   }catch{/* The YouTube iframe may not be ready yet. */}
  },500)
  return ()=>{
   live=false
   window.clearInterval(ticker)
   const instance=player.current
   player.current=null
   if(instance){try{instance.destroy()}catch{iframe.remove()}}
   else iframe.remove()
  }
 },[embedUrl,title])
 const toggle=()=>{
  const instance=player.current
  if(!instance||!ready)return
  if(playing)instance.pauseVideo()
  else instance.playVideo()
 }
 const seek=(value:number)=>{
  const at=Math.min(Math.max(0,value),duration)
  setTime(at)
  player.current?.seekTo(at,true)
 }
 const percent=duration>0?Math.min(100,time/duration*100):0
 return <>
  <div className="project-video-frame">
   <div className="project-video-iframe-host" ref={host}/>
  </div>
  <div className="project-video-console">
   <div className="project-video-console-top">
    <div className="project-video-console-heading">
     <span className="project-video-console-label">✦ PROJECT FILM</span>
     <strong>{title}</strong>
    </div>
    <a href={watchUrl} target="_blank" rel="noopener noreferrer" aria-label="Open on YouTube">YouTube <ExternalLink size={14}/></a>
   </div>
   <div className="project-video-console-controls">
    <button type="button" className="project-video-console-toggle" disabled={!ready} onClick={toggle} aria-label={playing?'Pause video':'Play video'}>{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button>
    <span className="project-video-clock">{clock(time)}</span>
    <input className="project-video-timeline" type="range" min="0" max={Math.max(duration,1)} step=".1" value={Math.min(time,Math.max(duration,1))} onChange={event=>seek(Number(event.target.value))} disabled={!ready||duration<=0} aria-label="Video timeline" style={{background:'linear-gradient(to right,#b75bfa 0%,#b75bfa '+percent+'%,#4e365c '+percent+'%,#4e365c 100%)'}}/>
    <span className="project-video-clock">{duration>0?clock(duration):'--:--'}</span>
    <button type="button" className="project-video-console-reset" disabled={!ready} onClick={()=>seek(0)} aria-label="Restart video"><RotateCcw size={16}/></button>
   </div>
   {controlsError&&<p className="project-video-console-note">Use os controles do próprio YouTube. Os controles personalizados não estão disponíveis neste navegador.</p>}
  </div>
 </>
}
