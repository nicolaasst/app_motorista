import { describe, expect, it } from 'vitest';
import { calculateResizedDimensions } from './photo.js';

describe('calculateResizedDimensions', () => {
  it('keeps dimensions unchanged when already under the max', () => {
    expect(calculateResizedDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('downscales a landscape photo preserving aspect ratio', () => {
    const result = calculateResizedDimensions(4000, 3000, 1600);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
  });

  it('downscales a portrait photo preserving aspect ratio', () => {
    const result = calculateResizedDimensions(3000, 4000, 1600);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(1600);
  });

  it('never upscales a smaller image', () => {
    expect(calculateResizedDimensions(200, 100, 1600)).toEqual({ width: 200, height: 100 });
  });
});
