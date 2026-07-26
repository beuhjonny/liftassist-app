import { describe, it, expect } from 'vitest';
import { getProgressKey } from './progressKey';

describe('getProgressKey', () => {
  it('lowercases and underscores spaces (legacy-compatible)', () => {
    expect(getProgressKey('Bench Press')).toBe('bench_press');
    expect(getProgressKey('  Overhead   Press ')).toBe('_overhead_press_');
  });

  it('never emits a slash (invalid Firestore path segment)', () => {
    expect(getProgressKey('Dumbbell Lat Pulldown / Band')).toBe('dumbbell_lat_pulldown_-_band');
    expect(getProgressKey('A/B Split')).toBe('a-b_split');
    expect(getProgressKey('x///y')).not.toContain('/');
  });

  it('is deterministic', () => {
    expect(getProgressKey('Squat')).toBe(getProgressKey('Squat'));
  });
});
