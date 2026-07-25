/**
 * Pure trailing-window training signals for the readiness engine (masterplan 2.1).
 *
 * Extracted so the readiness verdict gets deterministic, testable inputs
 * instead of view-layer math. Operates on plain logged-workout shapes; skipped
 * sets are excluded from fatigue math, matching progression.ts semantics.
 */

export interface SignalSet {
  status: 'done' | 'failed' | 'skipped' | string;
  actualWeight?: number;
  actualReps?: number;
}

export interface SignalWorkout {
  /** Resolved workout date (caller converts Firestore Timestamp -> Date). */
  date: Date;
  sets: SignalSet[];
}

/**
 * Fraction 0-1 of recent counted sets that failed, over the trailing `window`
 * sets (newest first). Skipped sets are neutral and excluded. Returns 0 when
 * there is no counted history.
 */
export function computeRecentFailRate(workouts: SignalWorkout[], window = 10): number {
  const newestFirst = [...workouts].sort((a, b) => b.date.getTime() - a.date.getTime());
  let done = 0;
  let failed = 0;
  for (const w of newestFirst) {
    for (const s of w.sets) {
      if (s.status === 'done') done++;
      else if (s.status === 'failed') failed++;
      if (done + failed >= window) break;
    }
    if (done + failed >= window) break;
  }
  const counted = done + failed;
  return counted === 0 ? 0 : failed / counted;
}

/**
 * Signed weekly-tonnage trend over the trailing `weeks` complete weeks,
 * normalized by mean weekly volume. Positive = rising load, negative = falling.
 * Clamped to [-1, 1]. Returns 0 with fewer than 2 non-empty weeks.
 */
export function computeWeeklyVolumeTrend(workouts: SignalWorkout[], weeks = 4, now = new Date()): number {
  if (workouts.length === 0) return 0;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = new Array<number>(weeks).fill(0);
  const seen = new Array<boolean>(weeks).fill(false);

  for (const w of workouts) {
    const age = now.getTime() - w.date.getTime();
    if (age < 0) continue;
    const idx = Math.floor(age / weekMs);
    if (idx >= weeks) continue;
    const bucket = weeks - 1 - idx; // oldest -> newest ordering
    seen[bucket] = true;
    for (const s of w.sets) {
      if (s.status === 'done' && typeof s.actualWeight === 'number' && typeof s.actualReps === 'number') {
        buckets[bucket] += s.actualWeight * s.actualReps;
      }
    }
  }

  if (seen.filter(Boolean).length < 2) return 0;

  // Least-squares slope over bucket index.
  const n = weeks;
  const xMean = (n - 1) / 2;
  const yMean = buckets.reduce((a, b) => a + b, 0) / n;
  if (yMean === 0) return 0;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (buckets[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slopePerWeek = num / den;
  const normalized = slopePerWeek / yMean;
  return Math.max(-1, Math.min(1, normalized));
}
