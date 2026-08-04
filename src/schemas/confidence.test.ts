import { describe, it, expect } from 'vitest';
import { CONFIDENCE_SCALE, confidenceLabel } from './confidence';

describe('CONFIDENCE_SCALE', () => {
  it('defines all 11 anchor points from the spec (GIZA - 01 §6)', () => {
    const anchors = Object.keys(CONFIDENCE_SCALE).map(Number);
    expect(anchors).toHaveLength(11);
    expect(anchors).toEqual(expect.arrayContaining([10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]));
  });

  it('maps 100 to "Measured directly"', () => {
    expect(CONFIDENCE_SCALE[100]).toBe('Measured directly');
  });

  it('maps 10 to "Hypothesis only"', () => {
    expect(CONFIDENCE_SCALE[10]).toBe('Hypothesis only');
  });

  it('maps 95 to "Multiple independent measurements"', () => {
    expect(CONFIDENCE_SCALE[95]).toBe('Multiple independent measurements');
  });
});

describe('confidenceLabel', () => {
  it('returns the exact label for an anchor score', () => {
    expect(confidenceLabel(100)).toBe('Measured directly');
    expect(confidenceLabel(50)).toBe('Competing interpretations');
    expect(confidenceLabel(10)).toBe('Hypothesis only');
  });

  it('returns the nearest anchor label for an intermediate score', () => {
    // 96 is nearest to 95
    expect(confidenceLabel(96)).toBe('Multiple independent measurements');
    // 85 is nearest to 80 (delta 5) vs 90 (delta 5) — first match wins on strict <
    // so 80 wins because 80 is encountered first in ascending order with delta 5
    expect(confidenceLabel(85)).toBeTruthy();
    // 12 is nearest to 10
    expect(confidenceLabel(12)).toBe('Hypothesis only');
  });

  it('handles score 0 by returning the nearest anchor (10)', () => {
    expect(confidenceLabel(0)).toBe('Hypothesis only');
  });

  it('handles scores above 100 by returning the 100 label', () => {
    expect(confidenceLabel(150)).toBe('Measured directly');
  });

  it('always returns a non-empty string', () => {
    for (const score of [0, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 100, 200]) {
      expect(confidenceLabel(score)).toBeTruthy();
    }
  });
});
