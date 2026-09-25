import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assinarRecibo, dataUrlParaBlob, enviarArquivo, itensDoRecibo, minhasContas, novaChave, recibo as buscarRecibo, rotasDoRecibo, rotasPorIds } from "@/api/app-motorista";
import { capturarPosicao } from "@/lib/posicao";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import SignaturePad from "@/components/SignaturePad";
import { maskCpf } from "@/lib/masks";
import { EMPTY_VALUE } from "@/lib/utils";

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : EMPTY_VALUE;
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : EMPTY_VALUE;

export default function ReceiptDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [signature, setSignature] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [chave] = useState(() => novaChave());

  useEffect(() => {
    let alive = true;
    (async () => {
      // Aceita o id ou o código legível (links antigos usam o código).
      const receipt = await buscarRecibo(id).catch(() => null);
      if (!receipt) { if (alive) setData({ notFound: true }); return; }
      const rid = receipt.id;
      const [items, links, driverRes, banks] = await Promise.all([
        itensDoRecibo(rid),
        rotasDoRecibo(rid),
        getDriver(),
        minhasContas(),
      ]);
      const routes = await rotasPorIds(links.map((l) => l.route_id));
      const linkedRoutes = links.map((l) => ({ ...l, route: routes.find((r) => r.id === l.route_id) }));
      const bank = banks.find((b) => b.is_primary) || banks[0];
      if (alive) setData({ receipt, items, links: linkedRoutes, driver: driverRes.driver, bank });
    })();
    return () => { alive = false; };
  }, [id]);

  const confirm = async () => {
    if (!signature || !agreed || !data) return;
    setSaving(true);
    setErro("");
    try {
      // A imagem sobe para o servidor, que confere o formato e calcula o SHA-256
      // dos bytes gravados; a RPC confere status/prazo e calcula o hash do recibo
      // assinado (antes era btoa() no aparelho — bug B-03).
      const { documentoId } = await enviarArquivo(dataUrlParaBlob(signature), "assinatura_recibo");
      const posicao = await capturarPosicao({ timeoutMs: 5000 });
      await assinarRecibo({ chave, reciboId: data.receipt.id, assinaturaId: documentoId, posicao });
      setDone(true);
    } catch (e) {
      setErro(e?.transitorio
        ? "Sem conexão com o servidor. A assinatura exige internet — tente novamente."
        : e?.message || "Não foi possível assinar o recibo.");
    }
    setSaving(false);
  };

  if (done) {
    return (
      <div className="app-shell flex flex-col items-center justify-center px-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-status-green-bg text-status-green-fg"><Icon name="task_alt" size={48} /></span>
        <h1 className="mt-4 text-headline-lg">Recibo assinado com sucesso!</h1>
        <p className="mt-1 text-body-md text-muted-foreground">Seu pagamento será liberado em {data?.receipt?.deposit_date ? fmtDate(data.receipt.deposit_date) : EMPTY_VALUE}</p>
        {data?.receipt?.pdf_url && (
          <a href={data.receipt.pdf_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-body-md font-bold text-ink">
            <Icon name="picture_as_pdf" size={20} /> Baixar PDF
          </a>
        )}
        <Button className="mt-4" onClick={() => navigate("/receipts")}>Voltar aos Recibos</Button>
      </div>
    );
  }

  if (!data) return <div className="screen-pad pt-16"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" /></div>;
  if (data.notFound) return (
    <div className="screen-pad pt-16 text-center">
      <Icon name="error" size={48} className="mx-auto text-muted-foreground" />
      <p className="mt-3 text-headline-sm">Recibo não encontrado</p>
      <Button className="mt-4" onClick={() => navigate("/receipts")}>Voltar aos Recibos</Button>
    </div>
  );

  const { receipt, items, links, driver, bank } = data;
  const earnings = items.filter((i) => i.group === "ganho");
  const discounts = items.filter((i) => i.group === "desconto");
  const alreadySigned = receipt.status === "assinado" || receipt.status === "pago";
  const canSign = signature && agreed && !saving;

  return (
    <div>
      <header className="safe-top sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><Icon name="arrow_back" size={20} /></button>
        <div className="flex-1"><p className="text-label-sm text-muted-foreground">Voltar para Recibos</p><p className="text-headline-sm leading-tight">Demonstrativo Quinzenal</p></div>
      </header>

      <div className="screen-pad pt-4 space-y-4">
        <Card>
          <h1 className="text-headline-lg font-extrabold">{receipt.code}</h1>
          <span className="chip status-amber">Pendente de Assinatura Digital</span>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-status-amber-bg/60 p-3 text-body-sm text-status-amber-fg">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
            <p>Este documento precisa ser assinado até <b>{receipt.sign_deadline ? fmtDate(receipt.sign_deadline) : EMPTY_VALUE}</b> para liberação do pagamento em <b>{receipt.deposit_date ? fmtDate(receipt.deposit_date) : EMPTY_VALUE}</b>.</p>
          </div>
        </Card>

        <Card>
          <p className="text-label-sm text-muted-foreground">Motorista Titular</p>
          <p className="text-body-lg font-extrabold">{driver?.full_name || EMPTY_VALUE}</p>
          <p className="text-body-sm text-muted-foreground">CPF: {maskCpf(driver?.cpf || "")} • Matrícula {driver?.matricula || EMPTY_VALUE}</p>
          <div className="mt-3 flex items-center gap-2 text-body-md font-semibold text-primary-deep"><Icon name="calendar_today" size={16} /> {fmtDate(receipt.period_start)} a {fmtDate(receipt.period_end)}</div>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-muted p-4 text-foreground">
            <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground"><Icon name="account_balance_wallet" size={16} /> Valor Líquido a Receber</p>
            <p className="text-display-lg font-extrabold">{brl(receipt.net)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-body-sm text-muted-foreground"><Icon name="verified" size={14} /> Aprovado pela auditoria logística</p>
          </div>
          {bank && <div className="p-4 text-body-md"><p className="flex items-center gap-2 font-semibold"><Icon name="land" size={18} className="text-primary-deep" /> {bank.bank_name || "Banco"} • Ag {bank.agency} • Conta {bank.account}</p><p className="mt-1 flex items-center gap-2 text-body-sm text-muted-foreground"><Icon name="lock" size={14} /> Dados bancários protegidos</p></div>}
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="list_alt" size={20} className="text-primary-deep" /> Discriminação de Valores</div>
          <p className="text-body-sm font-semibold text-muted-foreground">Itemizado</p>

          <p className="mt-3 text-label-sm text-status-green-fg">Ganhos & Diárias Operacionais</p>
          <div className="mt-2 space-y-2">
            {earnings.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted p-3">
                <div><p className="text-body-md font-bold leading-tight">{e.label}</p>{e.detail && <p className="text-body-sm text-muted-foreground">{e.detail}</p>}</div>
                <p className="text-body-md font-extrabold text-status-green-fg">{brl(e.value)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2 text-body-md font-bold"><span>Subtotal Bruto</span><span>{brl(receipt.gross)}</span></div>
          </div>

          {discounts.length > 0 && (
            <>
              <p className="mt-4 text-label-sm text-status-red-fg">Descontos & Retenções</p>
              <div className="mt-2 space-y-2">
                {discounts.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-status-red-bg/50 p-3">
                    <div><p className="text-body-md font-bold leading-tight">{d.label}</p>{d.detail && <p className="text-body-sm text-muted-foreground">{d.detail}</p>}</div>
                    <p className="text-body-md font-extrabold text-status-red-fg">- {brl(Math.abs(d.value))}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-container p-3 text-primary-foreground">
            <div><p className="text-body-md font-bold">Total Líquido do Recibo</p><p className="text-body-sm text-white/80">Valor exato de depósito em conta</p></div>
            <p className="text-headline-sm font-extrabold">{brl(receipt.net)}</p>
          </div>
        </Card>

        {links.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="local_shipping" size={20} className="text-primary-deep" /> Rotas Vinculadas</div>
            <p className="text-body-sm font-semibold text-muted-foreground">{links.length} rota(s)</p>
            <div className="mt-3 space-y-2">
              {links.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Icon name="local_shipping" size={16} /></span>
                  <div className="flex-1"><p className="text-body-md font-bold">{l.route?.code || EMPTY_VALUE} • {l.date ? fmtDate(l.date) : EMPTY_VALUE}</p><p className="text-body-sm text-muted-foreground">{l.stops_done || 0} paradas concluídas</p></div>
                  <span className="chip status-green">{l.sla_pct || 0}% SLA</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!alreadySigned && (
          <Card>
            <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="draw" size={20} className="text-primary-deep" /> Termo de Aceite & Assinatura</div>
            <p className="mt-1 text-body-sm italic text-muted-foreground">"Declaro para os devidos fins que conferi o demonstrativo de serviços prestados e diárias operacionais executadas, concordando integralmente com os valores descritos acima."</p>
            <div className="mt-3"><SignaturePad onChange={setSignature} /></div>
            <p className="mt-2 flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="fingerprint" size={14} /> CANVAS CRIPTOGRAFADO • SHA-256 DIGITAL ID</p>
            <p className="text-label-sm text-muted-foreground">Carimbo de data, IP e geolocalização serão anexados ao PDF.</p>
            <label className="mt-3 flex items-start gap-2 text-body-md font-semibold">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-primary-container" />
              Li, conferi os valores das diárias e concordo integralmente com os termos de prestação de serviços logísticos.
            </label>
          </Card>
        )}

        {alreadySigned && (
          <Card className="text-center">
            <Icon name="task_alt" size={40} className="mx-auto text-status-green-fg" />
            <p className="mt-2 text-body-lg font-extrabold">Recibo já assinado</p>
            <p className="text-body-sm text-muted-foreground">Assinado em {receipt.signed_at ? fmtDateTime(receipt.signed_at) : EMPTY_VALUE}</p>
            {receipt.pdf_url && (
              <a href={receipt.pdf_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-body-md font-bold text-ink">
                <Icon name="picture_as_pdf" size={20} /> Baixar PDF
              </a>
            )}
          </Card>
        )}

        {!alreadySigned && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/support")} className="flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-body-md font-bold text-muted-foreground"><Icon name="support_agent" size={20} /> Contestar Valores</button>
            {erro && <p className="text-center text-body-sm font-semibold text-destructive">{erro}</p>}
            <Button loading={saving} disabled={!canSign} onClick={confirm}><Icon name="check" size={20} /> Confirmar e Assinar</Button>
          </div>
        )}

        {receipt.pdf_url && (
          <a href={receipt.pdf_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-body-md font-bold text-ink">
            <Icon name="picture_as_pdf" size={20} /> Baixar PDF do Recibo
          </a>
        )}
      </div>
    </div>
  );
}