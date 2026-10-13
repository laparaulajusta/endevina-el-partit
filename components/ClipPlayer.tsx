'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Hls from 'hls.js';

export interface ClipPlayerHandle {
  seekBy: (delta: number) => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getProgress: () => number;
}

interface Props {
  manifestUrl: string;
  start: number;
  duration: number;
  revealed: boolean;
  volume: number;
  paused: boolean;
  muted: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlaying: () => void;
  onError: () => void;
  onLoop?: () => void;
}

export const ClipPlayer = forwardRef<ClipPlayerHandle, Props>(function ClipPlayer(
  { manifestUrl, start, duration, revealed, volume, paused, muted, onVolumeChange, onTimeUpdate, onPlaying, onError, onLoop },
  ref
) {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const startedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    seekBy(delta) {
      const m = mediaRef.current;
      if (!m) 
        return;
      const t = m.currentTime + delta;
      if (revealedRef.current) { 
        m.currentTime = Math.max(0, t); 
        return; 
      }
      m.currentTime = t >= start + duration ? start : Math.max(start, t);
    },
    seekTo(time) {
      const m = mediaRef.current;
      if (!m) 
        return;
      if (revealedRef.current) {
        m.currentTime = Math.max(0, time);
        return;
      }
      m.currentTime = Math.max(start, Math.min(start + duration, time));
    },
    getCurrentTime() {
      return mediaRef.current ? mediaRef.current.currentTime : start;
    },
    getDuration() {
      return mediaRef.current ? mediaRef.current.duration : 0;
    },
    getProgress() {
      const m = mediaRef.current;
      return m ? (m.currentTime - start) / duration : 0;
    },
  }), [start, duration]);

  useEffect(() => {
    if (mediaRef.current) 
      mediaRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (mediaRef.current) 
      mediaRef.current.muted = muted;
  }, [muted]);

  // pausa / continua (només un cop ha arrencat)
  useEffect(() => {
    const m = mediaRef.current;
    if (!m || !startedRef.current) 
      return;
    if (paused) 
      m.pause();
    else 
      m.play().catch(() => {});
  }, [paused]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) 
      return;
    const end = start + duration;
    let hls: Hls | null = null;
    startedRef.current = false;

    const play = () => media.play().catch(onError);
    const onPlayingEv = () => { startedRef.current = true; onPlaying(); };
    const onVol = () => onVolumeChange?.(media.volume, media.muted);
    const onTime = () => onTimeUpdate?.(media.currentTime);

    media.addEventListener('playing', onPlayingEv, { once: true });
    media.addEventListener('volumechange', onVol);
    media.addEventListener('timeupdate', onTime);

    // bucle: salta a l'inici quan arriba al final (en pausa, currentTime no avança)
    const timer = setInterval(() => {
      if (!revealedRef.current && media.currentTime >= end) {
        media.currentTime = start;
        onLoop?.();
      }
    }, 100);

    if (Hls.isSupported()) {
      hls = new Hls({ startPosition: start });
      hls.loadSource(manifestUrl);
      hls.attachMedia(media);
      hls.on(Hls.Events.MANIFEST_PARSED, play);
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) onError(); });
    } else if (media.canPlayType('application/vnd.apple.mpegurl')) {
      media.src = manifestUrl;
      media.addEventListener('loadedmetadata', () => { media.currentTime = start; play(); }, { once: true });
    } else {
      onError();
    }

    return () => {
      clearInterval(timer);
      media.removeEventListener('playing', onPlayingEv);
      media.removeEventListener('volumechange', onVol);
      media.removeEventListener('timeupdate', onTime);
      hls?.destroy();
      media.removeAttribute('src');
      media.load();
    };
  }, [manifestUrl, start, duration]);

  return <video ref={mediaRef} playsInline controls={true} className="w-full h-full object-contain bg-black" />;
});