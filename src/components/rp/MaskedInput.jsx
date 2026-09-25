import { useId } from "react";
import { Icon } from "./Icon";

export function MaskedInput({ label, icon, error, mask, value, onValue, onChange, placeholder, mono = false, inputMode, autoComplete, maxLength, type = "text", className = "" }) {
  const id = useId();
  const raw = value || "";
  const display = mask ? mask(raw) : raw;
  const handleChange = (e) => {
    const next = e.target.value;
    if (onValue) onValue(mask ? mask(next) : next, next);
    if (onChange) onChange(e);
  };
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-label-sm text-muted-foreground">{label}</label>}
      <div className={`flex min-h-[52px] items-center gap-2 rounded-2xl border bg-card px-3 ${error ? "border-destructive" : "border-input"} focus-within:ring-2 focus-within:ring-primary-container`}>
        {icon && <Icon name={icon} size={20} className="text-muted-foreground" />}
        <input
          id={id}
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          type={type}
          className={`flex-1 bg-transparent outline-none placeholder:text-stone ${mono ? "text-code-md tabular-nums" : "text-body-md"}`}
        />
      </div>
      {error && <p className="mt-1 text-body-sm text-destructive">{error}</p>}
    </div>
  );
}

export default MaskedInput;