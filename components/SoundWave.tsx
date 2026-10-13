export function SoundWave({ paused = false }: { paused?: boolean }) {
  return (
    <>
      <div className={`flex items-end gap-1 h-10 ${paused ? 'wave-paused' : ''}`} aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="wave-bar w-1 h-full rounded-full bg-amber-400 origin-bottom"
            style={{ animation: `wave ${0.6 + (i % 5) * 0.15}s ease-in-out ${(i * 83) % 700}ms infinite alternate` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes wave { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }
        .wave-paused .wave-bar { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) { .wave-bar { animation: none !important; } }
      `}</style>
    </>
  );
}