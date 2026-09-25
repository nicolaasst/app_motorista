// Inline toggle. Off = outline track. On = brand-yellow track. White knob with shadow.
export function Switch({ checked = false, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`rp-tap relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        checked ? "bg-brand-yellow" : "bg-outline"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default Switch;