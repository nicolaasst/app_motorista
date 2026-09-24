import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import LogotipoRotaproDriver from './LogotipoRotaproDriver.jsx';

describe('LogotipoRotaproDriver', () => {
  it('renders the RotaPro wordmark', () => {
    const { container } = render(<LogotipoRotaproDriver />);
    expect(container.textContent).toContain('ROTA');
    expect(container.textContent).toContain('PRO');
  });

  it('has no critical accessibility violations', async () => {
    const { container } = render(<LogotipoRotaproDriver />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
