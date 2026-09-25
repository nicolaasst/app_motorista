import { EMPTY_VALUE } from "@/lib/utils";

// Renders a value, or the standardized em-dash placeholder when the value is
// absent. Keeps "—" reserved exclusively for "missing value" across the app.
export function EmptyValue({ value, className = "" }) {
  if (value === null || value === undefined || value === "") {
    return <span className={`text-muted-foreground ${className}`}>{EMPTY_VALUE}</span>;
  }
  return <>{value}</>;
}

export default EmptyValue;