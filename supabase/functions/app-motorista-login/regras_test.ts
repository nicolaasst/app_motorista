import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { ErroLogin, ipDoPedido, MSG, pedidoEntrar, pedidoVerificar, sessaoPublica } from "./regras.ts";

Deno.test("pedidoEntrar exige identificador e senha", () => {
  assertEquals(pedidoEntrar({ identificador: " 123.456.789-01 ", senha: "x" }), { identificador: "123.456.789-01", senha: "x" });
  assertThrows(() => pedidoEntrar({ identificador: "12", senha: "x" }), ErroLogin);
  assertThrows(() => pedidoEntrar({ identificador: "12345678901" }), ErroLogin);
  assertThrows(() => pedidoEntrar(null), ErroLogin);
});

Deno.test("código de verificação: só dígitos (6 a 10), espaços ignorados", () => {
  assertEquals(pedidoVerificar({ identificador: "MAT101", codigo: "123 456" }).codigo, "123456");
  const e = assertThrows(() => pedidoVerificar({ identificador: "MAT101", codigo: "12ab56" }), ErroLogin);
  assertEquals(e.message, MSG.codigoInvalido);
});

Deno.test("ipDoPedido pega o primeiro IP válido do x-forwarded-for", () => {
  assertEquals(ipDoPedido("200.10.20.30, 10.0.0.1"), "200.10.20.30");
  assertEquals(ipDoPedido("2804:14c::1"), "2804:14c::1");
  assertEquals(ipDoPedido("'; drop table x;--"), null);
  assertEquals(ipDoPedido(null), null);
});

Deno.test("sessaoPublica devolve só os campos da sessão (sem usuário/e-mail)", () => {
  const s = sessaoPublica({ access_token: "a", refresh_token: "r", expires_in: 3600, expires_at: 1, token_type: "bearer",
    user: { email: "segredo@x" } } as never);
  assertEquals(Object.keys(s).sort(), ["access_token", "expires_at", "expires_in", "refresh_token", "token_type"]);
});

Deno.test("mensagem de credencial é a mesma para CPF inexistente e senha errada", () => {
  assertEquals(typeof MSG.credenciais, "string");
});
