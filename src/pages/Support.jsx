import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { abrirChamado, faq, meusChamados, novaChave } from "@/api/app-motorista";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { Sheet } from "@/components/rp/Sheet";
import { SelectionRow } from "@/components/rp/SelectionRow";
import { Field } from "@/components/rp/Field";
import { EMPTY_VALUE } from "@/lib/utils";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const CATEGORIES = [
  { value: "pagamento", icon: "account_balance_wallet", label: "Pagamento / Recibo" },
  { value: "mecanica", icon: "build", label: "Mecânica / Pneu" },
  { value: "coleta_nfe", icon: "receipt_long", label: "Coleta / NF-e" },
  { value: "app_sync", icon: "sync_problem", label: "App / Sincronismo" },
  // Emergência não é chamado: abre o fluxo próprio (prioridade máxima, com posição).
  { value: "emergencia", icon: "emergency", label: "Emergência", rota: "/emergency" },
  { value: "outro", icon: "more_horiz", label: "Outro" },
];
const STATUS_META = {
  aberto: { s: "amber", t: "Aberto" },
  em_andamento: { s: "blue", t: "Em Andamento" },
  resolvido: { s: "green", t: "Resolvido" },
  fechado: { s: "gray", t: "Fechado" },
};
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : EMPTY_VALUE);

export default function Support() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState("pagamento");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [catSheet, setCatSheet] = useState(false);

  const load = async () => {
    const [t, f] = await Promise.all([meusChamados(30), faq(30)]);
    setTickets(t);
    setFaqs(f);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openForm = (cat) => { setCategory(cat || "pagamento"); setFormOpen(true); };

  const submit = async () => {
    if (subject.trim().length < 4 || desc.trim().length < 10) return;
    setSending(true);
    try {
      // Vira chamado na Central de Atendimento do TMS (código CH-AAAA-NNNNN).
      await abrirChamado({ chave: novaChave(), categoria: category, assunto: subject.trim(), descricao: desc.trim() });
    } catch {
      setSending(false);
      return;
    }
    setSending(false);
    setFormOpen(false);
    setSubject(""); setDesc("");
    load();
  };

  const canSend = subject.trim().length >= 4 && desc.trim().length >= 10 && !sending;

  return (
    <div>
      <SubHeader title="Central de Apoio" subtitle="Suporte Operacional" right={<StatusPill status="green"><span className="h-1.5 w-1.5 rounded-full bg-status-green-fg" /> 24/7</StatusPill>} />
      <PullToRefresh onRefresh={load}>
      <div className="screen-pad pt-4 space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-destructive p-4 text-white">
            <div className="flex items-center gap-2 text-body-md font-bold"><Icon name="emergency" size={20} /> Ocorrência ou Emergência?</div>
            <p className="mt-1 text-body-sm text-white/85">Contato imediato para incidentes viários, avarias críticas ou sinistros na rota.</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <a href="tel:08007729000" className="rp-tap flex items-center justify-center gap-2 py-3 text-label-md text-destructive"><Icon name="call" size={18} /> Acionar Torre</a>
            <a href="https://wa.me/5511999990000" className="rp-tap flex items-center justify-center gap-2 py-3 text-label-md text-primary-deep"><Icon name="chat" size={18} /> WhatsApp</a>
          </div>
        </Card>

        <p className="flex items-center gap-1.5 text-body-sm font-semibold text-muted-foreground"><Icon name="my_location" size={14} className="text-primary-deep" /> GPS e romaneio ativo transmitidos automaticamente</p>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-body-lg font-extrabold">Novo Chamado</h2>
            <button onClick={() => openForm()} className="flex items-center gap-1 text-body-md font-bold text-primary-deep"><Icon name="add_circle" size={18} /> Abrir</button>
          </div>
          <p className="text-body-sm font-semibold text-muted-foreground">Selecione o tema</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => (c.rota ? navigate(c.rota) : openForm(c.value))} className="card flex flex-col items-start gap-1 p-3.5 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon name={c.icon} size={20} /></span>
                <p className="text-body-md font-bold leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-body-lg font-extrabold">Chamados Recentes</h2>
          <p className="text-body-sm font-semibold text-muted-foreground">Últimos 30 dias</p>
          <div className="mt-2 space-y-3">
            {tickets === null && <div className="card h-24 animate-pulse" />}
            {tickets?.length === 0 && <p className="text-body-md text-muted-foreground">Nenhum chamado aberto.</p>}
            {tickets?.map((t) => {
              const m = STATUS_META[t.status] || STATUS_META.aberto;
              const cat = CATEGORIES.find((c) => c.value === t.category);
              return (
                <div key={t.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-body-md font-bold">#{t.code} • <span className="font-semibold text-muted-foreground">{fmtDate(t.opened_at)}</span></p>
                    <StatusPill status={m.s}>{m.t}</StatusPill>
                  </div>
                  <p className="mt-1 text-body-md font-extrabold">{t.subject}</p>
                  {t.central_reply && (
                    <div className="mt-2 flex items-start gap-2 rounded-2xl bg-muted p-3">
                      <Icon name={m.s === "green" ? "check_circle" : "settings"} size={16} className={`mt-0.5 ${m.s === "green" ? "text-status-green-fg" : "text-status-amber-fg"}`} />
                      <div>
                        <p className="text-label-sm uppercase text-muted-foreground">Retorno da Central</p>
                        <p className="text-body-sm leading-snug">{t.central_reply}</p>
                      </div>
                    </div>
                  )}
                  {cat && <p className="mt-2 flex items-center gap-1 text-body-sm text-muted-foreground"><Icon name={cat.icon} size={14} /> {cat.label}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-body-lg font-extrabold">Dúvidas Frequentes (FAQ)</h2>
          <div className="mt-2 space-y-2">
            {faqs.map((f, i) => (
              <div key={f.id || i} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="rp-tap flex w-full items-center gap-2 p-4 text-left">
                  <p className="flex-1 text-body-md font-bold">{f.question}</p>
                  <Icon name="expand_more" size={18} className={`shrink-0 text-muted-foreground transition ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-body-md text-muted-foreground">{f.answer}</p>}
              </div>
            ))}
            {faqs.length === 0 && <p className="text-body-md text-muted-foreground">Sem FAQ cadastrado.</p>}
          </div>
        </section>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-body-md font-bold"><Icon name="warehouse" size={18} className="text-primary-deep" /> Base Operacional Vila Leopoldina</div>
          <p className="mt-1 text-body-sm text-muted-foreground">Torre SP Central • Plantão: 0800 772 9000</p>
          <p className="text-body-sm text-muted-foreground">Doca: Seg–Sáb • 05h às 22h</p>
        </Card>
      </div>
      </PullToRefresh>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Novo Chamado">
        <p className="text-body-sm text-muted-foreground">Descreva a ocorrência para a central.</p>
        <div className="mt-3 space-y-2">
          <div>
            <label className="mb-1.5 block text-label-sm text-muted-foreground">Motivo do Chamado</label>
            <button type="button" onClick={() => setCatSheet(true)} className="rp-tap flex min-h-[52px] w-full items-center gap-2 rounded-2xl border border-input bg-card px-3 text-left">
              <Icon name="category" size={20} className="text-muted-foreground" />
              <span className="flex-1 py-3 text-body-md font-semibold">{CATEGORIES.find((c) => c.value === category)?.label}</span>
              <Icon name="expand_more" size={20} className="text-muted-foreground" />
            </button>
          </div>
          <Field label="Assunto" placeholder="Resumo do problema" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-label-sm text-muted-foreground">Descrição da Ocorrência</label>
            <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 500))} placeholder="Descreva o problema (mín. 10 caracteres)..." className="w-full rounded-2xl border border-input bg-card p-3 text-body-md outline-none focus:border-primary-container" />
            <p className="text-right text-label-sm text-muted-foreground">{desc.length} / 500</p>
          </div>
          <Button className="w-full" loading={sending} disabled={!canSend} onClick={submit}><Icon name="send" size={20} /> Enviar para Análise</Button>
        </div>
      </Sheet>

      {/* Category picker sheet */}
      <Sheet open={catSheet} onClose={() => setCatSheet(false)} title="Motivo do Chamado">
        <div className="space-y-2">
          {CATEGORIES.filter((c) => !c.rota).map((c) => (
            <SelectionRow key={c.value} icon={c.icon} label={c.label} active={category === c.value} onClick={() => { setCategory(c.value); setCatSheet(false); }} />
          ))}
        </div>
      </Sheet>
    </div>
  );
}