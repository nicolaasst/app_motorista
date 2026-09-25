// Pure mask/validate helpers for RotaPro Driver (pt-BR). No external deps.

export const unmask = (s) => (s || "").replace(/\D/g, "");

export function maskCpf(v) {
  const d = unmask(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
  if (d.length <= 9) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
}

export function maskCpfOrMatricula(v) {
  const d = unmask(v).slice(0, 11);
  if (d.length <= 6) return d ? "#" + d : "";
  return maskCpf(d);
}

export function maskCnpj(v) {
  const d = unmask(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return d.slice(0, 2) + "." + d.slice(2);
  if (d.length <= 8) return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5);
  if (d.length <= 12) return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5, 8) + "/" + d.slice(8);
  return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5, 8) + "/" + d.slice(8, 12) + "-" + d.slice(12);
}

export function maskPhone(v) {
  const d = unmask(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
}

export function maskCep(v) {
  const d = unmask(v).slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

export function maskPlate(v) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  return s.length > 3 ? s.slice(0, 3) + "-" + s.slice(3) : s;
}

export function maskOdometer(v) {
  const d = unmask(v).slice(0, 7);
  return d ? Number(d).toLocaleString("pt-BR") : "";
}

export function maskAgency(v) {
  const d = unmask(v).slice(0, 5);
  return d.length > 4 ? d.slice(0, 4) + "-" + d.slice(4) : d;
}

export function maskAccount(v) {
  const d = unmask(v).slice(0, 13);
  if (d.length <= 1) return d;
  return d.slice(0, -1) + "-" + d.slice(-1);
}

export function maskCurrencyBRL(v) {
  const n = Number(unmask(v)) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function maskDate(v) {
  const d = unmask(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + "/" + d.slice(2);
  return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
}

export function maskTime(v) {
  const d = unmask(v).slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + ":" + d.slice(2) : d;
}

export function maskRgOrCpf(v) {
  const digits = unmask(v).slice(0, 11);
  if (digits.length <= 9) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length <= 8) return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5);
    return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "-" + digits.slice(8);
  }
  return maskCpf(digits);
}
// Identificador de acesso: CPF com máscara a partir do 10º dígito, matrícula em
// dígitos simples, e-mail preservado como digitado (login e recuperação de senha).
export function formatarIdentificador(v) {
  if (v.includes("@")) return v.trim();
  const d = unmask(v).slice(0, 11);
  return d.length > 9 ? maskCpf(d) : d;
}
