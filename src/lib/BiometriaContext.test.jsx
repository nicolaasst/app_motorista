import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cofre = new Map();
vi.mock("@/lib/armazenamentoSeguro", () => ({
  armazenamentoSeguro: {
    getItem: vi.fn(async (k) => cofre.get(k) ?? null),
    setItem: vi.fn(async (k, v) => void cofre.set(k, v)),
    removeItem: vi.fn(async (k) => void cofre.delete(k)),
  },
}));
vi.mock("@/lib/nativo", () => ({ ehNativo: () => true, plataforma: () => "android" }));

const checkBiometry = vi.fn();
const authenticate = vi.fn();
vi.mock("@aparajita/capacitor-biometric-auth", () => ({
  AndroidBiometryStrength: { weak: 0, strong: 1 },
  BiometryType: { none: 0, touchId: 1, faceId: 2, fingerprintAuthentication: 3, faceAuthentication: 4, irisAuthentication: 5 },
  BiometryErrorType: {
    none: "", appCancel: "appCancel", authenticationFailed: "authenticationFailed", invalidContext: "invalidContext", notInteractive: "notInteractive",
    passcodeNotSet: "passcodeNotSet", systemCancel: "systemCancel", userCancel: "userCancel", userFallback: "userFallback",
    biometryLockout: "biometryLockout", biometryNotAvailable: "biometryNotAvailable", biometryNotEnrolled: "biometryNotEnrolled", noDeviceCredential: "noDeviceCredential",
  },
  BiometricAuth: { checkBiometry: (...a) => checkBiometry(...a), authenticate: (...a) => authenticate(...a) },
}));

let estadoApp = null;
vi.mock("@capacitor/app", () => ({
  App: { addListener: vi.fn(async (_n, fn) => { estadoApp = fn; return { remove: vi.fn() }; }) },
}));

let auth;
vi.mock("@/lib/AuthContext", () => ({ useAuth: () => auth }));

import { BiometriaProvider, useBiometria } from "@/lib/BiometriaContext";

let ctx;
function Sonda() {
  ctx = useBiometria();
  return <p data-testid="s">{`${ctx.pronto ? "pronto" : "carregando"}|${ctx.bloqueado ? "bloqueado" : "livre"}|${ctx.ativa ? "ativa" : "inativa"}`}</p>;
}
const abrir = () => render(<BiometriaProvider><Sonda /></BiometriaProvider>);
const estado = () => screen.getByTestId("s").textContent;
const logout = vi.fn(async () => {});

afterEach(cleanup);
beforeEach(() => {
  cofre.clear();
  checkBiometry.mockReset().mockResolvedValue({ isAvailable: true, strongBiometryIsAvailable: true, biometryType: 3 });
  authenticate.mockReset().mockResolvedValue(undefined);
  logout.mockClear();
  estadoApp = null;
  auth = { user: { id: "u1" }, isAuthenticated: true, isLoadingAuth: false, logout };
});

describe("abertura do app", () => {
  it("sem biometria ativada abre livre", async () => {
    abrir();
    await waitFor(() => expect(estado()).toBe("pronto|livre|inativa"));
  });

  it("com biometria ativada abre BLOQUEADO até confirmar; sucesso libera", async () => {
    cofre.set("biometria.v1", JSON.stringify({ userId: "u1", ativa: true, decidido: true }));
    abrir();
    await waitFor(() => expect(estado()).toBe("pronto|bloqueado|ativa"));
    await act(async () => void (await ctx.desbloquear()));
    expect(estado()).toBe("pronto|livre|ativa");
  });

  it("falha, cancelamento e bloqueio temporário mantêm bloqueado com mensagem; a senha encerra a sessão", async () => {
    cofre.set("biometria.v1", JSON.stringify({ userId: "u1", ativa: true, decidido: true }));
    abrir();
    await waitFor(() => expect(estado()).toContain("bloqueado"));
    authenticate.mockRejectedValueOnce({ code: "authenticationFailed" });
    await act(async () => void (await ctx.desbloquear()));
    expect(estado()).toContain("bloqueado");
    expect(ctx.erro).toMatch(/reconhecemos/);
    authenticate.mockRejectedValueOnce({ code: "userCancel" });
    await act(async () => void (await ctx.desbloquear()));
    expect(estado()).toContain("bloqueado");
    authenticate.mockRejectedValueOnce({ code: "biometryLockout" });
    await act(async () => void (await ctx.desbloquear()));
    expect(ctx.erro).toMatch(/bloqueada/);
    await act(async () => ctx.usarSenha());
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("preferência de OUTRO usuário não bloqueia", async () => {
    cofre.set("biometria.v1", JSON.stringify({ userId: "outro", ativa: true, decidido: true }));
    abrir();
    await waitFor(() => expect(estado()).toBe("pronto|livre|inativa"));
  });

  it("sem sessão: abre livre e não lê o cofre", async () => {
    auth = { user: null, isAuthenticated: false, isLoadingAuth: false, logout };
    abrir();
    await waitFor(() => expect(estado()).toBe("pronto|livre|inativa"));
    expect(checkBiometry).not.toHaveBeenCalled();
  });
});

describe("ativar e desativar", () => {
  it("ativa só depois de o sistema confirmar a biometria e grava no cofre seguro", async () => {
    abrir();
    await waitFor(() => expect(estado()).toContain("pronto"));
    let r;
    await act(async () => void (r = await ctx.ativar()));
    expect(r.ok).toBe(true);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(JSON.parse(cofre.get("biometria.v1"))).toEqual({ userId: "u1", ativa: true, decidido: true });
    expect(estado()).toContain("ativa");
  });

  it("cancelar a confirmação NÃO ativa", async () => {
    abrir();
    await waitFor(() => expect(estado()).toContain("pronto"));
    authenticate.mockRejectedValueOnce({ code: "userCancel" });
    let r;
    await act(async () => void (r = await ctx.ativar()));
    expect(r).toMatchObject({ ok: false, cancelado: true });
    expect(cofre.has("biometria.v1")).toBe(false);
    expect(estado()).toContain("inativa");
  });

  it("aparelho sem biometria cadastrada: não ativa e explica", async () => {
    checkBiometry.mockResolvedValue({ isAvailable: false, code: "biometryNotEnrolled", biometryType: 3 });
    abrir();
    await waitFor(() => expect(estado()).toContain("pronto"));
    let r;
    await act(async () => void (r = await ctx.ativar()));
    expect(r.ok).toBe(false);
    expect(r.mensagem).toMatch(/cadastr/i);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("desativar grava a decisão (não pergunta de novo) e libera o app", async () => {
    cofre.set("biometria.v1", JSON.stringify({ userId: "u1", ativa: true, decidido: true }));
    abrir();
    await waitFor(() => expect(estado()).toContain("bloqueado"));
    await act(async () => ctx.desativar());
    expect(estado()).toBe("pronto|livre|inativa");
    expect(JSON.parse(cofre.get("biometria.v1"))).toEqual({ userId: "u1", ativa: false, decidido: true });
  });
});

describe("volta do segundo plano", () => {
  it("bloqueia depois do tempo fora; não bloqueia numa saída rápida", async () => {
    cofre.set("biometria.v1", JSON.stringify({ userId: "u1", ativa: true, decidido: true }));
    abrir();
    await waitFor(() => expect(estado()).toContain("bloqueado"));
    await act(async () => void (await ctx.desbloquear()));
    await waitFor(() => expect(estadoApp).toBeTypeOf("function"));
    const agora = vi.spyOn(Date, "now");
    agora.mockReturnValue(1_000);
    act(() => estadoApp({ isActive: false }));
    agora.mockReturnValue(1_000 + 10_000);
    act(() => estadoApp({ isActive: true }));
    expect(estado()).toContain("livre");
    agora.mockReturnValue(2_000_000);
    act(() => estadoApp({ isActive: false }));
    agora.mockReturnValue(2_000_000 + 61_000);
    act(() => estadoApp({ isActive: true }));
    expect(estado()).toContain("bloqueado");
    agora.mockRestore();
  });
});
