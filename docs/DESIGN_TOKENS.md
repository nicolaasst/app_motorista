# Design tokens — o que já está formalizado vs. o que precisa de token novo

Complementa `docs/PATTERN_INVENTORY.md` (Fase 0) com a decisão explícita da
Fase 4: quais tokens já formalizados em `tailwind.config.js` são a fonte da
verdade, e quais pontos do código ainda usam valores fora do sistema.

## Já formalizado (usar direto, não recriar)

Ver `tailwind.config.js` — cores (`theme.extend.colors`), tipografia
(`fontFamily`/`fontSize`), espaçamento (`spacing`) e raio de borda
(`borderRadius`). A página `/design-system` (só em `import.meta.env.DEV`,
`src/dev/DesignSystemShowcase.tsx`) renderiza a paleta e a escala
tipográfica ao vivo, a partir das classes reais do Tailwind (não é uma cópia
estática — se o token mudar no `tailwind.config.js`, a página muda junto).

## Pontos de fuga confirmados (não corrigidos nesta fase)

Da auditoria da Fase 0 (`docs/PATTERN_INVENTORY.md`, seção 2): 28
ocorrências de `text-gray-*` e 15 de `bg-white`/`text-white` — Tailwind
default, fora da paleta do design system. Além disso, a Fase 4 encontrou
outra categoria: **badges de status usam cores hexadecimais soltas**
(ex.: `bg-[#E5F1FF] text-[#0066CC]` para "A Caminho" em `B1RotaDoDiaHome`,
`bg-[#FFF3D6] text-[#B26200]` para "Pendente"), sem token correspondente em
`tailwind.config.js`. Corrigir isso significa **decidir uma paleta
semântica de status** (info/pendente/sucesso/erro) e é uma mudança visual,
não uma refatoração neutra — fica para ser decidido tela a tela na Fase 6
(ou como uma decisão de produto explícita antes disso), não presumido aqui.

## Componentes extraídos na Fase 4 (`src/components/ui/`)

| Componente      | Por quê                                                                                                                                                                                                                                                                                                            | Adoção                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon.tsx`      | Wrapper fino sobre `material-symbols-outlined`, já usado em 15/16 telas. Não troca a fonte de ícone.                                                                                                                                                                                                               | Usado internamente por `AppHeader`/`BottomNav`; telas passam a usá-lo na Fase 6.                                                                                                                                |
| `AppHeader.tsx` | Header fixo idêntico em 14/16 telas (ver PATTERN_INVENTORY §5). Agora mostra o contador de notificações não lidas **real** (`useApp().notifications`), em vez do "3" hardcoded em todo arquivo — e o botão de notificação, antes 100% decorativo em todas as 14 telas, chama `markNotificationsRead()` de verdade. | Ainda não adotado em nenhuma tela de produto (isso é Fase 6 — trocar o bloco inline pelo componente sem mudar a marcação renderizada). Testado isoladamente (`AppHeader.test.tsx`, 5 testes incluindo `axe()`). |
| `BottomNav.tsx` | Navegação inferior idêntica em 14/16 telas. A aba ativa passa a ser detectada por `useLocation()` em vez de cada tela precisar marcar manualmente qual `<Link>` leva `aria-current="page"`.                                                                                                                        | Mesma situação — extraído, não adotado ainda. Testado isoladamente (`BottomNav.test.tsx`, 3 testes).                                                                                                            |

## Candidatos avaliados e **não** extraídos nesta fase (decisão registrada, não esquecimento)

- **StopCard / cartão de rota concluída**: a estrutura visual entre
  `B1RotaDoDiaHome` (cartão de parada ativa) e `C1HistRicoDeRotas` (cartão
  de rota do histórico) é parecida por fora, mas o conteúdo interno (grid
  de métricas, badges, footer) tem shape de dados bem diferente em cada
  tela — forçar um componente genérico agora exigiria uma API de props tão
  grande que perderia o valor de abstração (ver a regra "três linhas
  parecidas é melhor que abstração prematura"). Decisão: deixar para a
  Fase 6, quando cada tela migrar para dados reais e o shape comum (se
  houver um de verdade) ficar visível.
- **Botão de ação primária (pílula full-width)**: presente em quase toda
  tela, mas com alturas (`h-14` vs `h-[54px]` vs `h-[56px]`), sombras e
  variantes de `active:scale-*` diferentes por tela — não é um padrão
  único, são variações bespoke. Unificar agora mudaria a aparência de
  telas específicas (viola paridade visual). Mesma decisão: Fase 6.
- **Badge de status**: ver seção "Pontos de fuga" acima — depende de uma
  decisão de paleta semântica antes de fazer sentido como componente.
