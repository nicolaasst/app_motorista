export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-elevated">
        <p className="text-headline-md">{title}</p>
        {description && <p className="mt-2 text-body-md text-muted-foreground">{description}</p>}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="rp-tap flex-1 rounded-full bg-muted py-3 text-label-md text-muted-foreground">{cancelLabel}</button>
          <button onClick={onConfirm} className={`rp-tap flex-1 rounded-full py-3 text-label-md ${danger ? "bg-destructive text-white" : "bg-primary text-primary-foreground"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;