// app-motorista-arquivos — upload e download de arquivos do App Motorista (R2 + documents).
//
// POST /upload   corpo = bytes do arquivo; header x-tipo = finalidade (regras.ts)
//   → confere o motorista (claims + cadastro ativo), o tipo REAL pelos bytes e o
//     tamanho; calcula o SHA-256; grava no R2 (PUT do próprio servidor); registra
//     documents + app_motorista_arquivos. 201 { documentoId, sha256, mimeType }.
//     O hash que as RPCs gravam como prova (assinatura) sai daqui, nunca do aparelho.
// POST /download { documentoId }
//   → só arquivo enviado pelo próprio motorista, ou PDF/documento ligado a um
//     recibo/documento pessoal dele. 200 { url } (GET pré-assinado, 5 min).
//
// Por que service_role: o motorista não tem a claim tenant_id, então a RLS de
// `documents` do TMS (tenant do JWT) nega tudo para ele — de propósito. A função
// valida o dono antes de qualquer escrita/leitura.
// Sem as variáveis R2_* responde 503 com o que falta.

import { createClient } from "npm:@supabase/supabase-js@2";
import { configR2, enviarObjeto, ErroArquivo, urlAssinada } from "../_shared/arquivos/r2.ts";
import { chaveObjeto, motoristaDasClaims, sha256Hex, tipoValido, uuidValido, validarConteudo } from "./regras.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-tipo",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const LIMITE_CORPO = 10 * 1024 * 1024 + 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json(405, { erro: "use POST" });
  try {
    const autorizacao = req.headers.get("Authorization") ?? "";
    const token = autorizacao.replace(/^Bearer\s+/i, "");
    if (!token) throw new ErroArquivo(401, "JWT obrigatório");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { data: claims, error: erroClaims } = await anon.auth.getClaims(token);
    if (erroClaims || !claims) throw new ErroArquivo(401, "JWT inválido");
    const motorista = motoristaDasClaims(claims.claims as Record<string, unknown>);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: perfil, error: erroPerfil } = await admin
      .from("app_motorista_perfis")
      .select("user_id")
      .eq("user_id", motorista.motoristaId)
      .eq("tenant_id", motorista.tenantId)
      .eq("situacao_cadastro", "ativo")
      .is("deleted_at", null)
      .maybeSingle();
    if (erroPerfil) throw erroPerfil;
    if (!perfil) throw new ErroArquivo(403, "cadastro de motorista inativo");

    const rota = new URL(req.url).pathname.split("/").pop();
    const config = configR2((n) => Deno.env.get(n));

    if (rota === "upload") {
      const tipo = tipoValido(req.headers.get("x-tipo"));
      const declarado = Number(req.headers.get("content-length") ?? "0");
      if (declarado > LIMITE_CORPO) throw new ErroArquivo(413, "arquivo acima de 10 MB");
      const bytes = new Uint8Array(await req.arrayBuffer());
      const mime = validarConteudo(tipo, bytes);
      const sha256 = await sha256Hex(bytes);
      const id = crypto.randomUUID();
      const chave = chaveObjeto(motorista, tipo, id, mime, new Date());

      await enviarObjeto(config, chave, bytes, mime);

      const { error: erroDoc } = await admin.from("documents").insert({
        id, tenant_id: motorista.tenantId, r2_key: chave, mime_type: mime, size_bytes: bytes.length,
        uploaded_by: motorista.motoristaId,
      });
      if (erroDoc) throw erroDoc;
      const { error: erroArq } = await admin.from("app_motorista_arquivos").insert({
        documento_id: id, tenant_id: motorista.tenantId, motorista_id: motorista.motoristaId, tipo, sha256,
        mime_type: mime, tamanho_bytes: bytes.length,
      });
      if (erroArq) throw erroArq;
      return json(201, { documentoId: id, sha256, mimeType: mime });
    }

    if (rota === "download") {
      const corpo = await req.json().catch(() => null);
      const documentoId = corpo?.documentoId;
      if (!uuidValido(documentoId)) throw new ErroArquivo(400, "documentoId inválido");

      const [enviado, recibo, pessoal] = await Promise.all([
        admin.from("app_motorista_arquivos").select("documento_id")
          .eq("documento_id", documentoId).eq("motorista_id", motorista.motoristaId).maybeSingle(),
        admin.from("app_motorista_recibos").select("id")
          .eq("motorista_id", motorista.motoristaId).is("deleted_at", null)
          .or(`pdf_documento_id.eq.${documentoId},assinatura_documento_id.eq.${documentoId}`).limit(1),
        admin.from("app_motorista_documentos_pessoais").select("id")
          .eq("motorista_id", motorista.motoristaId).eq("documento_id", documentoId).is("deleted_at", null).limit(1),
      ]);
      for (const r of [enviado, recibo, pessoal]) if (r.error) throw r.error;
      const autorizado = !!enviado.data || (recibo.data?.length ?? 0) > 0 || (pessoal.data?.length ?? 0) > 0;
      if (!autorizado) throw new ErroArquivo(404, "documento não encontrado");

      const { data: documento, error } = await admin.from("documents").select("r2_key, mime_type")
        .eq("id", documentoId).eq("tenant_id", motorista.tenantId).is("deleted_at", null).maybeSingle();
      if (error) throw error;
      if (!documento) throw new ErroArquivo(404, "documento não encontrado");
      return json(200, { url: await urlAssinada(config, "GET", documento.r2_key), mimeType: documento.mime_type });
    }

    throw new ErroArquivo(404, "rota inexistente (use /upload ou /download)");
  } catch (e) {
    if (e instanceof ErroArquivo) return json(e.status, { erro: e.message });
    console.error("app-motorista-arquivos", e);
    return json(500, { erro: "falha ao processar o arquivo" });
  }
});
