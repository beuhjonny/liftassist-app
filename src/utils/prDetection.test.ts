import { describe, it, expect } from 'vitest';
import { epley1RM, bestPrior1RM, detectSetPR } from './prDetection';

describe('epley1RM', () => {
  it('computes weight * (1 + reps/30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 2);
    expect(epley1RM(225, 1)).toBeCloseTo(232.5, 2);
  });
  it('returns 0 for zero/negative inputs', () => {
    expect(epley1RM(0, 10)).toBe(0);
    expect(epley1RM(100, 0)).toBe(0);
    expect(epley1RM(-5, 5)).toBe(0);
  });
});

describe('bestPrior1RM', () => {
  it('returns null with no counted history', () => {
    expect(bestPrior1RM([])).toBeNull();
    expect(bestPrior1RM([{ actualWeight: 100, actualReps: 8, status: 'failed' }])).toBeNull();
    expect(bestPrior1RM([{ actualWeight: 100, actualReps: 8, status: 'skipped' }])).toBeNull();
  });
  it('finds the best done-set e1RM', () => {
    const best = bestPrior1RM([
      { actualWeight: 100, actualReps: 8, status: 'done' }, // 126.7
      { actualWeight: 110, actualReps: 5, status: 'done' }, // 128.3
      { actualWeight: 200, actualReps: 10, status: 'failed' }, // ignored
    ]);
    expect(best).toBeCloseTo(128.33, 1);
  });
});

describe('detectSetPR', () => {
  it('is a PR when e1RM beats the prior best', () => {
    const v = detectSetPR({ actualWeight: 105, actualReps: 8, status: 'done' }, 128.33);
    expect(v.isPR).toBe(true);
    expect(v.e1rm).toBeGreaterThan(128.33);
  });
  it('is not a PR on the first-ever set (null prior)', () => {
    const v = detectSetPR({ actualWeight: 500, actualReps: 10, status: 'done' }, null);
    expect(v.isPR).toBe(false);
  });
  it('is not a PR when equal to the prior (float guard)', () => {
    const e = epley1RM(100, 8);
    const v = detectSetPR({ actualWeight: 100, actualReps: 8, status: 'done' }, e);
    expect(v.isPR).toBe(false);
  });
  it('failed and skipped sets are never PRs', () => {
    expect(detectSetPR({ actualWeight: 500, actualReps: 10, status: 'failed' }, 100).isPR).toBe(false);
    expect(detectSetPR({ actualWeight: 500, actualReps: 10, status: 'skipped' }, 100).isPR).toBe(false);
  });
});
