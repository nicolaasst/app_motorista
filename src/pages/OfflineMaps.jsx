import { useState } from "react";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { ProgressBar } from "@/components/rp/ProgressBar";

const LIMIT_MB = 1024; // 1 GB
const seedRegions = [
  { id: "r1", name: "São Paulo • Centro Expandido", mb: 184, updatedAt: "2026-09-20" },
  { id: "r2", name: "Guarulhos • Distrito Industrial", mb: 136, updatedAt: "2026-09-15" },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

export default function OfflineMaps() {
  const [regions, setRegions] = useState(seedRegions);
  const [downloading, setDownloading] = useState(false);

  const used = regions.reduce((a, r) => a + r.mb, 0);
  const pct = Math.min(100, Math.round((used / LIMIT_MB) * 100));

  const remove = (id) => setRegions((rs) => rs.filter((r) => r.id !== id));
  const download = () => {
    setDownloading(true);
    setTimeout(() => {
      setRegions((rs) => [
        ...rs,
        { id: `r${Date.now()}`, name: "ABC • Região Metropolitana", mb: 95, updatedAt: new Date().toISOString().slice(0, 10) },
      ]);
      setDownloading(false);
    }, 1500);
  };

  return (
    <div>
      <SubHeader title="Mapas Offline" />
      <div className="screen-pad pt-4 space-y-4 pb-36">
        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="cloud_off" size={20} /> Armazenamento</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink"><Icon name="sd_card" size={20} /></span>
              <p className="text-headline-sm font-extrabold">{used} MB</p>
            </div>
            <p className="text-body-sm text-muted-foreground">de {LIMIT_MB} MB (1 GB)</p>
          </div>
          <ProgressBar value={pct} className="mt-3" />
          <p className="mt-1 text-right text-label-sm text-muted-foreground">{pct}% usado</p>
        </Card>

        <div className="flex items-center gap-2">
          <Icon name="download" size={20} className="text-muted-foreground" />
          <h2 className="text-body-lg font-extrabold">Regiões Baixadas</h2>
          <span className="ml-auto chip bg-muted text-muted-foreground">{regions.length}</span>
        </div>

        {regions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Icon name="cloud_off" size={48} className="text-muted-foreground" />
            <p className="text-body-lg font-bold">Nenhum mapa offline</p>
            <p className="text-body-md text-muted-foreground">Baixe regiões antes de sair para rota e navegue sem internet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regions.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink"><Icon name="map" size={20} /></span>
                  <div className="flex-1">
                    <p className="text-body-md font-bold leading-tight">{r.name}</p>
                    <p className="text-body-sm text-muted-foreground">{r.mb} MB • Atualizado em {fmtDate(r.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rp-tap flex-1 rounded-full border border-border py-2 text-label-md font-bold text-muted-foreground"><Icon name="sync" size={16} className="mr-1 inline" /> Atualizar</button>
                  <button onClick={() => remove(r.id)} className="rp-tap flex-1 rounded-full bg-error-container py-2 text-label-md font-bold text-destructive"><Icon name="delete" size={16} className="mr-1 inline" /> Remover</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="px-5 pb-5 pt-3">
          <Button className="w-full" loading={downloading} onClick={download}><Icon name="download" size={20} /> Baixar Nova Região</Button>
        </div>
      </div>
    </div>
  );
}