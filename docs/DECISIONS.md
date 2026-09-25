# Decisões — app do motorista (ngs-driver)

Formato: data · decisão · por quê · quem decidiu. Pendências ficam em `docs/OPEN_QUESTIONS.md`.

| # | data | decisão | motivo | origem |
|---|---|---|---|---|
| D1 | 2026-09-25 | Prefixo `app_motorista_` em tabelas, funções e policies do app. | Convenção do TMS (domínio em português, sem prefixo de módulo), diferenciando o que é do app. | responsável |
| D2 | 2026-09-25 | Dados específicos do app em tabelas próprias; objetos que já existem no TMS são referenciados, nunca copiados. | Um banco compartilhado, uma fonte por fato. | responsável |
| D3 | 2026-09-25 | Portal exclusivo `app-motorista`, RLS restritiva por tenant e por motorista. | O portal `interno` dá leitura entre tenants em todas as tabelas. | responsável |
| D4 | 2026-09-25 | Arquivos no Cloudflare R2, registrados em `public.documents`. | É o caminho que o TMS já usa (`documents.r2_key`). | responsável |
| D5 | 2026-09-25 | Design visual preservado integralmente; tokens documentados em `docs/DESIGN_TOKENS_APP.md`. | Será a referência visual do TMS. | responsável |
| D6 | 2026-09-25 | Banco não é alterado até o responsável validar o desenho (entidades, RBAC/RLS, arquitetura). | Banco compartilhado em uso pelo TMS. | responsável |
| D7 | 2026-09-25 | Tabelas do TMS que são projeções de tela (`rotas_roteirizador`, `comprovantes_entrega`...) não recebem os fatos do app; o app grava fatos tipados em `app_motorista_*` com FK para essas projeções. | Colunas `*_label`, datas em `text`, paradas em `jsonb`, sem FKs (ver `MIGRACAO_ENTIDADES_BASE44.md` §2). | proposta técnica — em validação |
| D8 | 2026-09-25 | O JWT do motorista **não** leva o claim `tenant_id`; leva `app_motorista_tenant_id`. As 540 policies do TMS ficam intocadas e negam acesso ao motorista por padrão. | O motorista está no tenant plataforma, o mesmo de financeiro/RH/fiscal; qualquer outra forma exigiria alterar 540 policies e seria insegura por omissão em tabelas futuras (`RBAC_RLS_APP_MOTORISTA.md` §2). | proposta técnica — em validação |
| D9 | 2026-09-25 | `motorista_terceiro` continua sem permissões do vocabulário; o acesso do motorista vem de portal + dono da linha. Usuários internos usam permissões **existentes** (`tms.ver`, `rh.ver`, `financeiro.*`, `atendimento.*`, `torre.ver`). | Regra de não inventar vocabulário; mantém o motorista fora de `ler_dado_sensivel`. | proposta técnica — em validação |
| D10 | 2026-09-25 | Motorista só lê tabelas diretamente; toda escrita por RPC `security definer` com idempotência (`app_motorista_operacoes`). | Máquina de estados, hash, geofence e IP decididos no servidor; reenvio offline seguro. | proposta técnica — em validação |
| D11 | 2026-09-25 | Valores de enum iguais aos do app; colunas em português. | Tradução só de nomes de coluna, numa camada (`mappers.js`); nenhuma tela muda. | proposta técnica — em validação |
| D12 | 2026-09-25 | Migrations, testes pgTAP e Edge Functions do app ficam neste repositório (`supabase/`). | O app é dono do seu schema; mudanças em objetos do TMS vão numa migration separada, para revisão. | proposta técnica — em validação |
| D13 | — | Casca nativa (Expo/React Native vs. Capacitor): **não decidida**. Será proposta na Fase 4 e aguardará confirmação, como pede o prompt. | — | pendente |
