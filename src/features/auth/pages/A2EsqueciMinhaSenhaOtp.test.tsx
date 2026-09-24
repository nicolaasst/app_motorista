import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import A2EsqueciMinhaSenhaOtp from './A2EsqueciMinhaSenhaOtp.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <A2EsqueciMinhaSenhaOtp />
    </MemoryRouter>,
  );
}

describe('A2EsqueciMinhaSenhaOtp', () => {
  it('renders the OTP and new-password fields', () => {
    renderScreen();
    expect(screen.getByLabelText(/código de autenticação/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Definir Nova Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Nova Senha')).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
