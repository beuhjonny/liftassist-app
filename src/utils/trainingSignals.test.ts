import { describe, it, expect } from 'vitest';
import { computeRecentFailRate, computeWeeklyVolumeTrend, type SignalWorkout } from './trainingSignals';

const day = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-25T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * day);

const w = (date: Date, sets: Array<[string, number?, number?]>): SignalWorkout => ({
  date,
  sets: sets.map(([status, actualWeight, actualReps]) => ({ status, actualWeight, actualReps })),
});

describe('computeRecentFailRate', () => {
  it('returns 0 with no history', () => {
    expect(computeRecentFailRate([])).toBe(0);
  });

  it('counts failed over counted sets in the window', () => {
    const workouts = [w(daysAgo(1), [['done'], ['failed'], ['done'], ['done']])];
    expect(computeRecentFailRate(workouts, 10)).toBe(0.25);
  });

  it('excludes skipped sets from the denominator', () => {
    const workouts = [w(daysAgo(1), [['done'], ['skipped'], ['failed'], ['skipped']])];
    expect(computeRecentFailRate(workouts, 10)).toBe(0.5);
  });

  it('respects the trailing window across workouts (newest first)', () => {
    const workouts = [
      w(daysAgo(10), [['failed'], ['failed'], ['failed'], ['failed']]), // old, should fall outside window
      w(daysAgo(1), [['done'], ['done'], ['done'], ['done']]),
    ];
    expect(computeRecentFailRate(workouts, 4)).toBe(0);
  });

  it('all-fail recent history reads 1', () => {
    const workouts = [w(daysAgo(0), [['failed'], ['failed']])];
    expect(computeRecentFailRate(workouts, 10)).toBe(1);
  });
});

describe('computeWeeklyVolumeTrend', () => {
  it('returns 0 with no history or a single week', () => {
    expect(computeWeeklyVolumeTrend([], 4, NOW)).toBe(0);
    expect(computeWeeklyVolumeTrend([w(daysAgo(2), [['done', 100, 10]])], 4, NOW)).toBe(0);
  });

  it('positive when weekly tonnage rises', () => {
    const workouts = [
      w(daysAgo(22), [['done', 100, 10]]),
      w(daysAgo(15), [['done', 100, 20]]),
      w(daysAgo(8), [['done', 100, 30]]),
      w(daysAgo(1), [['done', 100, 40]]),
    ];
    expect(computeWeeklyVolumeTrend(workouts, 4, NOW)).toBeGreaterThan(0);
  });

  it('negative when weekly tonnage falls', () => {
    const workouts = [
      w(daysAgo(22), [['done', 100, 40]]),
      w(daysAgo(15), [['done', 100, 30]]),
      w(daysAgo(8), [['done', 100, 20]]),
      w(daysAgo(1), [['done', 100, 10]]),
    ];
    expect(computeWeeklyVolumeTrend(workouts, 4, NOW)).toBeLessThan(0);
  });

  it('ignores failed and skipped sets in tonnage', () => {
    const up = [
      w(daysAgo(8), [['done', 100, 10]]),
      w(daysAgo(1), [['done', 100, 10], ['failed', 100, 10], ['skipped', 100, 10]]),
    ];
    const flat = [
      w(daysAgo(8), [['done', 100, 10]]),
      w(daysAgo(1), [['done', 100, 10]]),
    ];
    expect(computeWeeklyVolumeTrend(up, 4, NOW)).toBeCloseTo(computeWeeklyVolumeTrend(flat, 4, NOW), 10);
  });

  it('is clamped to [-1, 1]', () => {
    const extreme = [
      w(daysAgo(8), [['done', 1, 1]]),
      w(daysAgo(1), [['done', 1000, 100]]),
    ];
    const t = computeWeeklyVolumeTrend(extreme, 4, NOW);
    expect(t).toBeLessThanOrEqual(1);
    expect(t).toBeGreaterThanOrEqual(-1);
  });
});
