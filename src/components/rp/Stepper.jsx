import { Icon } from "./Icon";

export function Stepper({ steps, current = 0 }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${done || active ? "bg-primary-container text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {done ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className={`text-label-sm ${active ? "text-primary-deep" : "text-muted-foreground"}`}>{label}</span>
            {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;