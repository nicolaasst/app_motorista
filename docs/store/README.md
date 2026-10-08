# Material das lojas — NGS Driver (Lote 05)

Tudo aqui é rascunho **para o dono revisar**. Nada foi enviado às lojas. Campos de identificação da empresa (razão social, CNPJ, encarregado, domínio) não foram inventados: ficam marcados `A PREENCHER`.

| Arquivo | O que é | Estado |
|---|---|---|
| `ficha.md` | Nome, descrições, palavras-chave, categoria, classificação etária | rascunho (textos prontos; categoria/idade a confirmar) |
| `permissoes-e-justificativas.md` | Justificativa de localização em segundo plano, permissões Android, `Info.plist` | pronto para colar |
| `privacidade-lojas.md` | Rascunho do **Data Safety** (Google) e dos **rótulos de privacidade** (Apple) | rascunho; depende da revisão jurídica |
| `video-demonstracao.md` | Roteiro do vídeo exigido pelo Google (localização e serviço em primeiro plano) | roteiro; **vídeo precisa ser gravado em aparelho** |
| `revisor.md` | Como o revisor da loja entra no app | falta criar a conta de revisor |
| `exigencias-vigentes.md` | Nível mínimo de API/Xcode, regras do Play e da Apple conferidas em 2026-10-08 | conferido em fontes públicas; confirmar nos consoles |
| `arte/` | Ícone 1024, gráfico de recursos 1024×500 | gerado (`scripts/store/gerar-arte.mjs`) |
| `capturas/` | Capturas reais nos tamanhos de loja | **só telas públicas** (entrar, recuperar senha); as logadas dependem da conta de revisor |
| `../app/PIPELINE.md` | Pipeline GitHub Actions (build assinado e envio) | pronto; envio só com Secrets |

Entrega: `scripts/store/empacotar.sh` junta builds + esta pasta em `.zip`.

## Regenerar
- Arte: `node scripts/store/gerar-arte.mjs && npx capacitor-assets generate`
- Capturas: `npm run build && npm run preview` e `node scripts/store/capturar.mjs` (com `CAPTURA_IDENTIFICADOR`/`CAPTURA_SENHA` para as telas logadas).
