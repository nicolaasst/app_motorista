import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  autenticar, deveBloquearAoVoltar, estadoInicial, gravarPreferencia, interpretarErroBiometria, lerEstadoBiometria, lerPreferencia, limparBiometria, TEMPO_BLOQUEIO_MS,
} from "@/lib/biometria";

beforeEach(() => {
  cofre.clear();
  checkBiometry.mockReset();
  authenticate.mockReset();
});

describe("interpretarErroBiometria", () => {
  it.each([
    ["userCancel", { cancelado: true }],
    ["systemCancel", { cancelado: true }],
    ["userFallback", { cancelado: true }],
    ["authenticationFailed", { cancelado: false, temporario: false, indisponivel: false }],
    ["biometryLockout", { temporario: true }],
    ["biometryNotEnrolled", { indisponivel: true }],
    ["biometryNotAvailable", { indisponivel: true }],
    ["passcodeNotSet", { indisponivel: true }],
  ])("%s", (codigo, esperado) => {
    const r = interpretarErroBiometria(codigo);
    expect(r).toMatchObject(esperado);
    expect(r.mensagem).toMatch(/\S/);
  });

  it("código desconhecido cai numa mensagem genérica que oferece a senha", () => {
    expect(interpretarErroBiometria("xyz").mensagem).toMatch(/senha/);
  });
});

describe("estadoInicial / deveBloquearAoVoltar", () => {
  const pref = { userId: "u1", ativa: true, decidido: true };
  it("bloqueia na abertura só com biometria ativa do MESMO usuário", () => {
    expect(estadoInicial({ nativo: true, autenticado: true, userId: "u1", preferencia: pref })).toEqual({ ativa: true, decidido: true, bloqueado: true });
    expect(estadoInicial({ nativo: true, autenticado: true, userId: "outro", preferencia: pref })).toEqual({ ativa: false, decidido: false, bloqueado: false });
  });
  it("sem sessão, sem preferência ou fora do app nativo não bloqueia", () => {
    expect(estadoInicial({ nativo: true, autenticado: false, userId: null, preferencia: pref }).bloqueado).toBe(false);
    expect(estadoInicial({ nativo: true, autenticado: true, userId: "u1", preferencia: null }).bloqueado).toBe(false);
    expect(estadoInicial({ nativo: false, autenticado: true, userId: "u1", preferencia: pref }).bloqueado).toBe(false);
  });
  it("recusa registrada (ativa=false, decidido=true) não bloqueia e não pergunta de novo", () => {
    expect(estadoInicial({ nativo: true, autenticado: true, userId: "u1", preferencia: { userId: "u1", ativa: false, decidido: true } })).toEqual({ ativa: false, decidido: true, bloqueado: false });
  });
  it("ao voltar do segundo plano só bloqueia depois do tempo e com biometria ativa", () => {
    expect(deveBloquearAoVoltar({ ativa: true, foraMs: TEMPO_BLOQUEIO_MS })).toBe(true);
    expect(deveBloquearAoVoltar({ ativa: true, foraMs: TEMPO_BLOQUEIO_MS - 1 })).toBe(false);
    expect(deveBloquearAoVoltar({ ativa: false, foraMs: 10 * TEMPO_BLOQUEIO_MS })).toBe(false);
  });
});

describe("estado do aparelho", () => {
  it("disponível: informa o tipo (digital/rosto) e se é forte", async () => {
    checkBiometry.mockResolvedValue({ isAvailable: true, strongBiometryIsAvailable: true, biometryType: 3 });
    expect(await lerEstadoBiometria()).toEqual({ disponivel: true, tipo: "digital", forte: true, mensagem: "" });
    checkBiometry.mockResolvedValue({ isAvailable: true, strongBiometryIsAvailable: false, biometryType: 2 });
    expect(await lerEstadoBiometria()).toMatchObject({ disponivel: true, tipo: "rosto", forte: false });
  });
  it("biometria não cadastrada e aparelho sem biometria explicam o motivo", async () => {
    checkBiometry.mockResolvedValue({ isAvailable: false, code: "biometryNotEnrolled", biometryType: 3 });
    expect((await lerEstadoBiometria()).mensagem).toMatch(/cadastr/i);
    checkBiometry.mockResolvedValue({ isAvailable: false, code: "biometryNotAvailable", biometryType: 0 });
    expect(await lerEstadoBiometria()).toMatchObject({ disponivel: false });
  });
  it("erro do plugin vira indisponível, não exceção", async () => {
    checkBiometry.mockRejectedValue(new Error("boom"));
    expect((await lerEstadoBiometria()).disponivel).toBe(false);
  });
});

describe("autenticar", () => {
  it("sucesso devolve só ok (nenhum dado biométrico)", async () => {
    authenticate.mockResolvedValue(undefined);
    expect(await autenticar({ forte: true })).toEqual({ ok: true });
    expect(authenticate).toHaveBeenCalledWith(expect.objectContaining({ allowDeviceCredential: false, androidBiometryStrength: 1 }));
  });
  it("cancelamento, falha e bloqueio temporário são tratados", async () => {
    authenticate.mockRejectedValueOnce({ code: "userCancel" });
    expect(await autenticar()).toMatchObject({ ok: false, cancelado: true });
    authenticate.mockRejectedValueOnce({ code: "authenticationFailed" });
    expect(await autenticar()).toMatchObject({ ok: false, cancelado: false });
    authenticate.mockRejectedValueOnce({ code: "biometryLockout" });
    expect(await autenticar()).toMatchObject({ ok: false, temporario: true });
  });
});

describe("preferência no cofre seguro", () => {
  it("grava, lê e limpa; só guarda usuário e flags (nada biométrico)", async () => {
    await gravarPreferencia({ userId: "u1", ativa: true });
    expect(JSON.parse(cofre.get("biometria.v1"))).toEqual({ userId: "u1", ativa: true, decidido: true });
    expect(await lerPreferencia()).toEqual({ userId: "u1", ativa: true, decidido: true });
    await limparBiometria();
    expect(await lerPreferencia()).toBeNull();
  });
  it("conteúdo corrompido é ignorado", async () => {
    cofre.set("biometria.v1", "{não é json");
    expect(await lerPreferencia()).toBeNull();
  });
});
