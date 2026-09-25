# MIGRATION_REPORT — NGS Driver: Base44 → Supabase compartilhado (TMS)

Data: 2026-09-25 · Branch: `claude/gifted-faraday-5fj17o`

**Resumo:** o app não depende mais do Base44. Dados, autenticação, arquivos e regras de
negócio foram para o mesmo projeto Supabase do TMS, com isolamento que não depende de
lembrar do app em tabelas futuras do TMS. O visual foi preservado. **Nada foi aplicado no
banco hospedado ainda** — ver "O que falta".

## 1. Migrado × reimplementado

| parte | situação | observação |
|---|---|---|
| 23 telas (JSX, estilos, tokens) | **migrado sem mudança visual** | só a origem dos dados mudou; exceções abaixo |
| 21 entidades Base44 | **migrado** para 23 tabelas `app_motorista_*` + objetos do TMS | `docs/MIGRACAO_ENTIDADES_BASE44.md` |
| Autenticação (`AuthContext`) | **reimplementado** sobre Supabase Auth | mesmo contrato para `App.jsx`/`ProtectedRoute` |
| Login por CPF/matrícula | **reimplementado** (Edge Function) | B-01: antes baixava o cadastro de todos os motoristas |
| Recuperação de senha | **reimplementado** (3 passos reais) | B-04: antes era simulada |
| Camada de dados (`src/api/app-motorista`) | **nova** | leitura por RLS, escrita só por RPC |
| Fila offline / sincronização | **reescrita** (mesma API) | idempotente, espera crescente, rejeição visível, por motorista (B-05) |
| Prova de entrega/insucesso | **corrigida** | B-02: assinatura agora é gravada; posição é a do aparelho |
| `SignaturePad` | **corrigido** | gravava só o começo do primeiro traço |
| Assinatura do recibo | **reimplementada** | B-03: hash e status decididos no servidor |
| Motorista atual (`getDriver`) | **reimplementado** | B-06: vinha do primeiro perfil da lista com fallback fixo |
| Rastreio GPS | **adaptado** | ponto a ponto por RPC idempotente (antes regravava a trilha inteira a cada 12 s) |
| Mapas e rotas | **trocado** para Mapbox | OSRM de demonstração só em dev |
| Arquivos (fotos, assinaturas, avatar) | **reimplementado** | Edge Function + R2 + `documents`; assinador do TMS reaproveitado |
| Emergência | **novo** (Fase 3) | `/emergency`, fora da fila de chamados |
| Chamados | **integrado** à Central de Atendimento do TMS | sem mudança nenhuma no TMS |

Mudanças visuais (todas pequenas e justificadas):
- Login: botão "Entrar com Google" removido (fora do escopo do TMS).
- Recuperar senha: passo 1 "Identificação" passou a existir (o indicador já mostrava 3
  passos); "SMS / WhatsApp" virou "E-mail" (SMS está desligado no projeto).
- Perfil: linha "Emergência" abaixo da Central de Apoio; nome completo somente leitura.
- Suporte: o bloco "Emergência" abre o fluxo de emergência (mesmo bloco, mesmo lugar).
- Telas de estado em inglês do template Base44 ("Access Restricted", "Page Not Found")
  traduzidas; a de acesso restrito ganhou "Sair".
- Mapas: estilo Mapbox (com a atribuição exigida pelos termos de uso).

## 2. Banco (`supabase/migrations`, 5 lotes)

| lote | conteúdo | estado |
|---|---|---|
| A | portal `app-motorista`, claims, validação portal×tenant×perfil (única mudança em objetos do TMS) | testado localmente |
| B | 23 tabelas, RLS, grants, partições de GPS até dez/2027 | testado |
| C | 22 RPCs do motorista | testado |
| D | 10 RPCs internas + leitura auditada (LGPD) | testado |
| E | apoio ao login/recuperação (só `service_role`) | testado |

Isolamento (pgTAP `00100`): o motorista vê **0 linhas em todas as tabelas do TMS**, não
escreve em nenhuma, só vê as próprias linhas do app, e não lê dado pessoal direto.

## 3. Edge Functions

| função | estado |
|---|---|
| `app-motorista-login` | pronta, testada (Deno), não publicada |
| `app-motorista-arquivos` | pronta, testada (Deno), não publicada; precisa dos segredos R2 do TMS |

## 4. Testes

`npm run lint` · `npm test` (11) · `npm run build` · `npm run test:db` (112 app + 1000 TMS) ·
`npm run test:edge` (15) — todos passando.

## 5. O que falta para publicar

1. **Decisão OQ-20** (quem guarda o histórico de migrations do banco compartilhado) e
   revisão da migration A por quem mantém o TMS.
2. Aplicar as migrations, publicar as duas Edge Functions, configurar Auth (template de
   e-mail com `{{ .Token }}`) — passo a passo em `docs/OPERACAO_APP_MOTORISTA.md`.
3. Criar o token público do Mapbox e as variáveis do frontend.
4. PNGs originais da marca (`src/assets/brand/`, `public/icons/`) — as imagens atuais
   ainda vêm do CDN do Base44 e somem quando a conta for encerrada.
5. Integração do roteirizador do TMS com `app_motorista_publicar_rota` (OQ-04) e alerta
   de emergência na torre (OQ-21).
6. **Fase 4 (lojas):** decisão da casca nativa (D18), ícones, política de privacidade,
   builds assinados — não iniciada, aguardando confirmação.
