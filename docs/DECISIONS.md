# ADRs — Decisões de arquitetura

Registro curto de toda decisão técnica não óbvia, toda dependência nova e
toda escolha que tenha custo ou seja difícil de reverter, conforme exigido
pelo prompt mestre de refatoração.

## ADR-001 — Playwright para baseline visual e testes de smoke (Fase 0)

**Contexto:** a Fase 0 exige capturar as 16 telas em 390×844 como referência
antes de qualquer refatoração, e comparar contra elas depois de cada
mudança para detectar regressão visual.

**Decisão:** usar `playwright` (dev dependency) para automatizar a captura,
reaproveitando o Chromium já pré-instalado no ambiente
(`/opt/pw-browsers/chromium-1194`) via `executablePath` explícito, em vez de
baixar um novo binário (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` já está setado
no ambiente).

**Alternativas consideradas:** Puppeteer (mesma categoria, sem vantagem
clara); captura manual (não repetível, não serve para CI na Fase 1).

**Custo:** nenhum — dependência de desenvolvimento, sem custo de nuvem.

## ADR-002 — pixelmatch + pngjs para diff de regressão visual (Fase 0)

**Contexto:** `scripts/visual-compare.mjs` precisa de um comparador de
pixels determinístico e leve para rodar em CI (Fase 1) sem depender de
serviço externo (ex.: Percy, Chromatic — ambos pagos).

**Decisão:** `pixelmatch` + `pngjs`, ambos sem dependências nativas pesadas,
puros em JS, limiar configurável via `VISUAL_DIFF_THRESHOLD`.

**Custo:** nenhum — bibliotecas open-source pequenas, sem serviço externo.

## Decisões ainda pendentes (não tomadas nesta sessão)

As decisões abaixo têm ADR **pendente** porque dependem de confirmação do
usuário antes de qualquer implementação, conforme as regras do prompt
mestre. Ver `docs/OPEN_QUESTIONS.md` para o detalhe de cada bloqueio:

- **ADR-00X — Expo vs. Capacitor** (Fase 9): bloqueado, aguardando decisão
  do usuário.
- **ADR-00X — Gerenciador de workspaces do monorepo** (Fase 2, npm
  workspaces vs. pnpm): a extração de `packages/core` ainda não começou;
  a escolha será registrada quando a Fase 2 iniciar.
- **ADR-00X — Storage nativo (`expo-sqlite` vs. `MMKV`)** (Fase 9):
  depende da decisão Expo vs. Capacitor.
- **ADR-00X — Motor de OCR do canhoto** (Fase 5/9): pendência de produto,
  não decisão técnica isolada — ver `docs/OPEN_QUESTIONS.md` item 3.
- **ADR-00X — Tolerância de geofence** (Fase 5): pendência de produto — ver
  `docs/OPEN_QUESTIONS.md` item 2. Valor conservador de 150m em uso até
  confirmação.
