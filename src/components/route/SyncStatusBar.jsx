import { Icon } from "@/components/rp/Icon";

const BASE =
  "flex items-center gap-2 rounded-full px-3.5 py-2 text-label-md shadow-elevated backdrop-blur";

export function SyncStatusBar({ online, pending, status, onSync }) {
  if (status === "synced") {
    return (
      <div className={`${BASE} bg-status-green text-status-green-fg`}>
        <Icon name="cloud_done" size={18} /> Tudo sincronizado
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${BASE} bg-status-red text-status-red-fg`}>
        <Icon name="cloud_off" size={18} />
        <span>Falha ao sincronizar</span>
        <button
          type="button"
          onClick={onSync}
          className="ml-1 rounded-full bg-status-red-fg px-3 py-1 text-label-sm text-white"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (status === "syncing") {
    return (
      <div className={`${BASE} bg-black/65 text-white`}>
        <Icon name="cloud_sync" size={18} className="animate-spin" /> Sincronizando…
      </div>
    );
  }

  if (!pending) return null;

  if (!online) {
    return (
      <div className={`${BASE} bg-black/65 text-white/90`}>
        <Icon name="cloud_off" size={18} /> Offline • {pending} pendência{pending > 1 ? "s" : ""}
      </div>
    );
  }

  return (
    <div className={`${BASE} bg-primary-container text-primary-foreground`}>
      <Icon name="cloud_upload" size={18} />
      <span>
        {pending} pendência{pending > 1 ? "s" : ""}
      </span>
      <button
        type="button"
        onClick={onSync}
        className="ml-1 rounded-full bg-ink px-3 py-1 text-label-sm text-white"
      >
        Sincronizar
      </button>
    </div>
  );
}

export default SyncStatusBar;