import { unmask } from "./masks";

export function validateCpf(v) {
  const d = unmask(v);
  if (d.length !== 11) return { ok: false, message: "CPF deve ter 11 dígitos." };
  const calc = (slice, base) => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) sum += parseInt(slice[i]) * (base - i);
    let rev = 11 - (sum % 11);
    return rev >= 10 ? 0 : rev;
  };
  if (calc(d.slice(0, 9), 10) !== parseInt(d[9])) return { ok: false, message: "CPF inválido." };
  if (calc(d.slice(0, 10), 11) !== parseInt(d[10])) return { ok: false, message: "CPF inválido." };
  return { ok: true };
}

export function validatePlate(v) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(s) || /^[A-Z]{3}\d{4}$/.test(s)) return { ok: true };
  return { ok: false, message: "Placa inválida (use ABC-1D23 ou ABC-1234)." };
}

export function validateOdometer(v, min) {
  const n = Number(unmask(v));
  if (!n) return { ok: false, message: "Informe a quilometragem." };
  if (min != null && n < min) return { ok: false, message: `KM não pode ser menor que ${min.toLocaleString("pt-BR")}.` };
  return { ok: true, value: n };
}

export function validatePhone(v) {
  const d = unmask(v);
  if (d.length < 10 || d.length > 11) return { ok: false, message: "Telefone inválido." };
  return { ok: true };
}

export function validateCep(v) {
  return unmask(v).length === 8 ? { ok: true } : { ok: false, message: "CEP deve ter 8 dígitos." };
}

export function validatePassword(v) {
  const s = v || "";
  const rules = [
    { ok: s.length >= 8, label: "Mín. 8 dígitos" },
    { ok: /\d/.test(s), label: "Pelo menos 1 número" },
    { ok: /[A-Z]/.test(s), label: "Letra maiúscula" },
  ];
  return { ok: rules.every((r) => r.ok), rules };
}

export function validatePersonName(v) {
  const s = (v || "").trim();
  if (!/^([A-Za-zÀ-ÿ]+(['-][A-Za-zÀ-ÿ]+)?)(\s+[A-Za-zÀ-ÿ]+(['-][A-Za-zÀ-ÿ]+)?)+$/.test(s))
    return { ok: false, message: "Informe nome e sobrenome válidos." };
  return { ok: true };
}

export function validateNotes300(v) {
  const s = (v || "").slice(0, 300);
  return { ok: true, length: s.length, max: 300, over: s.length > 280 };
}