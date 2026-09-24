import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import A1LoginDoMotorista from './A1LoginDoMotorista.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <A1LoginDoMotorista />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('A1LoginDoMotorista', () => {
  it('renders the login form fields', () => {
    renderScreen();
    expect(screen.getByLabelText('CPF ou Matrícula')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha de Acesso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
