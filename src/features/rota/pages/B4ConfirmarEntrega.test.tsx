import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B4ConfirmarEntrega from './B4ConfirmarEntrega.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B4ConfirmarEntrega />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B4ConfirmarEntrega', () => {
  it('renders the recipient fields and signature/photo steppers', () => {
    renderScreen();
    expect(screen.getByLabelText('Nome Completo de Quem Recebeu')).toBeInTheDocument();
    expect(screen.getByText('Assinatura Digital')).toBeInTheDocument();
    expect(screen.getByText('Foto Comprovante')).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
