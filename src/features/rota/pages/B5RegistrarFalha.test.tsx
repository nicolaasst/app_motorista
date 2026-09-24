import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B5RegistrarFalha from './B5RegistrarFalha.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B5RegistrarFalha />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B5RegistrarFalha', () => {
  it('renders the failure reasons and submit action', () => {
    renderScreen();
    expect(screen.getByText('Avaria ou Dano no Produto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar falha da entrega/i })).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
