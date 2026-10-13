interface Props {
  volume: number;
  muted: boolean;
  canSetVolume: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({ volume, muted, canSetVolume, onVolume, onToggleMute }: Props) {
  const silent = muted || volume === 0;
  const icon = silent ? '🔇' : volume < 0.35 ? '🔈' : volume < 0.7 ? '🔉' : '🔊';
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleMute}
        aria-label={silent ? 'Activa el so' : 'Silencia'}
        aria-pressed={silent}
        className="text-lg leading-none px-1 active:scale-90"
      >
        {icon}
      </button>
      {canSetVolume && (
        <input
          type="range" min={0} max={1} step={0.05}
          value={muted ? 0 : volume}
          onChange={e => onVolume(Number(e.target.value))}
          aria-label="Volum"
          className="w-24 accent-amber-400"
        />
      )}
    </div>
  );
}