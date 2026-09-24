import { describe, expect, it } from 'vitest';
import { checkCanFinishRoute } from './route.js';

describe('checkCanFinishRoute', () => {
  it('blocks when the route is already Concluída (only one execution per route)', () => {
    const result = checkCanFinishRoute({
      status: 'Concluída',
      stops: [{ id: 'stop-01', status: 'delivered' }],
    });
    expect(result.canFinish).toBe(false);
    expect(result.reason).toBe('ja-encerrada');
  });

  it('blocks when there are still pending/navigating stops', () => {
    const result = checkCanFinishRoute({
      status: 'Em operação',
      stops: [
        { id: 'stop-01', status: 'delivered' },
        { id: 'stop-02', status: 'pending' },
        { id: 'stop-03', status: 'navigating' },
      ],
    });
    expect(result.canFinish).toBe(false);
    expect(result.reason).toBe('paradas-pendentes');
    expect(result.pendingStopIds).toEqual(['stop-02', 'stop-03']);
  });

  it('allows finishing when every stop is delivered or failed', () => {
    const result = checkCanFinishRoute({
      status: 'Em operação',
      stops: [
        { id: 'stop-01', status: 'delivered' },
        { id: 'stop-02', status: 'failed' },
      ],
    });
    expect(result.canFinish).toBe(true);
    expect(result.pendingStopIds).toEqual([]);
  });
});
