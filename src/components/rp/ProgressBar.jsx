export function ProgressBar({ value = 0, className = "" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-brand-yellow-deep transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default ProgressBar;