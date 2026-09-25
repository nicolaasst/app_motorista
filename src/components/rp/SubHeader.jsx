import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

export function SubHeader({ title, subtitle, onBack, right }) {
  const navigate = useNavigate();
  return (
    <header className="safe-top sticky top-0 z-30 h-16 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4">
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="Voltar"
          className="rp-tap flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div className="min-w-0 flex-1">
          {subtitle && <p className="truncate text-label-sm text-muted-foreground">{subtitle}</p>}
          <p className="truncate text-headline-sm">{title}</p>
        </div>
        {right}
      </div>
    </header>
  );
}

export default SubHeader;