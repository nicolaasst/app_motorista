import Icon from '../components/ui/Icon.jsx';
import AppHeader from '../components/ui/AppHeader.jsx';
import BottomNav from '../components/ui/BottomNav.jsx';

// Classes escritas por extenso (não interpoladas): o scanner do Tailwind
// procura o texto literal da classe no código-fonte, então `bg-${token}`
// nunca geraria CSS nenhum.
const COLOR_TOKENS = [
  ['primary', 'bg-primary'],
  ['primary-container', 'bg-primary-container'],
  ['secondary', 'bg-secondary'],
  ['secondary-container', 'bg-secondary-container'],
  ['tertiary', 'bg-tertiary'],
  ['tertiary-container', 'bg-tertiary-container'],
  ['error', 'bg-error'],
  ['error-container', 'bg-error-container'],
  ['surface', 'bg-surface'],
  ['surface-container', 'bg-surface-container'],
  ['surface-container-high', 'bg-surface-container-high'],
  ['inverse-surface', 'bg-inverse-surface'],
] as const;

const TYPE_TOKENS = [
  ['display-lg', 'font-display-lg text-display-lg', 'Display LG'],
  ['headline-lg', 'font-headline-lg text-headline-lg', 'Headline LG'],
  ['headline-md', 'font-headline-md text-headline-md', 'Headline MD'],
  ['headline-sm', 'font-headline-sm text-headline-sm', 'Headline SM'],
  ['body-lg', 'font-body-lg text-body-lg', 'Body LG'],
  ['body-md', 'font-body-md text-body-md', 'Body MD'],
  ['body-sm', 'font-body-sm text-body-sm', 'Body SM'],
  ['label-lg', 'font-label-lg text-label-lg', 'Label LG'],
  ['label-md', 'font-label-md text-label-md', 'Label MD'],
  ['label-sm', 'font-label-sm text-label-sm', 'Label SM'],
  ['code-lg', 'font-code-lg text-code-lg', 'Code LG — 000.000'],
  ['code-md', 'font-code-md text-code-md', 'Code MD — 000.000'],
  ['code-sm', 'font-code-sm text-code-sm', 'Code SM — 000.000'],
] as const;

// Só existe em DEV (ver src/App.jsx). Mostra os tokens já formalizados em
// tailwind.config.js (docs/PATTERN_INVENTORY.md) e os componentes extraídos
// na Fase 4, para conferência visual manual durante a adoção tela a tela
// (Fase 6) — não é parte do roteamento de produção.
export default function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      <AppHeader title="Design System" />
      <main className="pt-20 px-margin space-y-8">
        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Cores</h2>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_TOKENS.map(([token, bgClass]) => (
              <div className="rounded-DEFAULT overflow-hidden shadow-sm" key={token}>
                <div className={`h-12 ${bgClass}`} />
                <div className="bg-surface-container-lowest px-2 py-1 font-code-sm text-code-sm text-on-surface-variant">
                  {token}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Tipografia</h2>
          <div className="space-y-2">
            {TYPE_TOKENS.map(([token, typeClass, label]) => (
              <p className={`${typeClass} text-on-surface`} key={token}>
                {label}
              </p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
            Ícones (Material Symbols)
          </h2>
          <div className="flex gap-4 flex-wrap">
            {[
              'local_shipping',
              'history',
              'receipt_long',
              'account_circle',
              'check_circle',
              'cancel',
              'report_problem',
            ].map((name) => (
              <div className="flex flex-col items-center gap-1" key={name}>
                <Icon className="text-[28px] text-primary" name={name} />
                <span className="font-code-sm text-code-sm text-on-surface-variant">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Componentes</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
            AppHeader e BottomNav (renderizados nesta própria página). StopCard, badges de status e
            o botão de ação primária foram auditados (ver docs/PATTERN_INVENTORY.md) e têm variação
            real de estilo entre telas — unificá-los sem mudar a aparência de nenhuma tela é
            trabalho da Fase 6, tela a tela, não desta fase.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
