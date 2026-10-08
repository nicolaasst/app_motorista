import { describe, expect, it } from "vitest";
import { HISTERESE_MOVIMENTO_MS, HISTERESE_PARADO_MS, PERFIL_MOVIMENTO, PERFIL_PARADO, proximoPerfil } from "@/lib/perfilRastreio";

describe("proximoPerfil", () => {
  it("mantém o perfil enquanto a condição não muda", () => {
    const r = proximoPerfil({ perfil: PERFIL_MOVIMENTO, desde: null }, { parado: false, agora: 1000 });
    expect(r).toEqual({ perfil: PERFIL_MOVIMENTO, desde: null, trocou: false });
  });

  it("só troca para parado depois da histerese", () => {
    let e = { perfil: PERFIL_MOVIMENTO, desde: null };
    e = proximoPerfil(e, { parado: true, agora: 0 });
    expect(e.trocou).toBe(false);
    expect(e.desde).toBe(0);
    e = proximoPerfil(e, { parado: true, agora: HISTERESE_PARADO_MS - 1 });
    expect(e.perfil).toBe(PERFIL_MOVIMENTO);
    e = proximoPerfil(e, { parado: true, agora: HISTERESE_PARADO_MS });
    expect(e.perfil).toBe(PERFIL_PARADO);
    expect(e.trocou).toBe(true);
  });

  it("volta a movimento mais rápido e zera a contagem se a condição oscila", () => {
    let e = { perfil: PERFIL_PARADO, desde: null };
    e = proximoPerfil(e, { parado: false, agora: 100 });
    expect(e.desde).toBe(100);
    e = proximoPerfil(e, { parado: true, agora: 5000 }); // voltou a parar: condição já é a do perfil
    expect(e.desde).toBeNull();
    e = proximoPerfil(e, { parado: false, agora: 6000 });
    e = proximoPerfil(e, { parado: false, agora: 6000 + HISTERESE_MOVIMENTO_MS });
    expect(e.perfil).toBe(PERFIL_MOVIMENTO);
    expect(e.trocou).toBe(true);
  });
});
