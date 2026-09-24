import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

const TABS = [
  { to: '/rota', label: 'Rota', icon: 'local_shipping' },
  { to: '/historico', label: 'Histórico', icon: 'history' },
  { to: '/recibos', label: 'Recibos', icon: 'receipt_long' },
  { to: '/perfil', label: 'Perfil', icon: 'account_circle' },
] as const;

// Navegação inferior reimplementada inline em 14 das 16 telas. Extraída na
// Fase 4; a aba ativa é detectada pela URL atual em vez de precisar de uma
// prop, então nenhuma tela precisa "saber" qual aba ela é.
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]"
      data-active-classes="text-primary-container font-label-md"
    >
      <div className="flex justify-around items-center h-[72px] px-space-xs">
        {TABS.map((tab) => {
          const active = location.pathname.startsWith(tab.to);
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group ${
                active
                  ? 'text-primary-container font-label-md'
                  : 'text-secondary-fixed-dim hover:text-surface'
              }`}
              key={tab.to}
              to={tab.to}
            >
              <Icon className="text-[24px]" name={tab.icon} />
              <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">{tab.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
