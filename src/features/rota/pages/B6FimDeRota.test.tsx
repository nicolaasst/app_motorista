import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B6FimDeRota from './B6FimDeRota.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B6FimDeRota />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B6FimDeRota', () => {
  it('renders the route summary and the continue action', () => {
    renderScreen();
    expect(screen.getByText('Rota Concluída!')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /prosseguir para checklist de retorno/i }),
    ).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
