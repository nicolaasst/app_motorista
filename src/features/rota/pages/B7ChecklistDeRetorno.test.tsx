import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AppProvider } from '../../../context/AppContext.jsx';
import B7ChecklistDeRetorno from './B7ChecklistDeRetorno.jsx';

function renderScreen() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <B7ChecklistDeRetorno />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('B7ChecklistDeRetorno', () => {
  it('renders all return checklist items conforme by default', () => {
    renderScreen();
    expect(screen.getByText('5/5 CONFERIDOS')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /encerrar turno e liberar veículo/i }),
    ).toBeInTheDocument();
  });

  it('has no critical accessibility violations', async () => {
    const { container } = renderScreen();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
