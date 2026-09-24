import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B1RotaDoDiaHome from './B1RotaDoDiaHome.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B1RotaDoDiaHome />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B1RotaDoDiaHome', () => {
  it('renders the route summary and next-stop card', () => {
    renderScreen();
    expect(screen.getByText('Sequência de Paradas')).toBeInTheDocument();
    expect(screen.getByText('Farmácia Santa Clara Ltda')).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
