import { describe, it, expect } from 'vitest';
import { computeReadiness, type ReadinessInputs } from './readiness';

const base: ReadinessInputs = {
  daysSinceLastWorkout: 2,
  weeklyStreak: 3,
  workoutsThisWeek: 1,
  targetPerWeek: 4,
  overloadRate: 60,
  recentFailRate: 0,
};

describe('computeReadiness', () => {
  it('first-ever session is neutral and inviting', () => {
    const r = computeReadiness({ ...base, daysSinceLastWorkout: null });
    expect(r.level).toBe('steady');
    expect(r.guidance).toMatch(/first session/i);
  });

  it('rested + on track + momentum = push', () => {
    const r = computeReadiness(base);
    expect(r.level).toBe('push');
    expect(r.score).toBeGreaterThanOrEqual(66);
    expect(r.headline).toBe('Primed');
  });

  it('trained today = recover (do not push twice)', () => {
    const r = computeReadiness({ ...base, daysSinceLastWorkout: 0 });
    expect(r.level).toBe('recover');
    expect(r.headline).toBe('Trained today');
  });

  it('high recent fail rate = recover with lighter guidance', () => {
    const r = computeReadiness({ ...base, recentFailRate: 0.7 });
    expect(r.level).toBe('recover');
    expect(r.guidance).toMatch(/lighter|stalling/i);
  });

  it('overreaching (hit weekly target, no rest) = recover', () => {
    const r = computeReadiness({ ...base, daysSinceLastWorkout: 1, workoutsThisWeek: 4, targetPerWeek: 4 });
    expect(r.level).toBe('recover');
  });

  it('modest signals with a single rest day = steady', () => {
    const r = computeReadiness({ ...base, daysSinceLastWorkout: 1, weeklyStreak: 0, overloadRate: 10 });
    expect(r.level).toBe('steady');
  });

  it('score is always clamped 0-100', () => {
    const hi = computeReadiness({ ...base, weeklyStreak: 99, overloadRate: 100 });
    const lo = computeReadiness({ ...base, daysSinceLastWorkout: 0, recentFailRate: 1, overloadRate: 0 });
    expect(hi.score).toBeLessThanOrEqual(100);
    expect(lo.score).toBeGreaterThanOrEqual(0);
  });

  it('every result carries a headline and guidance', () => {
    for (const days of [null, 0, 1, 3, 7]) {
      const r = computeReadiness({ ...base, daysSinceLastWorkout: days as number | null });
      expect(r.headline.length).toBeGreaterThan(0);
      expect(r.guidance.length).toBeGreaterThan(0);
    }
  });
});
