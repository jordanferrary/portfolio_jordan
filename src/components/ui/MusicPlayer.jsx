import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

// Add your licensed audio file at public/audio/portfolio-atmosphere.mp3.
const TRACK = "/audio/portfolio-atmosphere.mp3";

export default function MusicPlayer() {
  const { audioRef, playing, volume, setVolume, toggle, ready } = useAudioPlayer(TRACK);
  return (
    <section className="music-widget" aria-label="Ambient music player">
      <audio ref={audioRef} src={TRACK} loop preload="none" />
      <div className="music-collapsed">
        <button className="music-toggle" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"}>
          {playing ? <Pause size={16}/> : <Play size={16}/>}
        </button>
        <span className={`music-bars ${playing ? "is-playing" : ""}`}><i/><i/><i/><i/></span>
      </div>
      <div className="music-expanded">
        <div className="music-heading"><span className="eyebrow">AMBIENT PLAYER</span><span className="music-live">{playing ? "PLAYING" : "PAUSED"}</span></div>
        <strong>Studio atmosphere</strong>
        <small>{ready ? "A little sound for the journey" : "Add your own track to activate"}</small>
        <div className="music-controls">
          <button className="music-toggle" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"}>
            {playing ? <Pause size={15}/> : <Play size={15}/>}
          </button>
          <Volume2 size={15}/>
          <input aria-label="Music volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))}/>
        </div>
      </div>
    </section>
  );
}
