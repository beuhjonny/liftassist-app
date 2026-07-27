/**
 * Training-readiness engine (the flagship differentiator - ADA bible G1).
 *
 * Composes signals the app already computes into ONE verdict + one-line guidance,
 * the way The Outsiders / Harvee turn raw data into an actionable recommendation.
 * This is consistency-and-recovery readiness (streak, weekly load, rest gap,
 * recent misses), NOT a medical or HRV metric - honest about its inputs.
 *
 * Pure and deterministic so it is testable in isolation.
 */

export type ReadinessLevel = 'push' | 'steady' | 'recover';

export interface ReadinessInputs {
  /** Days since the last logged workout. null = never trained. */
  daysSinceLastWorkout: number | null;
  /** Consecutive weeks meeting the weekly target. */
  weeklyStreak: number;
  workoutsThisWeek: number;
  targetPerWeek: number;
  /** Overload rate 0-100 (fraction of exercises that beat last time). */
  overloadRate: number;
  /** Fraction 0-1 of recent exercises that were held/failed (fatigue proxy). */
  recentFailRate: number;
  /** Signed weekly tonnage trend, -1..1 (from trainingSignals). Optional. */
  weeklyVolumeTrend?: number;
  /** Coach line from deload detection; non-null pins the verdict to recover. */
  deloadLine?: string | null;
}

export interface Readiness {
  level: ReadinessLevel;
  /** 0-100 composite. */
  score: number;
  headline: string;
  guidance: string;
  /** Plain-language inputs behind the verdict ("Show the work"). */
  factors: string[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function computeReadiness(input: ReadinessInputs): Readiness {
  const {
    daysSinceLastWorkout: days,
    weeklyStreak,
    workoutsThisWeek,
    targetPerWeek,
    overloadRate,
    recentFailRate,
  } = input;

  // First-ever session: neutral, inviting.
  if (days === null) {
    return {
      level: 'steady',
      score: 60,
      headline: 'Ready when you are',
      guidance: 'Log your first session to start building your readiness.',
      factors: ['No sessions logged yet'],
    };
  }

  // Plain-language inputs behind the verdict ("Show the work").
  const factors: string[] = [];
  factors.push(days === 0 ? 'Trained today' : `${days} day${days === 1 ? '' : 's'} since last session`);
  if (targetPerWeek > 0) factors.push(`${workoutsThisWeek} of ${targetPerWeek} sessions this week`);
  if (weeklyStreak > 0) factors.push(`${weeklyStreak}-week streak`);
  if (recentFailRate > 0) factors.push(`${Math.round(recentFailRate * 100)}% of recent sets missed`);
  const trendIn = clamp(input.weeklyVolumeTrend ?? 0, -1, 1);
  if (Math.abs(trendIn) >= 0.05) factors.push(trendIn > 0 ? 'Weekly volume rising' : 'Weekly volume falling');

  const trainedToday = days === 0;
  const rested = days >= 2;
  const overreaching = targetPerWeek > 0 && workoutsThisWeek >= targetPerWeek && days <= 1;
  const highFatigue = recentFailRate >= 0.5;

  // Composite score.
  let score = 60;
  score += clamp(weeklyStreak * 4, 0, 20); // consistency
  score += clamp(overloadRate * 0.2, 0, 20); // momentum
  if (days >= 1 && days <= 3) score += 10; // optimal recovery window
  else if (trainedToday) score -= 22; // already trained today
  else if (days >= 6) score -= 6; // drifting toward detrain
  score -= recentFailRate * 30; // fatigue penalty
  if (overreaching) score -= 10;
  // Bounded momentum term from the weekly tonnage slope (max +/-8 points).
  const trend = clamp(input.weeklyVolumeTrend ?? 0, -1, 1);
  score += clamp(trend * 16, -8, 8);
  score = Math.round(clamp(score, 0, 100));

  // Deload pin: when multiple lifts are stalling, the honest call is a lighter
  // week regardless of how good consistency looks. The specific line names the
  // stalled lifts (deload.ts).
  if (input.deloadLine) {
    return {
      level: 'recover',
      score: Math.min(score, 42),
      headline: 'Deload due',
      guidance: input.deloadLine,
      factors: [...factors, 'Multiple lifts stalled'],
    };
  }

  // Verdict.
  let level: ReadinessLevel;
  if (trainedToday || highFatigue || overreaching || score < 42) level = 'recover';
  else if (rested && score >= 66) level = 'push';
  else level = 'steady';

  const copy: Record<ReadinessLevel, { headline: string; guidance: string }> = {
    push: {
      headline: 'Primed',
      guidance: rested
        ? 'Well rested and on track. Add a rep or a plate today.'
        : 'On track. Chase your targets today.',
    },
    steady: {
      headline: 'Ready',
      guidance: 'Solid form this week. Hit your prescribed targets.',
    },
    recover: {
      headline: trainedToday ? 'Trained today' : highFatigue ? 'Recovery is low' : 'Ease off',
      guidance: trainedToday
        ? 'You already logged a session today. Rest or keep it light.'
        : highFatigue
          ? 'Recent sets are stalling. Go lighter and rebuild momentum.'
          : 'You are deep in the week. A lighter session protects progress.',
    },
  };

  return { level, score, ...copy[level], factors };
}
