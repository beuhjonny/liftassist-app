import { describe, it, expect } from 'vitest';
import {
  computeNextPrescription,
  type ProgressionConfig,
  type ProgressionState,
  type PerformedSet,
  type SetStatus,
} from './progression';

// 3x8..12, +2 reps/step, +5 lb increment.
const std: ProgressionConfig = {
  targetSets: 3,
  minReps: 8,
  maxReps: 12,
  repOverloadStep: 2,
  weightIncrement: 5,
};

const state = (
  weight: number,
  reps: number,
  fails = 0,
): ProgressionState => ({
  currentWeightToAttempt: weight,
  repsToAttemptNext: reps,
  consecutiveFailedWorkoutsAtCurrentWeightAndReps: fails,
  lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
});

const sets = (
  n: number,
  weight: number,
  reps: number,
  status: SetStatus = 'done',
): PerformedSet[] =>
  Array.from({ length: n }, () => ({
    actualWeight: weight,
    actualReps: reps,
    status,
  }));

describe('standard double progression', () => {
  it('raises reps when target met below the top of the range', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 100, 8));
    expect(r.outcome).toBe('reps-up');
    expect(r.next.repsToAttemptNext).toBe(10);
    expect(r.next.currentWeightToAttempt).toBe(100);
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(0);
  });

  it('caps rep increase at maxReps', () => {
    const r = computeNextPrescription(std, state(100, 11), sets(3, 100, 11));
    expect(r.outcome).toBe('reps-up');
    expect(r.next.repsToAttemptNext).toBe(12);
  });

  it('raises weight and resets reps at the top of the range', () => {
    const r = computeNextPrescription(std, state(100, 12), sets(3, 100, 12));
    expect(r.outcome).toBe('weight-up');
    expect(r.next.currentWeightToAttempt).toBe(105);
    expect(r.next.repsToAttemptNext).toBe(8);
    expect(r.next.lastWorkoutAllSetsSuccessfulAtCurrentWeight).toBe(true);
  });

  it('holds and increments streak when reps are missed', () => {
    const r = computeNextPrescription(std, state(100, 8, 0), sets(3, 100, 6));
    expect(r.outcome).toBe('hold');
    expect(r.next.currentWeightToAttempt).toBe(100);
    expect(r.next.repsToAttemptNext).toBe(8);
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(1);
  });

  it('accumulates the fail streak across misses', () => {
    const r = computeNextPrescription(std, state(100, 8, 2), sets(3, 100, 5));
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(3);
  });

  it('counts extra reps beyond target as success (still reps-up)', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 100, 11));
    expect(r.outcome).toBe('reps-up');
    expect(r.next.repsToAttemptNext).toBe(10);
  });

  it('succeeds when the user lifts more than prescribed weight', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 105, 8));
    expect(r.outcome).toBe('reps-up');
  });
});

describe('earned-increment guard (unearned weight bug)', () => {
  it('holds when the user lowered the weight, even if reps were hit', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 90, 12));
    expect(r.outcome).toBe('hold');
    expect(r.next.currentWeightToAttempt).toBe(100);
    expect(r.reason).toContain('below the prescribed');
  });

  it('holds when one of several sets was under weight', () => {
    const mixed = [
      ...sets(2, 100, 8),
      ...sets(1, 95, 8),
    ];
    const r = computeNextPrescription(std, state(100, 8), mixed);
    expect(r.outcome).toBe('hold');
  });
});

describe('incomplete sessions', () => {
  it('holds when fewer than targetSets were logged', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(2, 100, 8));
    expect(r.outcome).toBe('hold');
    expect(r.reason).toContain('2 of 3');
  });
});

describe('skipped exercises stay neutral', () => {
  it('does not touch the streak when every set is skipped', () => {
    const r = computeNextPrescription(std, state(100, 8, 1), sets(3, 100, 0, 'skipped'));
    expect(r.outcome).toBe('skipped');
    expect(r.next.currentWeightToAttempt).toBe(100);
    expect(r.next.repsToAttemptNext).toBe(8);
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(1);
  });

  it('ignores skipped sets but still evaluates the ones performed', () => {
    const mixed = [...sets(3, 100, 8), ...sets(1, 0, 0, 'skipped')];
    const r = computeNextPrescription(std, state(100, 8), mixed);
    expect(r.outcome).toBe('reps-up');
  });

  it('treats a mix that falls short of targetSets after skips as a hold', () => {
    const mixed = [...sets(2, 100, 8), ...sets(1, 0, 0, 'skipped')];
    const r = computeNextPrescription(std, state(100, 8), mixed);
    expect(r.outcome).toBe('hold');
    expect(r.reason).toContain('2 of 3');
  });
});

describe('to-failure (AMRAP) exercises', () => {
  const amrap: ProgressionConfig = { ...std, isToFailure: true };

  it('raises weight when every set beats maxReps', () => {
    const r = computeNextPrescription(amrap, state(100, 8), sets(3, 100, 13));
    expect(r.outcome).toBe('weight-up');
    expect(r.next.currentWeightToAttempt).toBe(105);
    expect(r.next.repsToAttemptNext).toBe(8);
  });

  it('CAN fail: holds and increments streak when a set does not beat maxReps (#56)', () => {
    const r = computeNextPrescription(amrap, state(100, 8, 0), sets(3, 100, 10));
    expect(r.outcome).toBe('hold');
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(1);
  });

  it('a set exactly at maxReps is not a beat (must exceed)', () => {
    const mixed = [...sets(2, 100, 13), ...sets(1, 100, 12)];
    const r = computeNextPrescription(amrap, state(100, 8), mixed);
    expect(r.outcome).toBe('hold');
  });

  it('to-failure fail streak accumulates across sessions', () => {
    const r = computeNextPrescription(amrap, state(100, 8, 3), sets(3, 100, 9));
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(4);
  });

  it('to-failure skipped is still neutral, not a fail', () => {
    const r = computeNextPrescription(amrap, state(100, 8, 0), sets(3, 0, 0, 'skipped'));
    expect(r.outcome).toBe('skipped');
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(0);
  });
});

describe('progression disabled', () => {
  it('never changes state when enableProgression is false', () => {
    const off: ProgressionConfig = { ...std, enableProgression: false };
    const r = computeNextPrescription(off, state(100, 8, 2), sets(3, 100, 12));
    expect(r.outcome).toBe('disabled');
    expect(r.next.currentWeightToAttempt).toBe(100);
    expect(r.next.repsToAttemptNext).toBe(8);
    expect(r.next.consecutiveFailedWorkoutsAtCurrentWeightAndReps).toBe(2);
  });
});

describe('reason strings (why this weight)', () => {
  it('explains a weight increase', () => {
    const r = computeNextPrescription(std, state(100, 12), sets(3, 100, 12));
    expect(r.reason).toContain('+5');
    expect(r.reason).toContain('105');
  });

  it('explains a rep increase', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 100, 8));
    expect(r.reason).toContain('8 -> 10');
  });

  it('explains a hold after a miss', () => {
    const r = computeNextPrescription(std, state(100, 8), sets(3, 100, 6));
    expect(r.reason.toLowerCase()).toContain('holding');
  });

  it('every outcome carries a non-empty reason', () => {
    const cases: PerformedSet[][] = [
      sets(3, 100, 8),
      sets(3, 100, 12),
      sets(3, 100, 6),
      sets(3, 0, 0, 'skipped'),
    ];
    for (const c of cases) {
      const r = computeNextPrescription(std, state(100, 8), c);
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('unit-aware reason strings (kg users)', () => {
  it('formats reason weights via the injected formatter', () => {
    // Simulate a kg formatter: 100 lbs -> "45.4 kg", 105 -> "47.6 kg", 5 -> "2.3 kg".
    const kg = (lbs: number) => `${(lbs * 0.4536).toFixed(1)} kg`;
    const r = computeNextPrescription(std, state(100, 12), sets(3, 100, 12), kg);
    expect(r.reason).toContain('kg');
    expect(r.reason).not.toMatch(/\b105\b/); // no raw lbs number
  });

  it('defaults to lbs numbers when no formatter is given', () => {
    const r = computeNextPrescription(std, state(100, 12), sets(3, 100, 12));
    expect(r.reason).toContain('105');
  });
});

describe('fractional weights (kg-converted increments)', () => {
  it('formats non-integer weights to one decimal in the reason', () => {
    const cfg: ProgressionConfig = { ...std, weightIncrement: 2.5 };
    const r = computeNextPrescription(cfg, state(102.5, 12), sets(3, 102.5, 12));
    expect(r.next.currentWeightToAttempt).toBe(105);
    expect(r.reason).toContain('2.5');
  });
});
