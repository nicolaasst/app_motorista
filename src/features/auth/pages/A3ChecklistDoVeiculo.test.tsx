import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import A3ChecklistDoVeiculo from './A3ChecklistDoVeiculo.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <A3ChecklistDoVeiculo />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('A3ChecklistDoVeiculo', () => {
  it('renders all vehicle checklist items conforme by default', () => {
    renderScreen();
    expect(screen.getByText('5 de 5 conformes')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /iniciar turno e carregar rotas/i }),
    ).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
