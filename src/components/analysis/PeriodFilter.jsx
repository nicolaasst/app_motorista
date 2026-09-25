import { Icon } from "@/components/rp/Icon";

const OPTIONS = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana", icon: "calendar_today" },
  { value: "mes", label: "Mês" },
  { value: "custom", label: "Personalizado", icon: "calendar_month" },
];

export function PeriodFilter({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-full bg-muted p-1">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rp-tap flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-label-md font-bold transition ${
              active ? "bg-primary-container text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default PeriodFilter;