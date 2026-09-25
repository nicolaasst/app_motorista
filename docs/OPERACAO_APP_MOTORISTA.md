# Operação — App Motorista (NGS Driver)

Guia do que é preciso fazer **fora do código** para colocar o app no ar e operá-lo.
Tudo que exige alterar o projeto Supabase hospedado precisa de aprovação humana
(regra do TMS, `docs/AMBIENTES.md` do repositório do TMS).

## 1. Banco (projeto `rcweqbvdkskjtzjgpsnl`, compartilhado com o TMS)

### 1.1 Migrations do app

Cinco arquivos em `supabase/migrations/`, aplicados **nesta ordem** e **depois** da
última migration do TMS:

| arquivo | conteúdo | toca objeto do TMS? |
|---|---|---|
| `20260928100000_app_motorista_a_portal_e_claims.sql` | portal `app-motorista`, validação portal×tenant×perfil, hook de claims | **sim** (4 objetos, aditivo) |
| `20260928100100_app_motorista_b_schema.sql` | 23 tabelas `app_motorista_*` + partições de GPS, RLS, grants | não |
| `20260928100200_app_motorista_c_rpc_motorista.sql` | RPCs do motorista | não |
| `20260928100300_app_motorista_d_rpc_interno.sql` | RPCs internas + 3 linhas em `leitura_auditada` | só dados de configuração |
| `20260928100400_app_motorista_e_login.sql` | apoio ao login/recuperação (só `service_role`) | não |

Antes de aplicar:
1. Conferir a lista de migrations do hospedado (`list_migrations` / `supabase migration list`):
   se o TMS tiver aplicado alguma com data posterior a `20260928100000`, renomear os
   arquivos do app para depois dela (os nomes só definem ordem).
2. Rodar `npm run test:db` com o TMS clonado ao lado (`TMS_DIR=../ngs_transportes`):
   aplica as 46 migrations + seed do TMS e as do app num Postgres local e roda o pgTAP
   dos dois repositórios (hoje: 112 testes do app, 1000 do TMS, todos passando).
3. Revisão da migration **A** por quem mantém o TMS (é a única que muda objetos dele).

Como aplicar: pelo mesmo caminho usado pelo TMS (SQL Editor do Dashboard ou
`apply_migration`), com o **mesmo nome de arquivo** como nome da migration, para o
histórico `supabase_migrations` ficar coerente. Ver pendência OQ-20 (quem é dono do
histórico de migrations do banco compartilhado).

### 1.2 Auth (Dashboard > Authentication)

| onde | o quê |
|---|---|
| Hooks > Custom Access Token | Postgres Function `public.custom_access_token_hook` (já é a do TMS; a migration A só acrescenta o ramo do motorista). Se ainda não estiver ligada, ligar **depois** da migration A |
| Email Templates > Reset Password | incluir o código: `Seu código de acesso ao NGS Driver: {{ .Token }}` (a recuperação é por código de 6 dígitos, não por link) |
| Providers > Email | senha mínima ≥ 8 (as regras da tela pedem 8 caracteres, 1 número e 1 maiúscula) |
| Rate limits | manter o limite de e-mails do Auth; a Edge Function já limita 5 pedidos por CPF/matrícula a cada 15 min |

### 1.3 Rotinas periódicas

Ainda não há `pg_cron` no projeto. Até haver, rodar mensalmente (SQL Editor, como `postgres`):

```sql
-- cria as partições de GPS dos próximos 3 meses (idempotente)
select public.app_motorista_gps_garantir_particoes(current_date, 3);
-- retenção (padrão 180 dias; ver app_motorista_config.retencao_gps_dias)
select public.app_motorista_gps_expurgar(current_date - 180);
-- idempotência: registros com mais de 90 dias
delete from public.app_motorista_operacoes where created_at < now() - interval '90 days';
```

As partições já criadas vão até dez/2027.

## 2. Edge Functions

```bash
supabase functions deploy app-motorista-login     --project-ref rcweqbvdkskjtzjgpsnl --no-verify-jwt
supabase functions deploy app-motorista-arquivos  --project-ref rcweqbvdkskjtzjgpsnl
```

Segredos (Dashboard > Edge Functions > Secrets) — os mesmos do TMS:
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_DOCUMENTOS`.
Sem eles a função de arquivos responde 503 com a lista do que falta (nunca finge sucesso).

Os arquivos são gravados pelo **servidor** (o aparelho envia os bytes para a função),
então o bucket R2 **não** precisa de CORS para PUT. As URLs de leitura são GET
pré-assinados de 5 min.

## 3. Frontend (Vercel ou equivalente)

Variáveis (`.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
(mesmas do TMS) e `VITE_MAPBOX_PUBLIC_TOKEN`.

- Mapbox: criar um token **público** (`pk.*`) só com escopos de leitura de estilos/
  tiles e Directions, restrito às URLs do app (domínio de produção e previews).
- `vercel.json` já traz rewrite de SPA e cabeçalhos de segurança. A CSP está em
  modo **Report-Only**: depois de uma semana sem violações no console do navegador,
  trocar o nome do cabeçalho para `Content-Security-Policy`.
- Auth > URL Configuration: acrescentar o domínio do app às Redirect URLs.

## 4. Cadastro do motorista (central)

1. Criar a conta no Auth (Dashboard > Authentication > Add user / Invite) com o
   **e-mail corporativo** do motorista.
2. Com um usuário interno que tenha `rh.editar`, chamar:

```sql
select public.app_motorista_vincular_motorista(
  p_email => 'motorista@ngs...', p_nome => 'Nome Completo', p_cpf => '000.000.000-00',
  p_matricula => '1234', p_motorista_agregado_id => 'mot-1',   -- id em motoristas_agregados (opcional)
  p_telefone => '11999990000', p_cnh_numero => null, p_cnh_categoria => 'D', p_cnh_validade => '2028-01-31');
```

O motorista entra no app com CPF ou matrícula e a senha definida no convite.
Suspender/reativar: `app_motorista_definir_situacao(user_id, 'suspenso' | 'ativo')`
(vale na hora para qualquer escrita; o token antigo expira em até 1 h).

Configuração do tenant (raio do geofence, telefone da central etc.), com `tms.operar`:
`select public.app_motorista_salvar_config(150, 30, 180, '08007682776', null);`

## 5. Publicar uma rota para o motorista

Com `tms.operar` (tela do TMS ou integração):

```sql
select public.app_motorista_publicar_rota('<user_id do motorista>', '{
  "codigo": "R-2026-0001", "data": "2026-09-28", "turno": "integral",
  "rota_roteirizador_id": "rota-sp-04", "tms_veiculo_id": "vei-1",
  "setor": "Zona Sul", "bairros": ["Moema", "Vila Mariana"], "km_previsto": 42.5,
  "origem": { "lat": -23.55, "lng": -46.63, "rotulo": "CD São Paulo" },
  "paradas": [
    { "sequencia": 1, "tipo": "comercial", "destinatario_nome": "Mercado Um",
      "endereco": "Rua X, 100", "bairro": "Moema", "cidade": "São Paulo", "uf": "SP", "cep": "04000-000",
      "lat": -23.60, "lng": -46.66, "contato_nome": "João", "contato_telefone": "11999990000",
      "janela_inicio": "2026-09-28T09:00:00-03:00", "janela_fim": "2026-09-28T12:00:00-03:00",
      "volumes": [ { "codigo_volume": "VOL-1", "nf_numero": "12345", "nfe_chave": null, "ean": "789...", "peso_kg": 2.5, "tipo": "seco" } ] }
  ]}'::jsonb);
```

Republicar o mesmo `codigo` substitui paradas e volumes enquanto a rota não começou.
O motorista recebe uma notificação no app.

## 6. Financeiro

- Emitir recibo (`financeiro.lancar`): `app_motorista_emitir_recibo(user_id, jsonb)` com
  `codigo`, `periodo_inicio`, `periodo_fim`, `quinzena`, `prazo_assinatura`,
  `itens: [{grupo: ganho|desconto, rotulo, valor, ...}]` e `rotas: [{rota_id, data, paradas_concluidas}]`.
  Bruto, descontos e líquido são calculados a partir dos itens.
- Conta bancária (`financeiro.lancar`): `app_motorista_cadastrar_conta(...)`.
- Pagamento (`financeiro.conciliar`): `app_motorista_marcar_recibo_pago(recibo_id, pago_em, via)`.

## 7. Emergências

Ficam em `app_motorista_emergencias` (leitura com `tms.ver` ou `torre.ver`). A central
trata com `app_motorista_tratar_emergencia(id, 'reconhecida' | 'em_atendimento' |
'encerrada' | 'falso_alarme', notas)`. O alerta ativo para a torre (Realtime ou
WhatsApp pelo `notification_log`) é decisão pendente do TMS (OQ-21).

## 8. Chamados

Chamados do app entram na **Central de Atendimento do TMS** (mesma tabela, mesmos
rótulos, código `CH-AAAA-NNNNN`, `aberto_por_cargo = 'Motorista'`). A central responde
pela própria tela do TMS; a resposta aparece para o motorista em "Chamados Recentes".

## 9. Imagens da marca

Colocar os PNGs originais em `src/assets/brand/` (nomes em `src/assets/brand/README.md`)
e os ícones do PWA em `public/` (`public/icons/README.md`) e gerar um novo build.
Enquanto não chegarem, o app usa as imagens atuais — que ainda estão no CDN do
Base44 e **deixam de existir** quando a conta do Base44 for encerrada.
