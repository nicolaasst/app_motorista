export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export default Skeleton;