import { useEffect,useRef,useState } from 'react'
import { Check,Infinity as InfinityIcon,ListMusic,Pause,Play,X } from 'lucide-react'
import type { MusicTrack } from '../../data/studio'
import { useAssetSrc,AssetImage } from '../ui/asset-image'
export function MusicPlayer({tracks}:{tracks:MusicTrack[]}){
 const [selectedId,setSelectedId]=useState('')
 const [open,setOpen]=useState(false)
 const [playing,setPlaying]=useState(false)
 const [repeatOne,setRepeatOne]=useState(true)
 const [progress,setProgress]=useState(0)
 const [error,setError]=useState('')
 const audio=useRef<HTMLAudioElement>(null)
 const pendingPlay=useRef(false)
 const card=useRef<HTMLDivElement>(null)
 const current=tracks.find(t=>t.id===selectedId)??tracks[0]
 const source=useAssetSrc(current?.src)
 const cover=current?.cover||import.meta.env.BASE_URL+'images/music/album-cover.webp'
 useEffect(()=>{
  const onPointer=(event:PointerEvent)=>{if(card.current&&!card.current.contains(event.target as Node))setOpen(false)}
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)}
  document.addEventListener('pointerdown',onPointer)
  window.addEventListener('keydown',onKey)
  return ()=>{document.removeEventListener('pointerdown',onPointer);window.removeEventListener('keydown',onKey)}
 },[])
 useEffect(()=>{setProgress(0);setPlaying(false)},[current?.id])
 const tryPlay=()=>{
  if(!pendingPlay.current||!audio.current||!source)return
  pendingPlay.current=false
  void audio.current.play().catch(()=>setError('O navegador não iniciou a faixa automaticamente. Clique em Play.'))
 }
 useEffect(()=>{tryPlay()},[source])
 const toggle=()=>{
  const player=audio.current
  if(!current||!player||!source){setOpen(true);return}
  setError('')
  if(player.paused)void player.play().catch(()=>setError('Reprodução bloqueada. Clique em Play novamente.'))
  else player.pause()
 }
 const choose=(track:MusicTrack)=>{
  setOpen(false);setError('')
  if(track.id===current?.id){
   if(audio.current?.paused&&source)void audio.current.play().catch(()=>setError('Clique em Play para reproduzir a faixa.'))
   return
  }
  pendingPlay.current=true
  audio.current?.pause()
  setSelectedId(track.id)
 }
 const next=()=>{
  if(tracks.length<2){setPlaying(false);return}
  const index=tracks.findIndex(t=>t.id===current?.id)
  const upcoming=tracks[(index+1)%tracks.length]
  if(!upcoming)return
  pendingPlay.current=true
  setSelectedId(upcoming.id)
 }
 const seek=(value:number)=>{
  const player=audio.current
  if(player&&Number.isFinite(player.duration)&&player.duration>0){player.currentTime=value/100*player.duration;setProgress(value)}
 }
 return <div className="music-widget" ref={card}>
  <audio ref={audio} src={source||undefined} preload="metadata" loop={repeatOne} onPlay={()=>{setPlaying(true);setError('')}} onPause={()=>setPlaying(false)} onCanPlay={tryPlay} onError={()=>{setPlaying(false);if(current)setError('Áudio indisponível. Confira o arquivo ou a URL.')}} onTimeUpdate={e=>{const el=e.currentTarget;setProgress(Number.isFinite(el.duration)&&el.duration>0?el.currentTime/el.duration*100:0)}} onEnded={()=>{setPlaying(false);if(!repeatOne)next()}}/>
  {open&&<div className="music-popover" role="dialog" aria-label="Escolher música"><div className="music-popover-header"><b><ListMusic size={16}/> Minha playlist</b><button type="button" aria-label="Fechar" onClick={()=>setOpen(false)}><X size={16}/></button></div>
   {tracks.length?tracks.map(track=><button type="button" key={track.id} onClick={()=>choose(track)} className={track.id===current?.id?'music-track selected':'music-track'}><span className="music-track-cover"><AssetImage src={track.cover||import.meta.env.BASE_URL+'images/music/album-cover.webp'} alt=""/></span><span className="music-track-details"><b>{track.title}</b><small>{track.artist}</small></span>{track.id===current?.id&&<Check size={14}/>}</button>):<p className="music-empty">Playlist vazia. No Local Studio, abra “Home, feedbacks e músicas” e cadastre sua primeira faixa.</p>}
   {error&&<p className="music-error" role="status">{error}</p>}
  </div>}
  <div className="music-card">
   <div className="music-card-top"><button type="button" className="music-cover-button" onClick={()=>setOpen(v=>!v)} aria-label="Abrir biblioteca de músicas" aria-expanded={open} title="Escolher uma música"><AssetImage src={cover} alt={current?'Capa de '+current.title:'Capa da playlist'}/></button><button type="button" className="music-main-toggle" onClick={toggle} aria-label={playing?'Pausar música':'Reproduzir música'} aria-pressed={playing} disabled={!current}>{playing?<Pause size={31} fill="currentColor"/>:<Play size={28} fill="currentColor"/>}</button></div>
   <button type="button" className="music-card-details" onClick={()=>setOpen(v=>!v)} aria-label="Escolher música"><strong title={current?.title}>{current?.title||'Sua playlist'}</strong><span title={current?.artist}>{current?.artist||'Sem música cadastrada'}</span></button>
   <div className="music-card-footer"><button type="button" className={repeatOne?'music-repeat is-on':'music-repeat'} aria-pressed={repeatOne} aria-label={repeatOne?'Repetir esta música: ativado. Alternar para próxima música.':'Próxima música ao terminar: ativado. Alternar para repetir esta faixa.'} title={repeatOne?'∞ Repetir mesma música':'Avançar para a próxima'} onClick={()=>setRepeatOne(value=>!value)}><InfinityIcon size={17}/></button><input className="music-seek" type="range" min="0" max="100" step="0.1" value={progress} onChange={e=>seek(Number(e.target.value))} disabled={!current} aria-label="Progresso da música" style={{background:'linear-gradient(to right, #a02aff '+progress+'%,#27143b '+progress+'%)'}}/></div>
   {error&&<p className="music-card-error" role="status">{error}</p>}
  </div>
 </div>
}
