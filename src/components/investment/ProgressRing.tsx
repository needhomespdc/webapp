/** Donut showing a percentage (ownership / save-to-own progress), orange as in the Oct 2026 designs */
export function ProgressRing({ percent, size = 'sm', caption }: { percent: number; size?: 'sm' | 'lg'; caption?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const lg = size === 'lg';
  return (
    <div className={lg ? 'relative w-48 h-48 shrink-0' : 'relative w-20 h-20 shrink-0'}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="9" className="stroke-orange-200 dark:stroke-orange-500/25" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          className="stroke-orange-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={lg ? 'text-foreground font-bold text-4xl' : 'text-orange-500 font-bold text-base'}>
          {Math.round(p)}%
        </span>
        {caption && <span className="text-orange-500 text-xs">{caption}</span>}
      </div>
    </div>
  );
}
