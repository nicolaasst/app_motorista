# Inventário de padrões — estado real antes da refatoração

Levantamento por leitura direta do código em `src/pages/*.jsx` (16 arquivos,
16 telas) e `tailwind.config.js`, feito na Fase 0, antes de qualquer mudança.
Objetivo: medir o que já está correto e reaproveitável, não presumir que tudo
precisa ser refeito.

## 1. O design system já está formalizado em `tailwind.config.js`

Ao contrário do que um diagnóstico apressado poderia sugerir, as classes
usadas nas telas (`bg-surface`, `text-on-surface-variant`, `font-headline-md`
etc.) **não são nomes soltos sem config por trás**: `tailwind.config.js`
define formalmente, em `theme.extend`:

- **Cores**: paleta completa Material Design 3 — `surface`, `surface-dim`,
  `surface-bright`, `surface-container-*` (lowest/low/DEFAULT/high/highest),
  `on-surface`, `on-surface-variant`, `inverse-surface`/`inverse-on-surface`,
  `outline`/`outline-variant`, `primary`/`on-primary`/`primary-container`/
  `on-primary-container` (+ variantes `fixed`/`fixed-dim`), o mesmo padrão
  para `secondary` e `tertiary`, e semânticas `error`, `warning`, `info`
  (cada uma com seu `-container`).
- **Tipografia**: escalas `display-lg`, `headline-{lg,md,sm}`,
  `body-{lg,md,sm}`, `label-{lg,md,sm}`, `code-{lg,md,sm}` — cada uma com
  `fontFamily` (Manrope para headline/display, Plus Jakarta Sans para
  body/label, Space Mono para code) e `fontSize` com `lineHeight`,
  `fontWeight` e `letterSpacing` definidos por token, não por classe solta.
- **Espaçamento**: `space-2xs` a `space-2xl`, `margin`, `gutter` (+ variantes
  desktop).
- **Raio de borda**: `sm`/`DEFAULT`/`md`/`lg`/`xl`.

**Conclusão da Fase 4:** não é necessário "promover para token" a maior parte
do sistema — ele já é token. O trabalho real da Fase 4 é (a) extrair os
componentes que reimplementam a mesma composição de tokens em todo arquivo
(ver seção 3) e (b) corrigir os pontos de fuga do sistema (seção 2).

## 2. Pontos de fuga do design system (usam Tailwind cru, não os tokens)

Contagem de ocorrências em `src/pages/*.jsx`:

| Classe                    | Ocorrências | Problema                                                                   |
| ------------------------- | ----------: | -------------------------------------------------------------------------- |
| `text-gray-*`             |          28 | Tailwind default, não um token do design system                            |
| `bg-white` / `text-white` |          15 | Deveria ser `bg-surface-container-lowest`/`on-primary` conforme o contexto |

Esses pontos precisam ser normalizados para os tokens equivalentes na Fase 4,
sem alterar a aparência visual (os valores hexadecimais já são próximos ou
idênticos em vários casos — comparação pixel a pixel confirma via
`scripts/visual-compare.mjs`).

## 3. Uso de tokens por tela (top classes, todas as 16 telas)

```
326× text-on-surface        220× text-label-sm        161× font-label-md
240× font-label-sm          213× text-on-surface-variant
167× font-body-sm           147× text-body-sm          140× bg-surface-container-lowest
138× text-secondary         132× text-label-md         127× text-primary
107× bg-primary-container   106× font-code-sm          104× bg-surface-container
 89× bg-surface-container-low   84× text-code-sm        67× text-on-primary
 65× text-headline-sm / font-headline-sm                50× bg-primary
```

Uso consistente e alto volume confirma que o padrão visual (Material Symbols

- paleta verde tática + Space Mono para dados de código/rastreio) já está
  amplamente adotado — não é um esqueleto a ser preenchido, é um sistema em uso
  real que precisa ser **extraído para componentes**, não reescrito.

## 4. Ícones (`material-symbols-outlined`)

Presente em 15 das 16 telas de produto (`A2EsqueciMinhaSenhaOtp.jsx` é a
única sem ícones — tela simples de recuperação de senha). Uso mais intenso em
`E1PerfilDoMotorista.jsx` (35 ocorrências), `A3ChecklistDoVeCulo.jsx` (29) e
`B2DetalheDaParada.jsx`/`B7ChecklistDeRetorno.jsx` (26 cada). A fonte de
ícone é carregada via `<link>` para Google Fonts em `index.html` — ver
`docs/OPEN_QUESTIONS.md` item 8 sobre a limitação de rede durante a captura
de baseline neste ambiente. A Fase 4 padroniza um componente `<Icon name>`
fino por cima do mesmo mecanismo, sem trocar a fonte.

## 5. Header repetido (candidato certo para componentização)

14 das 16 telas de produto (todas exceto `A1LoginDoMotorista.jsx` e
`A2EsqueciMinhaSenhaOtp.jsx`, que são pré-login) contêm o texto "RotaPro" no
cabeçalho fixo com logo + sino de notificação + avatar, reimplementado
inline em cada arquivo. Este é o candidato número 1 para extração em
`components/ui` na Fase 4, junto com: stepper de pílula (visto em
`B4ConfirmarEntrega`, `B7ChecklistDeRetorno`), `StopCard` (visto em
`B1RotaDoDiaHome`, `C1HistRicoDeRotas`), badge de status, e botão de ação
primária (pílula verde full-width, presente em praticamente todas as telas
de ação).

## 6. Ergonomia de campo (a auditar em detalhe na Fase 4)

Não auditado pixel a pixel nesta passagem (isso é trabalho da Fase 4,
comparando contra os PNGs de referência em `public/screens/`). Ponto de
partida: os botões primários já usam padding generoso (`py-4`/`py-5` comuns
nos arquivos), consistente com o alvo de toque ≥44×44px, mas isso precisa
ser confirmado tela a tela, não presumido.

## 7. Baseline visual (Fase 0)

16 capturas em 390×844 salvas em `tests/visual/baseline/*.png`, geradas por
`scripts/capture-baseline.mjs` (login real com as credenciais demo,
navegação client-side via `pushState`+`popstate` para alcançar rotas sem
gatilho de clique direto na UI, como `/rota/fim` e `/rota/retorno`, que não
têm link de navegação a partir de `B1RotaDoDiaHome` no estado atual do
dispatcher). Comparação de regressão via `scripts/visual-compare.mjs`
(limiar padrão: 2% de pixels divergentes, configurável via
`VISUAL_DIFF_THRESHOLD`). Os PNGs em `public/screens/` são mockups de
referência de design (proporção e composição diferentes das capturas reais
do app rodando) — servem para conferência visual manual, não para diff de
pixel automatizado.
