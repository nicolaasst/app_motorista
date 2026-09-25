# Perguntas em aberto — app do motorista

Atualizado em 2026-09-25, depois da implementação. **Resolvida** = decidida e implementada;
**padrão** = implementada com a proposta padrão (pode ser mudada depois); **aberta** = depende
de decisão.

| id | tema | status | como ficou |
|---|---|---|---|
| OQ-01 | qual hook de claims está ativo | **resolvida** | o repositório do TMS define a função SQL `public.custom_access_token_hook` como hook oficial (`supabase/config.toml` e `docs/AMBIENTES.md` do TMS); a Edge Function `auth-hook-claims` é órfã. A migration A altera a função SQL. Conferir no Dashboard que ela está selecionada (Authentication > Hooks) |
| OQ-02 | tenant dos motoristas | **resolvida** | todos no tenant plataforma; o trigger recusa `app-motorista` em tenant `cliente` |
| OQ-03 | raio do geofence | padrão | 150 m, por tenant em `app_motorista_config.raio_geofence_m`; fora do raio **não bloqueia**, fica registrado (`dentro_geofence = false`) |
| OQ-04 | como a rota chega ao app | **aberta (integração do TMS)** | RPC `app_motorista_publicar_rota` pronta, com formato explícito (`docs/OPERACAO_APP_MOTORISTA.md` §5). Falta o TMS chamar a partir do roteirizador (`rotas_roteirizador.paradas` é `jsonb` de tela, sem volumes) |
| OQ-05 | fonte do cadastro do motorista (CNH etc.) | padrão | `app_motorista_perfis` guarda o cadastro completo; o TMS segue com as projeções dele |
| OQ-06 | pedidos/etiquetas de outro tenant | padrão | referência sem FK (`pedido_tenant_id` + `pedido_id`, `etiqueta_tenant_id` + `etiqueta_codigo`) |
| OQ-07 | retenção de localização (LGPD) | padrão | GPS 180 dias (configurável), idempotência 90 dias; rotina mensal em `docs/OPERACAO_APP_MOTORISTA.md` §1.3 até haver `pg_cron` |
| OQ-08 | push no celular | aberta (Fase 4) | `notification_log` só aceita `email`/`whatsapp`; hoje o app lê a caixa de entrada ao abrir. Push entra com a casca nativa |
| OQ-09 | prazo de "documento vencendo" | padrão | 30 dias, configurável |
| OQ-10 | motorista editar o próprio nome | **resolvida** | campo "Nome Completo" somente leitura, com a dica "fale com a central"; nome/CPF/CNH/matrícula só pela central |
| OQ-11 | suspensão e token ainda válido | **resolvida** | toda RPC confere o cadastro na hora (teste pgTAP cobre token antigo de motorista suspenso) |
| OQ-12 | exclusão de conta (LGPD) | aberta (jurídico) | o app abre chamado padronizado; a anonimização pela central ainda não tem RPC — precisa de validação jurídica do que manter (comprovantes, recibos) |
| OQ-13 | tamanho e tipos de arquivo | padrão | fotos/anexos ≤ 10 MB (JPEG/PNG/WebP; anexos também PDF), assinatura ≤ 512 KB (PNG), tipo conferido pelos bytes; fotos reduzidas a 1600 px no aparelho |
| OQ-14 | limite de tentativas de login | padrão | 5 por CPF/matrícula e 20 por IP a cada 15 min, por contexto (login, envio de código, verificação) |
| OQ-15 | "Entrar com Google" | **resolvida** | removido (o TMS tirou o Google do escopo em 26/09) |
| OQ-16 | autocadastro e redefinição por link | **resolvida** | removidos; recuperação por código em 3 passos |
| OQ-17 | "Lembrar de mim" desligado | **resolvida** | sessão em `sessionStorage` (encerra ao fechar) |
| OQ-18 | mapas e rotas em produção | **resolvida** | Mapbox (o mesmo do TMS); falta criar o token público restrito por URL |
| OQ-19 | código de R2 no TMS | **resolvida** | reaproveitado o assinador SigV4 do TMS (`_shared/arquivos/r2.ts`) |
| **OQ-20** | **quem é dono do histórico de migrations do banco compartilhado** | **aberta — precisa de você** | ver abaixo |
| OQ-21 | alerta ativo de emergência para a central | aberta (TMS) | dados e RPC de tratamento prontos; falta a tela/alerta do lado do TMS (Realtime e/ou WhatsApp para o plantão) |

## OQ-20 — decisão pendente antes de aplicar no banco

O banco é um só para os dois repositórios. As migrations do app estão em
`supabase/migrations/` **deste** repositório; as do TMS, no repositório do TMS. Se o TMS
algum dia usar `supabase db push`/`migration list` contra o hospedado, a CLI vai reclamar das
versões do app que não existem na pasta dele (e vice-versa).

Opções:
1. **Recomendado:** este repositório continua sendo a fonte das migrations do app, e cada
   migration do app é **também** copiada (mesmo nome) para `supabase/migrations/` do TMS
   por PR lá, antes de ser aplicada. O TMS continua sendo o dono do histórico do banco; o CI
   do TMS passa a rodar o pgTAP do app junto (garante que nenhuma mudança do TMS quebre o app).
2. Aplicar só daqui (sem cópia no TMS) e nunca usar `db push` no TMS — mais simples hoje,
   mas frágil.

Nada foi aplicado no hospedado; a decisão define como fazer.
