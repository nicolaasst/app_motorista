// Testes do assinador (origem: ngs_transportes r2_test.ts, só os casos das funções mantidas).
import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import { configR2, ErroArquivo, presignSigV4, urlAssinada } from "./r2.ts";

Deno.test("configR2 sem variáveis falha com 503 e lista o que falta", () => {
  const erro = assertThrows(() => configR2(() => undefined), ErroArquivo);
  assertEquals(erro.status, 503);
  assert(erro.message.includes("R2_BUCKET_DOCUMENTOS"));
});
Deno.test("urlAssinada gera SigV4 por query com validade curta", async () => {
  const url = new URL(await urlAssinada(
    { accountId: "acc", accessKeyId: "AK", secretAccessKey: "SK", bucket: "b" },
    "PUT",
    "t-1/2026/09/id-1-a.png",
    new Date(Date.UTC(2026, 8, 5, 12, 0, 0)),
  ));
  assertEquals(url.host, "acc.r2.cloudflarestorage.com");
  assertEquals(url.pathname, "/b/t-1/2026/09/id-1-a.png");
  assertEquals(url.searchParams.get("X-Amz-Expires"), "300");
  assertEquals(url.searchParams.get("X-Amz-Date"), "20260905T120000Z");
  assertEquals(url.searchParams.get("X-Amz-Credential"), "AK/20260905/auto/s3/aws4_request");
  assertEquals(url.searchParams.get("X-Amz-Signature")?.length, 64);
});
Deno.test("derivação SigV4 bate com o exemplo oficial da AWS", async () => {
  const query = await presignSigV4({
    metodo: "GET",
    host: "examplebucket.s3.amazonaws.com",
    caminho: "/test.txt",
    regiao: "us-east-1",
    expiraEmSegundos: 86400,
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    agora: new Date(Date.UTC(2013, 4, 24)),
  });
  assertEquals(
    new URLSearchParams(query).get("X-Amz-Signature"),
    "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
  );
});
