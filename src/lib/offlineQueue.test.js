import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  confirmarEntrega: vi.fn(),
  registrarInsucesso: vi.fn(),
  registrarGps: vi.fn(),
  acionarEmergencia: vi.fn(),
  enviarArquivo: vi.fn(),
}));
vi.mock("@/api/app-motorista", () => api);

import {
  definirUsuarioFila, enqueue, enqueueGpsPoints, getQueue, pendingCount, proximaEspera, putBlob, rejectedItems, syncPending,
} from "@/lib/offlineQueue";

const transitorio = () => Object.assign(new Error("sem conexão"), { transitorio: true });
const recusado = (msg) => Object.assign(new Error(msg), { transitorio: false });

async function entregaComAnexos() {
  await putBlob("assinatura-1", new Blob(["png"], { type: "image/png" }));
  await putBlob("foto-1", new Blob(["jpg"], { type: "image/jpeg" }));
  enqueue({
    kind: "delivery",
    key: "delivery:p1",
    stop_id: "p1",
    payload: {
      recebedor: { nome: "Carlos", tipo: "proprio_destinatario" },
      posicao: { lat: -23.55, lng: -46.63, accuracy: 8 },
      delivered_at: "2026-09-28T12:00:00Z",
      anexos: [
        { campo: "assinatura", tipo: "assinatura_entrega", blobKey: "assinatura-1" },
        { campo: "foto", tipo: "foto_entrega", blobKey: "foto-1" },
      ],
    },
  });
}

beforeEach(() => {
  localStorage.clear();
  Object.values(api).forEach((f) => f.mockReset());
  api.enviarArquivo.mockImplementation(async (_blob, tipo) => ({ documentoId: `doc-${tipo}`, sha256: "x" }));
  definirUsuarioFila(null);
  definirUsuarioFila("motorista-a");
});

describe("outbox", () => {
  it("sobe anexos e depois o registro, com a chave do item como p_chave", async () => {
    await entregaComAnexos();
    const [item] = getQueue();
    const r = await syncPending();
    expect(r).toMatchObject({ ok: true, synced: 1 });
    expect(api.enviarArquivo).toHaveBeenCalledTimes(2);
    expect(api.confirmarEntrega).toHaveBeenCalledWith(expect.objectContaining({
      chave: item.id,
      paradaId: "p1",
      assinaturaId: "doc-assinatura_entrega",
      fotoIds: ["doc-foto_entrega"],
      posicao: { lat: -23.55, lng: -46.63, accuracy: 8 },
    }));
    expect(pendingCount()).toBe(0);
  });

  it("reenvio depois de falha de rede usa a MESMA chave e não sobe os anexos de novo", async () => {
    await entregaComAnexos();
    api.confirmarEntrega.mockRejectedValueOnce(transitorio());
    await syncPending();
    const [item] = getQueue();
    expect(item.status).toBe("erro");
    expect(item.attempts).toBe(1);
    expect(item.payload.anexos.every((a) => a.documentoId)).toBe(true);

    await syncPending({ forcar: true });
    expect(api.enviarArquivo).toHaveBeenCalledTimes(2);
    expect(api.confirmarEntrega).toHaveBeenCalledTimes(2);
    expect(api.confirmarEntrega.mock.calls[0][0].chave).toBe(api.confirmarEntrega.mock.calls[1][0].chave);
    expect(pendingCount()).toBe(0);
  });

  it("recusa de regra de negócio vira 'rejeitado' e não é reenviada", async () => {
    await entregaComAnexos();
    api.confirmarEntrega.mockRejectedValue(recusado("Parada já finalizada"));
    const r = await syncPending();
    expect(r.rejected).toBe(1);
    expect(rejectedItems()[0].last_error).toBe("Parada já finalizada");
    await syncPending({ forcar: true });
    expect(api.confirmarEntrega).toHaveBeenCalledTimes(1);
    expect(pendingCount()).toBe(0);
  });

  it("respeita a espera entre tentativas (a não ser que forçado)", async () => {
    await entregaComAnexos();
    api.confirmarEntrega.mockRejectedValueOnce(transitorio());
    await syncPending();
    await syncPending();
    expect(api.confirmarEntrega).toHaveBeenCalledTimes(1);
    await syncPending({ forcar: true });
    expect(api.confirmarEntrega).toHaveBeenCalledTimes(2);
  });
});

describe("espera crescente", () => {
  it("dobra a cada tentativa, com teto de 10 min e variação de ±20%", () => {
    expect(proximaEspera(1, () => 0.5)).toBe(5000);
    expect(proximaEspera(2, () => 0.5)).toBe(10000);
    expect(proximaEspera(4, () => 0.5)).toBe(40000);
    expect(proximaEspera(30, () => 0.5)).toBe(600000);
    expect(proximaEspera(1, () => 0)).toBe(4000);
    expect(proximaEspera(1, () => 1)).toBe(6000);
  });
});

describe("agrupamento por alvo", () => {
  it("antes da 1ª tentativa, nova ação substitui a anterior (mesmo id)", () => {
    enqueue({ kind: "failure", key: "failure:p2", stop_id: "p2", payload: { reason: "recusado" } });
    const id = getQueue()[0].id;
    enqueue({ kind: "failure", key: "failure:p2", stop_id: "p2", payload: { reason: "cliente_ausente" } });
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0]).toMatchObject({ id, payload: { reason: "cliente_ausente" } });
  });

  it("depois de uma tentativa, o id fica congelado e a nova ação vira outro item", async () => {
    api.registrarInsucesso.mockRejectedValueOnce(transitorio());
    enqueue({ kind: "failure", key: "failure:p2", stop_id: "p2", payload: { reason: "recusado" } });
    await syncPending();
    enqueue({ kind: "failure", key: "failure:p2", stop_id: "p2", payload: { reason: "cliente_ausente" } });
    expect(getQueue()).toHaveLength(2);
  });
});

describe("ordem, lotes e isolamento", () => {
  it("emergência sai antes de tudo; GPS por último", async () => {
    const ordem = [];
    api.registrarGps.mockImplementation(async () => ordem.push("gps"));
    api.registrarInsucesso.mockImplementation(async () => ordem.push("failure"));
    api.acionarEmergencia.mockImplementation(async () => ordem.push("emergency"));
    enqueueGpsPoints("r1", [{ t: "2026-09-28T12:00:00Z", lat: 1, lng: 1 }]);
    enqueue({ kind: "failure", key: "failure:p3", stop_id: "p3", payload: { reason: "outro" } });
    enqueue({ kind: "emergency", key: "emergency", payload: { tipo: "acidente" } });
    await syncPending();
    expect(ordem).toEqual(["emergency", "failure", "gps"]);
  });

  it("GPS acumula pontos e sobe em lotes de 500", async () => {
    const pontos = (n, desde) => Array.from({ length: n }, (_, i) => ({ t: new Date(desde + i * 1000).toISOString(), lat: 1, lng: 1 }));
    enqueueGpsPoints("r1", pontos(700, 0));
    enqueueGpsPoints("r1", pontos(500, 10_000_000));
    expect(getQueue()).toHaveLength(1);
    await syncPending();
    expect(api.registrarGps).toHaveBeenCalledTimes(3);
    expect(api.registrarGps.mock.calls.map((c) => c[1].length)).toEqual([500, 500, 200]);
  });

  it("a fila é por motorista: outro login não vê nem envia itens alheios", async () => {
    enqueue({ kind: "failure", key: "failure:p4", stop_id: "p4", payload: { reason: "outro" } });
    definirUsuarioFila("motorista-b");
    expect(pendingCount()).toBe(0);
    await syncPending();
    expect(api.registrarInsucesso).not.toHaveBeenCalled();
    definirUsuarioFila("motorista-a");
    expect(pendingCount()).toBe(1);
  });

  it("sem motorista logado a fila fica vazia e não aceita itens", () => {
    definirUsuarioFila(null);
    enqueue({ kind: "failure", key: "x", payload: {} });
    expect(pendingCount()).toBe(0);
  });
});
