import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../context/AppContext.jsx';
import AppHeader from './AppHeader.jsx';

function renderHeader(props: React.ComponentProps<typeof AppHeader>) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <AppHeader {...props} />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('AppHeader', () => {
  it('renders the RotaPro label and the given title', () => {
    renderHeader({ title: 'Rota' });
    expect(screen.getByText('RotaPro')).toBeInTheDocument();
    expect(screen.getByText('Rota')).toBeInTheDocument();
  });

  it('shows the initial unread notification count from AppContext', () => {
    renderHeader({ title: 'Rota' });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('clears the unread badge when the notifications button is clicked', () => {
    renderHeader({ title: 'Rota' });
    fireEvent.click(screen.getByLabelText('Notificações'));
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('renders a back link instead of the logo when backTo is set', () => {
    renderHeader({ title: 'Suporte', backTo: '/perfil', backLabel: 'Voltar para o Perfil' });
    const back = screen.getByLabelText('Voltar para o Perfil');
    expect(back).toHaveAttribute('href', '/perfil');
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderHeader({ title: 'Rota' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
