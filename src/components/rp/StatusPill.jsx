const map = {
  green: "status-green",
  amber: "status-amber",
  red: "status-red",
  blue: "status-blue",
  gray: "status-gray",
};

export function StatusPill({ status = "gray", dot = true, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-sm ${map[status] || map.gray} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export default StatusPill;