import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function AppHeader({ title, showBack = false, notifications = 0 }) {
  const navigate = useNavigate();
  return (
    <header className="safe-top sticky top-0 z-30 h-16 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4">
        {showBack ? (
          <button onClick={() => navigate(-1)} aria-label="Voltar" className="rp-tap flex h-11 w-11 items-center justify-center rounded-full">
            <Icon name="arrow_back" size={24} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Logo variant="mark" size={32} />
            <div className="leading-none">
              <p className="text-label-sm uppercase tracking-wider text-muted-foreground">NGS</p>
              <p className="text-headline-sm">{title}</p>
            </div>
          </div>
        )}
        {showBack && <p className="text-headline-sm">{title}</p>}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => navigate("/")} aria-label="Rota ativa" className="rp-tap flex h-11 w-11 items-center justify-center rounded-full">
            <Icon name="alt_route" size={24} />
          </button>
          <button onClick={() => navigate("/notifications")} aria-label="Notificações" className="rp-tap relative flex h-11 w-11 items-center justify-center rounded-full">
            <Icon name="notifications" size={24} />
            {notifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-container px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                {notifications}
              </span>
            )}
          </button>
          <button onClick={() => navigate("/profile")} aria-label="Perfil" className="rp-tap flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-primary/20">
            <Icon name="account_circle" size={28} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;