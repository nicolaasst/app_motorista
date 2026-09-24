import { describe, expect, it } from 'vitest';
import { routeFromPath } from './PageRuntime.jsx';

describe('routeFromPath', () => {
  it('resolves known bottom-nav ids to their routes', () => {
    expect(routeFromPath('rota')).toBe('/rota');
    expect(routeFromPath('historico')).toBe('/historico');
    expect(routeFromPath('recibos')).toBe('/recibos');
    expect(routeFromPath('perfil')).toBe('/perfil');
  });

  it('falls back to /rota for an unknown id', () => {
    expect(routeFromPath('inexistente')).toBe('/rota');
    expect(routeFromPath(undefined)).toBe('/rota');
  });
});
