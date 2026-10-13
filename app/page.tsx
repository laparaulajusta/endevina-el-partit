'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundWave } from '@/components/SoundWave';
import { ClipPlayer, type ClipPlayerHandle } from '@/components/ClipPlayer';
import { LoopRing } from '@/components/LoopRing';
import { VolumeControl } from '@/components/VolumeControl';
import { VIDEO_BUFFER } from '@/lib/parlamentManifest';

interface PartitOpcio {
  id: string;
  nom: string;
  sigles: string;
  color: string;
}

interface GameData {
  videoId: string;
  posicio: number;
  manifestUrl: string;
  legislatura: string;
  partits: PartitOpcio[];
}

interface Resultat {
  correct: boolean;
  orador: string;
  partitCorrecte: string;
  siglesCorrectes: string;
  parlamentUrl?: string;
}

export default function Home() {
  const [data, setData] = useState<GameData | null>(null);
  const [score, setScore] = useState({ hits: 0, misses: 0 });
  const [result, setResult] = useState<Resultat | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [ready, setReady] = useState(false);
  const [loop, setLoop] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [canSetVolume, setCanSetVolume] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<ClipPlayerHandle>(null);
  const getProgress = useCallback(() => playerRef.current?.getProgress() ?? 0, []);

  const DURACIO = 30;

  useEffect(() => {
    let isMounted = true;

    const fetchVideo = async () => {
      setLoading(true);
      setResult(null);
      setSelectedId(null);
      try {
        const res = await fetch('/api/game/random');
        const json = await res.json();
        if (isMounted) 
          setData(json);
      } catch (err) {
        console.error('Error carregant el joc:', err);
      } finally {
        if (isMounted) 
          setLoading(false);
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const v = document.createElement('video');
    v.volume = 0.5;
    setCanSetVolume(v.volume === 0.5);
  }, []);

  const handleNext = async () => {
    setListening(true);
    setLoading(true);
    setData(null);
    setReady(false);
    setLoop(0);
    setCycle(0);
    setPaused(false);
    setPlayerError(false);
    setResult(null);
    setSelectedId(null);
    try {
      const res = await fetch('/api/game/random');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (partitId: string) => {
    if (result || !data) 
      return;
    setSelectedId(partitId);

    try {
      const res = await fetch('/api/game/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: data.videoId, partitId })
      });
      const json = await res.json();
      setResult(json);

      if (json.correct) {
        setScore(prev => ({ ...prev, hits: prev.hits + 1 }));
      } else {
        setScore(prev => ({ ...prev, misses: prev.misses + 1 }));
      }
    } catch (err) {
      console.error('Error enviant la resposta:', err);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (v > 0) 
      setMuted(false);
  };

  const toggleMute = () => {
    if (muted || volume === 0) {
      setMuted(false);
      if (volume === 0) 
        setVolume(0.5);
    } else {
      setMuted(true);
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4 sm:px-8 lg:px-12 xl:px-48 2xl:px-96 bg-slate-950 text-slate-100">
      <header className="flex justify-between items-center gap-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex gap-3 items-center">
          <img src="/logo.png" className="h-16" />
          <div>
            <h1 className="text-base font-black tracking-tight text-amber-400">Endevina el partit</h1>
            <span className="text-xs text-slate-400">{data?.legislatura || 'Carregant legislatura...'}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 text-sm font-bold">
          <span className="px-3 py-1 bg-green-950 text-green-400 border border-green-800 rounded-xl" title="Número d'encerts">✓ {score.hits}</span>
          <span className="px-3 py-1 bg-red-950 text-red-400 border border-red-800 rounded-xl" title="Número d'errades">✕ {score.misses}</span>
        </div>
      </header>

      {/* Reproductor Oficial del Canal Parlament */}
      <div className="w-full my-auto flex flex-col items-center">
        <div className="flex items-center justify-center relative w-full max-h-[55vh] aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
          {loading && !data ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
              <div className="w-7 h-7 border-3 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
              <span>Carregant fragment del Parlament...</span>
            </div>
          ) : (listening || result) && !loading && data?.manifestUrl && data?.posicio !== undefined ? (
            <ClipPlayer
              key={`${data.manifestUrl}-${data.posicio}-${loop}`}
              ref={playerRef}
              manifestUrl={data.manifestUrl}
              start={data.posicio}
              duration={DURACIO}
              revealed={!!result}
              volume={volume}
              paused={paused}
              muted={muted}
              onVolumeChange={(v, m) => { setVolume(v); setMuted(m); }}
              onTimeUpdate={setCurrentTime}
              onPlaying={() => setReady(true)}
              onLoop={() => setCycle(c => c + 1)}
              onError={() => setPlayerError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-sm">
              Carregant reproductor...
            </div>
          )}

          {/* Capa de protecció total anti-trampes fins que es respon */}
          {!result && data && !loading && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center border border-slate-800">
              {!listening ? (
                <button onClick={() => setListening(true)} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold rounded-xl">
                  ▶ Escolta
                </button>
              ) : playerError ? (
                <>
                  <p className="text-sm text-red-300 mb-3">No s'ha pogut reproduir l'àudio</p>
                  <button
                    onClick={() => { setPlayerError(false); setReady(false); setLoop(l => l + 1); setCycle(0); setPaused(false); }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                  >
                    Reintenta
                  </button>
                </>
              ) : !ready ? (
                <>
                  <div className="w-8 h-8 mb-3 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-sm text-slate-300">Carregant l'àudio…</p>
                </>
              ) : (
                <>
                  <SoundWave paused={paused} />
                  <p className="text-sm font-bold text-slate-200 mt-3">{paused ? 'En pausa' : 'Escoltant…'}</p>
                  <div className="absolute bottom-3 right-3">
                    <LoopRing getProgress={getProgress} cycle={cycle} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Controls de reproducció */}
        {data && listening && ready && !result && !playerError && (
          <div className="w-full mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">            
            {/* Botons inferiors (Play/Pause, -5s, +5s) */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused(p => !p)}
                  aria-label={paused ? 'Continua' : 'Pausa'}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg font-extrabold"
                >
                  {paused ? '▶' : '⏸'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playerRef.current?.seekBy(-5)}
                  aria-label="Enrere 5 segons"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-sm font-bold transition-all shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span>-5s</span>
                </button>
                <button
                  onClick={() => playerRef.current?.seekBy(5)}
                  aria-label="Endavant 5 segons"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-sm font-bold transition-all shadow-sm"
                >
                  <span>+5s</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>              
            </div>

            {/* Barra de progrés (Timeline) interactiva */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {Math.max(0, Math.floor(currentTime - (result ? 0 : data.posicio)))}s
              </span>
              <input
                type="range"
                min={result ? 0 : data.posicio}
                max={result ? (playerRef.current?.getDuration() || data.posicio + VIDEO_BUFFER) : data.posicio + VIDEO_BUFFER}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  playerRef.current?.seekTo(val);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
              />
              <span className="text-[11px] font-mono text-slate-400 w-10">
                {result ? `${Math.floor(playerRef.current?.getDuration() || VIDEO_BUFFER)}s` : `${VIDEO_BUFFER}s`}
              </span>
            </div>

            {/* Volum */}
            <VolumeControl
              volume={volume} muted={muted} canSetVolume={canSetVolume}
              onVolume={handleVolume} onToggleMute={toggleMute}
            />
          </div>
        )}
      </div>

      {result ? (
        <div className={`p-5 rounded-2xl text-center mb-4 border transition-all ${result.correct ? 'bg-green-950/80 border-green-600 text-green-200' : 'bg-red-950/80 border-red-600 text-red-200'}`}>
          <p className="text-xl font-black mb-1">{result.correct ? '🎉 Has encertat!' : `❌ T'has equivocat!`}</p>
          <p className="text-sm text-slate-300">L'orador era <strong className="text-white underline">{result.orador}</strong> de <strong className="text-amber-300">{result.partitCorrecte} ({result.siglesCorrectes})</strong></p>
          {result.parlamentUrl && (
            <a
              href={result.parlamentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200"
            >
              Veure la intervenció al Canal Parlament ↗
            </a>
          )}

          <button
            onClick={handleNext}
            className="mt-5 w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold rounded-xl transition-all shadow-lg"
          >
            Següent ➡️
          </button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3 mb-2">
          {data.partits?.sort(function (a, b) {
            if (a.nom > b.nom) {
              return 1;
            }
            if (a.nom < b.nom) {
              return -1;
            }
            return 0;
          }).map(partit => {
            const isSelected = selectedId === partit.id;
            return (
              <button
                key={partit.id}
                onClick={() => handleGuess(partit.id)}
                disabled={selectedId !== null}
                className={`p-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 rounded-xl font-bold text-sm transition-all shadow-md flex flex-col items-center justify-center gap-0.5 ${isSelected ? 'border-amber-500 bg-slate-800' : ''}`}
              >
                <span className="text-base text-amber-400">{partit.sigles}</span>
                <span className="text-[11px] text-slate-400 font-normal truncate max-w-full">{partit.nom}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full min-h-[240px] grid grid-cols-2 gap-3 mb-2 items-center justify-center bg-slate-900/40 border border-slate-900 rounded-2xl">
          <div className="col-span-2 flex flex-col items-center gap-2 text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
            <span>Carregant partits...</span>
          </div>
        </div>
      )}
    </main>
  );
}