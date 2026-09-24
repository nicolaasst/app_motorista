# Perguntas em aberto (produto e infraestrutura)

Este arquivo registra toda ambiguidade de produto e toda dependência externa
identificada durante a execução do prompt mestre de refatoração do App do
Motorista. Nada aqui foi decidido silenciosamente — cada item lista a opção
conservadora adotada (quando havia uma) e o que falta para fechar a decisão.

## 1. Documentos de planejamento referenciados não existem neste repositório

O prompt mestre manda ler, nesta ordem, antes de qualquer código:

- `docs/IDEALIZACAO_APP_MOTORISTA.md`
- `IDEALIZACAO_TMS_WMS.md`
- `docs/backend/PLANO_BACKEND_SUPABASE.md`
- `docs/backend/ARQUITETURA_BACKEND_COMPLETA.md`
- `CONTEXTO_APP_MOTORISTA.md`
- `PLANO_APP_MOTORISTA_FRONTEND.md` / `PLANO_APP_MOTORISTA_BACKEND.md`
- `docs/design/field-logistics-driver/DESIGN.md`

**Nenhum desses arquivos existe no repositório `app_motorista`** (branch
`main` e `claude/inspiring-brahmagupta-pjd2i4`, verificado por busca completa
em 2026-09-24). O repositório contém apenas: código-fonte de 16 telas,
`public/screens/*.png` (referência visual, prováveis mockups usados para gerar
as telas) e o backend Fastify em `server/`.

**Consequência, por decisão do próprio prompt mestre:** na ausência desses
documentos, o prompt mestre em si é a especificação técnica válida. É isso
que este projeto segue. Os tokens de design foram extraídos por auditoria do
CSS/Tailwind já aplicado nas telas (ver `docs/PATTERN_INVENTORY.md` e
`docs/DESIGN_TOKENS.md`), não de um documento de design system que não existe.

**Impacto direto na Fase 8 (backend Supabase):** sem acesso ao projeto
Supabase do TMS nem ao schema de `pedidos`/`viagens`/`motoristas`, a Fase 8 não
pode começar. Ver seção 4 abaixo — é um bloqueio explícito, não uma decisão
tomada por conta própria.

**O que resolve isto:** o usuário anexar os documentos ao repositório (ou a
outro repositório acessível), ou confirmar explicitamente que não existem e
que as decisões de produto pendentes (seções 2 e 3 abaixo) devem ser tomadas
pela equipe de engenharia com base neste prompt mestre.

## 2. Geofence — tolerância de raio

A idealização (citada no prompt mestre, seção 9) trata a tolerância de
geofence como pendência de produto explícita, não uma constante técnica óbvia.

**Decisão conservadora adotada até confirmação:** raio de tolerância de
**150 metros** ao redor da coordenada esperada da parada, documentado como
default no código (não hardcoded silenciosamente — ver `packages/core` a
partir da Fase 5).

**O que falta:** confirmação de produto/operação sobre o raio real (varia
por tipo de endereço — condomínio vs. rua residencial vs. zona rural?).

## 3. OCR do canhoto — motor a usar

Pendência de produto explícita (prompt mestre, seção 9 / Fase 5, item 9).

**Opções não decididas:**
- On-device no app nativo (Google ML Kit Text Recognition no Android,
  Apple Vision Framework no iOS) — sem custo por chamada, funciona offline,
  mas exige o app nativo (Fase 9) para existir de verdade.
- Serviço externo de OCR (ex.: AWS Textract, Google Cloud Vision API) — tem
  custo por chamada e exige rede no momento da captura.

**Decisão conservadora adotada até confirmação:** nenhum OCR real é
implementado. O campo de leitura do canhoto permanece como texto manual +
foto anexada (a foto real é capturada e enviada — isso não é simulado; só o
reconhecimento automático de texto não existe ainda).

## 4. Backend Supabase do TMS — acesso e escopo (Fase 8, BLOQUEADA)

O prompt mestre instrui não redesenhar `pedidos`/`viagens`/`motoristas` e
apenas estender esse domínio com tabelas novas (`checklists_execucao`,
`geolocalizacao_motorista`, `emergencias_acionadas`) e Edge Functions novas.

**Bloqueio:** não há acesso, neste ambiente, a nenhum projeto Supabase do
TMS, nem ao schema real de `pedidos`/`viagens`/`motoristas`, nem confirmação
de que tal projeto já existe. Criar um projeto Supabase novo tem custo real
recorrente — o prompt mestre exige confirmação explícita do usuário antes
disso ("Pare e confirme comigo antes de: criar ou usar um projeto Supabase
com custo real").

**O que resolve isto:** o usuário fornecer (a) a URL/ref do projeto Supabase
existente do TMS e credenciais de acesso (via MCP Supabase ou service role
key em ambiente seguro), ou (b) confirmar explicitamente a criação de um
projeto novo, ciente do custo.

## 5. Expo vs. Capacitor (Fase 9, BLOQUEADA)

O prompt mestre pede ADR obrigatório e confirmação do usuário antes de
qualquer código nativo. A recomendação técnica no próprio prompt é Expo
(localização em segundo plano, biometria real, push nativo, câmera/OCR
on-device, builds via EAS), com Capacitor como alternativa mais rápida e mais
limitada. Nenhum código de `apps/mobile` foi criado até esta decisão ser
confirmada.

## 6. Bundle identifier / Application ID (Fase 10, BLOQUEADA)

O prompt mestre cita `com.nexuslog.rotaprodriver` como exemplo, mas pede
confirmação explícita do domínio reverso antes de fixar — é uma decisão que
não muda depois de publicado nas lojas. Nenhum valor foi fixado no código.

## 7. Submissão real às lojas (Fase 10, BLOQUEADA)

Requer conta de desenvolvedor Google Play / Apple Developer do usuário.
Nenhuma submissão será feita nesta sessão nem preparada como se fosse
automática — apenas os artefatos e instruções ficarão prontos.

## 8. Fontes externas (Google Fonts) indisponíveis durante a captura de baseline

O baseline visual da Fase 0 (`tests/visual/baseline/`) foi capturado com o
navegador headless sem acesso, neste ambiente, às fontes do Google Fonts
(`Manrope`, `Plus Jakarta Sans`, `Space Mono`) nem aos ícones Material
Symbols Outlined — ambos carregados via `<link>` externo em `index.html`.
As capturas mostram fallback de fonte do sistema e o texto-ligadura dos
ícones (ex.: "badge", "lock") em vez do glifo. Isso é uma limitação do
ambiente de captura, não uma regressão do produto: o app em produção (com
rede liberada) renderiza os ícones e fontes corretamente. A comparação de
regressão visual (`scripts/visual-compare.mjs`) continua válida porque a
mesma limitação se aplica identicamente ao baseline e às capturas futuras,
desde que feitas no mesmo ambiente sem rede externa liberada para o
navegador de teste.
