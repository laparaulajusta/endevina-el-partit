'use client';
import { useEffect, useRef } from 'react';

interface Props {
  getProgress: () => number;
  cycle: number;
}

export function LoopRing({ getProgress, cycle }: Props) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, Math.max(0, getProgress()));
      ringRef.current?.setAttribute('stroke-dashoffset', String(c * (1 - p)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress, c]);

  return (
    <div className="flex flex-col items-center gap-1" aria-hidden>
      <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-slate-700" />
        <circle
          ref={ringRef}
          cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          className="stroke-amber-400"
          strokeDasharray={c} strokeDashoffset={c}
        />
      </svg>
      <span className="text-[11px] text-slate-400">↻ Repetició {cycle + 1}</span>
    </div>
  );
}