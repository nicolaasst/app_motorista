import { beforeEach, describe, expect, it, vi } from "vitest";

describe("links legais e divulgação", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("no navegador não exige a divulgação (o navegador pergunta)", async () => {
    const { precisaDivulgarLocalizacao } = await import("@/lib/divulgacaoLocalizacao");
    expect(precisaDivulgarLocalizacao()).toBe(false);
  });

  it("no app nativo pede a divulgação até o motorista aceitar", async () => {
    vi.doMock("@/lib/nativo", () => ({ ehNativo: () => true, plataforma: () => "android" }));
    const { precisaDivulgarLocalizacao, registrarDivulgacaoLocalizacao } = await import("@/lib/divulgacaoLocalizacao");
    expect(precisaDivulgarLocalizacao()).toBe(true);
    registrarDivulgacaoLocalizacao();
    expect(precisaDivulgarLocalizacao()).toBe(false);
    vi.doUnmock("@/lib/nativo");
  });

  it("sem VITE_LEGAL_BASE_URL (ou sem https) os links não existem", async () => {
    vi.stubEnv("VITE_LEGAL_BASE_URL", "http://inseguro.test");
    const { LINKS_LEGAIS } = await import("@/lib/linksLegais");
    expect(LINKS_LEGAIS.privacidade).toBeNull();
  });

  it("com https monta os três links sem barra dupla", async () => {
    vi.stubEnv("VITE_LEGAL_BASE_URL", "https://app.exemplo.test/");
    const { LINKS_LEGAIS } = await import("@/lib/linksLegais");
    expect(LINKS_LEGAIS).toEqual({
      privacidade: "https://app.exemplo.test/privacidade",
      termos: "https://app.exemplo.test/termos",
      exclusao: "https://app.exemplo.test/exclusao-de-conta",
    });
    vi.unstubAllEnvs();
  });
});
