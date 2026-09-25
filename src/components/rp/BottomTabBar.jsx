import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { TABS, resetTabStack, tabForPath, tabTopPath } from "@/lib/tabStack";

// Tab bar estilo iOS: cada aba mantém pilha própria. Tocar na aba ativa
// reseta a pilha dela (voltando à raiz) e rola a página para o topo;
// tocar em outra aba volta para onde aquela aba parou.
export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabForPath(location.pathname);

  const handleTap = (tab) => {
    if (tab.id === activeTab) {
      resetTabStack(tab.id);
      if (location.pathname !== tab.to) navigate(tab.to);
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      navigate(tabTopPath(tab.id));
    }
  };

  return (
    <nav
      className="safe-bottom sticky bottom-0 z-40 bg-card"
      style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTap(tab)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className="rp-tap flex min-h-[68px] flex-col items-center justify-center gap-1 py-2"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isActive
                    ? "-translate-y-2 bg-brand-yellow shadow-[0_4px_10px_rgba(255,216,15,0.45)]"
                    : ""
                }`}
              >
                <Icon
                  name={tab.icon}
                  size={24}
                  filled={isActive}
                  className={isActive ? "text-ink" : "text-muted-foreground"}
                />
              </span>
              <span
                className={`text-[11px] font-bold tracking-wide ${
                  isActive ? "text-ink" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabBar;