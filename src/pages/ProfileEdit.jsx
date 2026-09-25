import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { atualizarPerfil } from "@/api/app-motorista";
import { getDriver } from "@/lib/driver";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { Field } from "@/components/rp/Field";
import { MaskedInput } from "@/components/rp/MaskedInput";
import { Sheet } from "@/components/rp/Sheet";
import { maskPhone, maskCep, maskCpf } from "@/lib/masks";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ufSheet, setUfSheet] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      const { driver } = await getDriver();
      setDriver(driver);
      setForm({
        full_name: driver?.full_name || "",
        phone: driver?.phone || "",
        email_personal: driver?.email_personal || "",
        address: { cep: "", logradouro: "", numero: "", compl: "", bairro: "", cidade: "", uf: "", ...(driver?.address || {}) },
        emergency_contact: { name: "", phone: "", ...(driver?.emergency_contact || {}) },
      });
    })();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setEm = (k, v) => setForm((f) => ({ ...f, emergency_contact: { ...f.emergency_contact, [k]: v } }));

  const save = async () => {
    if (!driver?.id) return;
    setSaving(true);
    try {
      // Nome, CPF, CNH e matrícula mudam só pela central (cadastro oficial).
      await atualizarPerfil({
        phone: form.phone,
        email_personal: form.email_personal,
        address: form.address,
        emergency_contact: form.emergency_contact,
      });
      navigate("/profile");
    } catch {
      setSaving(false);
      setToast("Erro ao salvar. Verifique e tente novamente.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (!form) {
    return (
      <div>
        <SubHeader title="Editar dados pessoais" />
        <div className="screen-pad pt-4"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-40 animate-pulse" /></div>
      </div>
    );
  }

  return (
    <div>
      <SubHeader title="Editar dados pessoais" />
      <div className="screen-pad pt-4 space-y-4 pb-36">
        <Card>
          <p className="text-body-lg font-extrabold">Dados Pessoais</p>
          <div className="mt-3 space-y-3">
            <Field label="Nome Completo" value={form.full_name} readOnly hint="Para corrigir o nome, fale com a central." placeholder="Seu nome completo" />
            <MaskedInput label="Telefone" icon="call" mask={maskPhone} value={form.phone} onValue={(m) => set("phone", m)} inputMode="tel" placeholder="(11) 98765-4321" />
            <Field label="E-mail Pessoal" icon="mail" type="email" value={form.email_personal} onChange={(e) => set("email_personal", e.target.value)} placeholder="voce@email.com" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-label-sm text-muted-foreground">CPF</label>
                <div className="flex min-h-[52px] items-center rounded-2xl border border-border bg-surface-track px-3 text-body-md font-semibold text-muted-foreground">{driver?.cpf ? maskCpf(driver.cpf) : "—"}</div>
              </div>
              <div>
                <label className="mb-1.5 block text-label-sm text-muted-foreground">Matrícula</label>
                <div className="flex min-h-[52px] items-center rounded-2xl border border-border bg-surface-track px-3 text-body-md font-semibold text-muted-foreground">{driver?.matricula || "—"}</div>
              </div>
            </div>
            <p className="text-label-sm text-muted-foreground">Para alterar CPF ou matrícula, abra um chamado em Central de Apoio.</p>
          </div>
        </Card>

        <Card>
          <p className="text-body-lg font-extrabold">Endereço</p>
          <div className="mt-3 space-y-3">
            <MaskedInput label="CEP" icon="location_on" mask={maskCep} value={form.address.cep} onValue={(m) => setAddr("cep", m)} inputMode="numeric" placeholder="00000-000" />
            <Field label="Logradouro" value={form.address.logradouro} onChange={(e) => setAddr("logradouro", e.target.value)} placeholder="Rua / Avenida" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Número" value={form.address.numero} onChange={(e) => setAddr("numero", e.target.value)} placeholder="Nº" />
              <Field label="Complemento" value={form.address.compl} onChange={(e) => setAddr("compl", e.target.value)} placeholder="Apto / Bloco" />
            </div>
            <Field label="Bairro" value={form.address.bairro} onChange={(e) => setAddr("bairro", e.target.value)} placeholder="Bairro" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" value={form.address.cidade} onChange={(e) => setAddr("cidade", e.target.value)} placeholder="Cidade" />
              <button type="button" onClick={() => setUfSheet(true)} className="text-left">
                <label className="mb-1.5 block text-label-sm text-muted-foreground">UF</label>
                <div className="flex min-h-[52px] items-center justify-between rounded-2xl border border-input bg-card px-3 text-body-md font-semibold">
                  <span className={form.address.uf ? "text-foreground" : "text-muted-foreground"}>{form.address.uf || "Selecionar"}</span>
                  <Icon name="expand_more" size={20} className="text-muted-foreground" />
                </div>
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-body-lg font-extrabold">Contato de Emergência</p>
          <div className="mt-3 space-y-3">
            <Field label="Nome" value={form.emergency_contact.name} onChange={(e) => setEm("name", e.target.value)} placeholder="Nome do contato" />
            <MaskedInput label="Telefone" icon="call" mask={maskPhone} value={form.emergency_contact.phone} onValue={(m) => setEm("phone", m)} inputMode="tel" placeholder="(11) 98765-4321" />
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="px-5 pb-5 pt-3">
          <Button className="w-full" loading={saving} onClick={save}><Icon name="save" size={20} /> Salvar Alterações</Button>
        </div>
      </div>

      <Sheet open={ufSheet} onClose={() => setUfSheet(false)} title="Selecionar UF">
        <div className="grid grid-cols-4 gap-2">
          {UFS.map((uf) => (
            <button
              key={uf}
              onClick={() => { setAddr("uf", uf); setUfSheet(false); }}
              className={`rounded-xl border py-2.5 text-label-md font-bold transition ${
                form.address.uf === uf ? "border-transparent bg-brand-yellow text-ink" : "border-border text-foreground"
              }`}
            >
              {uf}
            </button>
          ))}
        </div>
      </Sheet>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-body-md font-bold text-white shadow-elevated">
          {toast}
        </div>
      )}
    </div>
  );
}