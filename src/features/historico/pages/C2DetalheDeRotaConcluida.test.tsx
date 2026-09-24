import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import C2DetalheDeRotaConcluida from './C2DetalheDeRotaConcluida.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <C2DetalheDeRotaConcluida />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('C2DetalheDeRotaConcluida', () => {
  it('renders the route audit summary', () => {
    renderScreen();
    expect(screen.getByText('Rota Concluída')).toBeInTheDocument();
    expect(screen.getByText('Linha do Tempo de Paradas')).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
