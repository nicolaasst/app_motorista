import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import Icon from './Icon.jsx';

describe('Icon', () => {
  it('renders the icon name as the Material Symbols ligature text', () => {
    const { container } = render(<Icon name="local_shipping" />);
    expect(container.textContent).toBe('local_shipping');
    expect(container.querySelector('.material-symbols-outlined')).toBeTruthy();
  });

  it('is hidden from assistive tech by default (decorative glyph)', () => {
    const { container } = render(<Icon name="check_circle" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('applies the FILL variation when filled is true', () => {
    const { container } = render(<Icon filled name="task_alt" />);
    const span = container.querySelector('.material-symbols-outlined') as HTMLElement;
    expect(span.style.fontVariationSettings).toContain('"FILL" 1');
  });
});
