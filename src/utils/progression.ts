/**
 * Pure double-progression engine.
 *
 * Extracted from WorkoutActive.vue so the core value proposition ("we do the
 * math so you don't") is testable in isolation and honest about its inputs.
 *
 * Model (double progression):
 *   You attempt `targetSets` sets of `repsToAttemptNext` reps at
 *   `currentWeightToAttempt`.
 *   - Success (every counted set met the target at or above the prescribed
 *     weight):
 *       * reps target below maxReps  -> raise reps by repOverloadStep (capped)
 *       * reps target at/above maxReps -> raise weight, reset reps to minReps
 *   - Miss -> hold weight and reps, increment the fail streak.
 *   - Skipped entirely -> neutral: nothing changes, the streak is NOT touched.
 *
 * To-failure (AMRAP) exercises progress weight when every set beats maxReps,
 * and otherwise count as a genuine miss (fixes the "can't fail a to-failure
 * exercise" bug where the streak was reset whenever sets were logged).
 *
 * All weights are in the app's internal unit (lbs). This module never touches
 * time, Firestore, or units. Callers stamp lastPerformedDate themselves.
 */

export type SetStatus = 'done' | 'failed' | 'skipped';

export interface PerformedSet {
  actualWeight: number;
  actualReps: number;
  status: SetStatus;
}

export interface ProgressionConfig {
  targetSets: number;
  minReps: number;
  maxReps: number;
  repOverloadStep: number;
  weightIncrement: number;
  enableProgression?: boolean;
  isToFailure?: boolean;
}

export interface ProgressionState {
  currentWeightToAttempt: number;
  repsToAttemptNext: number;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps: number;
  lastWorkoutAllSetsSuccessfulAtCurrentWeight: boolean;
}

export type ProgressionOutcome =
  | 'weight-up'
  | 'reps-up'
  | 'hold'
  | 'skipped'
  | 'disabled';

export interface ProgressionResult {
  outcome: ProgressionOutcome;
  next: ProgressionState;
  /** Plain-language "why this weight" line surfaced to the user. */
  reason: string;
}

const fmtWeight = (w: number): string =>
  Number.isInteger(w) ? String(w) : w.toFixed(1);

/**
 * Compute the next prescription from what was actually performed.
 * Pure: same inputs always yield the same result.
 */
export function computeNextPrescription(
  config: ProgressionConfig,
  current: ProgressionState,
  performedSets: PerformedSet[],
  // Optional: render weights in the caller's unit (e.g. kg) so the reason
  // string never shows lbs numbers to a kg user. Defaults to lbs.
  formatWeight: (weightLbs: number) => string = fmtWeight,
): ProgressionResult {
  const hold = (reason: string, bumpStreak: boolean): ProgressionResult => ({
    outcome: 'hold',
    reason,
    next: {
      currentWeightToAttempt: current.currentWeightToAttempt,
      repsToAttemptNext: current.repsToAttemptNext,
      consecutiveFailedWorkoutsAtCurrentWeightAndReps: bumpStreak
        ? (current.consecutiveFailedWorkoutsAtCurrentWeightAndReps || 0) + 1
        : current.consecutiveFailedWorkoutsAtCurrentWeightAndReps || 0,
      lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
    },
  });

  const neutral = (
    outcome: ProgressionOutcome,
    reason: string,
  ): ProgressionResult => ({
    outcome,
    reason,
    next: {
      currentWeightToAttempt: current.currentWeightToAttempt,
      repsToAttemptNext: current.repsToAttemptNext,
      consecutiveFailedWorkoutsAtCurrentWeightAndReps:
        current.consecutiveFailedWorkoutsAtCurrentWeightAndReps || 0,
      lastWorkoutAllSetsSuccessfulAtCurrentWeight:
        current.lastWorkoutAllSetsSuccessfulAtCurrentWeight,
    },
  });

  if (config.enableProgression === false) {
    return neutral('disabled', 'Auto-progression is off for this exercise.');
  }

  // Skipped sets never count as signal in either direction.
  const counted = performedSets.filter((s) => s.status !== 'skipped');
  if (counted.length === 0) {
    return neutral('skipped', 'Exercise skipped, so the target is unchanged.');
  }

  const target = current.repsToAttemptNext;
  const weight = current.currentWeightToAttempt;

  // A set only counts as success if it met the rep target AT OR ABOVE the
  // prescribed weight. This blocks the "lowered the weight but still got a
  // heavier prescription next time" bug.
  const meetsThreshold = (s: PerformedSet): boolean => {
    if (s.actualWeight < weight) return false;
    if (config.isToFailure) return s.actualReps > config.maxReps;
    return s.actualReps >= target;
  };

  const completedEnough = counted.length >= config.targetSets;
  const allMet = completedEnough && counted.every(meetsThreshold);

  if (!allMet) {
    const loweredWeight = counted.some((s) => s.actualWeight < weight);
    if (!completedEnough) {
      return hold(
        `Only ${counted.length} of ${config.targetSets} sets logged, holding at ${formatWeight(weight)}.`,
        true,
      );
    }
    if (loweredWeight) {
      return hold(
        `Logged below the prescribed ${formatWeight(weight)}, so holding there next time.`,
        true,
      );
    }
    return hold(
      config.isToFailure
        ? `Did not beat ${config.maxReps} reps on every set, holding at ${formatWeight(weight)}.`
        : `Missed the ${target}-rep target, holding at ${formatWeight(weight)} to try again.`,
      true,
    );
  }

  // Success. Decide reps-up vs weight-up.
  const atTopOfRange = config.isToFailure || target >= config.maxReps;

  if (atTopOfRange) {
    const nextWeight = weight + config.weightIncrement;
    return {
      outcome: 'weight-up',
      reason: config.isToFailure
        ? `Beat ${config.maxReps} reps on every set, so +${formatWeight(config.weightIncrement)} to ${formatWeight(nextWeight)}.`
        : `Hit ${config.targetSets}x${target} at the top of the range, so +${formatWeight(config.weightIncrement)} to ${formatWeight(nextWeight)}.`,
      next: {
        currentWeightToAttempt: nextWeight,
        repsToAttemptNext: config.minReps || 1,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
        lastWorkoutAllSetsSuccessfulAtCurrentWeight: true,
      },
    };
  }

  const nextReps = Math.min(target + config.repOverloadStep, config.maxReps);
  return {
    outcome: 'reps-up',
    reason: `Hit all sets, so target reps ${target} -> ${nextReps} at ${formatWeight(weight)}.`,
    next: {
      currentWeightToAttempt: weight,
      repsToAttemptNext: nextReps,
      consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
      lastWorkoutAllSetsSuccessfulAtCurrentWeight: true,
    },
  };
}
