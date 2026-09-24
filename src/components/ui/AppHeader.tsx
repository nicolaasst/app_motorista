import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import Icon from './Icon.jsx';

interface AppHeaderProps {
  title: string;
  backTo?: string;
  backLabel?: string;
}

// Header fixo reimplementado inline em 14 das 16 telas (ver
// docs/PATTERN_INVENTORY.md). Extraído aqui na Fase 4; a adoção tela a
// tela acontece na Fase 6, substituindo o bloco inline por este
// componente sem alterar a marcação renderizada.
export default function AppHeader({ title, backTo, backLabel }: AppHeaderProps) {
  const { driver, notifications, markNotificationsRead } = useApp();
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe">
      <div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-space-sm">
          {backTo ? (
            <Link
              aria-label={backLabel || 'Voltar'}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              to={backTo}
            >
              <Icon className="text-[24px]" name="arrow_back" />
            </Link>
          ) : (
            <img
              alt="Logotipo RotaPro Driver"
              className="h-8 w-auto object-contain"
              src="/screens/logotipo_rotapro_driver.png"
            />
          )}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              RotaPro
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            onClick={markNotificationsRead}
            type="button"
          >
            <Icon className="text-[24px]" name="notifications" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="relative flex items-center justify-center">
            <img
              alt={driver?.name || 'Perfil do motorista'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
              src="/screens/logotipo_rotapro_driver.png"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" />
          </div>
        </div>
      </div>
    </header>
  );
}
