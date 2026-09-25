import { useId } from "react";
import { Icon } from "./Icon";

export function Field({ label, icon, error, hint, mono = false, className = "", id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-label-sm text-muted-foreground">{label}</label>}
      <div className={`flex min-h-[52px] items-center gap-2 rounded-2xl border bg-card px-3 ${error ? "border-destructive" : "border-input"} focus-within:ring-2 focus-within:ring-primary-container`}>
        {icon && <Icon name={icon} size={20} className="text-muted-foreground" />}
        <input id={inputId} className={`flex-1 bg-transparent outline-none placeholder:text-stone ${mono ? "text-code-md tabular-nums" : "text-body-md"}`} {...props} />
      </div>
      {error ? <p className="mt-1 text-body-sm text-destructive">{error}</p> : hint ? <p className="mt-1 text-body-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default Field;