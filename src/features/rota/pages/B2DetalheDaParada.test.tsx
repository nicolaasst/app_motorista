import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B2DetalheDaParada from './B2DetalheDaParada.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B2DetalheDaParada />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B2DetalheDaParada', () => {
  it('renders the stop details and delivery actions', () => {
    renderScreen();
    expect(screen.getByText('Farmácia Santa Clara Ltda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar entrega/i })).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
