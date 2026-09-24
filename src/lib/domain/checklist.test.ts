import { describe, expect, it } from 'vitest';
import { evaluateChecklist, type ChecklistItemDefinition } from './checklist.js';

const DEFS: ChecklistItemDefinition[] = [
  { key: 'pneus', label: 'Pneus', critico: true },
  { key: 'luzes', label: 'Luzes', critico: true },
  { key: 'documentacao', label: 'Documentação', critico: false },
];

describe('evaluateChecklist', () => {
  it('approves when every item is answered Sim', () => {
    const result = evaluateChecklist(DEFS, { pneus: true, luzes: true, documentacao: true });
    expect(result.complete).toBe(true);
    expect(result.approved).toBe(true);
    expect(result.failedCriticalKeys).toEqual([]);
  });

  it('blocks approval when a critical item is Não, even if the rest is Sim', () => {
    const result = evaluateChecklist(DEFS, { pneus: false, luzes: true, documentacao: true });
    expect(result.complete).toBe(true);
    expect(result.approved).toBe(false);
    expect(result.failedCriticalKeys).toEqual(['pneus']);
  });

  it('does not block approval when only a non-critical item is Não', () => {
    const result = evaluateChecklist(DEFS, { pneus: true, luzes: true, documentacao: false });
    expect(result.approved).toBe(true);
    expect(result.failedNonCriticalKeys).toEqual(['documentacao']);
  });

  it('is not complete when an item has no answer yet', () => {
    const result = evaluateChecklist(DEFS, { pneus: true, luzes: true });
    expect(result.complete).toBe(false);
    expect(result.approved).toBe(false);
  });

  it('never approves an empty answer set (no silent pass-through like the old PageRuntime bug)', () => {
    const result = evaluateChecklist(DEFS, {});
    expect(result.complete).toBe(false);
    expect(result.approved).toBe(false);
  });
});
