# Design tokens — NGS Driver (app do motorista)

> **Documento de referência, não de redesenho.** Transcreve fielmente os tokens de
> `src/index.css` e `tailwind.config.js` no commit `59aa58c` (upload íntegro do Base44). Nenhum
> valor foi alterado. A fonte de verdade continua sendo o CSS: se divergir, vale o CSS.
> Destino: a sessão futura que vai adotar esta identidade no sistema operacional (TMS).

## Como os tokens funcionam

- Cores são variáveis CSS com **componentes HSL sem `hsl()`** (padrão shadcn/ui), ex.
  `--primary: 50 100% 53%`. O Tailwind envolve: `primary: 'hsl(var(--primary))'`, o que permite
  opacidade (`bg-primary/20`).
- Tema escuro por classe (`darkMode: ["class"]`), sobrescrevendo 39 das 75 variáveis em `.dark`.
  Quem aplica a classe é `src/components/ThemeSync.jsx` (preferência do motorista:
  `system/light/dark`).
- **Regra da marca (comentário no CSS):** a ação primária é o **amarelo** com texto **ink
  (preto)** por cima; `ink` é só para texto/ícone/traço e `navy` só para fundo. O sistema de
  status logístico (verde/âmbar/vermelho/azul/cinza) é **separado** do amarelo da marca.
- "hex calc." é a conversão do HSL, calculada por script. Os hex nos comentários do CSS são
  aproximações do autor e às vezes diferem na última casa (ex.: `--background` comenta
  `#F7F7F9`, o HSL dá `#F7F7F8`). **O valor normativo é o HSL.**
- Observação fiel ao original: `--primary`/`--brand-yellow` usam matiz **50**, enquanto
  `--ring`, `--lime` e `--chart-1` usam matiz **49**. Está assim no CSS; não foi "corrigido".

## Cores (`:root` e `.dark`)

#### Surfaces — NGS Driver (vivid yellow + ink)

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--background` | `240 10% 97%` | #F7F7F8 | `229 30% 9%` | #10131E | #F7F7F9 / escuro: navy |
| `--foreground` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 | ink #000000 |
| `--card` | `0 0% 100%` | #FFFFFF | `258 16% 12%` | #1D1A23 | surface #FFFFFF |
| `--card-foreground` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 |  |
| `--popover` | `0 0% 100%` | #FFFFFF | `258 16% 12%` | #1D1A23 |  |
| `--popover-foreground` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 |  |

#### Brand / Primary — ink (black) is the action color

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--primary` | `50 100% 53%` | #FFD70F | `50 100% 53%` | #FFD70F | brand-yellow — primary action / escuro: brand-yellow CTA on dark |
| `--primary-foreground` | `0 0% 0%` | #000000 | `0 0% 0%` | #000000 | ink on yellow / escuro: ink on yellow |
| `--primary-deep` | `0 0% 0%` | #000000 | `50 100% 53%` | #FFD70F | ink — accent/links on light / escuro: yellow accent text on dark |
| `--primary-container` | `50 100% 53%` | #FFD70F | `50 100% 53%` | #FFD70F | brand-yellow — CTA fill |
| `--on-primary-container` | `0 0% 0%` | #000000 | `0 0% 0%` | #000000 | ink on yellow / escuro: ink on yellow |
| `--primary-pressed` | `50 88% 47%` | #E1BE0E | `50 88% 47%` | #E1BE0E | brand-yellow-deep |

#### Secondary — slate

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--secondary` | `215 25% 37%` | #475A76 | `240 9% 20%` | #2E2E38 |  |
| `--secondary-foreground` | `0 0% 100%` | #FFFFFF | `240 9% 94%` | #EEEEF1 |  |
| `--secondary-container` | `240 9% 94%` | #EEEEF1 | `258 16% 16%` | #26222F |  |
| `--on-secondary-container` | `215 25% 27%` | #344256 | = claro |  |  |

#### Tertiary

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--tertiary` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 |  |
| `--tertiary-foreground` | `0 0% 100%` | #FFFFFF | `258 16% 9%` | #15131B |  |
| `--tertiary-container` | `48 100% 81%` | #FFEC9E | `48 60% 30%` | #7A681F | brand-yellow-soft |

#### Accent — soft yellow fill (icon tiles, light highlights)

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--accent` | `48 100% 81%` | #FFEC9E | `48 60% 30%` | #7A681F | #FFEFA0 |
| `--accent-foreground` | `0 0% 0%` | #000000 | `48 100% 81%` | #FFEC9E | ink on soft yellow |

#### Muted

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--muted` | `240 9% 94%` | #EEEEF1 | `258 16% 16%` | #26222F | surface-track |
| `--muted-foreground` | `240 3% 56%` | #8B8B92 | `240 3% 65%` | #A3A3A8 | #8B8B92 |

#### Destructive / Error

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--destructive` | `0 72% 51%` | #DC2828 | `0 72% 51%` | #DC2828 | #DC2626 |
| `--destructive-foreground` | `0 0% 100%` | #FFFFFF | `0 0% 100%` | #FFFFFF |  |
| `--destructive-pressed` | `0 70% 35%` | #981B1B | `0 70% 35%` | #981B1B |  |
| `--error` | `0 72% 51%` | #DC2828 | = claro |  |  |
| `--error-container` | `0 94% 94%` | #FEE1E1 | = claro |  | #FEE2E2 |
| `--on-error-container` | `0 70% 35%` | #981B1B | = claro |  |  |

#### Borders / Inputs / Rings

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--border` | `240 8% 90%` | #E3E3E8 | `258 16% 18%` | #2B2735 | outline #E3E3E7 |
| `--input` | `240 8% 86%` | #D8D8DE | `258 16% 22%` | #352F41 |  |
| `--ring` | `49 100% 53%` | #FFD30F | `49 100% 53%` | #FFD30F | brand-yellow |

#### Brand anchors (do not flip with theme)

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--onyx` | `0 0% 0%` | #000000 | = claro |  | ink |
| `--onyx-pressed` | `0 0% 11%` | #1C1C1C | = claro |  | ink-soft |
| `--lime` | `49 100% 53%` | #FFD30F | = claro |  | brand-yellow (accent on dark) |
| `--paper` | `240 9% 94%` | #EEEEF1 | = claro |  |  |
| `--stone` | `240 3% 56%` | #8B8B92 | = claro |  | muted |

#### Explicit brand tokens — ink is text/icon/stroke ONLY; navy is background ONLY

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--ink` | `0 0% 0%` | #000000 | = claro |  | #000000 — texto/ícone/traço |
| `--ink-soft` | `0 0% 11%` | #1C1C1C | = claro |  | #1D1D1B — textos secundários / pressed |
| `--navy` | `229 30% 9%` | #10131E | = claro |  | #10121E — fundo de telas vitrine |
| `--brand-yellow` | `50 100% 53%` | #FFD70F | = claro |  | #FFD80F — cor de marca dominante |
| `--brand-yellow-light` | `50 100% 62%` | #FFDF3D | = claro |  | #FFDF3E — realce sobre o amarelo |
| `--brand-yellow-secondary` | `49 100% 57%` | #FFD724 | = claro |  | #FED525 — tom intermediário de gradiente |
| `--brand-yellow-deep` | `50 88% 47%` | #E1BE0E | = claro |  | #E0BE0E |
| `--brand-yellow-soft` | `48 100% 81%` | #FFEC9E | = claro |  | #FFEFA0 |
| `--surface-track` | `240 9% 94%` | #EEEEF1 | = claro |  | #EEEEF1 |
| `--outline` | `240 8% 90%` | #E3E3E8 | = claro |  | #E3E3E7 |

#### Logistics status system — SEPARATE from brand yellow

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--status-green-bg` | `135 84% 93%` | #DEFCE6 | = claro |  | #DCFCE7 |
| `--status-green-fg` | `141 72% 29%` | #157F3A | = claro |  | #15803D |
| `--status-amber-bg` | `48 93% 89%` | #FDF3C9 | = claro |  | #FEF3C7 |
| `--status-amber-fg` | `32 95% 44%` | #DB7706 | = claro |  | #D97706 |
| `--status-red-bg` | `0 94% 94%` | #FEE1E1 | = claro |  | #FEE2E2 |
| `--status-red-fg` | `0 72% 51%` | #DC2828 | = claro |  | #DC2626 |
| `--status-blue-bg` | `214 92% 93%` | #DDEBFE | = claro |  | #DBEAFE |
| `--status-blue-fg` | `222 76% 48%` | #1D55D7 | = claro |  | #1D4ED8 |
| `--status-gray-bg` | `240 8% 95%` | #F1F1F3 | = claro |  | #F1F1F3 |
| `--status-gray-fg` | `240 5% 34%` | #52525B | = claro |  | #52525B |

#### Charts

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--chart-1` | `49 100% 53%` | #FFD30F | `49 100% 53%` | #FFD30F |  |
| `--chart-2` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 |  |
| `--chart-3` | `50 88% 47%` | #E1BE0E | `50 88% 47%` | #E1BE0E |  |
| `--chart-4` | `0 0% 11%` | #1C1C1C | `48 100% 81%` | #FFEC9E |  |
| `--chart-5` | `0 72% 51%` | #DC2828 | `0 72% 51%` | #DC2828 |  |

#### Radius

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--radius` | `1rem` |  | = claro |  |  |

#### Typography

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--font-heading` | `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif` |  | = claro |  |  |
| `--font-body` | `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif` |  | = claro |  |  |
| `--font-display` | `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif` |  | = claro |  |  |
| `--font-mono` | `'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |  | = claro |  |  |

#### Sidebar (mirrors surface)

| token | claro (HSL) | hex calc. | escuro (`.dark`) | hex calc. | comentário no CSS |
|---|---|---|---|---|---|
| `--sidebar-background` | `0 0% 100%` | #FFFFFF | `258 16% 12%` | #1D1A23 |  |
| `--sidebar-foreground` | `0 0% 0%` | #000000 | `240 9% 94%` | #EEEEF1 |  |
| `--sidebar-primary` | `0 0% 0%` | #000000 | `49 100% 53%` | #FFD30F |  |
| `--sidebar-primary-foreground` | `0 0% 100%` | #FFFFFF | = claro |  |  |
| `--sidebar-accent` | `48 100% 81%` | #FFEC9E | `48 60% 30%` | #7A681F |  |
| `--sidebar-accent-foreground` | `0 0% 0%` | #000000 | `48 100% 81%` | #FFEC9E |  |
| `--sidebar-border` | `240 8% 90%` | #E3E3E8 | `258 16% 18%` | #2B2735 |  |
| `--sidebar-ring` | `49 100% 53%` | #FFD30F | = claro |  |  |

## Mapeamento no Tailwind (`theme.extend.colors`)

| classe Tailwind | variável |
|---|---|
| `background`, `foreground` | `--background`, `--foreground` |
| `card(-foreground)`, `popover(-foreground)` | `--card*`, `--popover*` |
| `primary` / `-foreground` / `-deep` / `-container` / `-on-container` / `-pressed` | `--primary`, `--primary-foreground`, `--primary-deep`, `--primary-container`, `--on-primary-container`, `--primary-pressed` |
| `secondary(-foreground)` | `--secondary*` (os tokens `--secondary-container` e `--on-secondary-container` existem no CSS, mas não estão mapeados no Tailwind) |
| `tertiary` / `-foreground` / `-container` | `--tertiary*` |
| `muted(-foreground)`, `accent(-foreground)` | `--muted*`, `--accent*` |
| `destructive` / `-foreground` / `-pressed` | `--destructive*` |
| `error` / `-container` / `-on-container` | `--error`, `--error-container`, `--on-error-container` |
| `border`, `input`, `ring` | `--border`, `--input`, `--ring` |
| `onyx` / `onyx-pressed`, `lime`, `paper`, `stone` | âncoras de marca |
| `ink`, `ink-soft`, `navy`, `brand-yellow`, `brand-yellow-light`, `brand-yellow-secondary`, `brand-yellow-deep`, `brand-yellow-soft`, `outline`, `surface-track` | tokens explícitos de marca |
| `status-{green,amber,red,blue,gray}` (`DEFAULT` = bg, `.fg`, `.bg`) | `--status-*-bg`, `--status-*-fg` |
| `chart-1` … `chart-5` | `--chart-*` |
| `sidebar` (+ `foreground`, `primary`, `primary-foreground`, `accent`, `accent-foreground`, `border`, `ring`) | `--sidebar-*` |

Opacidade: `theme.extend.opacity` gera **todas** as opacidades de 0 a 100 (`/0` … `/100`).

## Raios (`borderRadius`)

| classe | valor | observação |
|---|---|---|
| `rounded-sm` | `0.5rem` (8px) | |
| `rounded` | `1rem` (16px) | igual a `--radius` |
| `rounded-md` | `1.5rem` (24px) | |
| `rounded-lg` | `2rem` (32px) | |
| `rounded-xl` | `3rem` (48px) | |
| `rounded-2xl` | `1.25rem` (20px) | menor que `lg`/`xl` — é assim no original; `.card` usa `rounded-2xl` |
| `rounded-3xl` | `1.5rem` (24px) | |
| `rounded-full` | `9999px` | |

## Sombras (`boxShadow`)

| classe | valor |
|---|---|
| `shadow-card` | `none` (cards usam borda de 1px, sem sombra) |
| `shadow-elevated` | `0 4px 12px -2px rgba(21,19,26,.06), 0 2px 4px -1px rgba(21,19,26,.04)` |
| `shadow-modal` | `0 12px 28px -4px rgba(15,23,42,.12), 0 4px 8px -2px rgba(15,23,42,.04)` |
| `shadow-chrome` | `0px -4px 16px rgba(0, 0, 0, 0.18)` (barra inferior) |
| `shadow-cta` | `0px 8px 24px rgba(21, 19, 26, 0.25)` |

Gradiente: `.bg-brand-gradient` = `linear-gradient(135deg, #000000 0%, #1D1D1B 100%)`.

## Tipografia

Fontes: **Plus Jakarta Sans** (400/500/600/700/800) para `heading`, `body` e `display`;
**Space Mono** (400/700) para `mono`. Ambas via Google Fonts (`@import` em `index.css`). Ícones:
**Material Symbols Outlined** (link em `index.html`, eixos `opsz 20..48`, `wght 400..600`,
`FILL 0..1`), com padrão `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`.

| classe | tamanho / altura de linha | peso | extra |
|---|---|---|---|
| `.text-display-lg` | 30/36px (≥768px: 40/48px) | 700 | `letter-spacing: -0.02em` |
| `.text-headline-lg` | 28/36px | 700 | |
| `.text-headline-md` | 22/28px | 600 | |
| `.text-headline-sm` | 18/24px | 600 | |
| `.text-body-lg` | 16/24px | 500 | |
| `.text-body-md` | 14/20px | 500 | |
| `.text-body-sm` | 12/16px | 500 | |
| `.text-label-lg` | 14/20px | 600 | |
| `.text-label-md` | 12/16px | 600 | |
| `.text-label-sm` | 12/14px | 700 | `letter-spacing: 0.04em` |
| `.text-code-lg` | 18/24px | 700 | mono, `0.06em` |
| `.text-code-md` | 14/20px | 700 | mono, `0.04em` |
| `.text-code-sm` | 12/16px | 400 | mono, `0.02em` |

## Componentes-base (`@layer components`)

| classe | definição |
|---|---|
| `.app-shell` | `w-full min-h-screen bg-background relative` (fluido, sem `max-width`) |
| `.screen-pad` | `px-5 pb-28 md:px-6 lg:px-8` |
| `.card` | `rounded-2xl bg-card border border-border` (nível L1: borda 1px, sem blur) |
| `.chip` | `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold leading-[14px] tracking-[0.04em]` |
| `.status-{green,amber,red,blue,gray}` | fundo `--status-*-bg` + texto `--status-*-fg` |
| `.rp-tap` | sem destaque de toque (`-webkit-tap-highlight-color: transparent`), `touch-action: manipulation` |
| `.safe-top` / `.safe-bottom` | `padding` com `env(safe-area-inset-*)` |
| `.tabular-nums` | números tabulares |

Comportamento de "shell nativo" (`@layer base`): `overscroll-behavior: none` no `body`; sem
seleção de texto em botões/links/labels/chips/ícones; seleção liberada em
`input`/`textarea`/`contenteditable`. `prefers-reduced-motion` zera animações e transições.

## Fora do escopo deste documento

- O logotipo "NGS Transportes" (dourado) enviado pelo responsável é um ativo de marca separado
  dos tokens do app; os arquivos `logo-full.png`, `logo.png` e `manifest.json` ainda vão ser
  adicionados ao repositório.
- Imagens hoje servidas pelo CDN do Base44 (`media.base44.com`: ícone 48px e 4 mascotes) — ver
  `docs/ARQUITETURA_APP_MOTORISTA.md` §9.
