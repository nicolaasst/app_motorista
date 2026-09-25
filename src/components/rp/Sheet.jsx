import { useEffect } from "react";
import { Icon } from "./Icon";

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[32px] bg-card p-5 shadow-elevated">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-headline-sm">{title}</p>
            <button onClick={onClose} aria-label="Fechar" className="rp-tap flex h-9 w-9 items-center justify-center rounded-full">
              <Icon name="close" size={22} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Sheet;