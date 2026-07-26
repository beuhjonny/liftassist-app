/**
 * Deload detection (masterplan 2.3 / ADA bible G10).
 *
 * Reads the consecutive-fail streaks the progression engine already writes and
 * calls for a lighter week when multiple lifts are stalling. Pure and honest:
 * it only ever reports what the training log actually shows.
 */

export interface DeloadLiftInput {
  exerciseName: string;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps?: number;
}

export interface StalledLift {
  exerciseName: string;
  failStreak: number;
}

export interface DeloadVerdict {
  due: boolean;
  stalled: StalledLift[];
  /** Coach-voice line naming the stalled lifts; null when not due. */
  line: string | null;
}

export function detectDeload(
  lifts: DeloadLiftInput[],
  minStreak = 2,
  minLifts = 2,
): DeloadVerdict {
  const stalled: StalledLift[] = lifts
    .map((l) => ({
      exerciseName: l.exerciseName,
      failStreak: l.consecutiveFailedWorkoutsAtCurrentWeightAndReps ?? 0,
    }))
    .filter((l) => l.failStreak >= minStreak)
    .sort((a, b) => b.failStreak - a.failStreak);

  if (stalled.length < minLifts) {
    return { due: false, stalled, line: null };
  }

  const names = stalled.map((s) => s.exerciseName);
  const named =
    names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]}, ${names[1]} and ${names.length - 2} more`;
  return {
    due: true,
    stalled,
    line: `${named} have stalled. A lighter week will reset momentum.`,
  };
}
