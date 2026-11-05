import { useEffect, useRef, useState } from "react";

export function useAudioPlayer(src) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onReady = () => setReady(true);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("canplay", onReady);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }

  return { audioRef, playing, volume, setVolume, ready, toggle };
}
