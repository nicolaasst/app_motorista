import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import BottomNav from './BottomNav.jsx';

describe('BottomNav', () => {
  it('renders all four tabs', () => {
    render(
      <MemoryRouter initialEntries={['/rota']}>
        <BottomNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Rota')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Recibos')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('marks the tab matching the current path as the current page', () => {
    render(
      <MemoryRouter initialEntries={['/historico/ROM-2024-88412']}>
        <BottomNav />
      </MemoryRouter>,
    );
    const historyLink = screen.getByText('Histórico').closest('a');
    expect(historyLink).toHaveAttribute('aria-current', 'page');
    const routeLink = screen.getByText('Rota').closest('a');
    expect(routeLink).not.toHaveAttribute('aria-current');
  });

  it('has no critical accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/rota']}>
        <BottomNav />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
