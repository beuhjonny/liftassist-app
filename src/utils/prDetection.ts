/**
 * Personal-record detection (masterplan 2.7) - pure and unit-tested.
 *
 * A PR is an honest artifact of real training: the estimated one-rep max of a
 * just-logged DONE set beating every prior counted set of the same exercise.
 * Estimated via Epley: e1RM = weight * (1 + reps/30). First-ever sets are not
 * PRs (no prior to beat), so the beat stays rare and meaningful.
 */

export interface PrSet {
  actualWeight: number;
  actualReps: number;
  status: string;
}

/** Epley estimated 1RM. Reps<=0 or weight<=0 yield 0. */
export function epley1RM(weight: number, reps: number): number {
  if (!(weight > 0) || !(reps > 0)) return 0;
  return weight * (1 + reps / 30);
}

/** Best prior e1RM across a set history (done sets only). Null when none. */
export function bestPrior1RM(history: PrSet[]): number | null {
  let best: number | null = null;
  for (const s of history) {
    if (s.status !== 'done') continue;
    const e = epley1RM(s.actualWeight, s.actualReps);
    if (e > 0 && (best === null || e > best)) best = e;
  }
  return best;
}

export interface PrVerdict {
  isPR: boolean;
  e1rm: number;
  prior: number | null;
}

/**
 * Decide whether a just-logged set is a PR against the prior best e1RM.
 * Only DONE sets qualify; a null prior (first ever) is never a PR.
 */
export function detectSetPR(set: PrSet, prior: number | null): PrVerdict {
  const e1rm = set.status === 'done' ? epley1RM(set.actualWeight, set.actualReps) : 0;
  const isPR = prior !== null && e1rm > prior * 1.0001;
  return { isPR, e1rm, prior };
}
