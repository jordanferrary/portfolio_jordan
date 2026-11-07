import { useEffect,useRef,useState } from 'react'
import { Check,Infinity as InfinityIcon,ListMusic,Pause,Play,Volume2,VolumeX,X } from 'lucide-react'
import type { MusicTrack } from '../../data/studio'
import { useAssetSrc,AssetImage } from '../ui/asset-image'
import {classifyAudioSource} from '../../lib/audio-source'
export function MusicPlayer({tracks}:{tracks:MusicTrack[]}){
 const [selectedId,setSelectedId]=useState(()=>{try{return localStorage.getItem('jf-selected-song')??''}catch{return ''}})
 const [open,setOpen]=useState(false)
 const [playing,setPlaying]=useState(false)
 const [repeatOne,setRepeatOne]=useState(()=>{try{return localStorage.getItem('jf-music-repeat')!=='next'}catch{return true}})
 const [progress,setProgress]=useState(0)
 const [volume,setVolume]=useState(()=>{try{const raw=localStorage.getItem('jf-music-volume');if(raw===null)return 70;const saved=Number(raw);return Number.isFinite(saved)&&saved>=0&&saved<=100?saved:70}catch{return 70}})
 const [volumeOpen,setVolumeOpen]=useState(false)
 const [error,setError]=useState('')
 const audio=useRef<HTMLAudioElement>(null)
 const pendingPlay=useRef(false)
 const card=useRef<HTMLDivElement>(null)
 const current=tracks.find(t=>t.id===selectedId)??tracks[0]
 const source=useAssetSrc(current?.src)
 const sourceKind=classifyAudioSource(current?.src??'')
 const rejectedSource=['video-page','web-page','invalid'].includes(sourceKind)
 const playableSource=rejectedSource?'':source
 const sourceExplanation=sourceKind==='video-page'?'This is a streaming/video page, not a direct audio file. Edit the track in Local Studio and import an MP3, WAV, OGG or M4A.':sourceKind==='web-page'?'This address points to a page or another media type, not a playable audio file. Add a direct audio URL.':sourceKind==='invalid'?'This audio address is invalid. Edit the track in Local Studio to choose a file.':''
 const cover=current?.cover||import.meta.env.BASE_URL+'images/music/album-cover.webp'
 useEffect(()=>{
  const onPointer=(event:PointerEvent)=>{if(card.current&&!card.current.contains(event.target as Node)){setOpen(false);setVolumeOpen(false)}}
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);setVolumeOpen(false)}}
  document.addEventListener('pointerdown',onPointer)
  window.addEventListener('keydown',onKey)
  return ()=>{document.removeEventListener('pointerdown',onPointer);window.removeEventListener('keydown',onKey)}
 },[])
 useEffect(()=>{setProgress(0);setPlaying(false);if(current?.id){try{localStorage.setItem('jf-selected-song',current.id)}catch{/* storage unavailable */}}},[current?.id])
 useEffect(()=>{try{localStorage.setItem('jf-music-repeat',repeatOne?'one':'next')}catch{/* storage unavailable */}},[repeatOne])
 useEffect(()=>{if(audio.current){audio.current.volume=volume/100;audio.current.muted=volume===0}try{localStorage.setItem('jf-music-volume',String(volume))}catch{/* storage unavailable */}},[volume])
 const tryPlay=()=>{
  const player=audio.current
  if(!pendingPlay.current||!player||!playableSource||player.readyState<2)return
  // Await actual media readiness. An immediate play() during a source change
  // can reject with AbortError; clearing the intent there previously broke next-track.
  void player.play().then(()=>{pendingPlay.current=false}).catch((reason:unknown)=>{
   if(reason instanceof DOMException&&reason.name==='AbortError')return
   pendingPlay.current=false
   setError('The next track could not start. Press Play to try again.')
  })
 }
 const toggle=()=>{
  const player=audio.current
  if(!current||!player||!playableSource){if(sourceExplanation)setError(sourceExplanation);setOpen(true);return}
  setError('')
  if(player.paused)void player.play().catch(()=>setError('Playback was blocked. Press Play again.'))
  else player.pause()
 }
 const choose=(track:MusicTrack)=>{
  setOpen(false);setError('')
  if(track.id===current?.id){
   if(audio.current?.paused&&playableSource)void audio.current.play().catch(()=>setError('Press Play to start the track.'))
   return
  }
  pendingPlay.current=true
  audio.current?.pause()
  setSelectedId(track.id)
 }
 const next=()=>{
  if(tracks.length<2){pendingPlay.current=false;setPlaying(false);return}
  const index=tracks.findIndex(t=>t.id===current?.id)
  const upcoming=tracks[(index+1)%tracks.length]
  if(!upcoming)return
  pendingPlay.current=true
  setError('')
  setSelectedId(upcoming.id)
 }
 const seek=(value:number)=>{
  const player=audio.current
  if(player&&Number.isFinite(player.duration)&&player.duration>0){player.currentTime=value/100*player.duration;setProgress(value)}
 }
 return <div className="music-widget" ref={card}>
  <audio ref={audio} src={playableSource||undefined} preload="metadata" loop={repeatOne} onPlay={()=>{setPlaying(true);setError('')}} onPause={()=>setPlaying(false)} onCanPlay={tryPlay} onLoadedData={tryPlay} onError={()=>{setPlaying(false);if(current)setError(sourceExplanation||'Audio unavailable. The file link may be private, expired, or not supported by this browser. Use a direct playable MP3, WAV, OGG or M4A URL.')}} onTimeUpdate={e=>{const el=e.currentTarget;setProgress(Number.isFinite(el.duration)&&el.duration>0?el.currentTime/el.duration*100:0)}} onEnded={()=>{setPlaying(false);if(!repeatOne)next()}}/>
  {open&&<div className="music-popover" role="dialog" aria-label="Choose a song"><div className="music-popover-header"><b><ListMusic size={16}/> My playlist</b><button type="button" aria-label="Close" onClick={()=>setOpen(false)}><X size={16}/></button></div>
   {tracks.length?tracks.map(track=><button type="button" key={track.id} onClick={()=>choose(track)} className={track.id===current?.id?'music-track selected':'music-track'}><span className="music-track-cover"><AssetImage src={track.cover||import.meta.env.BASE_URL+'images/music/album-cover.webp'} alt=""/></span><span className="music-track-details"><b>{track.title}</b><small>{track.artist}</small></span>{track.id===current?.id&&<Check size={14}/>}</button>):<p className="music-empty">No tracks have been added yet.</p>}
   {(error||sourceExplanation)&&<p className="music-error" role="status">{error||sourceExplanation}</p>}
  </div>}
  <div className="music-card">
   <div className="music-card-top"><button type="button" className="music-cover-button" onClick={()=>setOpen(v=>!v)} aria-label="Open music library" aria-expanded={open} title="Choose a song"><AssetImage src={cover} alt={current?'Cover art for '+current.title:'Playlist cover art'}/></button><button type="button" className="music-main-toggle" onClick={toggle} aria-label={playing?'Pause':'Play'} aria-pressed={playing} disabled={!current}>{playing?<Pause size={31} fill="currentColor"/>:<Play size={28} fill="currentColor"/>}</button></div>
   <button type="button" className="music-card-details" onClick={()=>setOpen(v=>!v)} aria-label="Choose a song"><strong title={current?.title}>{current?.title||'Your playlist'}</strong><span title={current?.artist}>{current?.artist||'No tracks yet'}</span></button>
   <div className="music-card-footer"><button type="button" className={repeatOne?'music-repeat is-on':'music-repeat'} aria-pressed={repeatOne} aria-label={repeatOne?'Repeat this track: on. Switch to next-track mode.':'Next-track mode: on. Switch to repeat-track mode.'} title={repeatOne?'∞ Repeat track':'Play next track'} onClick={()=>setRepeatOne(value=>!value)}><InfinityIcon size={17}/></button><input className="music-seek" type="range" min="0" max="100" step="0.1" value={progress} onChange={e=>seek(Number(e.target.value))} disabled={!current} aria-label="Playback progress" style={{background:'linear-gradient(to right, var(--jf-primary,#a02aff) '+progress+'%,var(--jf-surface-deep,#27143b) '+progress+'%)'}}/><button type="button" className={volumeOpen?'music-volume-toggle is-open':'music-volume-toggle'} aria-label="Adjust volume" title={'Volume: '+volume+'%'} aria-expanded={volumeOpen} onClick={()=>setVolumeOpen(v=>!v)}>{volume===0?<VolumeX size={16}/>:<Volume2 size={16}/>}</button></div>{volumeOpen&&<div className="music-volume-inline" role="group" aria-label="Music volume"><button type="button" onClick={()=>setVolume(v=>v===0?70:0)} aria-label={volume===0?'Unmute':'Mute'}>{volume===0?<VolumeX size={17}/>:<Volume2 size={17}/>}</button><input type="range" min="0" max="100" step="1" value={volume} onChange={e=>setVolume(Number(e.target.value))} aria-label="Playback volume" style={{background:'linear-gradient(to right,var(--jf-primary,#b148ff) 0%,var(--jf-primary,#b148ff) '+volume+'%,var(--jf-surface-deep,#39204f) '+volume+'%,var(--jf-surface-deep,#39204f) 100%)'}}/><span>{volume}%</span></div>}
   {(error||sourceExplanation)&&<p className="music-card-error" role="status">{error||sourceExplanation}</p>}
  </div>
 </div>
}
