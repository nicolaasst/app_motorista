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

## ADR-004 — Adiar a extração física de `packages/core`/`apps/web` para o início da Fase 9 (Fase 2)

**Contexto:** o prompt mestre desenha uma arquitetura alvo com
`packages/core` (lógica de domínio pura) consumida por `apps/web` (este
projeto) e `apps/mobile` (Expo, Fase 9), e explicitamente permite adiar essa
extração: "Se o esforço de separar em packages/core antes da Fase 9 parecer
prematuro, é aceitável adiar a extração para o início da Fase 9 — mas
registre a decisão e não deixe lógica de negócio presa em componentes web".

O usuário confirmou Expo para a Fase 9, mas também confirmou explicitamente
que **esta sessão vai até a Fase 7** — a Fase 9 (app nativo) fica para uma
retomada futura, fora deste escopo de trabalho.

**Decisão:** não criar a estrutura física de monorepo (`packages/core/`,
`apps/web/`, workspaces do npm) agora, porque não há um segundo consumidor
(`apps/mobile`) nesta sessão para justificá-la — seria mover arquivos sem
nenhum benefício imediato, e ainda geraria diffs grandes sem leitor real.
Em vez disso, dentro do pacote único atual:

- Lógica de domínio pura (máquina de estados da parada, regras de
  checklist com item crítico, geofence, formatadores, tipos) vai para
  `src/lib/domain/` — sem importar React, DOM ou APIs de browser
  específicas, exatamente como `packages/core/domain` faria.
- Cliente de API e contratos ficam em `src/lib/api/`.
- Fila de saída offline e storage abstrato ficam em `src/lib/offline/`.
- Páginas migradas na Fase 6 vão para `src/features/<dominio>/pages/`.
- Componentes de design system vão para `src/components/ui/`.

Essa organização é **mecanicamente equivalente** a `packages/core` — mover
`src/lib/domain`, `src/lib/api` e `src/lib/offline` para um pacote separado
quando a Fase 9 for retomada é uma operação de mover pastas e ajustar
imports, não uma reescrita. Nenhuma lógica de negócio fica presa dentro de
componentes React.

**Custo de reverter esta decisão:** baixo — é literalmente mover diretórios
e trocar `../lib/domain` por `@rotapro/core/domain` (ou equivalente) nos
imports, quando `apps/mobile` existir de fato.

## Decisões já resolvidas pelo usuário (2026-09-24)

- **Expo vs. Capacitor:** Expo. (Fase 9, ainda não iniciada nesta sessão.)
- **Bundle identifier:** `com.ngstransportes.ngsdriver`, nome de loja
  "NGS Driver". Ver `docs/OPEN_QUESTIONS.md` item 6 sobre a pergunta em
  aberto que isso levanta (rebrand completo vs. só o pacote de distribuição
  — nenhum rebrand foi feito na UI até isso ser esclarecido).
- **Acesso ao Supabase do TMS:** confirmado, mesmo projeto já acessível via
  MCP. Fase 8 continua fora do escopo desta sessão (usuário pediu para
  seguir só até a Fase 7).
- **Contas de loja:** o usuário providencia antes da submissão final.

## Decisões ainda pendentes (não tomadas nesta sessão)

As decisões abaixo têm ADR **pendente** porque dependem de confirmação do
usuário antes de qualquer implementação, conforme as regras do prompt
mestre. Ver `docs/OPEN_QUESTIONS.md` para o detalhe de cada bloqueio:

- **ADR-00X — Storage nativo (`expo-sqlite` vs. `MMKV`)** (Fase 9): Expo já
  está decidido; esta escolha específica fica para quando a Fase 9 for
  retomada (fora do escopo desta sessão).
- **ADR-00X — Motor de OCR do canhoto** (Fase 5/9): pendência de produto,
  não decisão técnica isolada — ver `docs/OPEN_QUESTIONS.md` item 3.
- **ADR-00X — Tolerância de geofence** (Fase 5): pendência de produto — ver
  `docs/OPEN_QUESTIONS.md` item 2. Valor conservador de 150m em uso até
  confirmação.
