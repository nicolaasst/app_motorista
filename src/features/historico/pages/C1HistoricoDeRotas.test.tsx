import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import C1HistoricoDeRotas from './C1HistoricoDeRotas.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <C1HistoricoDeRotas />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('C1HistoricoDeRotas', () => {
  it('renders the route cards as keyboard-accessible triggers', () => {
    renderScreen();
    expect(screen.getByText('ROM-2024-88412')).toBeInTheDocument();
    const card = screen.getByText('ROM-2024-88412').closest('[role="button"]');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
