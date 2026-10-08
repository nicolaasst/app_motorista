import { describe, expect, it, vi } from "vitest";

const ordem = [];
vi.mock("@/lib/pushNativo", () => ({ desativarPush: vi.fn(async () => void ordem.push("push")) }));
vi.mock("@/lib/biometria", () => ({ limparBiometria: vi.fn(async () => void ordem.push("biometria")) }));
vi.mock("@/api/supabaseClient", () => ({
  definirLembrarLogin: vi.fn(),
  supabase: { auth: { signOut: vi.fn(async () => void ordem.push("signOut")) } },
}));

import { sair } from "@/api/app-motorista/auth";

describe("logout completo", () => {
  it("tira o aparelho do push, apaga a biometria e só então encerra a sessão", async () => {
    await sair();
    expect(ordem).toEqual(["push", "biometria", "signOut"]);
  });
});
