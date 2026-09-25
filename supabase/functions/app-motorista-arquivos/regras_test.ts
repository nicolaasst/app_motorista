import { assert, assertEquals, assertMatch, assertThrows } from "jsr:@std/assert@1";
import { ErroArquivo } from "../_shared/arquivos/r2.ts";
import { chaveObjeto, detectarMime, motoristaDasClaims, sha256Hex, tipoValido, validarConteudo } from "./regras.ts";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const PDF = new TextEncoder().encode("%PDF-1.7\n");
const HTML = new TextEncoder().encode("<html><script>alert(1)</script>");
const TENANT = "00000000-0000-4000-8000-00000000a001";
const MOTORISTA = "a1a1a1a1-0000-4000-8000-000000000001";

Deno.test("detectarMime usa os bytes, não o nome nem o Content-Type", () => {
  assertEquals(detectarMime(PNG), "image/png");
  assertEquals(detectarMime(JPEG), "image/jpeg");
  assertEquals(detectarMime(PDF), "application/pdf");
  assertEquals(detectarMime(HTML), null);
});

Deno.test("assinatura só aceita PNG; foto recusa PDF; HTML disfarçado é recusado", () => {
  assertEquals(validarConteudo("assinatura_entrega", PNG), "image/png");
  assertThrows(() => validarConteudo("assinatura_entrega", JPEG), ErroArquivo, "formato");
  assertThrows(() => validarConteudo("foto_entrega", PDF), ErroArquivo, "formato");
  assertThrows(() => validarConteudo("anexo_chamado", HTML), ErroArquivo, "formato");
  assertEquals(validarConteudo("anexo_chamado", PDF), "application/pdf");
});

Deno.test("limites de tamanho por finalidade", () => {
  const grande = new Uint8Array(600 * 1024);
  grande.set(PNG);
  const e = assertThrows(() => validarConteudo("assinatura_recibo", grande), ErroArquivo);
  assertEquals(e.status, 413);
  assertThrows(() => validarConteudo("foto_entrega", new Uint8Array()), ErroArquivo, "vazio");
});

Deno.test("tipo desconhecido é recusado", () => {
  assertThrows(() => tipoValido("script"), ErroArquivo);
  assertThrows(() => tipoValido(null), ErroArquivo);
  assertEquals(tipoValido("avatar"), "avatar");
});

Deno.test("só o portal app-motorista passa; claims do TMS são recusadas", () => {
  assertEquals(motoristaDasClaims({ portal: "app-motorista", app_motorista_tenant_id: TENANT, sub: MOTORISTA }),
    { tenantId: TENANT, motoristaId: MOTORISTA });
  const interno = assertThrows(() => motoristaDasClaims({ portal: "interno", tenant_id: TENANT, sub: MOTORISTA }), ErroArquivo);
  assertEquals(interno.status, 403);
  assertThrows(() => motoristaDasClaims({ portal: "app-motorista", sub: MOTORISTA }), ErroArquivo);
  assertThrows(() => motoristaDasClaims(null), ErroArquivo);
});

Deno.test("chave do objeto começa pelo tenant e não tem nada vindo do cliente", () => {
  const chave = chaveObjeto({ tenantId: TENANT, motoristaId: MOTORISTA }, "foto_entrega",
    "11111111-2222-4333-8444-555555555555", "image/jpeg", new Date("2026-09-28T12:00:00Z"));
  assertEquals(chave, `${TENANT}/app-motorista/${MOTORISTA}/foto_entrega/2026/09/11111111-2222-4333-8444-555555555555.jpg`);
  assert(!chave.includes(".."));
});

Deno.test("sha256Hex bate com o valor conhecido", async () => {
  assertMatch(await sha256Hex(new TextEncoder().encode("abc")), /^ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad$/);
});
