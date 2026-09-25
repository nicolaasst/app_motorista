import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { Sheet } from "@/components/rp/Sheet";
import { SelectionRow } from "@/components/rp/SelectionRow";
import { Switch } from "@/components/rp/Switch";
import { maskCpf, maskPhone } from "@/lib/masks";
import { EMPTY_VALUE } from "@/lib/utils";
import { applyTheme } from "@/lib/theme";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const DOC_ICON = { cnh: "badge", crlv: "description", aso: "health_and_safety" };
const STATUS_COLOR = { valido: "green", vencendo: "amber", vencido: "red" };
const PREF_NAV = { waze: "Waze", google_maps: "Google Maps", rotapro: "NGS" };
const PREF_THEME = { system: "Sistema", light: "Claro", dark: "Escuro" };

const NAV_OPTIONS = [
  { value: "waze", label: "Waze", icon: "navigation" },
  { value: "google_maps", label: "Google Maps", icon: "map" },
  { value: "rotapro", label: "NGS Driver", icon: "local_shipping" },
];
const THEME_OPTIONS = [
  { value: "system", label: "Sistema", icon: "settings_suggest" },
  { value: "light", label: "Claro", icon: "light_mode" },
  { value: "dark", label: "Escuro", icon: "dark_mode" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [navSheet, setNavSheet] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteSheet, setDeleteSheet] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const load = async () => {
    const { driver, driverId } = await getDriver();
    const [vehicles, docs, banks, prefs] = await Promise.all([
      base44.entities.Vehicle.list(),
      base44.entities.PersonalDocument.filter({ driver_id: driverId }, "valid_until", 20),
      base44.entities.BankAccount.filter({ driver_id: driverId }, "-changed_at", 5),
      base44.entities.DriverPreferences.filter({ driver_id: driverId }, "created_date", 1),
    ]);
    const vehicle = vehicles.find((v) => v.fleet === driver?.fleet) || vehicles[0];
    let avatarSrc = null;
    if (driver?.avatar_url) {
      if (driver.avatar_url.startsWith("http")) avatarSrc = driver.avatar_url;
      else {
        try {
          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: driver.avatar_url });
          avatarSrc = signed_url;
        } catch { avatarSrc = null; }
      }
    }
    setData({ driver, vehicle, docs, bank: banks.find((b) => b.is_primary) || banks[0], pref: prefs[0], prefId: prefs[0]?.id, avatarSrc });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => { alive = false; };
  }, []);

  const logout = async () => {
    setBusy(true);
    await base44.auth.logout("/login");
  };

  const requestDeletion = async () => {
    setDeleting(true);
    try {
      const { driverId } = await getDriver();
      await base44.entities.Ticket.create({
        code: `EX${Date.now().toString().slice(-6)}`,
        driver_id: driverId,
        category: "outro",
        subject: "Solicitação de Exclusão de Conta",
        description: "Motorista solicitou a exclusão definitiva da conta e dos dados pessoais (LGPD).",
        status: "aberto",
        opened_at: new Date().toISOString(),
      });
      setDeleteRequested(true);
    } catch {
      flash("Não foi possível registrar a solicitação. Tente novamente.");
    }
    setDeleting(false);
  };

  const savePref = async (patch) => {
    if (!data?.prefId) { flash("Preferências ainda não sincronizadas."); return; }
    const prev = data.pref;
    setData((d) => ({ ...d, pref: { ...d.pref, ...patch } })); // optimistic
    try {
      await base44.entities.DriverPreferences.update(data.prefId, patch);
    } catch {
      setData((d) => ({ ...d, pref: prev })); // revert
      flash("Não foi possível salvar a preferência.");
    }
  };

  const pickPhoto = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      flash("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flash("Imagem muito grande (máx. 5MB).");
      return;
    }
    setPhotoSheet(false);
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.DriverProfile.update(data.driver.id, { avatar_url: file_uri });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      setData((d) => ({ ...d, driver: { ...d.driver, avatar_url: file_uri }, avatarSrc: signed_url }));
    } catch {
      flash("Falha no upload da foto.");
    }
    setUploading(false);
  };

  const removePhoto = async () => {
    setPhotoSheet(false);
    setUploading(true);
    try {
      await base44.entities.DriverProfile.update(data.driver.id, { avatar_url: "" });
      setData((d) => ({ ...d, driver: { ...d.driver, avatar_url: "" }, avatarSrc: null }));
    } catch {
      flash("Falha ao remover a foto.");
    }
    setUploading(false);
  };

  if (!data) {
    return (
      <div className="screen-pad pt-12">
        <div className="card h-40 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" />
      </div>
    );
  }

  const { driver, vehicle, docs, bank, pref, avatarSrc } = data;
  const initials = (driver?.full_name || "M").split(" ").map((s) => s[0]).slice(0, 2).join("");
  const hasAvatar = !!avatarSrc;

  return (
    <div className="screen-pad pt-12">
      <PullToRefresh onRefresh={load}>
      <header className="flex items-center justify-between">
        <h1 className="text-headline-lg">Perfil</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/profile/edit")}
            aria-label="Editar dados"
            className="rp-tap flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <Icon name="edit" size={20} className="text-ink" />
          </button>
          <StatusPill status="green"><Icon name="verified" size={14} /> Cadastro Ativo</StatusPill>
        </div>
      </header>

      <div className="card mt-4 overflow-hidden">
        <div className="flex items-center gap-4 bg-muted p-4 text-foreground">
          <div className="relative shrink-0">
            {hasAvatar ? (
              <img src={avatarSrc} alt={driver.full_name} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-border" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-headline-md font-extrabold">{initials}</span>
            )}
            <button
              onClick={() => setPhotoSheet(true)}
              aria-label="Alterar foto"
              className="rp-tap absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white ring-2 ring-card"
            >
              <Icon name="photo_camera" size={16} />
            </button>
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-headline-sm">{driver?.full_name}</h2>
            <p className="text-body-sm text-muted-foreground">Matrícula {driver?.matricula || EMPTY_VALUE} • CPF {maskCpf(driver?.cpf || "")}</p>
            <p className="text-body-sm text-muted-foreground">CNH {driver?.cnh_number || EMPTY_VALUE} ({driver?.cnh_category || EMPTY_VALUE})</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-label-sm font-bold">
              <Icon name="workspace_premium" size={14} /> Nível {driver?.level || EMPTY_VALUE} • SLA {driver?.sla_pct != null ? driver.sla_pct : EMPTY_VALUE}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-4">
            <p className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="call" size={14} /> Telefone</p>
            <p className="mt-1 text-body-md font-bold">{maskPhone(driver?.phone || "")}</p>
          </div>
          <div className="p-4">
            <p className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="mail" size={14} /> E-mail</p>
            <p className="mt-1 truncate text-body-md font-bold">{driver?.email_corporate || EMPTY_VALUE}</p>
          </div>
        </div>
        {vehicle && (
          <div className="border-t border-border p-4">
            <p className="flex items-center gap-2 text-body-md font-bold"><Icon name="directions_car" size={18} className="text-ink" /> Veículo Alocado</p>
            <p className="text-body-md font-extrabold">{vehicle.brand_model}</p>
            <p className="text-body-md font-bold text-ink">{vehicle.plate} • Frota {vehicle.fleet}</p>
          </div>
        )}
      </div>

      <section className="mt-5">
        <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="folder_shared" size={20} className="text-ink" /> Cofre Digital</div>
        <p className="text-body-sm font-semibold text-muted-foreground">Conformidade e licenças • {docs.length} documento(s)</p>
        <div className="mt-2 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink"><Icon name={DOC_ICON[d.kind] || "description"} size={20} /></span>
              <div className="flex-1">
                <p className="text-body-md font-bold leading-tight">{d.title}</p>
                <p className="text-body-sm text-muted-foreground">{d.subtitle || `Válido até ${d.valid_until || EMPTY_VALUE}`}</p>
                <StatusPill status={STATUS_COLOR[d.status] || "gray"} className="mt-1">{d.status === "valido" ? "Válido" : d.status === "vencendo" ? "Vencendo" : "Vencido"}</StatusPill>
              </div>
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-label-sm font-bold text-ink"><Icon name="picture_as_pdf" size={16} /> PDF</a>}
            </div>
          ))}
          {docs.length === 0 && <p className="text-body-md text-muted-foreground">Nenhum documento no cofre.</p>}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="account_balance" size={20} className="text-ink" /> Recebimento de Diárias</div>
        <p className="text-body-sm font-semibold text-muted-foreground">Liquidação automática de romaneios D.1/D.2</p>
        {bank ? (
          <div className="card mt-2 p-4">
            <div className="flex items-center gap-2 text-body-md font-bold">
              <Icon name="account_balance" size={18} className="text-ink" /> {bank.bank_name || "Banco"}
              {bank.is_primary && <span className="ml-auto chip bg-muted text-muted-foreground">Principal</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><p className="text-label-sm uppercase text-muted-foreground">Agência</p><p className="text-body-md font-bold">{bank.agency}</p></div>
              <div><p className="text-label-sm uppercase text-muted-foreground">Conta</p><p className="text-body-md font-bold">{bank.account} ({bank.account_type})</p></div>
            </div>
            {bank.pix_key && <p className="mt-2 text-body-sm text-muted-foreground">Chave PIX ({bank.pix_key_type}): {bank.pix_key}</p>}
            {bank.pending_change && <p className="mt-2 flex items-center gap-1 text-body-sm font-semibold text-status-amber-fg"><Icon name="pending" size={14} /> Alteração em validação</p>}
          </div>
        ) : <p className="card mt-2 p-4 text-body-md text-muted-foreground">Nenhuma conta cadastrada.</p>}
      </section>

      <section className="mt-5">
        <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="tune" size={20} className="text-ink" /> Preferências Operacionais</div>
        <div className="card mt-2 divide-y divide-border">
          <PrefRow icon="navigation" title="Navegador Padrão" value={pref ? PREF_NAV[pref.default_nav_app] || pref.default_nav_app : EMPTY_VALUE} chevron onClick={() => setNavSheet(true)} />
          <PrefRow icon="volume_up" title="Alertas Sonoros & Bipagem" trailing={<Switch checked={!!pref?.sound_alerts} onChange={(v) => savePref({ sound_alerts: v })} />} />
          <PrefRow icon="cloud_off" title="Mapas Offline" value={pref?.offline_map_mb ? `${pref.offline_map_mb} MB` : EMPTY_VALUE} chevron onClick={() => navigate("/profile/offline-maps")} />
          <PrefRow icon="dark_mode" title="Tema do Painel" value={pref ? PREF_THEME[pref.theme] || pref.theme : "Sistema"} chevron onClick={() => setThemeSheet(true)} />
        </div>
      </section>

      <button onClick={() => navigate("/analysis")} className="rp-tap mt-5 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink"><Icon name="analytics" size={20} /></span>
        <div className="flex-1"><p className="text-body-md font-bold">Análise de Desempenho</p><p className="text-body-sm text-muted-foreground">KM, entregas e trajetos por período</p></div>
        <Icon name="chevron_right" size={20} className="text-muted-foreground" />
      </button>

      <button onClick={() => navigate("/support")} className="rp-tap mt-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink"><Icon name="support_agent" size={20} /></span>
        <div className="flex-1"><p className="text-body-md font-bold">Central de Apoio à Frota</p><p className="text-body-sm text-muted-foreground">Abertura de chamados e suporte</p></div>
        <Icon name="chevron_right" size={20} className="text-muted-foreground" />
      </button>

      <div className="mt-4 flex justify-center gap-4 text-label-sm font-semibold text-muted-foreground">
        <span className="flex items-center gap-1"><Icon name="description" size={14} /> Termos de Uso</span>
        <span className="flex items-center gap-1"><Icon name="privacy_tip" size={14} /> Política LGPD</span>
      </div>
      <p className="mt-2 text-center text-label-sm text-muted-foreground">NGS Driver v2.4.12-PRO</p>

      <button onClick={logout} disabled={busy} className="rp-tap mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-error-container/30 py-3 text-label-md text-destructive disabled:opacity-70">
        <Icon name="logout" size={20} /> Desconectar da Conta
      </button>

      <button onClick={() => setDeleteSheet(true)} className="rp-tap mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-label-md font-semibold text-destructive">
        <Icon name="delete_forever" size={18} /> Excluir Conta
      </button>

      </PullToRefresh>

      {/* Photo source sheet */}
      <Sheet open={photoSheet} onClose={() => setPhotoSheet(false)} title="Foto de Perfil">
        <div className="space-y-2">
          <SelectionRow icon="photo_camera" label="Tirar foto" description="Usar a câmera do dispositivo" active={false} onClick={() => cameraInput.current?.click()} />
          <SelectionRow icon="photo_library" label="Escolher da galeria" description="Selecionar uma imagem existente" active={false} onClick={() => galleryInput.current?.click()} />
          {hasAvatar && (
            <button onClick={removePhoto} className="rp-tap flex w-full min-h-[64px] items-center gap-3 rounded-2xl border border-transparent bg-error-container p-4 text-left text-destructive">
              <Icon name="delete" size={22} />
              <p className="text-body-md font-bold">Remover foto atual</p>
            </button>
          )}
        </div>
        <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
      </Sheet>

      {/* Default navigator sheet */}
      <Sheet open={navSheet} onClose={() => setNavSheet(false)} title="Navegador Padrão">
        <div className="space-y-2">
          {NAV_OPTIONS.map((o) => (
            <SelectionRow
              key={o.value}
              icon={o.icon}
              label={o.label}
              active={pref?.default_nav_app === o.value}
              onClick={async () => {
                await savePref({ default_nav_app: o.value });
                setNavSheet(false);
              }}
            />
          ))}
        </div>
      </Sheet>

      {/* Theme sheet */}
      <Sheet open={themeSheet} onClose={() => setThemeSheet(false)} title="Tema do Painel">
        <div className="space-y-2">
          {THEME_OPTIONS.map((o) => (
            <SelectionRow
              key={o.value}
              icon={o.icon}
              label={o.label}
              active={(pref?.theme || "system") === o.value}
              onClick={async () => {
                await savePref({ theme: o.value });
                applyTheme(o.value);
                setThemeSheet(false);
              }}
            />
          ))}
        </div>
      </Sheet>

      {/* Account deletion sheet */}
      <Sheet open={deleteSheet} onClose={() => { setDeleteSheet(false); setDeleteRequested(false); }} title="Excluir Conta">
        {deleteRequested ? (
          <div className="space-y-3 pb-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-green text-status-green-fg"><Icon name="check_circle" size={28} /></span>
            <p className="text-body-lg font-extrabold">Solicitação registrada</p>
            <p className="text-body-md text-muted-foreground">A central conclui a exclusão em até 5 dias úteis e confirma por e-mail. Você pode se desconectar enquanto isso.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-error-container/40 p-4">
              <p className="flex items-center gap-2 text-body-md font-extrabold text-destructive"><Icon name="warning" size={20} /> Esta ação é irreversível</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body-sm text-destructive">
                <li>Seu cadastro, documentos do Cofre Digital e contas bancárias serão apagados.</li>
                <li>O histórico de rotas, entregas e recibos é retido por 5 anos por obrigação fiscal (LGPD, art. 46).</li>
                <li>Você perderá o acesso ao app NGS Driver.</li>
                <li>Diárias pendentes devem ser quitadas antes da efetivação.</li>
                <li>A exclusão é efetivada em até 5 dias úteis após a confirmação da central.</li>
              </ul>
            </div>
            <button onClick={requestDeletion} disabled={deleting} className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-destructive py-3 text-label-lg font-bold text-white disabled:opacity-60">
              <Icon name="delete_forever" size={20} /> {deleting ? "Enviando..." : "Solicitar Exclusão Definitiva"}
            </button>
            <button onClick={() => setDeleteSheet(false)} className="rp-tap w-full rounded-full border border-border py-3 text-label-lg font-bold">Cancelar</button>
          </div>
        )}
      </Sheet>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-body-md font-bold text-white shadow-elevated">
          {toast}
        </div>
      )}
    </div>
  );
}

function PrefRow({ icon, title, value, trailing, chevron, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3.5 ${onClick ? "rp-tap cursor-pointer" : ""}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon name={icon} size={18} /></span>
      <p className="flex-1 text-body-md font-bold">{title}</p>
      {value && <span className="text-body-md font-semibold text-muted-foreground">{value}</span>}
      {trailing}
      {chevron && <Icon name="chevron_right" size={18} className="text-muted-foreground" />}
    </div>
  );
}