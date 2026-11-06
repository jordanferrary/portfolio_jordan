import { useEffect,useRef,useState } from 'react'
import { ListMusic, Music2, Pause, Play, X } from 'lucide-react'
import type { MusicTrack } from '../../data/studio'
import { useAssetSrc } from '../ui/asset-image'
export function MusicPlayer({tracks}:{tracks:MusicTrack[]}){
 const [selectedId,setSelectedId]=useState('')
 const [open,setOpen]=useState(false)
 const [playing,setPlaying]=useState(false)
 const [progress,setProgress]=useState(0)
 const [error,setError]=useState('')
 const audio=useRef<HTMLAudioElement>(null)
 const pendingPlay=useRef(false)
 const card=useRef<HTMLDivElement>(null)
 const current=tracks.find(t=>t.id===selectedId)??tracks[0]
 const source=useAssetSrc(current?.src)
 useEffect(()=>{
  const close=(event:PointerEvent)=>{if(card.current&&!card.current.contains(event.target as Node))setOpen(false)}
  document.addEventListener('pointerdown',close)
  return ()=>document.removeEventListener('pointerdown',close)
 },[])
 useEffect(()=>{setProgress(0);setPlaying(false)},[current?.id])
 useEffect(()=>{
  if(source&&pendingPlay.current){
   pendingPlay.current=false
   audio.current?.play().catch(()=>setError('Não foi possível iniciar o áudio. Clique em Play novamente.'))
  }
 },[source])
 const toggle=()=>{
  const player=audio.current
  if(!current||!player||!source){setOpen(true);return}
  setError('')
  if(player.paused)void player.play().catch(()=>setError('Reprodução bloqueada. Clique em Play novamente.'))
  else player.pause()
 }
 const choose=(track:MusicTrack)=>{
  setError('');setOpen(false)
  if(track.id===current?.id){void audio.current?.play().catch(()=>setError('Não foi possível reproduzir a faixa.'));return}
  pendingPlay.current=true
  setSelectedId(track.id)
 }
 return <div className="music-widget" ref={card}>
  <audio ref={audio} src={source||undefined} loop preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>{const el=e.currentTarget;setProgress(el.duration>0?el.currentTime/el.duration*100:0)}}/>
  {open&&<div className="music-popover" role="dialog" aria-label="Selecionar música"><div className="music-popover-header"><b><ListMusic size={16}/> Playlist</b><button aria-label="Fechar lista" onClick={()=>setOpen(false)}><X size={16}/></button></div>{tracks.length?tracks.map(track=><button key={track.id} className={track.id===current?.id?'music-track selected':'music-track'} onClick={()=>choose(track)}><Music2 size={16}/><span><b>{track.title}</b><small>{track.artist||'Artista não informado'}</small></span>{track.id===current?.id&&<span className="playing-indicator">●</span>}</button>):<p className="music-empty">Nenhuma faixa cadastrada. No Local Studio, abra “Home & música” e importe um áudio.</p>}{error&&<p className="music-error">{error}</p>}</div>}
  <div className="mini-player actual-player"><button className="album music-album-button" title="Escolher música" aria-label="Abrir playlist" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><img src={import.meta.env.BASE_URL+'images/music/album-cover.webp'} alt="Capa da playlist"/></button><button className="song music-name-button" onClick={()=>setOpen(v=>!v)} aria-label="Selecionar faixa"><b>{current?.title||'Selecionar'}</b><small>{current?.artist||'Sem música'}</small><span className={playing?'wave wave-playing':'wave'}>▂▅▃▇▂▅▆▃</span></button><button className="music-toggle-button" type="button" onClick={toggle} aria-label={playing?'Pausar música':'Reproduzir música'} disabled={!current} aria-pressed={playing}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><div className="music-progress"><span style={{width:progress+'%'}}/></div></div>
 </div>
}
