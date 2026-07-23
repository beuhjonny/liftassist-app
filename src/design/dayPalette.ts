/**
 * Single source of truth for workout-day colors.
 *
 * Previously Routines.vue and WorkoutHistory.vue each defined their own copy of
 * this palette and resolved a day's color with different index math, so the
 * same day could show one color on the routine screen and another in history
 * (issue #73). Everything now routes through here.
 */

export const DAY_COLOR_PALETTE = [
  '#FF5252', // Red
  '#2ECC71', // Green
  '#2979FF', // Blue
  '#FFD600', // Gold
  '#9C27B0', // Purple
  '#FF9100', // Orange
] as const;

export const DEFAULT_DAY_COLOR = '#10B981'; // Emerald

/**
 * Resolve a day's color. An explicit stored color always wins; otherwise the
 * color is derived deterministically from the 1-based day order so a given day
 * looks identical on every screen.
 */
export function colorForDay(
  order?: number | null,
  explicitColor?: string | null,
): string {
  if (explicitColor) return explicitColor;
  if (typeof order === 'number' && order > 0) {
    const len = DAY_COLOR_PALETTE.length;
    return DAY_COLOR_PALETTE[(order - 1) % len];
  }
  return DEFAULT_DAY_COLOR;
}
