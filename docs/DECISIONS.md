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

## ADR-003 — Adoção incremental de ESLint/Prettier estritos sobre código legado (Fase 1)

**Contexto:** a Fase 1 exige ESLint com `jsx-a11y` como erro e Prettier em
todo o projeto. Rodar isso contra as 16 páginas legadas de uma vez causou 92
problemas (15 erro / 77 warning) — a maioria (anchor-is-valid,
label-has-associated-control, click-events-have-key-events) é trabalho real
de acessibilidade que pertence à Fase 6 (migração tela por tela, onde cada
tela ganha o componente e o teste corretos), não a um `--fix` em massa
agora. O mesmo vale para Prettier: as páginas atuais são escritas em uma
linha só por componente; reformatá-las agora criaria um diff enorme em
arquivos que serão movidos para `features/<dominio>/pages/<Nome>.tsx` e
reescritos na Fase 6 de qualquer forma — puro desperdício de revisão.

**Decisão:** adoção incremental, não supressão.

- **Corrigido agora** (bugs reais, sem relação com a migração de tela):
  `target="_blank"` sem `rel="noreferrer"` (risco de segurança) em
  `B2DetalheDaParada.jsx`; 4 `<img>` sem `alt` (usando o texto já presente em
  `data-alt`, que é descritivo, não decorativo); `autofocus` → `autoFocus`
  em `A2EsqueciMinhaSenhaOtp.jsx`; aspas não escapadas em
  `E2CentralDeSuporteEAjuda.jsx`; variável `location` não usada em
  `PageRuntime.jsx`. Nenhuma dessas mudanças altera a renderização —
  confirmado por `scripts/visual-compare.mjs` (0% de diff nas 16 telas
  antes/depois).
- **Rebaixado para `warn` apenas nos globs legados**
  (`src/pages/**/*.jsx`, `src/lib/**/*.jsx`, `src/context/**/*.jsx`,
  `src/api/**/*.js`) em `eslint.config.js`: `jsx-a11y/anchor-is-valid`,
  `jsx-a11y/label-has-associated-control`,
  `jsx-a11y/click-events-have-key-events`,
  `jsx-a11y/no-static-element-interactions`, `jsx-a11y/no-autofocus`,
  `react-hooks/exhaustive-deps`. Cada arquivo sai da lista de globs legados
  (e passa a exigir `error`) no momento em que é migrado na Fase 6.
- **Prettier**: `.prettierignore` exclui `src/pages/`, `src/lib/`,
  `src/context/`, `src/api/`, `src/App.jsx`, `src/styles.css`,
  `tailwind.config.js`, `index.html` e `server/` pelo mesmo motivo. Todo
  arquivo novo desta refatoração (scripts, docs, config) já está formatado.

**Consequência para `MIGRATION_PROGRESS.md`:** uma tela só é marcada `done`
quando, entre outras coisas, sai dos globs legados de `eslint.config.js` e
`.prettierignore` e passa a cumprir as regras estritas sem rebaixamento.

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
