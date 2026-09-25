# NGS Driver — App do Motorista

App operacional do motorista da NGS Transportes (rota do dia, entregas, insucessos,
recibos, suporte e emergência). React + Vite, dados no **mesmo projeto Supabase do TMS**
(sistema operacional). Migrado do Base44 — ver `MIGRATION_REPORT.md`.

## Rodar localmente

```bash
cp .env.example .env.local   # preencha VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

Sem as variáveis do Supabase o app abre uma tela explicando o que falta.

## Verificações

| comando | o quê |
|---|---|
| `npm run lint` | ESLint |
| `npm test` | Vitest (fila offline) |
| `npm run build` | build de produção |
| `npm run test:db` | pgTAP do app **e do TMS** num Postgres local (precisa do repositório do TMS em `../ngs_transportes` ou `TMS_DIR=...`, e de Postgres 16+ com pgTAP) |
| `npm run test:edge` | testes Deno das Edge Functions |

## Estrutura

| pasta | conteúdo |
|---|---|
| `src/api/app-motorista/` | camada de dados (leitura por RLS, escrita por RPC) |
| `src/lib/offlineQueue.js`, `syncEngine.js` | fila offline idempotente |
| `supabase/migrations/` | schema, RLS e RPCs do app (lotes A–E) |
| `supabase/functions/` | Edge Functions `app-motorista-login` e `app-motorista-arquivos` |
| `supabase/tests/` | pgTAP e o runner local |
| `docs/` | desenho, decisões, pendências, operação e tokens de design |

## Documentos

- `docs/ARQUITETURA_APP_MOTORISTA.md` — como o app funciona
- `docs/RBAC_RLS_APP_MOTORISTA.md` — acesso e isolamento
- `docs/MIGRACAO_ENTIDADES_BASE44.md` — tabelas
- `docs/OPERACAO_APP_MOTORISTA.md` — publicar e operar
- `docs/DESIGN_TOKENS_APP.md` — identidade visual (não alterar)
- `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`
