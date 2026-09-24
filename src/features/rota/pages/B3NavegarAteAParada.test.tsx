import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B3NavegarAteAParada from './B3NavegarAteAParada.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B3NavegarAteAParada />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B3NavegarAteAParada', () => {
  it('renders the arrival action', () => {
    renderScreen();
    expect(screen.getByText(/cheguei no local da entrega/i)).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
