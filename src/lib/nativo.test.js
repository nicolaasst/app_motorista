import { beforeEach, describe, expect, it, vi } from "vitest";

const mem = new Map();
vi.mock("@aparajita/capacitor-secure-storage", () => ({
  KeychainAccess: { afterFirstUnlock: 2 },
  SecureStorage: {
    setKeyPrefix: vi.fn(async () => {}),
    get: vi.fn(async (k) => mem.get(k) ?? null),
    set: vi.fn(async (k, v) => void mem.set(k, v)),
    remove: vi.fn(async (k) => mem.delete(k)),
  },
}));

import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { armazenamentoSeguro } from "@/lib/armazenamentoSeguro";
import { biometriaAtiva, biometriaDisponivel, definirBiometriaAtiva } from "@/lib/biometria";
import { ehNativo, plataforma } from "@/lib/nativo";

describe("casca nativa no navegador", () => {
  beforeEach(() => {
    mem.clear();
    localStorage.clear();
  });

  it("no navegador não é nativo e a biometria não está disponível", async () => {
    expect(ehNativo()).toBe(false);
    expect(plataforma()).toBe("web");
    expect(await biometriaDisponivel()).toBe(false);
  });

  it("lembra a escolha da biometria", () => {
    expect(biometriaAtiva()).toBe(false);
    definirBiometriaAtiva(true);
    expect(biometriaAtiva()).toBe(true);
  });

  it("guarda a sessão no armazenamento seguro com prefixo e sem tocar no localStorage", async () => {
    await armazenamentoSeguro.setItem("ngs.driver.auth", '{"a":1}');
    expect(SecureStorage.setKeyPrefix).toHaveBeenCalledWith("ngs.driver.");
    expect(SecureStorage.set).toHaveBeenCalledWith("ngs.driver.auth", '{"a":1}', false, false, 2);
    expect(await armazenamentoSeguro.getItem("ngs.driver.auth")).toBe('{"a":1}');
    expect(localStorage.length).toBe(0);
    await armazenamentoSeguro.removeItem("ngs.driver.auth");
    expect(await armazenamentoSeguro.getItem("ngs.driver.auth")).toBeNull();
  });
});
