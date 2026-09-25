import { Icon } from "./Icon";

// Single-choice row used in bottom sheets (nav app, theme, plan, reason, etc.).
// Selected = brand-yellow fill + ink text. Unselected = white + outline border.
export function SelectionRow({ icon, label, description, value, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rp-tap flex w-full min-h-[64px] items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        active
          ? "border-transparent bg-brand-yellow text-ink"
          : "border-outline bg-card text-ink"
      }`}
    >
      {icon && (
        <Icon
          name={icon}
          size={22}
          className={active ? "text-ink" : "text-muted-foreground"}
        />
      )}
      <div className="flex-1">
        <p className="text-body-md font-bold leading-tight">{label}</p>
        {description && (
          <p className={`text-body-sm ${active ? "text-ink/70" : "text-muted-foreground"}`}>
            {description}
          </p>
        )}
      </div>
      {value && (
        <span className={`text-body-sm font-semibold ${active ? "text-ink/70" : "text-muted-foreground"}`}>
          {value}
        </span>
      )}
      {active && <Icon name="check_circle" size={22} className="text-ink" />}
    </button>
  );
}

export default SelectionRow;