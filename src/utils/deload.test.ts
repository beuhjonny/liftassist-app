import { describe, it, expect } from 'vitest';
import { detectDeload } from './deload';
import { computeReadiness } from './readiness';

const lift = (exerciseName: string, streak: number) => ({
  exerciseName,
  consecutiveFailedWorkoutsAtCurrentWeightAndReps: streak,
});

describe('detectDeload', () => {
  it('not due with no lifts or no streaks', () => {
    expect(detectDeload([]).due).toBe(false);
    expect(detectDeload([lift('Bench', 0), lift('Squat', 1)]).due).toBe(false);
  });

  it('not due with only one stalled lift', () => {
    const v = detectDeload([lift('Bench', 3), lift('Squat', 0)]);
    expect(v.due).toBe(false);
    expect(v.stalled).toHaveLength(1);
  });

  it('due with two lifts stalled >= 2, line names both', () => {
    const v = detectDeload([lift('Bench Press', 2), lift('Squat', 3), lift('Curl', 0)]);
    expect(v.due).toBe(true);
    expect(v.line).toContain('Squat');
    expect(v.line).toContain('Bench Press');
    expect(v.stalled[0].exerciseName).toBe('Squat'); // sorted by streak desc
  });

  it('summarizes 3+ stalled lifts', () => {
    const v = detectDeload([lift('A', 2), lift('B', 2), lift('C', 2)]);
    expect(v.line).toContain('and 1 more');
  });

  it('handles missing streak field as 0', () => {
    expect(detectDeload([{ exerciseName: 'X' }, { exerciseName: 'Y' }]).due).toBe(false);
  });
});

describe('readiness deload pin', () => {
  const base = {
    daysSinceLastWorkout: 2,
    weeklyStreak: 5,
    workoutsThisWeek: 1,
    targetPerWeek: 3,
    overloadRate: 80,
    recentFailRate: 0,
  };

  it('pins to recover with the deload line even when otherwise primed', () => {
    const without = computeReadiness(base);
    expect(without.level).toBe('push'); // sanity: would be primed
    const r = computeReadiness({ ...base, deloadLine: 'Bench and Squat have stalled. A lighter week will reset momentum.' });
    expect(r.level).toBe('recover');
    expect(r.headline).toBe('Deload due');
    expect(r.guidance).toContain('lighter week');
    expect(r.score).toBeLessThanOrEqual(42);
  });

  it('null deloadLine changes nothing', () => {
    const a = computeReadiness(base);
    const b = computeReadiness({ ...base, deloadLine: null });
    expect(b).toEqual(a);
  });
});
